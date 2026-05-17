"use client";

import { useEffect, useState, useCallback } from "react";
import { getTasks, completeTask, deleteTask } from "@/services/crm-api";
import { TaskList } from "@/components/crm/TaskList";
import { CreateTaskDialog } from "@/components/crm/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, ClipboardList } from "lucide-react";
import type { CrmTask } from "@/types/crm";

export default function TasksPage() {
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [scope, setScope] = useState<"me" | "all">("me");
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTasks(scope === "me" ? { assignedTo: "me" } : {});
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Tarefas</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Nova Tarefa</Button>
      </div>

      <Card className="card !p-0 !block border-0 overflow-hidden">
        <CardHeader className="border-b border-neutral-200 dark:border-slate-600 !py-3 px-6">
          <Tabs value={scope} onValueChange={(v) => setScope(v as "me" | "all")}>
            <TabsList>
              <TabsTrigger value="me">Minhas Tarefas</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onStatusChange={async (id) => {
                await completeTask(id);
                loadTasks();
              }}
              onDelete={async (id) => {
                await deleteTask(id);
                loadTasks();
              }}
              onRefresh={loadTasks}
            />
          )}
        </CardContent>
      </Card>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false);
          loadTasks();
        }}
      />
    </div>
  );
}
