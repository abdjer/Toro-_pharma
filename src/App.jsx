import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  Fingerprint,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  PackageCheck,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const ADMIN_PATH = "/toro-control-9487";

const copy = {
  en: {
    home: "Home",
    about: "About",
    products: "Products",
    verify: "Verify",
    contact: "Contact",
    verifyCode: "Verify code",
    heroLabel: "We're Here When You Need Us",
    heroTitleA: "Black, gold, and built around",
    heroTitleB: "authenticity",
    heroText:
      "In a world of empty promises, we deliver what matters — pharmaceutical-grade excellence with uncompromising integrity. Every product tells the truth. Every batch proves it.",
    explore: "Explore products",
    checkAuthenticity: "Check authenticity",
    statA: "Third-Party Tested",
    statB: "tested in compliance with GMP Certified",
    statC: "Authenticity Guaranteed",
    aboutLabel: "Who we are",
    aboutTitle: "Forged in black. Defined in gold. Built on authenticity.",
    aboutText:
      "We are  a brand built for those who refuse to compromise. Born from the gap between what the market promises and what it actually delivers. Every product we make carries the black standard of pharmaceutical-grade quality and the gold seal of verified authenticity. We don't ask for your trust. We give you the tools to earn it yourself. No fluff. No fakes. Just the real thing.",
    productsLabel: "Products",
    productsTitle: "Catalog cards connected to the backend",
    productsText: "Products shown here are loaded from the FastAPI database and can be added, edited, hidden, or deleted from the admin panel.",
    verifyLabel: "Authenticity check",
    verifyTitle: "Check a 6-character serial number before trusting the package.",
    verifyText:"It's just 6 characters — but they hold the weight of everything we stand for. Every genuine TORO Pharma product carries a unique serial number that connects directly to our batch records. Type it in. Get instant confirmation. No runaround. No fine print. If it's real, you'll know in seconds. If it's not, you'll know in seconds too. That's the black standard. That's gold-level transparency. That's authenticity you can hold in your hands.",
    verifyNote: "If the numbers don't match, neither does our name.",
    enterCode: "Enter verification code",
    codePlaceholder: "Example: TR0001",
    verifyButton: "Verify",
    waiting: "Waiting for code",
    waitingText: "Enter a product code to see the verification result.",
    product: "Product",
    strength: "Code",
    scanTime: "Scan time",
    notConfigured: "Backend is not reachable. Make sure FastAPI is running on port 8000.",
    contactLabel: "Contact",
    contactTitle: "Talk to TORO support",
    contactText: "Use this area for official support, product verification help, and business inquiries.",
    name: "Name",
    email: "Email or WhatsApp",
    subject: "Subject",
    message: "Message",
    send: "Send message",
    footerLeft: "© 2026 TORO Pharma. All rights reserved.",
    footerRight: "Vite + React + Tailwind + FastAPI + SQLite.",
    langButton: "عربي"
  }
};

const fallbackProducts = [
  {
    id: "fallback-1",
    name_ar: "TORO Series A",
    name_en: "TORO Series A",
    strength: "TS-A",
    form_ar: "علبة مختومة / كود دفعة",
    form_en: "Sealed box / batch-coded",
    description_ar: "بطاقة منتج تجريبية تظهر عند عدم اتصال الباك إند.",
    description_en: "Fallback product card shown when the backend is not connected.",
    image_url: "/toro-label-original.png",
    active: 1
  },
  {
    id: "fallback-2",
    name_ar: "TORO Series B",
    name_en: "TORO Series B",
    strength: "TS-B",
    form_ar: "عبوة / لصاقة أمان",
    form_en: "Bottle / security label",
    description_ar: "اربط FastAPI حتى تظهر المنتجات الحقيقية من قاعدة البيانات.",
    description_en: "Connect FastAPI to show real products from the database.",
    image_url: "/toro-hero.png",
    active: 1
  },
  {
    id: "fallback-3",
    name_ar: "TORO Series C",
    name_en: "TORO Series C",
    strength: "TS-C",
    form_ar: "علبة / جاهزة للهولوغرام",
    form_en: "Box / hologram-ready",
    description_ar: "لوحة الأدمن تضيف وتعدل وتحذف المنتجات والأكواد.",
    description_en: "The admin panel adds, edits, and deletes products and codes.",
    image_url: "/toro-logo.png",
    active: 1
  }
];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof data === "object" ? data.detail || "Request failed" : data;
    throw new Error(message || "Request failed");
  }
  return data;
}

function getProductName(product, lang) {
  return lang === "ar" ? product.name_ar || product.name_en : product.name_en || product.name_ar;
}

