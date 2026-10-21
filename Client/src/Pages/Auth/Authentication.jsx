import { Link } from "react-router-dom";
import { BarChart3, CalendarCheck, Users } from "lucide-react";
import AuthBrand from "../../Components/Auth/AuthBrand";
import LoginCard from "../../Components/Auth/LoginCard";
import LoginNotice from "../../Components/Auth/LoginNotice";
import { LanguageSwitch, LoginLanguageProvider, useLoginLanguage } from "../../i18n/LoginLanguage";
import { CSR_PARTNERS } from "../../config/csrPartners";
import { HELP_EMAIL } from "../../config/contact";
import logo from "../../assets/sathee.svg";

const HIGHLIGHTS = [
  { icon: CalendarCheck, key: "highlightAttendance" },
  { icon: Users, key: "highlightPeople" },
  { icon: BarChart3, key: "highlightReports" },
];

function Footer() {
  const { t } = useLoginLanguage();
  const linkClass = "underline-offset-2 hover:text-slate-700 hover:underline";
  return (
    <footer className="px-6 pb-6 text-center text-sm text-slate-500">
      <p>{t.footerName}</p>
      <nav className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <Link to="/privacy" className={linkClass}>{t.privacy}</Link>
        <span aria-hidden="true">·</span>
        <Link to="/terms" className={linkClass}>{t.terms}</Link>
        <span aria-hidden="true">·</span>
        <a href={`mailto:${HELP_EMAIL}`} className={linkClass}>{t.contact}</a>
      </nav>
    </footer>
  );
}

function Partners({ className = "" }) {
  const { t } = useLoginLanguage();
  if (!CSR_PARTNERS.length) return null;
  return (
    <section className={className}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.partnersTitle}</p>
      <ul className="mt-3 flex flex-wrap items-center gap-3">
        {CSR_PARTNERS.map(({ name, logo: partnerLogo }) => (
          <li
            key={name}
            title={name}
            className="flex h-14 min-w-14 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm"
          >
            <img src={partnerLogo} alt={name} className="max-h-10 max-w-28 object-contain" />
          </li>
        ))}
      </ul>
    </section>
  );
}

// Large, faint logo tucked into the bottom-right corner.
function WatermarkLayout({ onLoginSuccess }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F1F5F9] text-white flex flex-col">
      {/* Cropped to the central sun/people/book so the logo's small text and
          outer emblems do not show as smudges. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 hidden h-[560px] w-[560px] select-none overflow-hidden rounded-full opacity-[0.06] grayscale md:block"
      >
        <img src={logo} alt="" className="h-full w-full scale-[1.6] object-cover" />
      </div>

      <div className="relative flex justify-end px-6 pt-5">
        <LanguageSwitch />
      </div>

      <div className="relative flex-1 flex items-center justify-center px-6">
        <div className="flex flex-col items-center justify-center gap-8">
          <AuthBrand />
          <LoginNotice />
          <LoginCard onLoginSuccess={onLoginSuccess} />
          <Partners className="text-center [&_ul]:justify-center" />
        </div>
      </div>

      <div className="relative">
        <Footer />
      </div>
    </div>
  );
}

// Brand panel on the left, login on the right; phones get the plain layout.
function SplitLayout({ onLoginSuccess }) {
  const { t } = useLoginLanguage();
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-white lg:grid lg:grid-cols-2">
      <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:flex-col lg:justify-center lg:px-16 xl:px-24">
        <div className="max-w-md">
          <div className="h-28 w-28 overflow-hidden rounded-full border border-slate-200 bg-white shadow-lg">
            <img src={logo} alt="SATHEE logo" className="h-full w-full rounded-full object-cover" />
          </div>

          <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900">SATHEE</h1>
          <p className="mt-3 text-lg text-slate-600">{t.tagline}</p>

          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-3 text-slate-700">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Icon size={18} />
                </span>
                {t[key]}
              </li>
            ))}
          </ul>

          <Partners className="mt-12 border-t border-slate-200 pt-8" />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <div className="flex justify-end px-6 pt-5">
          <LanguageSwitch />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="flex w-full flex-col items-center justify-center gap-6">
            <div className="lg:hidden">
              <AuthBrand />
            </div>
            <LoginNotice />
            <LoginCard onLoginSuccess={onLoginSuccess} />
            <Partners className="w-full max-w-md text-center lg:hidden [&_ul]:justify-center" />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default function AdminAuth({ onLoginSuccess, layout = "split" }) {
  return (
    <LoginLanguageProvider>
      {layout === "watermark" ? (
        <WatermarkLayout onLoginSuccess={onLoginSuccess} />
      ) : (
        <SplitLayout onLoginSuccess={onLoginSuccess} />
      )}
    </LoginLanguageProvider>
  );
}
