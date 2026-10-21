import { BarChart3, CalendarCheck, Users } from "lucide-react";
import AuthBrand from "../../Components/Auth/AuthBrand";
import LoginCard from "../../Components/Auth/LoginCard";
import logo from "../../assets/sathee.svg";

const HIGHLIGHTS = [
  { icon: CalendarCheck, text: "Daily attendance for students and mentors" },
  { icon: Users, text: "Students, mentors and CSR partners in one place" },
  { icon: BarChart3, text: "Progress, test marks and Kendra reports" },
];

const Footer = () => (
  <div className="pb-6">
    <p className="text-center text-sm text-slate-500">SATHEE Kendra Portal</p>
  </div>
);

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

      <div className="relative flex-1 flex items-center justify-center px-6">
        <div className="flex flex-col items-center justify-center gap-8">
          <AuthBrand />
          <LoginCard onLoginSuccess={onLoginSuccess} />
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
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-white lg:grid lg:grid-cols-2">
      <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:flex-col lg:justify-center lg:px-16 xl:px-24">
        <div className="max-w-md">
          <div className="h-28 w-28 overflow-hidden rounded-full border border-slate-200 bg-white shadow-lg">
            <img src={logo} alt="SATHEE logo" className="h-full w-full rounded-full object-cover" />
          </div>

          <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900">SATHEE</h1>
          <p className="mt-3 text-lg text-slate-600">
            One portal for every SATHEE Kendra set up with our CSR partners.
          </p>

          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-slate-700">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="flex flex-col items-center justify-center gap-8">
            <div className="lg:hidden">
              <AuthBrand />
            </div>
            <LoginCard onLoginSuccess={onLoginSuccess} />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default function AdminAuth({ onLoginSuccess, layout = "split" }) {
  return layout === "watermark" ? (
    <WatermarkLayout onLoginSuccess={onLoginSuccess} />
  ) : (
    <SplitLayout onLoginSuccess={onLoginSuccess} />
  );
}
