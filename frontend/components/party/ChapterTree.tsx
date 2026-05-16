"use client";

import { useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { PartyChapter } from "@/types/party";

const LEVEL_COLORS: Record<string, string> = {
  nacional: "bg-purple-100 text-purple-700",
  estadual: "bg-blue-100 text-blue-700",
  municipal: "bg-green-100 text-green-700",
  zonal: "bg-orange-100 text-orange-700",
};

const LEVEL_LABELS: Record<string, string> = {
  nacional: "Nacional",
  estadual: "Estadual",
  municipal: "Municipal",
  zonal: "Zonal",
};

function ChapterNode({ chapter, depth = 0 }: { chapter: PartyChapter; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const router = useRouter();
  const hasChildren = chapter.children && chapter.children.length > 0;

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        {hasChildren ? (
          <Collapsible.Trigger asChild>
            <button className="p-0.5 rounded hover:bg-muted">
              {open ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </Collapsible.Trigger>
        ) : (
          <span className="w-5" />
        )}
        <span className="flex-1 font-medium text-sm">{chapter.name}</span>
        <Badge className={`text-xs ${LEVEL_COLORS[chapter.level] ?? ""}`}>
          {LEVEL_LABELS[chapter.level] ?? chapter.level}
        </Badge>
        {chapter.state && (
          <span className="text-xs text-muted-foreground hidden sm:inline">{chapter.state}</span>
        )}
        {chapter.member_count !== undefined && (
          <span className="text-xs text-muted-foreground">{chapter.member_count} membros</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/party/chapters/${chapter.id}`)}
        >
          Ver
        </Button>
      </div>
      {hasChildren && (
        <Collapsible.Content>
          {chapter.children!.map((child) => (
            <ChapterNode key={child.id} chapter={child} depth={depth + 1} />
          ))}
        </Collapsible.Content>
      )}
    </Collapsible.Root>
  );
}

export function ChapterTree({ chapters }: { chapters: PartyChapter[] }) {
  const roots = chapters.filter((c) => !c.parent_id);

  if (roots.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
        Nenhum diretório encontrado.
      </div>
    );
  }

  return (
    <div className="border rounded-lg divide-y">
      {roots.map((c) => (
        <ChapterNode key={c.id} chapter={c} />
      ))}
    </div>
  );
}
