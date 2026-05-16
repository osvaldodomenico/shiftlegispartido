import { MailOpen } from "lucide-react";

const EmailList = () => {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MailOpen className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Nenhuma mensagem cadastrada
        </h3>
        <p className="max-w-2xl text-sm text-neutral-500 dark:text-neutral-300">
          A central de comunicacao ainda nao possui mensagens, caixas ou historico
          sincronizado. Quando a integracao real estiver pronta, as conversas vao
          aparecer aqui.
        </p>
      </div>
    </div>
  );
};

export default EmailList;
