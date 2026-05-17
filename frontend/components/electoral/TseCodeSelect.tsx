"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { getTseCodes } from "@/services/electoral-api";
import type { TseCode } from "@/types/electoral";

interface Props {
  value?: TseCode;
  onChange: (code: TseCode) => void;
}

export function TseCodeSelect({ value, onChange }: Props) {
  const [codes, setCodes] = useState<TseCode[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getTseCodes().then((c) => setCodes(c.data as TseCode[]));
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {value ? `${value.code} — ${value.description}` : "Selecionar código TSE"}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0">
        <Command>
          <CommandInput placeholder="Buscar código..." />
          <CommandEmpty>Nenhum código encontrado.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {codes.map((c) => (
              <CommandItem
                key={c.id}
                value={`${c.code} ${c.description}`}
                onSelect={() => {
                  onChange(c);
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${value?.id === c.id ? "opacity-100" : "opacity-0"}`}
                />
                <span className="font-mono mr-2">{c.code}</span> {c.description}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
