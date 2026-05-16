import { PipelineKanban } from "@/components/crm/PipelineKanban";

export default function PipelinePage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Pipeline de Contatos</h1>
      <PipelineKanban />
    </div>
  );
}
