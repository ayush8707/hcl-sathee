import { createContext, useContext, useState } from "react";
import { LOGIN_LANGUAGES, LOGIN_STRINGS } from "./loginStrings";

const STORAGE_KEY = "sathee_login_language";

const readLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LOGIN_STRINGS[saved] ? saved : "en";
  } catch {
    return "en";
  }
};

const LoginLanguageContext = createContext({ lang: "en", t: LOGIN_STRINGS.en, setLang: () => {} });

export function LoginLanguageProvider({ children }) {
  const [lang, setLangState] = useState(readLanguage);

  const setLang = (code) => {
    if (!LOGIN_STRINGS[code]) return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <LoginLanguageContext.Provider value={{ lang, t: LOGIN_STRINGS[lang], setLang }}>
      <div lang={lang}>{children}</div>
    </LoginLanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLoginLanguage = () => useContext(LoginLanguageContext);

export function LanguageSwitch({ className = "" }) {
  const { lang, t, setLang } = useLoginLanguage();
  return (
    <div role="group" aria-label={t.language} className={`inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm ${className}`}>
      {LOGIN_LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          lang={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            lang === code ? "bg-[#3B82F6] text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
