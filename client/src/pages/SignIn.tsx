import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  Home as HomeIcon,
  ShieldCheck,
  MapPin,
  Star,
  ArrowRight,
  CheckCircle2,
  Building2,
  GraduationCap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

/* ─── Tiny animated stat pill ─── */
function StatPill({
  value,
  label,
  delay,
}: {
  value: string;
  label: string;
  delay: string;
}) {
  return (
    <div
      className="flex flex-col items-center px-5 py-3 rounded-2xl bg-white/10 backdrop-blur border border-white/15"
      style={{ animationDelay: delay }}
    >
      <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
      <span className="text-xs text-amber-200/80 mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

/* ─── Feature row ─── */
function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3.5 items-start group">
      <div className="mt-0.5 shrink-0 w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
        <Icon className="w-4 h-4 text-blue-700" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Harare skyline SVG illustration ─── */
function HarareSkyline() {
  return (
    <svg
      viewBox="0 0 480 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm opacity-90"
      aria-hidden="true"
    >
      {/* Ground */}
      <rect x="0" y="160" width="480" height="20" fill="rgba(255,255,255,0.08)" rx="2" />

      {/* Far bg buildings */}
      <rect x="10" y="110" width="28" height="50" rx="2" fill="rgba(255,255,255,0.07)" />
      <rect x="42" y="90" width="22" height="70" rx="2" fill="rgba(255,255,255,0.07)" />
      <rect x="440" y="105" width="30" height="55" rx="2" fill="rgba(255,255,255,0.07)" />

      {/* Main buildings */}
      {/* Left cluster */}
      <rect x="55" y="70" width="35" height="90" rx="3" fill="rgba(255,255,255,0.15)" />
      <rect x="58" y="73" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="67" y="73" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="76" y="73" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="58" y="87" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="67" y="87" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="76" y="87" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="58" y="101" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="67" y="101" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="76" y="101" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      {/* Spire */}
      <rect x="69" y="55" width="4" height="18" rx="1" fill="rgba(255,255,255,0.25)" />

      {/* Center tall building */}
      <rect x="115" y="30" width="50" height="130" rx="3" fill="rgba(255,255,255,0.18)" />
      <rect x="120" y="35" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="132" y="35" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="144" y="35" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="120" y="52" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="132" y="52" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="144" y="52" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="120" y="69" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="132" y="69" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="144" y="69" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="120" y="86" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="132" y="86" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="144" y="86" width="8" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="136" y="15" width="8" height="17" rx="2" fill="rgba(255,255,255,0.3)" />
      {/* Antenna */}
      <line x1="140" y1="5" x2="140" y2="17" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      <circle cx="140" cy="5" r="2" fill="#fbbf24" />

      {/* Right mid building */}
      <rect x="185" y="55" width="42" height="105" rx="3" fill="rgba(255,255,255,0.14)" />
      <rect x="190" y="60" width="7" height="9" rx="1" fill="rgba(255,255,255,0.22)" />
      <rect x="201" y="60" width="7" height="9" rx="1" fill="rgba(255,255,255,0.22)" />
      <rect x="212" y="60" width="7" height="9" rx="1" fill="rgba(255,255,255,0.22)" />
      <rect x="190" y="76" width="7" height="9" rx="1" fill="rgba(255,255,255,0.22)" />
      <rect x="201" y="76" width="7" height="9" rx="1" fill="rgba(255,255,255,0.22)" />
      <rect x="212" y="76" width="7" height="9" rx="1" fill="rgba(255,255,255,0.22)" />
      <rect x="190" y="92" width="7" height="9" rx="1" fill="rgba(255,255,255,0.22)" />
      <rect x="201" y="92" width="7" height="9" rx="1" fill="rgba(255,255,255,0.22)" />
      <rect x="212" y="92" width="7" height="9" rx="1" fill="rgba(255,255,255,0.22)" />

      {/* Boarding house cottage */}
      <rect x="255" y="100" width="60" height="60" rx="3" fill="rgba(255,255,255,0.18)" />
      {/* Roof */}
      <polygon points="250,100 285,72 320,100" fill="rgba(251,191,36,0.35)" />
      <rect x="270" y="120" width="14" height="22" rx="2" fill="rgba(255,255,255,0.15)" />
      <rect x="260" y="108" width="10" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      <rect x="295" y="108" width="10" height="10" rx="1" fill="rgba(255,255,255,0.25)" />
      {/* Door */}
      <rect x="273" y="122" width="8" height="18" rx="1" fill="rgba(251,191,36,0.5)" />

      {/* Far right tower */}
      <rect x="340" y="45" width="38" height="115" rx="3" fill="rgba(255,255,255,0.13)" />
      <rect x="345" y="50" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="355" y="50" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="365" y="50" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="345" y="65" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="355" y="65" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="365" y="65" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="345" y="80" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="355" y="80" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="365" y="80" width="6" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="357" y="30" width="4" height="17" rx="1" fill="rgba(255,255,255,0.25)" />

      {/* Trees */}
      <ellipse cx="240" cy="148" rx="12" ry="14" fill="rgba(34,197,94,0.25)" />
      <rect x="238" y="155" width="4" height="8" rx="1" fill="rgba(255,255,255,0.1)" />
      <ellipse cx="400" cy="148" rx="10" ry="12" fill="rgba(34,197,94,0.2)" />
      <rect x="398" y="154" width="4" height="7" rx="1" fill="rgba(255,255,255,0.1)" />
    </svg>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function SignIn() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("return_to");
      setLocation(returnTo?.startsWith("/") ? returnTo : "/");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f3ee]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-blue-700/20 border-t-blue-700 animate-spin" />
          <p className="text-sm text-gray-400 tracking-wide">Loading…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* ════════════════════════════════
          LEFT — brand / illustration
      ════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col overflow-hidden">
        {/* Deep warm-blue gradient — feels trustworthy + local */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(155deg, #1e3a5f 0%, #1a4a7a 40%, #0f2d52 75%, #0a1e38 100%)",
          }}
        />
        {/* Warm amber glow bottom-right */}
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-[120px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)" }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 48px)",
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-10 xl:px-14 py-10">
          {/* Logo */}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2.5 w-fit hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shadow-lg">
              <HomeIcon className="w-5 h-5 text-blue-900" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">House-by-us</span>
          </button>

          {/* Headline */}
          <div
            className="mt-14 transition-all duration-700"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/15 border border-amber-300/25 mb-5">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-xs font-medium text-amber-200 tracking-wide">
                Harare · Student Accommodation
              </span>
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.12] tracking-tight">
              Find a home
              <br />
              <span
                className="relative inline-block"
                style={{
                  background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                near campus.
              </span>
            </h2>

            <p className="mt-5 text-blue-200/80 text-base xl:text-lg leading-relaxed max-w-[320px]">
              Browse verified boarding houses close to every university and college in Harare.
            </p>
          </div>

          {/* Stats */}
          <div
            className="mt-10 flex gap-3 flex-wrap transition-all duration-700 delay-150"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)" }}
          >
            <StatPill value="200+" label="Verified listings" delay="0ms" />
            <StatPill value="12+" label="Universities nearby" delay="80ms" />
            <StatPill value="4.8★" label="Avg. landlord rating" delay="160ms" />
          </div>

          {/* Harare skyline illustration */}
          <div
            className="mt-auto pt-10 transition-all duration-700 delay-300"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)" }}
          >
            <HarareSkyline />
          </div>

          {/* Testimonial */}
          <div
            className="mt-6 p-4 rounded-2xl bg-white/6 border border-white/10 backdrop-blur-sm transition-all duration-700 delay-500"
            style={{ opacity: mounted ? 1 : 0 }}
          >
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-blue-100 leading-relaxed">
              "Found a great room near UZ within 3 days. Everything was exactly as advertised."
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-blue-900 text-xs font-bold">
                T
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Tatenda M.</p>
                <p className="text-[11px] text-blue-400">UZ, 2nd year</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          RIGHT — sign-in panel
      ════════════════════════════════ */}
      <div className="flex-1 flex flex-col bg-[#f8f7f4]">
        {/* Mobile header only */}
        <nav className="lg:hidden sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
          <div className="flex items-center justify-between px-5 h-14">
            <button onClick={() => setLocation("/")} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center">
                <HomeIcon className="w-4 h-4 text-blue-900" />
              </div>
              <span className="text-base font-bold text-gray-900">House-by-us</span>
            </button>
            <button
              onClick={() => setLocation("/")}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
            >
              ← Back
            </button>
          </div>
        </nav>

        {/* Centre the sign-in card */}
        <div className="flex-1 flex items-center justify-center px-6 py-14">
          <div
            className="w-full max-w-[420px] transition-all duration-500"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)" }}
          >
            {/* Card */}
            <div className="bg-white rounded-3xl shadow-[0_4px_32px_rgba(0,0,0,0.08)] border border-gray-100/80 overflow-hidden">
              {/* Card top accent */}
              <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #1a4a7a, #fbbf24)" }} />

              <div className="px-8 pt-8 pb-8">
                {/* Header */}
                <div className="mb-7">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                    Sign in to access listings, save properties, and connect with landlords.
                  </p>
                </div>

                {/* OAuth button */}
                <button
                  onClick={() => { window.location.href = getLoginUrl(); }}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  className="w-full h-12 flex items-center justify-center gap-2.5 rounded-2xl text-white text-sm font-semibold transition-all duration-200 shadow-md"
                  style={{
                    background: hovered
                      ? "linear-gradient(135deg, #1e4d87 0%, #1a3d6e 100%)"
                      : "linear-gradient(135deg, #1a4a7a 0%, #0f2d52 100%)",
                    boxShadow: hovered
                      ? "0 6px 20px rgba(26,74,122,0.4)"
                      : "0 4px 14px rgba(26,74,122,0.3)",
                    transform: hovered ? "translateY(-1px)" : "translateY(0)",
                  }}
                >
                  <ShieldCheck className="w-4.5 h-4.5" />
                  Continue with Manus
                  <ArrowRight
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: hovered ? "translateX(3px)" : "translateX(0)" }}
                  />
                </button>

                <p className="text-center text-[11px] text-gray-400 mt-3">
                  Secured with OAuth 2.0 — your credentials are never shared with us
                </p>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-[11px] text-gray-400 uppercase tracking-widest">
                      what you get
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <Feature
                    icon={CheckCircle2}
                    title="Verified listings only"
                    desc="Every property is inspected by our admin team before going live."
                  />
                  <Feature
                    icon={MapPin}
                    title="Locations near your campus"
                    desc="Filter by proximity to UZ, MSU, NUST, Chinhoyi Tech, and more."
                  />
                  <Feature
                    icon={Building2}
                    title="Save & compare properties"
                    desc="Bookmark your favourites and revisit them across sessions."
                  />
                  <Feature
                    icon={GraduationCap}
                    title="For students & landlords"
                    desc="Browse as a student or list your property — both in one account."
                  />
                </div>
              </div>
            </div>

            {/* New account note */}
            <p className="text-center text-xs text-gray-400 mt-5">
              No account yet?{" "}
              <button
                onClick={() => { window.location.href = getLoginUrl(); }}
                className="text-blue-700 font-medium hover:underline"
              >
                Create one during sign-in
              </button>
            </p>

            {/* Admin contact */}
            <div className="mt-6 p-4 rounded-2xl bg-white/70 border border-gray-200/80 text-center">
              <p className="text-[11px] text-gray-400 mb-1.5 uppercase tracking-wide">Need help?</p>
              <div className="flex justify-center gap-6 text-xs text-gray-600">
                <span>
                  <span className="font-semibold text-gray-800">Makhosi</span> · 0781 482 977
                </span>
                <span>
                  <span className="font-semibold text-gray-800">Vimbai</span> · 0774 497 837
                </span>
              </div>
            </div>

            <p className="text-center text-[11px] text-gray-300 mt-5">
              © 2026 House-by-us · Harare, Zimbabwe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
