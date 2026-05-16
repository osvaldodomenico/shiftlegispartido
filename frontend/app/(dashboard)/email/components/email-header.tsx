import { Mail } from "lucide-react";

const EmailHeader = () => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            Caixa de comunicacao
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-300">
            Modulo sem dados publicados no momento.
          </p>
        </div>
      </div>
      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-slate-800 dark:text-neutral-300">
        0 mensagens
      </span>
    </div>
  );
};

export default EmailHeader;
