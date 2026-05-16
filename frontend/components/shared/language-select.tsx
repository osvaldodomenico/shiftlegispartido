"use client";

import { cn } from "@/lib/utils";

const LanguageSelect = () => {
  return (
    <div
      className={cn(
        "flex h-10 items-center rounded-lg bg-gray-200/75 px-3 text-sm font-medium text-neutral-800 dark:bg-slate-700 dark:text-white"
      )}
      aria-label="Idioma atual"
      title="Idioma atual"
    >
      PT-BR
    </div>
  );
};

export default LanguageSelect;
