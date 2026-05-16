import { CsvImportWizard } from "@/components/crm/CsvImportWizard";

export default function ImportPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Importar Contatos</h1>
      <p className="text-muted-foreground">
        Importe contatos em massa via arquivo CSV. O arquivo deve conter os campos: nome, tipo, e-mail, telefone.
      </p>
      <CsvImportWizard />
    </div>
  );
}
