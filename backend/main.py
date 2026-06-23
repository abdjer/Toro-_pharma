import csv
import hashlib
import hmac
import io
import os
import secrets
import sqlite3
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

load_dotenv()

DB_PATH = os.getenv("DB_PATH", "verification.db")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
APP_SECRET_KEY = os.getenv("APP_SECRET_KEY", "CHANGE_ME_NOW").encode("utf-8")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app = FastAPI(title="TORO Verification API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def now_str():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def normalize_serial(serial: str) -> str:
    return "".join(str(serial or "").strip().upper().split())


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    rounds = 220000
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        rounds,
    ).hex()
    return f"pbkdf2_sha256${rounds}${salt}${digest}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algo, rounds, salt, stored_digest = password_hash.split("$")
        if algo != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt),
            int(rounds),
        ).hex()
        return hmac.compare_digest(digest, stored_digest)
    except Exception:
        return False


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_short_serial(seed: str, existing: set[str]) -> str:
    modifier = 0
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    while True:
        raw = f"{seed}-{modifier}-{secrets.token_hex(12)}"
        digest = hmac.new(APP_SECRET_KEY, raw.encode("utf-8"), hashlib.sha256).digest()
        number = int.from_bytes(digest[:8], "big")
        serial = ""
        for _ in range(6):
            serial += alphabet[number % len(alphabet)]
            number //= len(alphabet)
        if serial not in existing:
            return serial
        modifier += 1


