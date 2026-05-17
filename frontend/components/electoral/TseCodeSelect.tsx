"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTseCodes } from "@/services/electoral-api";
import type { TseCode, TseItemType } from "@/types/electoral";

interface Props {
  value?: TseCode;
  filterType?: TseItemType;
  onChange: (code: TseCode) => void;
}

export function TseCodeSelect({ value, filterType, onChange }: Props) {
  const [codes, setCodes] = useState<TseCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTseCodes()
      .then(setCodes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterType ? codes.filter((c) => c.type === filterType) : codes;

  return (
    <Select
      value={value?.id ?? ""}
      onValueChange={(id) => {
        const found = filtered.find((c) => c.id === id);
        if (found) onChange(found);
      }}
      disabled={loading}
    >
      <SelectTrigger>
        <SelectValue
          placeholder={loading ? "Carregando códigos..." : "Selecione o código TSE"}
        />
      </SelectTrigger>
      <SelectContent>
        {filtered.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            <span className="font-mono text-xs mr-2">{c.code}</span>
            {c.description}
          </SelectItem>
        ))}
        {filtered.length === 0 && !loading && (
          <SelectItem value="_none" disabled>
            Nenhum código disponível
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
