import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useState, useEffect } from "react";

export const LanguageButtonSmall = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [displayLang, setDisplayLang] = useState(language);

  // Update display when language context changes
  useEffect(() => {
    setDisplayLang(language);
    console.log("Display language updated to:", language);
  }, [language]);

  // Listen to custom event
  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.language) {
        console.log("Custom event received:", customEvent.detail.language);
        setDisplayLang(customEvent.detail.language);
      }
    };

    window.addEventListener("languageChanged", handleLanguageChange);
    return () => window.removeEventListener("languageChanged", handleLanguageChange);
  }, []);

  const languages = [
    { code: "NL" as const, flag: "🇳🇱" },
    { code: "FR" as const, flag: "🇫🇷" },
    { code: "DE" as const, flag: "🇩🇪" },
    { code: "EN" as const, flag: "🇬🇧" },
  ];

  const handleLanguageSelect = (lang: "NL" | "FR" | "DE" | "EN") => {
    console.log("Header button: Selecting language", lang);
    setDisplayLang(lang);
    setLanguage(lang);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-dropdown-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative language-dropdown-container">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border-gray-300 hover:bg-[#243E8F]/10 hover:border-[#243E8F]/30 hover:text-[#243E8F]"
      >
        <Globe className="h-4 w-4" />
        <span className="font-semibold">{displayLang}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
          <div className="space-y-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                  displayLang === lang.code
                    ? "bg-[#243E8F]/10 text-[#243E8F] font-bold"
                    : "hover:bg-[#243E8F]/10 hover:text-[#243E8F] text-gray-700"
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.code}</span>
                {displayLang === lang.code && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
