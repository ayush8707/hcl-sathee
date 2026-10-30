import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import {
  canPromptInstall,
  isInstalledApp,
  isIosSafari,
  promptInstall,
  subscribeInstallPrompt,
} from "../../utils/installPrompt";

/** "Install app" button; renders nothing when installing isn't possible or already done. */
export default function InstallAppButton({ className = "" }) {
  const [canInstall, setCanInstall] = useState(canPromptInstall);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => subscribeInstallPrompt(() => setCanInstall(canPromptInstall())), []);

  if (isInstalledApp()) return null;
  const ios = isIosSafari();
  if (!canInstall && !ios) return null;

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => (canInstall ? promptInstall() : setShowIosTip((open) => !open))}
        className={className}
      >
        <Download size={16} />
        <span>Install app</span>
      </button>

      {showIosTip ? (
        <div className="fixed inset-x-4 top-20 z-50 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-700 shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64">
          <button
            type="button"
            onClick={() => setShowIosTip(false)}
            aria-label="Close"
            className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
          <p className="font-semibold text-slate-900">Add to Home Screen</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>
              Tap the <Share size={13} className="inline -mt-0.5" /> <b>Share</b> button in Safari.
            </li>
            <li>
              Choose <b>Add to Home Screen</b>.
            </li>
            <li>
              Tap <b>Add</b>.
            </li>
          </ol>
        </div>
      ) : null}
    </div>
  );
}
