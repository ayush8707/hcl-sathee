import { useState } from "react";
import { ArrowUpRight, Globe, LogOut, Plus, X } from "lucide-react";
import HCLLogo from "../../assets/HCL.svg";
import SatheeLogo from "../../assets/sathee.svg";
import AddDashboardModal from "../../Components/Selector/AddDashboardModal";
import {
  addCustomDashboard,
  getCustomDashboards,
  removeCustomDashboard,
} from "../../utils/customDashboards";
import { canAccessPortal, isStandalonePortal, STANDALONE_PORTALS } from "../../utils/portalMapping";

function LogoIcon({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full rounded-md object-cover"
    />
  );
}

// SATHEE web app entry point. Swap for the real URL after deployment/domain.
const SATHEE_APP_URL = "http://localhost:5174/";

export default function DashboardSelect({ openHCLSathee, openPortal, onLogout, userRole, userCentre }) {
  const isAdmin = String(userRole || "").trim().toUpperCase() === "ADMIN";

  const openSatheeApp = () => {
    const url = new URL(SATHEE_APP_URL);
    if (userRole) url.searchParams.set("role", userRole);
    if (userCentre) url.searchParams.set("centre", userCentre);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const [customDashboards, setCustomDashboards] = useState(() => getCustomDashboards());
  const [modalOpen, setModalOpen] = useState(false);

  const handleAdd = ({ title, url }) => {
    setCustomDashboards(addCustomDashboard({ title, url }));
  };

  const handleRemove = (id) => {
    setCustomDashboards(removeCustomDashboard(id));
  };

  const builtInCards = [
    {
      id: "hcl-sathee",
      title: "HCL SATHEE",
      subtitle: "Open your internal HCL SATHEE analytics workspace",
      icon: (size) => <LogoIcon src={HCLLogo} alt="HCL" size={size} />,
      buttonText: "Open HCL SATHEE",
      onClick: openHCLSathee,
      badge: "Internal",
    },
    {
      id: "sathee",
      title: "SATHEE",
      subtitle: "Go to the official SATHEE learning portal",
      icon: (size) => <LogoIcon src={SatheeLogo} alt="SATHEE" size={size} />,
      buttonText: "Visit SATHEE",
      onClick: openSatheeApp,
      badge: "External",
    },
  ];

  // Standalone Kendras, shown only to admins and to that Kendra's own users.
  const kendraCards = STANDALONE_PORTALS.filter((portal) =>
    canAccessPortal(userCentre, portal.title, userRole)
  ).map((portal) => ({
    id: portal.title,
    title: portal.label,
    subtitle: portal.subtitle,
    icon: (size) => <LogoIcon src={SatheeLogo} alt={portal.title} size={size} />,
    buttonText: "Open Kendra",
    onClick: () => openPortal?.(portal.title),
    badge: "Kendra",
  }));

  const customCards = customDashboards.map((dashboard) => ({
    id: dashboard.id,
    title: dashboard.title,
    subtitle: dashboard.url,
    icon: (size) => <Globe size={size} />,
    buttonText: `Open ${dashboard.title}`,
    onClick: () => window.open(dashboard.url, "_blank", "noopener,noreferrer"),
    badge: "External",
    removable: true,
  }));

  const addDashboardCard = {
    id: "add-dashboard",
    title: "Add New Dashboard",
    subtitle: "Create OR add a new custom dashboard",
    icon: (size) => <Plus size={size} />,
    buttonText: "Add New Dashboard",
    onClick: () => setModalOpen(true),
    badge: "Custom",
  };

  // Users of a standalone Kendra (e.g. Barmer) don't belong to HCL SATHEE.
  const visibleBuiltIns =
    !isAdmin && isStandalonePortal(userCentre)
      ? builtInCards.filter((card) => card.id !== "hcl-sathee")
      : builtInCards;

  const cards = isAdmin
    ? [...builtInCards, ...kendraCards, ...customCards, addDashboardCard]
    : [...visibleBuiltIns, ...kendraCards];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F1F5F9] font-sans text-black">
      <header className="h-16 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-[#3B82F6]/20 bg-[#5785d0]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src={HCLLogo}
            alt="HCL Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0"
          />
          <div className="min-w-0">
            <p className="font-semibold tracking-tight text-black truncate text-sm sm:text-base">
              HCL SATHEE
            </p>
            <p className="text-xs text-[#101011] truncate">Dashboard Selection</p>
          </div>
        </div>

        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="bg-[#3B82F6] hover:bg-blue-600 text-white px-3 sm:px-6 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 transition-colors shrink-0"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
          Choose Your Platform
        </h1>
        <p className="mt-2 text-slate-600">
          You are logged in successfully. Select where you want to continue.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:mt-10 lg:gap-7">
          {cards.map(
            ({ id, title, subtitle, icon, buttonText, onClick, badge, removable }) => (
              <article
                key={id}
                className="group relative flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md lg:p-7"
              >
                {removable ? (
                  <button
                    type="button"
                    onClick={() => handleRemove(id)}
                    className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                    title="Remove dashboard"
                  >
                    <X size={16} />
                  </button>
                ) : null}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-[#3B82F6]">
                    {icon(26)}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      removable ? "mr-6 " : ""
                    }${
                      badge === "Internal"
                        ? "bg-blue-100 text-blue-700"
                        : badge === "Custom"
                          ? "bg-emerald-100 text-emerald-700"
                          : badge === "Kendra"
                            ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {badge}
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {title}
                </h2>

                <p className="mt-1.5 truncate text-sm leading-relaxed text-slate-600">
                  {subtitle}
                </p>

                <button
                  type="button"
                  onClick={onClick}
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-2xl bg-[#3B82F6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                >
                  {buttonText}
                  <ArrowUpRight
                    size={18}
                    className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </button>
              </article>
            )
          )}
        </div>
      </main>

      {isAdmin ? (
        <AddDashboardModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAdd={handleAdd}
        />
      ) : null}
    </div>
  );
}