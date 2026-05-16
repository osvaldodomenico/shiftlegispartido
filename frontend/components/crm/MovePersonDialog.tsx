"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { movePerson } from "@/services/crm-api";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  contactName: string;
  contactId: string;
  fromStage: string;
  toStageId: string;
  toStageName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MovePersonDialog({
  open,
  contactName,
  contactId,
  fromStage,
  toStageId,
  toStageName,
  onSuccess,
  onCancel,
}: Props) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await movePerson(contactId, toStageId, notes || undefined);
      toast.success(`${contactName} movido para ${toStageName}`);
      setNotes("");
      onSuccess();
    } catch (err) {
      toast.error("Erro ao mover contato. Tente novamente.");
      onCancel();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover Contato</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">
            <span className="font-medium">{contactName}</span> será movido de{" "}
            <span className="text-muted-foreground">{fromStage}</span> →{" "}
            <span className="font-medium text-foreground">{toStageName}</span>
          </p>
          <Textarea
            placeholder="Observações (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Movendo..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
