import { useState, useEffect, useRef } from "react";

// ============================================================
// DEEP LINK RESOLVER - Platform App Schemes
// ============================================================
const PLATFORM_SCHEMES = {
  youtube: {
    name: "YouTube",
    icon: "▶",
    color: "#FF0000",
    detect: (url) => url.includes("youtube.com") || url.includes("youtu.be"),
    android: (url) => {
      const videoMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (videoMatch) return `vnd.youtube:${videoMatch[1]}`;
      return `vnd.youtube://www.youtube.com`;
    },
    ios: (url) => {
      const videoMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (videoMatch) return `youtube://www.youtube.com/watch?v=${videoMatch[1]}`;
      return `youtube://`;
    },
    fallback: (url) => url,
  },
  amazon: {
    name: "Amazon",
    icon: "🛒",
    color: "#FF9900",
    detect: (url) => url.includes("amazon.") || url.includes("amzn."),
    android: (url) => {
      const asin = url.match(/\/dp\/([A-Z0-9]{10})/);
      if (asin) return `com.amazon.mobile.shopping://detail/${asin[1]}`;
      return `com.amazon.mobile.shopping://`;
    },
    ios: (url) => {
      const asin = url.match(/\/dp\/([A-Z0-9]{10})/);
      if (asin) return `com.amazon.mobile.shopping.web://www.amazon.in/dp/${asin[1]}`;
      return `com.amazon.mobile.shopping.web://`;
    },
    fallback: (url) => url,
  },
  flipkart: {
    name: "Flipkart",
    icon: "🛍",
    color: "#2874F0",
    detect: (url) => url.includes("flipkart.com"),
    android: (url) => `flipkart://flipkart.com${new URL(url).pathname}`,
    ios: (url) => `flipkart://flipkart.com${new URL(url).pathname}`,
    fallback: (url) => url,
  },
  telegram: {
    name: "Telegram",
    icon: "✈",
    color: "#0088CC",
    detect: (url) => url.includes("t.me") || url.includes("telegram.me"),
    android: (url) => {
      const path = url.replace(/https?:\/\/(t\.me|telegram\.me)/, "");
      return `tg://resolve?domain=${path.replace("/", "")}`;
    },
    ios: (url) => {
      const path = url.replace(/https?:\/\/(t\.me|telegram\.me)/, "");
      return `tg://resolve?domain=${path.replace("/", "")}`;
    },
    fallback: (url) => url,
  },
  instagram: {
    name: "Instagram",
    icon: "📸",
    color: "#E1306C",
    detect: (url) => url.includes("instagram.com"),
    android: (url) => `instagram://user?username=${url.split("/").filter(Boolean).pop()}`,
    ios: (url) => `instagram://user?username=${url.split("/").filter(Boolean).pop()}`,
    fallback: (url) => url,
  },
  snapchat: {
    name: "Snapchat",
    icon: "👻",
    color: "#FFFC00",
    detect: (url) => url.includes("snapchat.com"),
    android: (url) => `snapchat://`,
    ios: (url) => `snapchat://`,
    fallback: (url) => url,
  },
  pinterest: {
    name: "Pinterest",
    icon: "📌",
    color: "#E60023",
    detect: (url) => url.includes("pinterest.com") || url.includes("pin.it"),
    android: (url) => `pinterest://`,
    ios: (url) => `pinterest://`,
    fallback: (url) => url,
  },
  netflix: {
    name: "Netflix",
    icon: "🎬",
    color: "#E50914",
    detect: (url) => url.includes("netflix.com"),
    android: (url) => {
      const titleId = url.match(/title\/(\d+)/);
      return titleId ? `nflx://www.netflix.com/title/${titleId[1]}` : `nflx://`;
    },
    ios: (url) => {
      const titleId = url.match(/title\/(\d+)/);
      return titleId ? `nflx://www.netflix.com/title/${titleId[1]}` : `nflx://`;
    },
    fallback: (url) => url,
  },
  maps: {
    name: "Google Maps",
    icon: "📍",
    color: "#4285F4",
    detect: (url) => url.includes("maps.google") || url.includes("goo.gl/maps") || url.includes("google.com/maps"),
    android: (url) => `geo:0,0?q=${encodeURIComponent(url)}`,
    ios: (url) => `comgooglemaps://?q=${encodeURIComponent(url)}`,
    fallback: (url) => url,
  },
  facebook: {
    name: "Facebook",
    icon: "👥",
    color: "#1877F2",
    detect: (url) => url.includes("facebook.com") || url.includes("fb.com"),
    android: (url) => `fb://`,
    ios: (url) => `fb://`,
    fallback: (url) => url,
  },
  swiggy: {
    name: "Swiggy",
    icon: "🍱",
    color: "#FC8019",
    detect: (url) => url.includes("swiggy.com"),
    android: (url) => `in.swiggy.android://swiggy.com`,
    ios: (url) => `swiggy://`,
    fallback: (url) => url,
  },
  zomato: {
    name: "Zomato",
    icon: "🍽",
    color: "#E23744",
    detect: (url) => url.includes("zomato.com"),
    android: (url) => `com.application.zomato://zomato.com`,
    ios: (url) => `zomato://`,
    fallback: (url) => url,
  },
  myntra: {
    name: "Myntra",
    icon: "👗",
    color: "#FF3F6C",
    detect: (url) => url.includes("myntra.com"),
    android: (url) => `com.myntra.android://myntra.com`,
    ios: (url) => `myntra://`,
    fallback: (url) => url,
  },
};

