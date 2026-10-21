import { useEffect, useState } from "react";
import { Info, TriangleAlert } from "lucide-react";
import { fetchLoginNotice } from "../../services/siteNotice";
import { useLoginLanguage } from "../../i18n/LoginLanguage";

// Notice set by an admin (Announcements page), shown above the login card.
export default function LoginNotice({ className = "" }) {
  const { t } = useLoginLanguage();
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    fetchLoginNotice()
      .then((value) => active && setNotice(value))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!notice?.message) return null;
  const warning = notice.level === "warning";
  const Icon = warning ? TriangleAlert : Info;

  return (
    <div
      role="status"
      className={`flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 text-sm lg:max-w-lg ${
        warning ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-900"
      } ${className}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="min-w-0 whitespace-pre-line break-words">
        <span className="font-semibold">{t.notice}: </span>
        {notice.message}
      </p>
    </div>
  );
}
