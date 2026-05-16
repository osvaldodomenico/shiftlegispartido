"use client";

import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card, CardContent } from "@/components/ui/card";
import { v4 as uuidv4 } from "uuid";

function BasicFullCalendar() {
    const [events, setEvents] = useState<{ id: string; title: string; start: Date | string }[]>([]);

    // Add event
    const handleDateClick = (info: any) => {
        const title = prompt("INFORME O TÍTULO DO EVENTO:");
        if (title) {
            setEvents([
                ...events,
                {
                    id: uuidv4(),
                    title,
                    start: info.date
                }
            ]);
        }
    };

    // Edit event
    const handleEventClick = (info: any) => {
        const newTitle = prompt("EDITE O TÍTULO DO EVENTO:", info.event.title);
        if (newTitle) {
            setEvents(
                events.map((event) =>
                    event.id === info.event.id ? { ...event, title: newTitle } : event
                )
            );
        } else if (newTitle === "") {
            // Delete if blank
            if (confirm("DESEJA EXCLUIR ESTE EVENTO?")) {
                setEvents(events.filter((event) => event.id !== info.event.id));
            }
        }
    };

    return (
        <>
            <Card className="card h-full rounded-lg border-0">
                <CardContent className="card-body p-0 flex flex-col justify-between gap-8">
                    <FullCalendar
                        locale={ptBrLocale}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,timeGridDay",
                        }}
                        buttonText={{
                            today: "Hoje",
                            month: "Mês",
                            week: "Semana",
                            day: "Dia",
                        }}
                        selectable={true}
                        editable={true}
                        events={events}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                    />
                </CardContent>
            </Card>
        </>
    );
}
export default BasicFullCalendar;