function getProductForm(product, lang) {
  return lang === "ar" ? product.form_ar || product.form_en : product.form_en || product.form_ar;
}

function getProductDescription(product, lang) {
  return lang === "ar" ? product.description_ar || product.description_en : product.description_en || product.description_ar;
}

function SectionLabel({ children }) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-toro-gold/40 bg-toro-gold/10 px-4 py-2 text-sm font-semibold text-toro-goldLight">
      <span className="h-2 w-2 rounded-full bg-toro-goldLight shadow-[0_0_22px_rgba(215,163,93,0.9)]" />
      {children}
    </div>
  );
}

function Header({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const t = copy[lang];
  const links = [
    [t.home, "#home"],
    [t.about, "#about"],
    [t.products, "#products"],
    [t.verify, "#verify"],
    [t.contact, "#contact"]
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-toro-gold/40 bg-black shadow-gold">
            <img src="/toro-logo.png" alt="TORO Pharma logo" className="h-full w-full scale-[1.75] object-cover object-top" />
          </div>
          <div className="leading-none">
            <p className="text-xl font-black tracking-[0.22em] text-white">TORO</p>
            <p className="mt-1 text-[11px] font-semibold tracking-[0.38em] text-toro-goldLight">PHARMA</p>
          </div>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map(([label, href]) => (
            <a key={label} href={href} className="text-sm font-semibold text-zinc-300 transition hover:text-toro-goldLight">
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a href="#verify" className="rounded-full bg-toro-gold px-5 py-2.5 text-sm font-black text-black transition hover:bg-toro-goldLight">
            {t.verifyCode}
          </a>
        </div>

        <button className="rounded-xl border border-white/10 p-2 text-white md:hidden" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-black px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map(([label, href]) => (
              <a key={label} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-zinc-200 hover:bg-white/5">
                {label}
              </a>
            ))}
            {/* language toggle removed */}
          </div>
        </div>
      )}
    </header>
  );
}

