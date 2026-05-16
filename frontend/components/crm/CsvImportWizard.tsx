"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { uploadCsv, getImportStatus } from "@/services/crm-api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import type { CrmImport } from "@/types/crm";

type Step = "upload" | "preview" | "result";

export function CsvImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importRecord, setImportRecord] = useState<CrmImport | null>(null);
  const [polling, setPolling] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Processa o arquivo CSV localmente usando papaparse
  const processFile = (f: File) => {
    setFile(f);
    Papa.parse<string[]>(f, {
      skipEmptyLines: true,
      complete: (result) => {
        const [headerRow, ...dataRows] = result.data;
        setHeaders(headerRow ?? []);
        setRows(dataRows.slice(0, 10));
        setStep("preview");
      },
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.endsWith(".csv")) processFile(f);
  }, []);

  const handleConfirm = async () => {
    if (!file) return;
    const result = await uploadCsv(file);
    setImportRecord(result as any);
    setStep("result");
    setPolling(true);
  };

  // Polling a cada 3s enquanto importação está em andamento
  useEffect(() => {
    if (!polling || !importRecord?.id) return;

    pollRef.current = setInterval(async () => {
      const status = await getImportStatus(importRecord.id);
      setImportRecord(status as any);
      if ((status as any).status === "done" || (status as any).status === "error") {
        setPolling(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [polling, importRecord?.id]);

  const progressPct =
    importRecord && importRecord.total_rows > 0
      ? Math.round((importRecord.imported_rows / importRecord.total_rows) * 100)
      : 0;

  // Passo 1: Upload (drag-and-drop)
  if (step === "upload") {
    return (
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-1">Arraste e solte um arquivo CSV aqui</p>
        <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
        <Button variant="outline" onClick={() => inputRef.current?.click()}>
          Selecionar arquivo
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    );
  }

  // Passo 2: Preview das primeiras 10 linhas
  if (step === "preview") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Pré-visualização</h2>
            <p className="text-sm text-muted-foreground">
              Arquivo: <span className="font-medium">{file?.name}</span> — mostrando primeiras {rows.length} linhas
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setStep("upload"); setFile(null); }}>
            Trocar arquivo
          </Button>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-t">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 truncate max-w-[200px]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setStep("upload")}>Voltar</Button>
          <Button onClick={handleConfirm}>Confirmar Importação</Button>
        </div>
      </div>
    );
  }

  // Passo 3: Resultado / progresso
  return (
    <div className="space-y-6 py-4">
      <h2 className="font-semibold text-lg">Resultado da Importação</h2>

      {importRecord ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {importRecord.status === "done" && (
              <CheckCircle className="h-6 w-6 text-green-500" />
            )}
            {importRecord.status === "error" && (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            {(importRecord.status === "pending" || importRecord.status === "processing") && (
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            )}
            <span className="capitalize font-medium">
              {importRecord.status === "done" && "Importação concluída"}
              {importRecord.status === "error" && "Erro na importação"}
              {importRecord.status === "processing" && "Processando..."}
              {importRecord.status === "pending" && "Aguardando processamento..."}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{importRecord.imported_rows} de {importRecord.total_rows} registros importados</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} />
          </div>

          {importRecord.error_rows > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {importRecord.error_rows} linha(s) com erro durante a importação.
            </div>
          )}

          {importRecord.status === "done" && (
            <Button variant="outline" onClick={() => { setStep("upload"); setFile(null); setImportRecord(null); }}>
              Fazer nova importação
            </Button>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">Iniciando importação...</p>
      )}
    </div>
  );
}
