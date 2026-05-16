"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUnreadCount, getNotifications, markRead, markAllRead } from "@/services/crm-api";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CrmNotification } from "@/types/crm";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<CrmNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Polling de notificações não lidas a cada 30 segundos
    const poll = () =>
      getUnreadCount()
        .then((r: any) => setCount(r?.count ?? r?.data?.count ?? 0))
        .catch(() => {});
    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function handleOpen(value: boolean) {
    setOpen(value);
    if (value) {
      try {
        const data = await getNotifications();
        setNotifications(Array.isArray(data) ? data : (data as any)?.data ?? []);
      } catch {
        setNotifications([]);
      }
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setCount((c) => Math.max(0, c - 1));
    } catch {}
  }

  async function handleMarkAll() {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setCount(0);
    } catch {}
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs rounded-full bg-red-500 text-white border-0 flex items-center justify-center"
            >
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-slate-600">
          <span className="font-semibold text-sm">Notificações</span>
          {notifications.some((n) => !n.read) && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleMarkAll}>
              Marcar todas
            </Button>
          )}
        </div>

        {/* Lista de notificações */}
        <div className="overflow-y-auto max-h-80 divide-y divide-neutral-100 dark:divide-slate-700">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-400 text-sm gap-2">
              <Bell className="w-8 h-8 opacity-30" />
              <span>Sem notificações</span>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 ${!n.read ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-snug">
                    {n.message}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {!n.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 shrink-0"
                    onClick={() => handleMarkRead(n.id)}
                  >
                    Marcar como lida
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