function Hero({ lang }) {
  const t = copy[lang];
  return (
    <section id="home" className="noise relative isolate min-h-screen overflow-hidden bg-toro-black pt-24 text-white">
      <div className="absolute left-1/2 top-20 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-toro-gold/20 blur-3xl" />
      <div className="absolute -right-40 bottom-8 -z-10 h-[28rem] w-[28rem] rounded-full bg-toro-gold/10 blur-3xl" />
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }}>
          <SectionLabel>{t.heroLabel}</SectionLabel>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            {t.heroTitleA} <span className="gold-text">{t.heroTitleB}</span>.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-300">{t.heroText}</p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <a href="#products" className="inline-flex items-center justify-center gap-2 rounded-full bg-toro-gold px-7 py-4 font-black text-black transition hover:bg-toro-goldLight">
              {t.explore} <ArrowRight size={18} className={lang === "ar" ? "rotate-180" : ""} />
            </a>
            <a href="#verify" className="inline-flex items-center justify-center gap-2 rounded-full border border-toro-gold/50 bg-white/5 px-7 py-4 font-bold text-white transition hover:bg-white/10">
              <ShieldCheck size={18} /> {t.checkAuthenticity}
            </a>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {[t.statA, t.statB, t.statC].map((label, index) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <p className="text-2xl font-black text-toro-goldLight">{index === 0 ? "TEST" : index === 1 ? "Certificates" : "originality"}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }} className="mx-auto w-full max-w-lg">
          <div className="relative rounded-[2rem] border border-toro-gold/40 bg-gradient-to-b from-zinc-950 to-black p-5 shadow-2xl shadow-toro-gold/10">
            <div className="absolute -inset-1 -z-10 rounded-[2.2rem] bg-gradient-to-b from-toro-goldLight/25 via-transparent to-toro-gold/20 blur-xl" />
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
              <img src="/toro-hero.png" alt="TORO Pharma visual identity" className="h-[34rem] w-full object-cover object-top" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function About({ lang }) {
  const t = copy[lang];
  const items = lang === "ar"
    ? [
        [ShieldCheck, "الأصالة", "واجهة تحقق من السيريال وتفاصيل الدفعة."],
        [PackageCheck, "التغليف", "مساحة لنوع العبوة، الختم، وتفاصيل اللصاقة."],
        [Fingerprint, "التتبع", "جاهزة لتاريخ الفحص وتنبيهات التكرار."],
        [LockKeyhole, "الأمان", "الأكواد محمية في الباك إند وليس في React."]
      ]
    : [
        [ShieldCheck, "Authenticity", "A verification-first interface for checking serial numbers and batch details."],
        [PackageCheck, "Packaging", "Space for package type, seal information, and visible label details."],
        [Fingerprint, "Traceability", "Ready for scan history and duplicate-scan alerts."],
        [LockKeyhole, "Secure backend", "Valid codes live in the backend, not in React."]
      ];

  return (
    <section id="about" className="bg-black py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <SectionLabel>{t.aboutLabel}</SectionLabel>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">{t.aboutTitle}</h2>
          <p className="mt-6 text-lg leading-8 text-zinc-300">{t.aboutText}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(([Icon, title, text]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-toro-gold/60 hover:bg-toro-gold/10">
              <Icon className="text-toro-goldLight" size={29} />
              <h3 className="mt-5 text-xl font-black">{title}</h3>
              <p className="mt-3 leading-7 text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Products({ lang }) {
  const t = copy[lang];
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiRequest("/api/products")
      .then((data) => {
        if (!cancelled) {
          setProducts(data.length ? data : fallbackProducts);
          setApiOnline(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts(fallbackProducts);
          setApiOnline(false);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="products" className="bg-[#0b0b0b] py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>{t.productsLabel}</SectionLabel>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">{t.productsTitle}</h2>
          <p className="mt-5 text-lg leading-8 text-zinc-300">{t.productsText}</p>
          {!apiOnline && !loading && <p className="mt-4 text-sm text-amber-300">{t.notConfigured}</p>}
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {products.map((product, index) => (
            <motion.article
              key={product.id || product.name_en}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-xl shadow-black/30 transition hover:-translate-y-1 hover:border-toro-gold/60"
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-[#171717] via-black to-toro-gold/20 p-6">
                <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_28%_20%,rgba(215,163,93,0.55),transparent_24%),radial-gradient(circle_at_72%_74%,rgba(183,122,50,0.55),transparent_24%)]" />
                <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-toro-gold/30 bg-black/70 p-6 backdrop-blur">
                  {product.image_url && (
                    <img src={product.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
                  )}
                  <div className="relative flex items-start justify-between gap-3">
                    <span className="rounded-full bg-toro-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-toro-goldLight">
                      {getProductForm(product, lang) || "Product line"}
                    </span>
                    <Sparkles className="text-toro-goldLight" />
                  </div>
                  <div className="relative">
                    <p className="text-5xl font-black text-toro-goldLight">{product.strength || "TORO"}</p>
                    <p className="mt-2 text-sm uppercase tracking-[0.25em] text-zinc-400">{getProductName(product, lang)}</p>
                  </div>
                </div>
              </div>
              <div className="p-7">
                <h3 className="text-2xl font-black">{getProductName(product, lang)}</h3>
                <p className="mt-4 leading-7 text-zinc-400">{getProductDescription(product, lang)}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Batch code", "Serial check", "Admin editable", "API linked"].map((spec) => (
                    <span key={spec} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300">
                      {lang === "ar" ? { "Batch code": "كود دفعة", "Serial check": "فحص سيريال", "Admin editable": "تعديل أدمن", "API linked": "مربوط API" }[spec] : spec}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Verify({ lang }) {
  const t = copy[lang];
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const samples = ["TR0001", "TR0002", "TR0003"];

  async function handleVerify(value = code) {
    const serial = value.trim().toUpperCase();
    setCode(serial);
    setError("");
    setResult(null);
    if (!serial) return;
    try {
      setLoading(true);
      const data = await apiRequest("/api/verify", {
        method: "POST",
        body: JSON.stringify({ serial })
      });
      setResult(data);
    } catch (err) {
      setError(t.notConfigured);
    } finally {
      setLoading(false);
    }
  }

  const statusStyles = {
    success: "border-emerald-500/30 bg-emerald-500/10",
    duplicated: "border-amber-500/30 bg-amber-500/10",
    fake: "border-red-500/30 bg-red-500/10",
    invalid: "border-sky-500/30 bg-sky-500/10"
  };

  return (
    <section id="verify" className="relative overflow-hidden bg-black py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(183,122,50,0.22),transparent_42%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <SectionLabel>{t.verifyLabel}</SectionLabel>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">{t.verifyTitle}</h2>
          <p className="mt-6 text-lg leading-8 text-zinc-300">{t.verifyText}</p>
          <div className="mt-8 rounded-3xl border border-toro-gold/30 bg-toro-gold/10 p-5">
            <div className="flex gap-3">
              <FileText className="mt-1 shrink-0 text-toro-goldLight" size={22} />
              <p className="leading-7 text-zinc-300">{t.verifyNote}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="rounded-[1.5rem] border border-toro-gold/30 bg-black p-6 sm:p-8">
            <label className="text-sm font-bold uppercase tracking-[0.25em] text-toro-goldLight">{t.enterCode}</label>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className={cx("absolute top-1/2 -translate-y-1/2 text-zinc-500", lang === "ar" ? "right-4" : "left-4")} size={20} />
                <input
                  value={code}
                  maxLength={6}
                  onChange={(event) => {
                    setCode(event.target.value.toUpperCase());
                    setResult(null);
                    setError("");
                  }}
                  onKeyDown={(event) => event.key === "Enter" && handleVerify()}
                  placeholder={t.codePlaceholder}
                  className={cx(
                    "w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-toro-goldLight",
                    lang === "ar" ? "pr-12 pl-4" : "pl-12 pr-4"
                  )}
                />
              </div>
              <button disabled={loading} onClick={() => handleVerify()} className="rounded-2xl bg-toro-gold px-6 py-4 font-black text-black transition hover:bg-toro-goldLight disabled:opacity-60">
                {loading ? "..." : t.verifyButton}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {samples.map((sample) => (
                <button
                  key={sample}
                  onClick={() => handleVerify(sample)}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-toro-gold/60 hover:text-toro-goldLight"
                >
                  {sample}
                </button>
              ))}
            </div>

            <div className={cx("mt-8 rounded-3xl border p-6", result ? statusStyles[result.status] || "border-white/10 bg-white/[0.03]" : error ? "border-red-500/30 bg-red-500/10" : "border-white/10 bg-white/[0.03]")}>
              {!result && !error ? (
                <div className="flex items-start gap-4">
                  <ShieldCheck className="shrink-0 text-toro-goldLight" size={30} />
                  <div>
                    <h3 className="text-xl font-black">{t.waiting}</h3>
                    <p className="mt-2 text-zinc-400">{t.waitingText}</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-start gap-4">
                  <AlertTriangle className="shrink-0 text-red-300" size={32} />
                  <div>
                    <h3 className="text-2xl font-black text-red-200">API Error</h3>
                    <p className="mt-2 text-zinc-300">{error}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-4">
                    {result.status === "success" ? <CheckCircle2 className="shrink-0 text-emerald-400" size={32} /> : <AlertTriangle className="shrink-0 text-amber-300" size={32} />}
                    <div>
                      <h3 className={cx("text-2xl font-black", result.status === "success" ? "text-emerald-300" : result.status === "fake" ? "text-red-200" : "text-amber-200")}>
                        {result.status === "success" ? (lang === "ar" ? "كود أصلي" : "Original serial") : result.status === "duplicated" ? (lang === "ar" ? "كود أصلي مستخدم سابقاً" : "Original but already checked") : result.status === "fake" ? (lang === "ar" ? "الكود غير موجود" : "Code not found") : (lang === "ar" ? "كود غير صالح" : "Invalid code")}
                      </h3>
                      <p className="mt-2 text-zinc-300">{lang === "ar" ? result.message_ar : result.message_en}</p>
                    </div>
                  </div>
                  {result.product && (
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {[
                        [t.product, getProductName(result.product, lang) || "TORO"],
                        [t.strength, result.product.strength || code],
                        [t.scanTime, result.scanned_at || "-" ]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                          <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
                          <p className="mt-1 font-bold text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact({ lang }) {
  const t = copy[lang];
  return (
    <section id="contact" className="bg-[#0b0b0b] py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 rounded-[2rem] border border-toro-gold/30 bg-gradient-to-br from-[#151515] to-black p-6 sm:p-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionLabel>{t.contactLabel}</SectionLabel>
            <h2 className="text-4xl font-black tracking-tight">{t.contactTitle}</h2>
            <p className="mt-5 leading-8 text-zinc-300">{t.contactText}</p>
            <div className="mt-8 space-y-4">
              {[
                [Phone, "+963 957 257 941"],
                [Mail, "support@toropharma.example"],
                [MapPin, lang === "ar" ? "القنوات الرسمية فقط" : "Official channels only"]
              ].map(([Icon, text]) => (
                <div key={text} className="flex items-center gap-3 text-zinc-300">
                  <Icon className="text-toro-goldLight" size={21} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <form className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input placeholder={t.name} className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-toro-goldLight" />
              <input placeholder={t.email} className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-toro-goldLight" />
            </div>
            <input placeholder={t.subject} className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-toro-goldLight" />
            <textarea placeholder={t.message} rows={5} className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-toro-goldLight" />
            <button type="button" className="rounded-2xl bg-toro-gold px-7 py-4 font-black text-black transition hover:bg-toro-goldLight">
              {t.send}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer({ lang }) {
  const t = copy[lang];
  return (
    <footer className="border-t border-white/10 bg-black py-10 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-zinc-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>{t.footerLeft}</p>
        <p>{t.footerRight}</p>
      </div>
    </footer>
  );
}

function WhatsAppFloat() {
  const phone = "963957257941";
  const message = encodeURIComponent("مرحبا");
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className="fixed bottom-6 left-6 z-[9999] flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-black/40 transition duration-300 hover:scale-110 hover:bg-[#1ebe5d]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-9 w-9 fill-current">
        <path d="M16.04 3C9.42 3 4.03 8.38 4.03 15c0 2.12.56 4.18 1.62 6L4 29l8.2-1.58A11.9 11.9 0 0 0 16.04 27C22.66 27 28 21.62 28 15S22.66 3 16.04 3Zm0 21.8c-1.8 0-3.56-.48-5.1-1.38l-.36-.21-4.86.94.97-4.74-.24-.38A9.7 9.7 0 0 1 6.24 15c0-5.4 4.4-9.8 9.8-9.8s9.76 4.4 9.76 9.8-4.36 9.8-9.76 9.8Zm5.38-7.33c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.46-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.51s1.08 2.91 1.23 3.11c.15.2 2.13 3.25 5.16 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}

const emptyProduct = {
  name_ar: "",
  name_en: "",
  strength: "",
  form_ar: "",
  form_en: "",
  description_ar: "",
  description_en: "",
  image_url: "",
  active: 1
};

function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem("toro_admin_token") || "");
  const [login, setLogin] = useState({ username: "admin", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [products, setProducts] = useState([]);
  const [codes, setCodes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState("products");
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [codeForm, setCodeForm] = useState({ serial: "", product_id: "", note: "" });
  const [generateForm, setGenerateForm] = useState({ product_id: "", count: 10 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  async function adminRequest(path, options = {}) {
    return apiRequest(path, {
      ...options,
      headers: { ...authHeaders, ...(options.headers || {}) }
    });
  }

  function handleAuthError(err) {
    if (String(err.message || "").toLowerCase().includes("session") || String(err.message || "").toLowerCase().includes("unauthorized")) {
      localStorage.removeItem("toro_admin_token");
      setToken("");
    }
    setError(err.message || "حدث خطأ");
  }

  async function loadAdminData() {
    if (!token) return;
    try {
      setLoading(true);
      const [productData, codeData, logData, statData] = await Promise.all([
        adminRequest("/api/admin/products"),
        adminRequest(`/api/admin/codes?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`),
        adminRequest("/api/admin/scan-logs"),
        adminRequest("/api/admin/stats")
      ]);
      setProducts(productData);
      setCodes(codeData);
      setLogs(logData);
      setStats(statData);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, search, status]);

  async function doLogin(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify(login)
      });
      localStorage.setItem("toro_admin_token", data.token);
      setToken(data.token);
      setNotice("تم تسجيل الدخول بنجاح");
    } catch (err) {
      setError("بيانات الدخول غير صحيحة أو الباك إند غير شغال");
    }
  }

  function logout() {
    localStorage.removeItem("toro_admin_token");
    setToken("");
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const body = { ...productForm, active: Number(productForm.active) };
    try {
      if (editingProductId) {
        await adminRequest(`/api/admin/products/${editingProductId}`, { method: "PUT", body: JSON.stringify(body) });
        setNotice("تم تعديل المنتج");
      } else {
        await adminRequest("/api/admin/products", { method: "POST", body: JSON.stringify(body) });
        setNotice("تم إضافة المنتج");
      }
      setProductForm(emptyProduct);
      setEditingProductId(null);
      await loadAdminData();
    } catch (err) {
      handleAuthError(err);
    }
  }

  function editProduct(product) {
    setEditingProductId(product.id);
    setProductForm({
      name_ar: product.name_ar || "",
      name_en: product.name_en || "",
      strength: product.strength || "",
      form_ar: product.form_ar || "",
      form_en: product.form_en || "",
      description_ar: product.description_ar || "",
      description_en: product.description_en || "",
      image_url: product.image_url || "",
      active: product.active ?? 1
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProduct(id) {
    if (!confirm("حذف المنتج؟ الأكواد المرتبطة به ستبقى بدون منتج.")) return;
    try {
      await adminRequest(`/api/admin/products/${id}`, { method: "DELETE" });
      setNotice("تم حذف المنتج");
      await loadAdminData();
    } catch (err) {
      handleAuthError(err);
    }
  }

  async function createCode(event) {
    event.preventDefault();
    try {
      await adminRequest("/api/admin/codes", {
        method: "POST",
        body: JSON.stringify({
          serial: codeForm.serial,
          product_id: codeForm.product_id ? Number(codeForm.product_id) : null,
          note: codeForm.note
        })
      });
      setCodeForm({ serial: "", product_id: "", note: "" });
      setNotice("تم إضافة الكود");
      await loadAdminData();
    } catch (err) {
      handleAuthError(err);
    }
  }

  async function generateCodes(event) {
    event.preventDefault();
    try {
      const data = await adminRequest("/api/admin/codes/generate", {
        method: "POST",
        body: JSON.stringify({
          product_id: generateForm.product_id ? Number(generateForm.product_id) : null,
          count: Number(generateForm.count)
        })
      });
      setGeneratedCodes(data.codes || []);
      setNotice(`تم توليد ${data.count} كود`);
      await loadAdminData();
    } catch (err) {
      handleAuthError(err);
    }
  }

  async function resetCode(serial) {
    try {
      await adminRequest(`/api/admin/codes/${serial}`, {
        method: "PUT",
        body: JSON.stringify({ is_used: 0, scanned_at: null })
      });
      setNotice("تم تصفير حالة الكود");
      await loadAdminData();
    } catch (err) {
      handleAuthError(err);
    }
  }

  async function deleteCode(serial) {
    if (!confirm(`حذف الكود ${serial}؟`)) return;
    try {
      await adminRequest(`/api/admin/codes/${serial}`, { method: "DELETE" });
      setNotice("تم حذف الكود");
      await loadAdminData();
    } catch (err) {
      handleAuthError(err);
    }
  }

  function downloadGeneratedCsv() {
    const rows = generatedCodes.length ? generatedCodes : codes.map((code) => code.serial);
    const csv = ["Serial_Number", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generatedCodes.length ? "generated_toro_codes.csv" : "visible_toro_codes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadAllCodes() {
    try {
      const response = await fetch(`${API_URL}/api/admin/codes/export`, { headers: authHeaders });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "toro_verification_codes.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("فشل تصدير كل الأكواد");
    }
  }

  if (!token) {
    return (
      <main dir="rtl" className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-md rounded-[2rem] border border-toro-gold/30 bg-white/[0.04] p-6 shadow-gold">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-2xl border border-toro-gold/40">
              <img src="/toro-logo.png" className="h-full w-full scale-[1.75] object-cover object-top" alt="TORO" />
            </div>
            <div>
              <h1 className="text-2xl font-black">لوحة إدارة TORO</h1>
              <p className="text-sm text-zinc-400">رابط مخفي + تسجيل دخول محمي</p>
            </div>
          </div>
          <form onSubmit={doLogin} className="grid gap-4">
            <input
              value={login.username}
              onChange={(e) => setLogin((v) => ({ ...v, username: e.target.value }))}
              placeholder="اسم المستخدم"
              className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none focus:border-toro-goldLight"
            />
            <input
              value={login.password}
              onChange={(e) => setLogin((v) => ({ ...v, password: e.target.value }))}
              type="password"
              placeholder="كلمة المرور"
              className="rounded-2xl border border-white/10 bg-black/50 px-5 py-4 outline-none focus:border-toro-goldLight"
            />
            {error && <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
            <button className="rounded-2xl bg-toro-gold px-5 py-4 font-black text-black hover:bg-toro-goldLight">دخول</button>
          </form>
          <p className="mt-6 text-xs leading-6 text-zinc-500">البيانات الافتراضية محلياً: admin / admin123. غيّرها من backend/.env قبل النشر.</p>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-2xl border border-toro-gold/40">
              <img src="/toro-logo.png" className="h-full w-full scale-[1.75] object-cover object-top" alt="TORO" />
            </div>
            <div>
              <h1 className="text-xl font-black">لوحة إدارة TORO</h1>
              <p className="text-xs text-zinc-500">منتجات، أكواد تحقق، وسجل فحص</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["products", "المنتجات"],
              ["codes", "الأكواد"],
              ["logs", "السجل"]
            ].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} className={cx("rounded-full px-4 py-2 text-sm font-bold", tab === key ? "bg-toro-gold text-black" : "border border-white/10 text-zinc-300 hover:border-toro-gold/60")}>{label}</button>
            ))}
            <button onClick={loadAdminData} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 hover:border-toro-gold/60">
              <RefreshCw size={16} /> تحديث
            </button>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-red-500/30 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-500/10">
              <LogOut size={16} /> خروج
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["المنتجات", stats.products || 0],
            ["الأكواد", stats.codes || 0],
            ["غير مستخدمة", stats.unused_codes || 0],
            ["مستخدمة", stats.used_codes || 0]
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-toro-goldLight">{value}</p>
            </div>
          ))}
        </div>

        {notice && <p className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">{notice}</p>}
        {error && <p className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</p>}
        {loading && <p className="mt-5 text-sm text-zinc-500">جاري التحميل...</p>}

        {tab === "products" && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={saveProduct} className="rounded-[2rem] border border-toro-gold/30 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-black">{editingProductId ? "تعديل منتج" : "إضافة منتج"}</h2>
              <div className="mt-5 grid gap-4">
                <input value={productForm.name_ar} onChange={(e) => setProductForm((v) => ({ ...v, name_ar: e.target.value }))} required placeholder="اسم المنتج عربي" className="input-admin" />
                <input value={productForm.name_en} onChange={(e) => setProductForm((v) => ({ ...v, name_en: e.target.value }))} required placeholder="Product name EN" className="input-admin" />
                <input value={productForm.strength} onChange={(e) => setProductForm((v) => ({ ...v, strength: e.target.value }))} placeholder="الكود / القوة / السلسلة" className="input-admin" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input value={productForm.form_ar} onChange={(e) => setProductForm((v) => ({ ...v, form_ar: e.target.value }))} placeholder="الشكل عربي" className="input-admin" />
                  <input value={productForm.form_en} onChange={(e) => setProductForm((v) => ({ ...v, form_en: e.target.value }))} placeholder="Form EN" className="input-admin" />
                </div>
                <textarea value={productForm.description_ar} onChange={(e) => setProductForm((v) => ({ ...v, description_ar: e.target.value }))} placeholder="الوصف عربي" rows={3} className="input-admin" />
                <textarea value={productForm.description_en} onChange={(e) => setProductForm((v) => ({ ...v, description_en: e.target.value }))} placeholder="Description EN" rows={3} className="input-admin" />
                <input value={productForm.image_url} onChange={(e) => setProductForm((v) => ({ ...v, image_url: e.target.value }))} placeholder="رابط الصورة مثل /toro-hero.png" className="input-admin" />
                <select value={productForm.active} onChange={(e) => setProductForm((v) => ({ ...v, active: Number(e.target.value) }))} className="input-admin">
                  <option value={1}>ظاهر بالموقع</option>
                  <option value={0}>مخفي</option>
                </select>
                <div className="flex gap-3">
                  <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-toro-gold px-5 py-4 font-black text-black hover:bg-toro-goldLight">
                    <Plus size={18} /> {editingProductId ? "حفظ التعديل" : "إضافة"}
                  </button>
                  {editingProductId && <button type="button" onClick={() => { setEditingProductId(null); setProductForm(emptyProduct); }} className="rounded-2xl border border-white/10 px-5 py-4 font-bold text-zinc-300">إلغاء</button>}
                </div>
              </div>
            </form>

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 p-5">
                <h2 className="text-2xl font-black">قائمة المنتجات</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-white/[0.04] text-zinc-400">
                    <tr>
                      <th className="p-4 text-right">المنتج</th>
                      <th className="p-4 text-right">الكود</th>
                      <th className="p-4 text-right">الحالة</th>
                      <th className="p-4 text-right">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-t border-white/10">
                        <td className="p-4"><p className="font-bold">{product.name_ar}</p><p className="text-zinc-500">{product.name_en}</p></td>
                        <td className="p-4 text-toro-goldLight">{product.strength}</td>
                        <td className="p-4">{product.active ? "ظاهر" : "مخفي"}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => editProduct(product)} className="rounded-xl border border-white/10 p-2 text-zinc-300 hover:border-toro-gold/60"><Edit3 size={16} /></button>
                            <button onClick={() => deleteProduct(product.id)} className="rounded-xl border border-red-500/30 p-2 text-red-200 hover:bg-red-500/10"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "codes" && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-6">
              <form onSubmit={createCode} className="rounded-[2rem] border border-toro-gold/30 bg-white/[0.04] p-6">
                <h2 className="text-2xl font-black">إضافة كود يدوي</h2>
                <div className="mt-5 grid gap-4">
                  <input maxLength={6} value={codeForm.serial} onChange={(e) => setCodeForm((v) => ({ ...v, serial: e.target.value.toUpperCase() }))} placeholder="مثال TR0004" className="input-admin" />
                  <select value={codeForm.product_id} onChange={(e) => setCodeForm((v) => ({ ...v, product_id: e.target.value }))} className="input-admin">
                    <option value="">بدون منتج</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name_ar || product.name_en}</option>)}
                  </select>
                  <input value={codeForm.note} onChange={(e) => setCodeForm((v) => ({ ...v, note: e.target.value }))} placeholder="ملاحظة" className="input-admin" />
                  <button className="rounded-2xl bg-toro-gold px-5 py-4 font-black text-black hover:bg-toro-goldLight">إضافة الكود</button>
                </div>
              </form>

              <form onSubmit={generateCodes} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-2xl font-black">توليد أكواد دفعة واحدة</h2>
                <div className="mt-5 grid gap-4">
                  <select value={generateForm.product_id} onChange={(e) => setGenerateForm((v) => ({ ...v, product_id: e.target.value }))} className="input-admin">
                    <option value="">بدون منتج</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name_ar || product.name_en}</option>)}
                  </select>
                  <input type="number" min="1" max="50000" value={generateForm.count} onChange={(e) => setGenerateForm((v) => ({ ...v, count: e.target.value }))} className="input-admin" />
                  <button className="rounded-2xl bg-toro-gold px-5 py-4 font-black text-black hover:bg-toro-goldLight">توليد</button>
                  <button type="button" onClick={downloadGeneratedCsv} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 font-bold text-zinc-200 hover:border-toro-gold/60">
                    <Download size={18} /> تحميل الأكواد الظاهرة CSV
                  </button>
                  <button type="button" onClick={downloadAllCodes} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 font-bold text-zinc-200 hover:border-toro-gold/60">
                    <Download size={18} /> تصدير كل الأكواد من السيرفر
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
              <div className="grid gap-3 border-b border-white/10 p-5 md:grid-cols-3">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث عن كود" className="input-admin" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-admin">
                  <option value="all">كل الأكواد</option>
                  <option value="unused">غير مستخدم</option>
                  <option value="used">مستخدم</option>
                </select>
                <button onClick={loadAdminData} className="rounded-2xl bg-toro-gold px-5 py-3 font-black text-black">بحث</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-white/[0.04] text-zinc-400">
                    <tr>
                      <th className="p-4 text-right">الكود</th>
                      <th className="p-4 text-right">المنتج</th>
                      <th className="p-4 text-right">الحالة</th>
                      <th className="p-4 text-right">آخر فحص</th>
                      <th className="p-4 text-right">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((code) => (
                      <tr key={code.serial} className="border-t border-white/10">
                        <td className="p-4 font-black text-toro-goldLight">{code.serial}</td>
                        <td className="p-4">{code.name_ar || code.name_en || "-"}</td>
                        <td className="p-4">{code.is_used ? "مستخدم" : "غير مستخدم"}</td>
                        <td className="p-4 text-zinc-500">{code.scanned_at || "-"}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => resetCode(code.serial)} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:border-toro-gold/60">Reset</button>
                            <button onClick={() => deleteCode(code.serial)} className="rounded-xl border border-red-500/30 p-2 text-red-200 hover:bg-red-500/10"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "logs" && (
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
            <div className="border-b border-white/10 p-5">
              <h2 className="text-2xl font-black">سجل محاولات الفحص</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-white/[0.04] text-zinc-400">
                  <tr>
                    <th className="p-4 text-right">الكود</th>
                    <th className="p-4 text-right">النتيجة</th>
                    <th className="p-4 text-right">IP</th>
                    <th className="p-4 text-right">الوقت</th>
                    <th className="p-4 text-right">User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-white/10">
                      <td className="p-4 font-black text-toro-goldLight">{log.serial}</td>
                      <td className="p-4">{log.status}</td>
                      <td className="p-4 text-zinc-400">{log.ip}</td>
                      <td className="p-4 text-zinc-400">{log.created_at}</td>
                      <td className="max-w-[360px] truncate p-4 text-zinc-500">{log.user_agent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("toro_lang") || "ar");

  useEffect(() => {
    localStorage.setItem("toro_lang", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const isAdminRoute = window.location.pathname === ADMIN_PATH;

  if (isAdminRoute) {
    return <AdminPanel />;
  }

  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-black font-sans">
      <Header lang={lang} setLang={setLang} />
      <Hero lang={lang} />
      <About lang={lang} />
      <Products lang={lang} />
      <Verify lang={lang} />
      <Contact lang={lang} />
      <Footer lang={lang} />
      <WhatsAppFloat />
    </main>
  );
}