def seed_defaults(cur):
    cur.execute("SELECT COUNT(*) AS c FROM catalog_products")
    product_count = cur.fetchone()["c"]
    if product_count == 0:
        defaults = [
            (
                "TORO Series A",
                "TORO Series A",
                "TS-A",
                "علبة مختومة / كود دفعة",
                "Sealed box / batch-coded",
                "بطاقة منتج تجريبية قابلة للتعديل من لوحة الإدارة.",
                "Demo product card editable from the admin panel.",
                "/toro-label-original.png",
                1,
                now_str(),
            ),
            (
                "TORO Series B",
                "TORO Series B",
                "TS-B",
                "عبوة / لصاقة أمان",
                "Bottle / security label",
                "استخدم لوحة الإدارة لاستبدال هذه البيانات بالبيانات الرسمية.",
                "Use the admin panel to replace this with official data.",
                "/toro-hero.png",
                1,
                now_str(),
            ),
            (
                "TORO Series C",
                "TORO Series C",
                "TS-C",
                "علبة / جاهزة للهولوغرام",
                "Box / hologram-ready",
                "واجهة مرتبطة بقاعدة بيانات التحقق وتاريخ الفحص.",
                "Frontend connected to verification database and scan history.",
                "/toro-logo.png",
                1,
                now_str(),
            ),
        ]
        cur.executemany(
            """
            INSERT INTO catalog_products (
                name_ar, name_en, strength, form_ar, form_en,
                description_ar, description_en, image_url, active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            defaults,
        )

    cur.execute("SELECT COUNT(*) AS c FROM verification_codes")
    code_count = cur.fetchone()["c"]
    if code_count == 0:
        cur.execute("SELECT id FROM catalog_products ORDER BY id ASC LIMIT 3")
        ids = [row["id"] for row in cur.fetchall()]
        seed_codes = [
            ("TR0001", ids[0] if len(ids) > 0 else None, 0, now_str(), "Demo code"),
            ("TR0002", ids[1] if len(ids) > 1 else None, 0, now_str(), "Demo code"),
            ("TR0003", ids[2] if len(ids) > 2 else None, 1, now_str(), "Already scanned demo code"),
        ]
        cur.executemany(
            """
            INSERT OR IGNORE INTO verification_codes
            (serial, product_id, is_used, created_at, note)
            VALUES (?, ?, ?, ?, ?)
            """,
            seed_codes,
        )
        cur.execute(
            "UPDATE verification_codes SET scanned_at = ? WHERE serial = ?",
            (now_str(), "TR0003"),
        )


def migrate_old_table(cur):
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='products'")
    if not cur.fetchone():
        return
    try:
        cur.execute(
            """
            INSERT OR IGNORE INTO verification_codes (serial, is_used, scanned_at, created_at, note)
            SELECT serial, is_used, scanned_at, ?, 'Migrated from old products table'
            FROM products
            """,
            (now_str(),),
        )
    except Exception:
        pass


def init_db():
    conn = db()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS catalog_products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name_ar TEXT NOT NULL,
            name_en TEXT NOT NULL,
            strength TEXT,
            form_ar TEXT,
            form_en TEXT,
            description_ar TEXT,
            description_en TEXT,
            image_url TEXT,
            active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS verification_codes (
            serial TEXT PRIMARY KEY,
            product_id INTEGER,
            is_used INTEGER DEFAULT 0,
            scanned_at TEXT,
            created_at TEXT NOT NULL,
            note TEXT,
            FOREIGN KEY(product_id) REFERENCES catalog_products(id) ON DELETE SET NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS scan_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            serial TEXT,
            status TEXT NOT NULL,
            ip TEXT,
            user_agent TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_sessions (
            token_hash TEXT PRIMARY KEY,
            admin_id INTEGER NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute("SELECT COUNT(*) AS c FROM admins")
    if cur.fetchone()["c"] == 0:
        cur.execute(
            "INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)",
            (ADMIN_USERNAME, hash_password(ADMIN_PASSWORD), now_str()),
        )
    migrate_old_table(cur)
    seed_defaults(cur)
    conn.commit()
    conn.close()


init_db()


class LoginBody(BaseModel):
    username: str
    password: str


class ProductBody(BaseModel):
    name_ar: str = Field(..., min_length=1)
    name_en: str = Field(..., min_length=1)
    strength: Optional[str] = ""
    form_ar: Optional[str] = ""
    form_en: Optional[str] = ""
    description_ar: Optional[str] = ""
    description_en: Optional[str] = ""
    image_url: Optional[str] = ""
    active: int = 1


class VerifyBody(BaseModel):
    serial: str = Field(..., min_length=1, max_length=30)


class CodeBody(BaseModel):
    serial: str = Field(..., min_length=1, max_length=30)
    product_id: Optional[int] = None
    note: Optional[str] = ""


class GenerateCodesBody(BaseModel):
    product_id: Optional[int] = None
    count: int = Field(..., ge=1, le=50000)


class CodeUpdateBody(BaseModel):
    product_id: Optional[int] = None
    is_used: Optional[int] = None
    scanned_at: Optional[str] = None
    note: Optional[str] = None


def require_admin(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.replace("Bearer ", "", 1).strip()
    conn = db()
    cur = conn.cursor()
    cur.execute(
        "SELECT admin_id, expires_at FROM admin_sessions WHERE token_hash = ?",
        (token_hash(token),),
    )
    session = cur.fetchone()
    conn.close()
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = datetime.strptime(session["expires_at"], "%Y-%m-%d %H:%M:%S")
    if expires_at < datetime.now():
        raise HTTPException(status_code=401, detail="Session expired")
    return session["admin_id"]


def log_scan(serial: str, status: str, request: Request):
    ip = request.client.host if request.client else ""
    user_agent = request.headers.get("user-agent", "")[:300]
    conn = db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO scan_logs (serial, status, ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?)",
        (serial, status, ip, user_agent, now_str()),
    )
    conn.commit()
    conn.close()


@app.get("/api/health")
def health():
    return {"ok": True, "service": "TORO Verification API"}


@app.get("/api/products")
def public_products():
    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM catalog_products WHERE active = 1 ORDER BY id DESC")
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows


@app.post("/api/verify")
def verify_product(body: VerifyBody, request: Request):
    serial = normalize_serial(body.serial)
    if len(serial) != 6:
        log_scan(serial, "invalid", request)
        return {
            "status": "invalid",
            "message_ar": "الكود يجب أن يكون 6 محارف فقط.",
            "message_en": "The verification code must be exactly 6 characters.",
        }
    conn = db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT vc.serial, vc.is_used, vc.scanned_at,
               cp.id AS product_id, cp.name_ar, cp.name_en, cp.strength, cp.form_ar, cp.form_en
        FROM verification_codes vc
        LEFT JOIN catalog_products cp ON cp.id = vc.product_id
        WHERE vc.serial = ?
        """,
        (serial,),
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        log_scan(serial, "fake", request)
        return {
            "status": "fake",
            "message_ar": "هذا الكود غير موجود وغير صادر عن الشركة.",
            "message_en": "This code was not found and is not issued by the company.",
        }
    product = {
        "id": row["product_id"],
        "name_ar": row["name_ar"],
        "name_en": row["name_en"],
        "strength": row["strength"],
        "form_ar": row["form_ar"],
        "form_en": row["form_en"],
    }
    if row["is_used"] == 1:
        conn.close()
        log_scan(serial, "duplicated", request)
        return {
            "status": "duplicated",
            "message_ar": f"المنتج أصلي، لكن تم فحص هذا الكود مسبقاً بتاريخ {row['scanned_at']}.",
            "message_en": f"The product is original, but this code was already checked on {row['scanned_at']}.",
            "product": product,
            "scanned_at": row["scanned_at"],
        }
    scanned_at = now_str()
    cur.execute(
        "UPDATE verification_codes SET is_used = 1, scanned_at = ? WHERE serial = ?",
        (scanned_at, serial),
    )
    conn.commit()
    conn.close()
    log_scan(serial, "success", request)
    return {
        "status": "success",
        "message_ar": "المنتج أصلي وهذه أول مرة يتم فيها فحص الكود.",
        "message_en": "The product is original and this is the first time the code has been checked.",
        "product": product,
        "scanned_at": scanned_at,
    }


@app.post("/api/admin/login")
def admin_login(body: LoginBody):
    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM admins WHERE username = ?", (body.username,))
    admin = cur.fetchone()
    if not admin or not verify_password(body.password, admin["password_hash"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Wrong username or password")
    token = secrets.token_urlsafe(48)
    expires = datetime.now() + timedelta(hours=12)
    cur.execute(
        "INSERT INTO admin_sessions (token_hash, admin_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
        (token_hash(token), admin["id"], expires.strftime("%Y-%m-%d %H:%M:%S"), now_str()),
    )
    conn.commit()
    conn.close()
    return {"token": token, "expires_at": expires.strftime("%Y-%m-%d %H:%M:%S")}


@app.get("/api/admin/stats")
def admin_stats(admin_id=Depends(require_admin)):
    conn = db()
    cur = conn.cursor()
    stats = {}
    for key, query in {
        "products": "SELECT COUNT(*) AS c FROM catalog_products",
        "active_products": "SELECT COUNT(*) AS c FROM catalog_products WHERE active = 1",
        "codes": "SELECT COUNT(*) AS c FROM verification_codes",
        "used_codes": "SELECT COUNT(*) AS c FROM verification_codes WHERE is_used = 1",
        "unused_codes": "SELECT COUNT(*) AS c FROM verification_codes WHERE is_used = 0",
        "scan_logs": "SELECT COUNT(*) AS c FROM scan_logs",
    }.items():
        cur.execute(query)
        stats[key] = cur.fetchone()["c"]
    conn.close()
    return stats


@app.get("/api/admin/products")
def admin_list_products(admin_id=Depends(require_admin)):
    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM catalog_products ORDER BY id DESC")
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows


@app.post("/api/admin/products")
def admin_create_product(body: ProductBody, admin_id=Depends(require_admin)):
    conn = db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO catalog_products (
            name_ar, name_en, strength, form_ar, form_en,
            description_ar, description_en, image_url, active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            body.name_ar,
            body.name_en,
            body.strength,
            body.form_ar,
            body.form_en,
            body.description_ar,
            body.description_en,
            body.image_url,
            body.active,
            now_str(),
        ),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"ok": True, "id": new_id}


@app.put("/api/admin/products/{product_id}")
def admin_update_product(product_id: int, body: ProductBody, admin_id=Depends(require_admin)):
    conn = db()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE catalog_products
        SET name_ar = ?, name_en = ?, strength = ?, form_ar = ?, form_en = ?,
            description_ar = ?, description_en = ?, image_url = ?, active = ?
        WHERE id = ?
        """,
        (
            body.name_ar,
            body.name_en,
            body.strength,
            body.form_ar,
            body.form_en,
            body.description_ar,
            body.description_en,
            body.image_url,
            body.active,
            product_id,
        ),
    )
    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    conn.commit()
    conn.close()
    return {"ok": True}


@app.delete("/api/admin/products/{product_id}")
def admin_delete_product(product_id: int, admin_id=Depends(require_admin)):
    conn = db()
    cur = conn.cursor()
    cur.execute("UPDATE verification_codes SET product_id = NULL WHERE product_id = ?", (product_id,))
    cur.execute("DELETE FROM catalog_products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.get("/api/admin/codes")
def admin_list_codes(
    search: Optional[str] = "",
    status: Optional[str] = "all",
    admin_id=Depends(require_admin),
):
    conn = db()
    cur = conn.cursor()
    query = """
        SELECT vc.serial, vc.product_id, vc.is_used, vc.scanned_at, vc.created_at, vc.note,
               cp.name_ar, cp.name_en, cp.strength
        FROM verification_codes vc
        LEFT JOIN catalog_products cp ON cp.id = vc.product_id
        WHERE 1 = 1
    """
    params = []
    if search:
        query += " AND vc.serial LIKE ?"
        params.append(f"%{normalize_serial(search)}%")
    if status == "used":
        query += " AND vc.is_used = 1"
    elif status == "unused":
        query += " AND vc.is_used = 0"
    query += " ORDER BY vc.created_at DESC LIMIT 500"
    cur.execute(query, params)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows


@app.post("/api/admin/codes")
def admin_create_code(body: CodeBody, admin_id=Depends(require_admin)):
    serial = normalize_serial(body.serial)
    if len(serial) != 6:
        raise HTTPException(status_code=400, detail="Serial must be exactly 6 characters")
    conn = db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO verification_codes (serial, product_id, is_used, created_at, note) VALUES (?, ?, 0, ?, ?)",
            (serial, body.product_id, now_str(), body.note),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Serial already exists")
    conn.close()
    return {"ok": True, "serial": serial}


@app.put("/api/admin/codes/{serial}")
def admin_update_code(serial: str, body: CodeUpdateBody, admin_id=Depends(require_admin)):
    serial = normalize_serial(serial)
    updates = []
    params = []
    fields = body.model_fields_set
    if "product_id" in fields:
        updates.append("product_id = ?")
        params.append(body.product_id)
    if "is_used" in fields:
        updates.append("is_used = ?")
        params.append(body.is_used)
    if "scanned_at" in fields:
        updates.append("scanned_at = ?")
        params.append(body.scanned_at)
    if "note" in fields:
        updates.append("note = ?")
        params.append(body.note)
    if not updates:
        return {"ok": True}
    params.append(serial)
    conn = db()
    cur = conn.cursor()
    cur.execute(f"UPDATE verification_codes SET {', '.join(updates)} WHERE serial = ?", params)
    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Serial not found")
    conn.commit()
    conn.close()
    return {"ok": True}


@app.delete("/api/admin/codes/{serial}")
def admin_delete_code(serial: str, admin_id=Depends(require_admin)):
    serial = normalize_serial(serial)
    conn = db()
    cur = conn.cursor()
    cur.execute("DELETE FROM verification_codes WHERE serial = ?", (serial,))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.post("/api/admin/codes/generate")
def admin_generate_codes(body: GenerateCodesBody, admin_id=Depends(require_admin)):
    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT serial FROM verification_codes")
    existing = {row["serial"] for row in cur.fetchall()}
    created = []
    for i in range(body.count):
        serial = generate_short_serial(f"{body.product_id}-{i}", existing)
        existing.add(serial)
        created.append(serial)
    cur.executemany(
        "INSERT INTO verification_codes (serial, product_id, is_used, created_at, note) VALUES (?, ?, 0, ?, ?)",
        [(serial, body.product_id, now_str(), "Generated batch") for serial in created],
    )
    conn.commit()
    conn.close()
    return {"ok": True, "count": len(created), "codes": created}


@app.get("/api/admin/codes/export")
def admin_export_codes(admin_id=Depends(require_admin)):
    conn = db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT vc.serial, vc.is_used, vc.scanned_at, vc.created_at, vc.note,
               cp.name_en AS product_en, cp.name_ar AS product_ar, cp.strength
        FROM verification_codes vc
        LEFT JOIN catalog_products cp ON cp.id = vc.product_id
        ORDER BY vc.created_at DESC
        """
    )
    rows = cur.fetchall()
    conn.close()
    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(["serial", "is_used", "scanned_at", "created_at", "product_en", "product_ar", "strength", "note"])
    for row in rows:
        writer.writerow([row["serial"], row["is_used"], row["scanned_at"], row["created_at"], row["product_en"], row["product_ar"], row["strength"], row["note"]])
    stream.seek(0)
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=toro_verification_codes.csv"},
    )


@app.get("/api/admin/scan-logs")
def admin_scan_logs(admin_id=Depends(require_admin)):
    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM scan_logs ORDER BY id DESC LIMIT 500")
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows
