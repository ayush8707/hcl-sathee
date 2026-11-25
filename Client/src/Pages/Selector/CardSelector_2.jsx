import { useEffect, useState } from "react";
import { MapPin, ArrowRight, ArrowLeft, ShieldAlert, Plus, Pencil, Trash2, Lock, LogOut } from "lucide-react";
import HCLLogo from "../../assets/HCL.svg";
import SatheeLogo from "../../assets/sathee.svg";
import AddCentreModal from "../../Components/Selector/AddCentreModal";
import {
  fetchCentres,
  createCentre,
  renameCentre,
  deleteCentre,
} from "../../services/centres";
import {
  canAccessPortal,
  canEnterAdminDashboard,
  canEnterPartnerDashboard,
  canEnterSatheeMitraDashboard,
  getCanonicalCentreKey,
  PORTAL_OPTIONS,
  isStandalonePortal,
  STANDALONE_PORTALS,
  SATHEE_PORTAL_OPTIONS,
} from "../../utils/portalMapping";
import { getCentreId, getCentrePlace } from "../../utils/centreDirectory";

// The 3 originals are already rendered from PORTAL_OPTIONS with their own
// titles/subtitles — filter them out of the dynamic list so they show once.
const DEFAULT_CENTRE_KEYS = new Set(
  PORTAL_OPTIONS.map((option) => getCanonicalCentreKey(option.title))
);

const toTitleCase = (value) =>
  value.toLowerCase().replace(/\b([a-z])/g, (match) => match.toUpperCase());

// The same page serves two networks:
//  - HCL SATHEE: the 3 state portals plus HCL centres added here;
//  - SATHEE: its own Kendras, named "SATHEE <place>" (starts empty).
// Barmer has its own card on the platform screen, so it is on neither list.
const NETWORKS = {
  hcl: {
    name: "HCL SATHEE",
    logo: HCLLogo,
    logoAlt: "HCL Logo",
    logoClass: "object-contain",
    subtitle: "State Portals",
    heading: "Select Your State Portal",
    intro: "Choose the HCL SATHEE portal you want to manage.",
    builtIn: PORTAL_OPTIONS,
    // "HCL SATHEE RAJASTHAN" -> "Rajasthan" for the card heading.
    prefix: /^HCL\s+SATHEE\s+/i,
    includes: (name) => !DEFAULT_CENTRE_KEYS.has(getCanonicalCentreKey(name)) && !isStandalonePortal(name),
    toCentreName: (name) => name,
    empty: "",
    unit: "portal",
  },
  sathee: {
    name: "SATHEE",
    logo: SatheeLogo,
    logoAlt: "SATHEE Logo",
    logoClass: "rounded-full object-cover",
    subtitle: "Kendras",
    heading: "Select Your SATHEE Kendra",
    intro: "Choose the SATHEE Kendra you want to manage.",
    builtIn: SATHEE_PORTAL_OPTIONS,
    // "SATHEE KOTA" -> "Kota" for the card heading.
    prefix: /^SATHEE\s+/i,
    includes: (name) =>
      isStandalonePortal(name) &&
      ![...STANDALONE_PORTALS, ...SATHEE_PORTAL_OPTIONS].some(
        (p) => getCanonicalCentreKey(p.title) === getCanonicalCentreKey(name)
      ),
    // Every Kendra on this page is stored as "SATHEE <place>".
    toCentreName: (name) => `SATHEE ${name.replace(/^SATHEE\s*/i, "").trim()}`,
    empty: "No SATHEE Kendras yet.",
    unit: "Kendra",
  },
};

function Alert({ children }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm text-red-700">
      <ShieldAlert size={20} className="shrink-0" />
      <p className="font-medium">{children}</p>
    </div>
  );
}