function detectPlatform(url) {
  for (const [key, platform] of Object.entries(PLATFORM_SCHEMES)) {
    if (platform.detect(url)) return { key, ...platform };
  }
  return null;
}

function detectDevice() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  return "desktop";
}

function generateBypassLink(url, linkId) {
  return `${window.location.origin}/r/${linkId}`;
}

function buildDeepLink(url, platform) {
  const device = detectDevice();
  try {
    if (device === "android") return platform.android(url);
    if (device === "ios") return platform.ios(url);
  } catch (e) {}
  return platform.fallback(url);
}

// ============================================================
// STORAGE
// ============================================================
function useStorage() {
  const [links, setLinks] = useState(() => {
    try {
      const s = sessionStorage.getItem("bg_links");
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [analytics, setAnalytics] = useState(() => {
    try {
      const s = sessionStorage.getItem("bg_analytics");
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });
  const [user, setUser] = useState(() => {
    try {
      const s = sessionStorage.getItem("bg_user");
      return s ? JSON.parse(s) : { clicks: 1000, email: null, loggedIn: false };
    } catch { return { clicks: 1000, email: null, loggedIn: false }; }
  });

  function saveLink(link) {
    const updated = [link, ...links];
    setLinks(updated);
    sessionStorage.setItem("bg_links", JSON.stringify(updated));
  }

  function trackClick(linkId) {
    const updated = { ...analytics, [linkId]: (analytics[linkId] || 0) + 1 };
    setAnalytics(updated);
    sessionStorage.setItem("bg_analytics", JSON.stringify(updated));
    const updatedUser = { ...user, clicks: Math.max(0, user.clicks - 1) };
    setUser(updatedUser);
    sessionStorage.setItem("bg_user", JSON.stringify(updatedUser));
  }

  function addClicks(amount) {
    const updatedUser = { ...user, clicks: user.clicks + amount };
    setUser(updatedUser);
    sessionStorage.setItem("bg_user", JSON.stringify(updatedUser));
  }

  function login(email) {
    const updatedUser = { ...user, email, loggedIn: true };
    setUser(updatedUser);
    sessionStorage.setItem("bg_user", JSON.stringify(updatedUser));
  }

  return { links, analytics, user, saveLink, trackClick, addClicks, login };
}

// ============================================================
// COMPONENTS
// ============================================================

function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A855F7"/>
          <stop offset="100%" stopColor="#7C3AED"/>
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#logoGrad)"/>
      <path d="M8 20 L16 12 L24 20 L16 28 Z" fill="white" opacity="0.9"/>
      <path d="M18 20 L26 12 L34 20 L26 28 Z" fill="white" opacity="0.5"/>
      <circle cx="16" cy="20" r="3" fill="white"/>
    </svg>
  );
}

function Navbar({ page, setPage, user }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(168,85,247,0.15)" : "none",
      transition: "all 0.3s ease",
      padding: "14px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setPage("home")}>
        <Logo size={36}/>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, background: "linear-gradient(135deg,#7C3AED,#A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          BypassGram
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {["home","dashboard","pricing"].map(p => (
          <button key={p} onClick={() => setPage(p)} style={{
            padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer",
            background: page === p ? "linear-gradient(135deg,#7C3AED,#A855F7)" : "transparent",
            color: page === p ? "white" : "#6B7280", fontWeight: 600, fontSize: 13,
            fontFamily: "'Syne', sans-serif", textTransform: "capitalize", transition: "all 0.2s"
          }}>{p}</button>
        ))}
        {user.loggedIn ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
              ⚡ {user.clicks} clicks
            </div>
            <button onClick={() => setPage("dashboard")} style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white", padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Dashboard</button>
          </div>
        ) : (
          <button onClick={() => setPage("login")} style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white", padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>Get Started Free</button>
        )}
      </div>
    </nav>
  );
}

