"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import toast from "react-hot-toast";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Trash } from "lucide-react";
import AddEvent from "./add-event";
import EditEvent from "./edit-event";
import ViewEvent from "./view-event";

export interface CalendarEvent {
    id: number;
    title: string;
    label: string;
    color: string;
    startTime: string;
    endTime: string;
    description: string;
}

const CalendarSidebar: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    // Add new event
    const handleAddEvent = (newEvent: CalendarEvent) => {
        setEvents((prev) => [...prev, newEvent]);
    };

    // Remove event
    const handleRemoveEvent = (id: number) => {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        toast.success("Evento removido com sucesso.");
    };

    // Update event
    const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
        setEvents((prev) =>
            prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
        );
    };

    return (
        <Card className="h-full border-0 !p-0 rounded-lg">
            <CardContent className="p-0">
                <div className="p-6">
                    <AddEvent onAddEvent={handleAddEvent} />
                </div>

                <div className="space-y-4 max-h-[700px] overflow-y-auto p-6 pt-0">
                    {events.length > 0 ? (
                        events.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-600"
                            >
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <span className={cn("w-3 h-3 rounded-full", event.color)} />
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-800 dark:text-gray-200">
                                                {event.startTime}
                                            </span>
                                            <span>-</span>
                                            <span className="text-gray-800 dark:text-gray-200">
                                                {event.endTime}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-neutral-600 dark:text-neutral-200 font-semibold text-base mt-1.5">
                                        {event.title}
                                    </span>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <EllipsisVertical width={18} />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem asChild>
                                            <ViewEvent addOnViewEvent={event} />
                                        </DropdownMenuItem>

                                        <DropdownMenuItem asChild>
                                            <EditEvent onEditEvent={handleUpdateEvent} event={event} />
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => handleRemoveEvent(event.id)}
                                        >
                                            <Trash /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center dark:border-slate-600 dark:bg-slate-800/40">
                            <span className="block text-lg font-semibold text-neutral-800 dark:text-white">Nenhum evento cadastrado.</span>
                            <span className="mt-2 block text-sm text-neutral-500 dark:text-neutral-300">
                                O calendario foi limpo e nao exibe mais eventos de exemplo.
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CalendarSidebar;