export default function CardSelector_2({ openDashboard, onBack, onLogout, userCentre, userRole, network = "hcl" }) {
  const net = NETWORKS[network] || NETWORKS.hcl;
  const cardHeading = (title) =>
    net.builtIn.find((option) => option.title === title)?.label ||
    (net.prefix.test(title) ? toTitleCase(title.replace(net.prefix, "")) : title);
  const isAdmin = String(userRole || "").trim().toUpperCase() === "ADMIN";
  const [accessMessage, setAccessMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [extraCentres, setExtraCentres] = useState([]);
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);
  // When set, the modal is in "rename" mode for this centre instead of "add".
  const [editingCentre, setEditingCentre] = useState(null);
  // Errors from rename/delete that aren't tied to the modal (e.g. CENTRE_IN_USE).
  const [actionError, setActionError] = useState("");

  const loadCentres = async () => {
    try {
      const centres = await fetchCentres();
      setExtraCentres(centres.filter((centre) => net.includes(centre.name)));
    } catch (error) {
      console.error("Fetch Centres Error:", error);
    }
  };

  useEffect(() => {
    loadCentres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]);

  const handleOpenPortal = (portalTitle) => {
    if (!canAccessPortal(userCentre, portalTitle, userRole)) {
      setAccessMessage("You don't have access to this portal. Ask your admin if you need it.");
      return;
    }

    if (
      canEnterAdminDashboard(userRole) ||
      canEnterPartnerDashboard(userRole) ||
      canEnterSatheeMitraDashboard(userRole)
    ) {
      setAccessMessage("");
      openDashboard(portalTitle);
      return;
    }

    setAccessMessage("You don't have access to this portal. Ask your admin if you need it.");
  };

  const openAddModal = () => {
    setEditingCentre(null);
    setAddError("");
    setActionError("");
    setModalOpen(true);
  };

  const openRenameModal = (centre) => {
    setEditingCentre(centre);
    setAddError("");
    setActionError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCentre(null);
    setAddError("");
  };

  const handleSubmitCentre = async (name) => {
    setAddError("");
    setSaving(true);
    try {
      if (editingCentre) {
        await renameCentre(editingCentre.id, net.toCentreName(name));
      } else {
        await createCentre(net.toCentreName(name));
      }
      await loadCentres();
      closeModal();
    } catch (error) {
      setAddError(
        error?.response?.data?.message ||
          (editingCentre
            ? "Unable to rename centre. Please try again."
            : "Unable to add centre. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCentre = async (centre) => {
    if (
      !window.confirm(
        `Delete "${centre.name}"? This can't be undone.`
      )
    ) {
      return;
    }
    setActionError("");
    try {
      await deleteCentre(centre.id);
      await loadCentres();
    } catch (error) {
      setActionError(
        error?.response?.data?.message || "Unable to delete centre. Please try again."
      );
    }
  };

  const centreCards = [
    ...net.builtIn,
    ...extraCentres.map((centre) => ({
      title: centre.name,
      subtitle: "Learning Portal",
      custom: { id: centre.id, name: centre.name },
    })),
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F1F5F9] font-sans text-black">
      <header className="h-16 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-[#3B82F6]/20 bg-[#5785d0]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img src={net.logo} alt={net.logoAlt} className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 ${net.logoClass}`} />
          <div className="min-w-0">
            <p className="font-semibold tracking-tight text-black truncate text-sm sm:text-base">{net.name}</p>
            <p className="text-xs text-[#101011] truncate">{net.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="bg-white/20 hover:bg-white/30 text-slate-900 px-3 sm:px-5 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Platforms</span>
            </button>
          ) : null}
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white px-3 sm:px-6 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">{net.heading}</h1>
            <p className="mt-2 text-slate-600">{net.intro}</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow-sm">
            {centreCards.length} {centreCards.length === 1 ? net.unit : `${net.unit}s`}
          </span>
        </div>

        {accessMessage ? <Alert>{accessMessage}</Alert> : null}
        {actionError ? <Alert>{actionError}</Alert> : null}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {centreCards.map((state) => {
            const allowed = canAccessPortal(userCentre, state.title, userRole);
            const custom = state.custom;
            const kendraId = getCentreId(state.title);
            const place = getCentrePlace(state.title);
            const isPrefixed = net.prefix.test(state.title);

            return (
              <article
                key={state.title}
                onClick={() => handleOpenPortal(state.title)}
                className={`group flex min-w-0 cursor-pointer flex-col rounded-2xl border bg-white shadow-sm transition duration-200 ${
                  allowed
                    ? "border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    : "border-slate-200 opacity-75"
                }`}
              >
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                        allowed ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {allowed ? <MapPin size={24} /> : <Lock size={22} />}
                    </div>
                    {kendraId ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-600">
                        {kendraId}
                      </span>
                    ) : null}
                  </div>

                  {isPrefixed ? (
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-blue-600">{net.name}</p>
                  ) : null}
                  <h2 className={`${isPrefixed ? "mt-1" : "mt-5"} break-words text-2xl font-bold tracking-tight text-slate-900`}>
                    {cardHeading(state.title)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{state.subtitle}</p>

                  {place ? (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin size={14} className="shrink-0" />
                      {place}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
                  {allowed ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPortal(state.title);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                    >
                      Open portal
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
                      <Lock size={15} />
                      No access
                    </span>
                  )}

                  {isAdmin && custom ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Rename centre"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameModal(custom);
                        }}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title="Delete centre"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCentre(custom);
                        }}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}

          {isAdmin ? (
            <button
              type="button"
              onClick={openAddModal}
              className="group flex min-h-[240px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-6 text-center transition hover:border-blue-400 hover:bg-white"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
                <Plus size={24} />
              </span>
              <span className="mt-4 text-lg font-semibold text-slate-900">Add new centre</span>
              <span className="mt-1 text-sm text-slate-500">Create a portal for a new SATHEE Kendra</span>
            </button>
          ) : null}
        </div>

        {!isAdmin && centreCards.length === 0 && net.empty ? (
          <p className="mt-16 text-center text-slate-500">{net.empty}</p>
        ) : null}
      </main>

      <footer className="pb-6">
        <p className="text-center text-sm text-slate-500">{net.name} Platform</p>
      </footer>

      {isAdmin ? (
        <AddCentreModal
          open={modalOpen}
          onClose={closeModal}
          onAdd={handleSubmitCentre}
          submitting={saving}
          error={addError}
          initialName={editingCentre ? (network === "sathee" ? cardHeading(editingCentre.name) : editingCentre.name) : ""}
          title={editingCentre ? "Rename Centre" : network === "sathee" ? "Add a SATHEE Kendra" : "Add a Centre"}
          submitLabel={editingCentre ? "Save" : "Add"}
        />
      ) : null}
    </div>
  );
}