// ── HOME PAGE ──────────────────────────────────────────────
function HomePage({ setPage }) {
  const [demoUrl, setDemoUrl] = useState("");
  const [demoResult, setDemoResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [hoveredFaq, setHoveredFaq] = useState(null);

  const platformList = Object.values(PLATFORM_SCHEMES);

  function handleDemoGenerate() {
    if (!demoUrl.trim()) return;
    const platform = detectPlatform(demoUrl);
    if (platform) {
      const id = Math.random().toString(36).substr(2, 8);
      setDemoResult({ platform, id, url: demoUrl });
    } else {
      const id = Math.random().toString(36).substr(2, 8);
      setDemoResult({ platform: null, id, url: demoUrl });
    }
  }

  function handleCopy() {
    if (!demoResult) return;
    navigator.clipboard.writeText(`bypassgram.app/r/${demoResult.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const faqs = [
    { q: "How does BypassGram work?", a: "BypassGram generates smart deep links that detect the user's device and redirect them directly to the native app instead of opening a browser preview inside Instagram." },
    { q: "Which apps are supported?", a: "YouTube, Amazon, Flipkart, Telegram, Instagram, Snapchat, Pinterest, Netflix, Google Maps, Facebook, Swiggy, Zomato, Myntra, and more being added regularly." },
    { q: "Is it free to use?", a: "Yes! Every account starts with 1,000 free clicks. After that, recharge at just ₹80 per 100 clicks — starting from a minimum of ₹80." },
    { q: "Does it work on all devices?", a: "Yes. BypassGram automatically detects Android, iOS, and desktop devices and applies the correct deep link scheme for each." },
    { q: "How do I track clicks?", a: "Your dashboard shows real-time click analytics for every link — total clicks, per-link breakdown, and performance over time." },
    { q: "What payment methods are accepted?", a: "We accept UPI (Google Pay, PhonePe, Paytm, BHIM) and credit/debit cards via Razorpay." },
  ];

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* HERO */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #faf5ff 0%, #f3e8ff 40%, #ede9fe 100%)",
        position: "relative", overflow: "hidden", padding: "100px 24px 60px"
      }}>
        {/* Background orbs */}
        {[
          { top: "10%", left: "5%", size: 300, opacity: 0.15 },
          { top: "60%", right: "5%", size: 250, opacity: 0.12 },
          { top: "30%", left: "60%", size: 200, opacity: 0.1 },
        ].map((orb, i) => (
          <div key={i} style={{
            position: "absolute", width: orb.size, height: orb.size, borderRadius: "50%",
            background: "radial-gradient(circle, #A855F7, #7C3AED)",
            opacity: orb.opacity, top: orb.top, left: orb.left, right: orb.right,
            filter: "blur(60px)", animation: `float ${3 + i}s ease-in-out infinite alternate`
          }}/>
        ))}

        <div style={{ position: "relative", textAlign: "center", maxWidth: 800 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(168,85,247,0.1)",
            border: "1px solid rgba(168,85,247,0.3)", borderRadius: 100, padding: "8px 18px", marginBottom: 28,
            fontSize: 13, color: "#7C3AED", fontWeight: 600
          }}>
            <span style={{ animation: "pulse 2s infinite" }}>✨</span>
            1,000 Free Clicks — No Credit Card Required
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "clamp(2.5rem,6vw,4.5rem)",
            lineHeight: 1.1, marginBottom: 24, color: "#1a1a2e"
          }}>
            Skip Instagram's Browser.<br/>
            <span style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7,#C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Open Apps Directly.
            </span>
          </h1>

          <p style={{ fontSize: 18, color: "#6B7280", maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Generate smart bypass links that open YouTube, Amazon, Telegram, Flipkart & 10+ apps natively — no browser middleman, no friction.
          </p>

          {/* Demo Generator */}
          <div style={{
            background: "white", borderRadius: 20, padding: 24, boxShadow: "0 20px 60px rgba(124,58,237,0.15)",
            maxWidth: 600, margin: "0 auto 40px", border: "1px solid rgba(168,85,247,0.2)"
          }}>
            <div style={{ display: "flex", gap: 10, marginBottom: demoResult ? 16 : 0 }}>
              <input
                value={demoUrl}
                onChange={e => setDemoUrl(e.target.value)}
                placeholder="Paste any link (YouTube, Amazon, Telegram...)"
                style={{
                  flex: 1, padding: "14px 18px", borderRadius: 12, border: "1.5px solid #E5E7EB",
                  fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none",
                  transition: "border 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "#A855F7"}
                onBlur={e => e.target.style.borderColor = "#E5E7EB"}
              />
              <button onClick={handleDemoGenerate} style={{
                padding: "14px 22px", borderRadius: 12, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white",
                fontWeight: 700, fontSize: 14, fontFamily: "'Outfit', sans-serif",
                boxShadow: "0 4px 15px rgba(124,58,237,0.4)", whiteSpace: "nowrap"
              }}>Generate →</button>
            </div>

            {demoResult && (
              <div style={{ background: "linear-gradient(135deg,#faf5ff,#f3e8ff)", borderRadius: 12, padding: 16, textAlign: "left" }}>
                {demoResult.platform && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{demoResult.platform.icon}</span>
                    <span style={{ fontWeight: 700, color: "#7C3AED" }}>{demoResult.platform.name} detected</span>
                    <span style={{ background: "#7C3AED", color: "white", padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>✓ SUPPORTED</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <code style={{ flex: 1, fontSize: 13, color: "#374151", background: "white", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(168,85,247,0.2)" }}>
                    bypassgram.app/r/{demoResult.id}
                  </code>
                  <button onClick={handleCopy} style={{
                    padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: copied ? "#10B981" : "linear-gradient(135deg,#7C3AED,#A855F7)",
                    color: "white", fontWeight: 700, fontSize: 13, transition: "all 0.2s"
                  }}>{copied ? "✓ Copied!" : "Copy"}</button>
                </div>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8, marginBottom: 0 }}>
                  ⚡ This link opens the native app directly — bypassing Instagram's browser
                </p>
              </div>
            )}
          </div>

          {/* Platform badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {platformList.map(p => (
              <div key={p.name} style={{
                display: "flex", alignItems: "center", gap: 6, background: "white",
                borderRadius: 100, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#374151",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid rgba(168,85,247,0.1)"
              }}>
                <span>{p.icon}</span>{p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section style={{ padding: "80px 24px", background: "white", textAlign: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(168,85,247,0.1)", color: "#7C3AED", padding: "6px 20px", borderRadius: 100, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>WHY BYPASSGRAM</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(2rem,4vw,3rem)", color: "#1a1a2e", marginBottom: 16 }}>Stop Losing Clicks to<br/>Instagram's Browser</h2>
          <p style={{ color: "#6B7280", fontSize: 17, maxWidth: 560, margin: "0 auto 60px", lineHeight: 1.7 }}>Every time someone clicks your link in Instagram DMs, it opens in a mini-browser — losing context, losing conversions, losing customers.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              { icon: "🚀", title: "Direct App Launch", desc: "Links open YouTube, Amazon, Telegram and 10+ apps natively — no browser wrapper, no extra taps." },
              { icon: "🔍", title: "Smart Detection", desc: "Automatically identifies the destination platform and picks the right deep link scheme for Android & iOS." },
              { icon: "📊", title: "Click Analytics", desc: "Track every click per link in real-time. See which links perform best from your dashboard." },
              { icon: "🔗", title: "Short Clean URLs", desc: "Get a branded short link you can paste anywhere — Instagram bio, DMs, Stories, WhatsApp." },
              { icon: "⚡", title: "Zero Friction", desc: "No app installs needed. Generate, copy, paste. It works instantly across all devices." },
              { icon: "💸", title: "Affordable Credits", desc: "1,000 clicks free. Recharge 100 clicks for just ₹80. Pay only for what you use." },
            ].map((f, i) => (
              <div key={i} style={{
                background: "linear-gradient(145deg,#faf5ff,white)", border: "1px solid rgba(168,85,247,0.15)",
                borderRadius: 20, padding: 32, textAlign: "left", transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(124,58,237,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#1a1a2e", marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: "#6B7280", lineHeight: 1.7, fontSize: 14, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEFORE & AFTER */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(160deg,#faf5ff,#f3e8ff)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.8rem)", color: "#1a1a2e", marginBottom: 50 }}>Before vs After BypassGram</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "center" }}>
            <div style={{ background: "white", borderRadius: 20, padding: 32, border: "2px solid #FCA5A5", textAlign: "left" }}>
              <div style={{ background: "#FEE2E2", color: "#DC2626", display: "inline-block", padding: "4px 14px", borderRadius: 100, fontSize: 12, fontWeight: 700, marginBottom: 20 }}>❌ WITHOUT</div>
              {["Link opens in Instagram's in-app browser","User can't access YouTube features or Amazon cart","No native app experience","Lost conversions, frustrated users","Instagram strips tracking parameters"].map((x, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "#EF4444", fontWeight: 700, marginTop: 1 }}>✗</span>
                  <span style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.5 }}>{x}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#7C3AED" }}>→</div>
            <div style={{ background: "white", borderRadius: 20, padding: 32, border: "2px solid #A855F7", textAlign: "left" }}>
              <div style={{ background: "rgba(168,85,247,0.1)", color: "#7C3AED", display: "inline-block", padding: "4px 14px", borderRadius: 100, fontSize: 12, fontWeight: 700, marginBottom: 20 }}>✅ WITH BYPASSGRAM</div>
              {["Link opens native YouTube / Amazon / Telegram app","Full app experience — no limitations","One tap, zero friction","Higher conversions, happy users","All parameters preserved in deep link"].map((x, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "#7C3AED", fontWeight: 700, marginTop: 1 }}>✓</span>
                  <span style={{ color: "#374151", fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>{x}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.8rem)", color: "#1a1a2e", marginBottom: 16 }}>How It Works</h2>
          <p style={{ color: "#6B7280", fontSize: 16, marginBottom: 60, maxWidth: 500, margin: "0 auto 60px" }}>Three simple steps to bypass Instagram's browser forever</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 30 }}>
            {[
              { step: "01", icon: "📋", title: "Paste Your Link", desc: "Copy any YouTube, Amazon, Telegram or supported link and paste it into BypassGram." },
              { step: "02", icon: "⚙️", title: "We Generate", desc: "Our engine detects the platform and generates a smart deep link with your unique short URL." },
              { step: "03", icon: "📤", title: "Share & Track", desc: "Share the bypass link in Instagram DMs. When clicked, the native app opens instantly." },
              { step: "04", icon: "📊", title: "View Analytics", desc: "Monitor clicks in real-time from your dashboard. See which links drive the most engagement." },
            ].map((s, i) => (
              <div key={i} style={{ position: "relative", padding: "32px 24px", borderRadius: 20, background: "linear-gradient(145deg,#faf5ff,white)", border: "1px solid rgba(168,85,247,0.15)" }}>
                <div style={{ position: "absolute", top: -14, left: 24, background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white", padding: "4px 14px", borderRadius: 100, fontSize: 12, fontWeight: 800 }}>STEP {s.step}</div>
                <div style={{ fontSize: 40, marginBottom: 16, marginTop: 8 }}>{s.icon}</div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#1a1a2e", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(160deg,#faf5ff,#f3e8ff)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.8rem)", color: "#1a1a2e", marginBottom: 50, textAlign: "center" }}>Frequently Asked Questions</h2>
          {faqs.map((f, i) => (
            <div key={i} onClick={() => setHoveredFaq(hoveredFaq === i ? null : i)} style={{
              background: "white", borderRadius: 16, marginBottom: 12,
              border: `1px solid ${hoveredFaq === i ? "#A855F7" : "rgba(168,85,247,0.15)"}`,
              overflow: "hidden", cursor: "pointer", transition: "border 0.2s"
            }}>
              <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 15 }}>{f.q}</span>
                <span style={{ color: "#A855F7", fontSize: 20, transform: hoveredFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.2s", fontWeight: 300 }}>+</span>
              </div>
              {hoveredFaq === i && (
                <div style={{ padding: "0 24px 20px", color: "#6B7280", lineHeight: 1.7, fontSize: 14 }}>{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(135deg,#7C3AED,#A855F7)", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(2rem,4vw,3rem)", color: "white", marginBottom: 16 }}>Start Bypassing Instagram's Browser Today</h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, marginBottom: 36, lineHeight: 1.7 }}>Free forever for up to 1,000 clicks. No credit card required.</p>
          <button onClick={() => setPage("login")} style={{
            background: "white", color: "#7C3AED", padding: "16px 40px", borderRadius: 50, border: "none",
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, cursor: "pointer",
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)", transition: "transform 0.2s"
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >Get 1,000 Free Clicks →</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#1a1a2e", color: "#9CA3AF", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 16 }}>
          <Logo size={28}/><span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "white" }}>BypassGram</span>
        </div>
        <p style={{ fontSize: 13, margin: 0 }}>© 2025 BypassGram. Smart deep links for Instagram DMs.</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=Outfit:wght@400;500;600;700&display=swap');
        @keyframes float { from { transform: translateY(0) } to { transform: translateY(-20px) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0 }
      `}</style>
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────
function DashboardPage({ user, links, analytics, saveLink, trackClick, setPage }) {
  const [url, setUrl] = useState("");
  const [generated, setGenerated] = useState(null);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState("");

  function handleGenerate() {
    if (!url.trim()) { setError("Please enter a URL"); return; }
    if (user.clicks <= 0) { setError("No clicks remaining. Please recharge."); return; }
    setError("");
    const platform = detectPlatform(url);
    const id = Math.random().toString(36).substr(2, 8);
    const link = {
      id, url, platform: platform ? platform.key : "generic",
      platformName: platform ? platform.name : "Generic Link",
      platformIcon: platform ? platform.icon : "🔗",
      createdAt: new Date().toISOString(),
      shortUrl: `bypassgram.app/r/${id}`
    };
    saveLink(link);
    setGenerated(link);
    setUrl("");
  }

  function handleCopy(id, text) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function simulateClick(linkId) {
    trackClick(linkId);
  }

  const totalClicks = Object.values(analytics).reduce((a, b) => a + b, 0);

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", minHeight: "100vh", background: "#F9FAFB", paddingTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 36 }}>
          {[
            { label: "Clicks Remaining", value: user.clicks.toLocaleString(), icon: "⚡", color: "#7C3AED" },
            { label: "Links Created", value: links.length, icon: "🔗", color: "#A855F7" },
            { label: "Total Clicks Tracked", value: totalClicks, icon: "📊", color: "#6D28D9" },
            { label: "Avg Clicks / Link", value: links.length ? Math.round(totalClicks / links.length) : 0, icon: "📈", color: "#8B5CF6" },
          ].map((s, i) => (
            <div key={i} style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid rgba(168,85,247,0.15)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Generator */}
        <div style={{ background: "white", borderRadius: 20, padding: 32, border: "1px solid rgba(168,85,247,0.15)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#1a1a2e", marginBottom: 20 }}>Generate Bypass Link</h2>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
              placeholder="Paste YouTube, Amazon, Telegram, Flipkart, or any supported URL..."
              style={{
                flex: 1, padding: "14px 20px", borderRadius: 12, border: "1.5px solid #E5E7EB",
                fontSize: 15, fontFamily: "'Outfit', sans-serif", outline: "none"
              }}
              onFocus={e => e.target.style.borderColor = "#A855F7"}
              onBlur={e => e.target.style.borderColor = "#E5E7EB"}
            />
            <button onClick={handleGenerate} style={{
              padding: "14px 28px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white",
              fontWeight: 700, fontSize: 15, fontFamily: "'Outfit', sans-serif",
              boxShadow: "0 4px 15px rgba(124,58,237,0.35)"
            }}>Generate →</button>
          </div>
          {error && <p style={{ color: "#EF4444", fontSize: 13, marginTop: 10 }}>{error}</p>}

          {generated && (
            <div style={{ marginTop: 20, background: "linear-gradient(135deg,#faf5ff,#f3e8ff)", borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{generated.platformIcon}</span>
                <span style={{ fontWeight: 700, color: "#7C3AED" }}>{generated.platformName}</span>
                <span style={{ background: "#7C3AED", color: "white", padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>BYPASS LINK CREATED</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <code style={{ flex: 1, fontSize: 14, color: "#374151", background: "white", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(168,85,247,0.2)", fontWeight: 600 }}>
                  {generated.shortUrl}
                </code>
                <button onClick={() => handleCopy("gen", generated.shortUrl)} style={{
                  padding: "12px 18px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: copied === "gen" ? "#10B981" : "linear-gradient(135deg,#7C3AED,#A855F7)",
                  color: "white", fontWeight: 700, fontSize: 13
                }}>{copied === "gen" ? "✓ Copied!" : "Copy"}</button>
              </div>
            </div>
          )}
        </div>

        {/* Recharge CTA */}
        {user.clicks < 200 && (
          <div style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", borderRadius: 16, padding: 24, marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
            <div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Running Low on Clicks!</h3>
              <p style={{ opacity: 0.85, fontSize: 14 }}>Only {user.clicks} clicks left. Recharge 100 clicks for just ₹80.</p>
            </div>
            <button onClick={() => setPage("pricing")} style={{ background: "white", color: "#7C3AED", padding: "12px 24px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 14, fontFamily: "'Syne', sans-serif" }}>Recharge Now →</button>
          </div>
        )}

        {/* Links Table */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid rgba(168,85,247,0.15)", overflow: "hidden" }}>
          <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(168,85,247,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#1a1a2e" }}>Your Links</h2>
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>{links.length} links created</span>
          </div>

          {links.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#9CA3AF" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
              <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No links yet</p>
              <p style={{ fontSize: 14 }}>Generate your first bypass link above</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Platform", "Short URL", "Original URL", "Clicks", "Created", "Actions"].map(h => (
                      <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {links.map((link, i) => (
                    <tr key={link.id} style={{ borderTop: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{link.platformIcon}</span>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "#374151" }}>{link.platformName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <code style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600 }}>{link.shortUrl}</code>
                      </td>
                      <td style={{ padding: "16px 20px", maxWidth: 200 }}>
                        <span style={{ fontSize: 12, color: "#9CA3AF", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.url}</span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ background: "rgba(168,85,247,0.1)", color: "#7C3AED", padding: "4px 12px", borderRadius: 100, fontSize: 13, fontWeight: 700 }}>
                            {analytics[link.id] || 0}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{new Date(link.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => handleCopy(link.id, link.shortUrl)} style={{
                            padding: "6px 14px", borderRadius: 8, border: "1.5px solid #A855F7", cursor: "pointer",
                            background: copied === link.id ? "#7C3AED" : "transparent",
                            color: copied === link.id ? "white" : "#7C3AED", fontSize: 12, fontWeight: 700, transition: "all 0.2s"
                          }}>{copied === link.id ? "✓" : "Copy"}</button>
                          <button onClick={() => simulateClick(link.id)} style={{
                            padding: "6px 14px", borderRadius: 8, border: "1.5px solid #E5E7EB", cursor: "pointer",
                            background: "transparent", color: "#9CA3AF", fontSize: 12, fontWeight: 600
                          }}>Test</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Outfit:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}

// ── PRICING ────────────────────────────────────────────────
function PricingPage({ user, addClicks }) {
  const [selectedPack, setSelectedPack] = useState(null);
  const [payMethod, setPayMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [txnId, setTxnId] = useState("");
  const [step, setStep] = useState("choose"); // choose | pay | confirm | done
  const [processing, setProcessing] = useState(false);

  const packs = [
    { clicks: 100, price: 80, label: "Starter", popular: false, perClick: "0.80" },
    { clicks: 500, price: 350, label: "Growth", popular: true, perClick: "0.70" },
    { clicks: 1000, price: 600, label: "Pro", popular: false, perClick: "0.60" },
    { clicks: 5000, price: 2500, label: "Scale", popular: false, perClick: "0.50" },
  ];

  function handlePay() {
    if (!selectedPack) return;
    if (payMethod === "upi" && !upiId) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep("confirm");
    }, 1500);
  }

  function handleConfirm() {
    if (!txnId) return;
    setStep("done");
    addClicks(selectedPack.clicks);
  }

  const UPI_ID = "bypassgram@upi";
  const pack = packs.find(p => p === selectedPack);

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", minHeight: "100vh", background: "#F9FAFB", paddingTop: 80 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "50px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ display: "inline-block", background: "rgba(168,85,247,0.1)", color: "#7C3AED", padding: "6px 20px", borderRadius: 100, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>PRICING</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,3rem)", color: "#1a1a2e", marginBottom: 16 }}>Simple, Affordable Pricing</h1>
          <p style={{ color: "#6B7280", fontSize: 17, maxWidth: 480, margin: "0 auto" }}>Start with 1,000 free clicks. Recharge when you need more.</p>
        </div>

        {step === "choose" && (
          <>
            {/* Free tier */}
            <div style={{ background: "linear-gradient(135deg,#faf5ff,#f3e8ff)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 20, padding: 28, marginBottom: 36, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e", fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>🎉 Free Plan — 1,000 Clicks</div>
                <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>Every new account gets 1,000 clicks absolutely free. No credit card needed.</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 28, color: "#7C3AED" }}>₹0</div>
                <div style={{ fontSize: 13, color: "#9CA3AF" }}>Forever</div>
              </div>
            </div>

            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#1a1a2e", marginBottom: 24, textAlign: "center" }}>Top Up Clicks</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 20, marginBottom: 36 }}>
              {packs.map((p, i) => (
                <div key={i} onClick={() => setSelectedPack(p)} style={{
                  background: "white", borderRadius: 20, padding: 28, cursor: "pointer",
                  border: `2px solid ${selectedPack === p ? "#A855F7" : "rgba(168,85,247,0.15)"}`,
                  boxShadow: selectedPack === p ? "0 0 0 4px rgba(168,85,247,0.15)" : "0 2px 12px rgba(0,0,0,0.04)",
                  position: "relative", transition: "all 0.2s", textAlign: "center"
                }}>
                  {p.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white", padding: "4px 16px", borderRadius: 100, fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>MOST POPULAR</div>}
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#9CA3AF", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{p.label}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 36, color: "#7C3AED", marginBottom: 4 }}>₹{p.price}</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#1a1a2e", marginBottom: 4 }}>{p.clicks.toLocaleString()} Clicks</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>₹{p.perClick} per click</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <button onClick={() => selectedPack && setStep("pay")} style={{
                padding: "16px 48px", borderRadius: 50, border: "none", cursor: selectedPack ? "pointer" : "not-allowed",
                background: selectedPack ? "linear-gradient(135deg,#7C3AED,#A855F7)" : "#E5E7EB",
                color: selectedPack ? "white" : "#9CA3AF",
                fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17,
                boxShadow: selectedPack ? "0 8px 25px rgba(124,58,237,0.35)" : "none",
                transition: "all 0.2s"
              }}>
                {selectedPack ? `Pay ₹${selectedPack.price} for ${selectedPack.clicks} Clicks →` : "Select a pack above"}
              </button>
            </div>
          </>
        )}

        {step === "pay" && selectedPack && (
          <div style={{ maxWidth: 520, margin: "0 auto", background: "white", borderRadius: 24, padding: 40, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
            <button onClick={() => setStep("choose")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>← Back</button>

            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: "#1a1a2e", marginBottom: 8 }}>Complete Payment</h2>
            <div style={{ background: "linear-gradient(135deg,#faf5ff,#f3e8ff)", borderRadius: 12, padding: 16, marginBottom: 28, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6B7280", fontSize: 14 }}>{selectedPack.clicks} Clicks ({selectedPack.label})</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#7C3AED" }}>₹{selectedPack.price}</span>
            </div>

            {/* Payment method tabs */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {["upi", "razorpay"].map(m => (
                <button key={m} onClick={() => setPayMethod(m)} style={{
                  flex: 1, padding: "12px", borderRadius: 12, border: `2px solid ${payMethod === m ? "#A855F7" : "#E5E7EB"}`,
                  background: payMethod === m ? "rgba(168,85,247,0.05)" : "transparent",
                  cursor: "pointer", fontWeight: 700, fontSize: 13, color: payMethod === m ? "#7C3AED" : "#6B7280",
                  transition: "all 0.2s"
                }}>{m === "upi" ? "💳 Manual UPI" : "🔐 Razorpay"}</button>
              ))}
            </div>

            {payMethod === "upi" && (
              <div>
                <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 20, marginBottom: 20, textAlign: "center", border: "1.5px dashed rgba(168,85,247,0.3)" }}>
                  <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>Send ₹{selectedPack.price} to this UPI ID:</p>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#7C3AED", marginBottom: 8 }}>{UPI_ID}</div>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>Works with Google Pay, PhonePe, Paytm, BHIM & all UPI apps</p>
                </div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Your UPI ID (for verification)</label>
                <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", marginBottom: 16 }}
                  onFocus={e => e.target.style.borderColor = "#A855F7"} onBlur={e => e.target.style.borderColor = "#E5E7EB"}/>
                <button onClick={handlePay} disabled={!upiId || processing} style={{
                  width: "100%", padding: 16, borderRadius: 12, border: "none", cursor: upiId ? "pointer" : "not-allowed",
                  background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white",
                  fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16,
                  opacity: upiId ? 1 : 0.6
                }}>{processing ? "Processing..." : "I've Made the Payment →"}</button>
              </div>
            )}

            {payMethod === "razorpay" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 32, marginBottom: 20, border: "1.5px dashed rgba(168,85,247,0.3)" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
                  <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.6 }}>You'll be redirected to Razorpay's secure payment gateway to complete the transaction of <strong>₹{selectedPack.price}</strong>.</p>
                </div>
                <button onClick={handlePay} disabled={processing} style={{
                  width: "100%", padding: 16, borderRadius: 12, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white",
                  fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16
                }}>{processing ? "Connecting to Razorpay..." : "Pay ₹" + selectedPack.price + " with Razorpay →"}</button>
              </div>
            )}
          </div>
        )}

        {step === "confirm" && selectedPack && (
          <div style={{ maxWidth: 520, margin: "0 auto", background: "white", borderRadius: 24, padding: 40, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid rgba(168,85,247,0.15)", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: "#1a1a2e", marginBottom: 12 }}>Payment Received!</h2>
            <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>Please enter your UPI Transaction ID / Razorpay payment ID for verification. Clicks will be added within 5 minutes.</p>
            <input value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="Enter Transaction / Payment ID" style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", marginBottom: 16, textAlign: "center" }}
              onFocus={e => e.target.style.borderColor = "#A855F7"} onBlur={e => e.target.style.borderColor = "#E5E7EB"}/>
            <button onClick={handleConfirm} disabled={!txnId} style={{
              width: "100%", padding: 16, borderRadius: 12, border: "none", cursor: txnId ? "pointer" : "not-allowed",
              background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white",
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, opacity: txnId ? 1 : 0.6
            }}>Submit & Add Clicks →</button>
          </div>
        )}

        {step === "done" && selectedPack && (
          <div style={{ maxWidth: 520, margin: "0 auto", background: "white", borderRadius: 24, padding: 50, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid rgba(168,85,247,0.15)", textAlign: "center" }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "#1a1a2e", marginBottom: 12 }}>Clicks Added!</h2>
            <p style={{ color: "#6B7280", fontSize: 16, marginBottom: 8 }}><strong style={{ color: "#7C3AED" }}>{selectedPack.clicks} clicks</strong> have been added to your account.</p>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 32 }}>Your new balance: <strong style={{ color: "#7C3AED" }}>{user.clicks} clicks</strong></p>
            <button onClick={() => setStep("choose")} style={{
              padding: "14px 36px", borderRadius: 50, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white",
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16
            }}>Back to Pricing</button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Outfit:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}

// ── LOGIN ──────────────────────────────────────────────────
function LoginPage({ login, setPage }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function handleLogin() {
    if (!email.includes("@")) return;
    login(email);
    setDone(true);
    setTimeout(() => setPage("dashboard"), 1500);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg,#faf5ff,#f3e8ff)", fontFamily: "'Outfit', sans-serif", padding: 24
    }}>
      <div style={{ background: "white", borderRadius: 24, padding: 50, maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(124,58,237,0.15)", border: "1px solid rgba(168,85,247,0.2)", textAlign: "center" }}>
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}><Logo size={56}/></div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "#1a1a2e", marginBottom: 10 }}>Welcome to BypassGram</h1>
        <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>Enter your email to get started with 1,000 free clicks</p>

        {done ? (
          <div style={{ padding: 20, background: "rgba(168,85,247,0.1)", borderRadius: 12 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <p style={{ color: "#7C3AED", fontWeight: 700 }}>Redirecting to dashboard...</p>
          </div>
        ) : (
          <>
            <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="you@example.com" type="email" style={{
                width: "100%", padding: "14px 18px", borderRadius: 12, border: "1.5px solid #E5E7EB",
                fontSize: 15, fontFamily: "'Outfit', sans-serif", outline: "none", marginBottom: 16, textAlign: "center"
              }}
              onFocus={e => e.target.style.borderColor = "#A855F7"} onBlur={e => e.target.style.borderColor = "#E5E7EB"}/>
            <button onClick={handleLogin} style={{
              width: "100%", padding: 16, borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "white",
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16,
              boxShadow: "0 8px 25px rgba(124,58,237,0.35)"
            }}>Get 1,000 Free Clicks →</button>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 16 }}>No password needed • No credit card • Instant access</p>
          </>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Outfit:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}

// ── REDIRECT PAGE (simulated) ──────────────────────────────
function RedirectPage({ linkId, links, trackClick }) {
  const [status, setStatus] = useState("loading");
  const link = links.find(l => l.id === linkId);

  useEffect(() => {
    if (!link) { setStatus("notfound"); return; }
    trackClick(linkId);
    const platform = PLATFORM_SCHEMES[link.platform];
    const device = detectDevice();
    setTimeout(() => {
      if (platform && device !== "desktop") {
        const deepLink = buildDeepLink(link.url, platform);
        window.location.href = deepLink;
        setTimeout(() => { window.location.href = link.url; }, 1500);
      } else {
        window.location.href = link.url;
      }
      setStatus("redirecting");
    }, 800);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#faf5ff,#f3e8ff)", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <Logo size={60}/>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: "#1a1a2e", marginTop: 20, marginBottom: 10 }}>
          {status === "loading" ? "Opening app..." : status === "redirecting" ? "Launching native app..." : "Link not found"}
        </h2>
        {link && <p style={{ color: "#6B7280" }}>Opening {link.platformName} natively</p>}
        <div style={{ marginTop: 24, width: 40, height: 4, background: "linear-gradient(135deg,#7C3AED,#A855F7)", borderRadius: 2, animation: "loading 1s infinite", margin: "20px auto 0" }}/>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=Outfit:wght@400;600&display=swap');
        @keyframes loading { 0%{width:10px} 50%{width:120px} 100%{width:10px} }
      `}</style>
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================
export default function App() {
  const [page, setPage] = useState("home");
  const [redirectId, setRedirectId] = useState(null);
  const { links, analytics, user, saveLink, trackClick, addClicks, login } = useStorage();

  // Simulate /r/:id routing
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#\/r\/([a-z0-9]+)$/);
    if (match) { setRedirectId(match[1]); setPage("redirect"); }
  }, []);

  if (page === "redirect" && redirectId) {
    return <RedirectPage linkId={redirectId} links={links} trackClick={trackClick}/>;
  }

  const needsLogin = (page === "dashboard") && !user.loggedIn;
  const activePage = needsLogin ? "login" : page;

  return (
    <div>
      {activePage !== "login" && activePage !== "redirect" && (
        <Navbar page={activePage} setPage={setPage} user={user}/>
      )}
      {activePage === "home" && <HomePage setPage={setPage}/>}
      {activePage === "dashboard" && <DashboardPage user={user} links={links} analytics={analytics} saveLink={saveLink} trackClick={trackClick} setPage={setPage}/>}
      {activePage === "pricing" && <PricingPage user={user} addClicks={addClicks}/>}
      {activePage === "login" && <LoginPage login={login} setPage={setPage}/>}
    </div>
  );
}
