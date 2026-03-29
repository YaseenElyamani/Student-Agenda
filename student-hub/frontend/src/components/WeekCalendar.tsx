import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./WeekCalendar.module.css";
import type { Task } from "../types/Task";

interface WeekCalendarProps {
  tasks?: Task[];
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getWeekDays(offsetWeeks: number) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + offsetWeeks * 7);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      day: dayNames[i],
      date: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
    };
  });
}

const SHORT_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getUrgency(year: number, month: number, date: number): "overdue" | "today" | "soon" | "upcoming" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(year, month, date);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 3) return "soon";
  return "upcoming";
}

const URGENCY_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  overdue:  { bg: "#2a1a1a", color: "#ef4444", border: "#ef4444" },
  today:    { bg: "#2a1a00", color: "#f59e0b", border: "#f59e0b" },
  soon:     { bg: "#1a2a1a", color: "#34d399", border: "#34d399" },
  upcoming: { bg: "#1e1a3a", color: "#7c6fcd", border: "#7c6fcd" },
};

export default function WeekCalendar({ tasks = [] }: WeekCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const navigate = useNavigate();
  const weekDays = getWeekDays(weekOffset);
  const today = new Date();

  const startDay = weekDays[0];
  const endDay = weekDays[6];
  const rangeLabel = `${SHORT_MONTH_NAMES[startDay.month]} ${startDay.date} – ${SHORT_MONTH_NAMES[endDay.month]} ${endDay.date}`;

  const getTasksForDay = (year: number, month: number, date: number) =>
    tasks.filter(t => {
      if (!t.due_date || t.due_date === "TBD") return false;
      const due = parseLocalDate(t.due_date);
      return due.getFullYear() === year && due.getMonth() === month && due.getDate() === date;
    });

  const isToday = (year: number, month: number, date: number) =>
    date === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>📅</span>
          <span>This Week</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className={styles.navBtn} onClick={() => setWeekOffset(o => o - 1)}>‹</button>
          <span className={styles.range}>{rangeLabel}</span>
          <button className={styles.navBtn} onClick={() => setWeekOffset(o => o + 1)}>›</button>
          {weekOffset !== 0 && (
            <button className={styles.todayBtn} onClick={() => setWeekOffset(0)}>Today</button>
          )}
          <button className={styles.expandBtn} onClick={() => navigate("/calendar")}>
            Semester View ↗
          </button>
        </div>
      </div>

      <div className={styles.legend}>
        {Object.entries(URGENCY_STYLES).map(([key, val]) => (
          <div key={key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: val.color }} />
            <span className={styles.legendLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {weekDays.map((d) => {
          const dueTasks = getTasksForDay(d.year, d.month, d.date);
          const todayDay = isToday(d.year, d.month, d.date);
          return (
            <div key={`${d.year}-${d.month}-${d.date}`} className={`${styles.dayCol} ${todayDay ? styles.today : ""}`}>
              <p className={styles.dayLabel}>{d.day}</p>
              <p className={styles.dateNum}>{d.date}</p>
              {dueTasks.map((t, i) => {
                const urgency = getUrgency(d.year, d.month, d.date);
                const s = URGENCY_STYLES[urgency];
                return (
                  <div
                    key={i}
                    className={styles.timePill}
                    style={{ background: s.bg, color: s.color, borderColor: s.border }}
                    title={t.title}
                  >
                    {urgency === "overdue" ? "Overdue" : urgency === "today" ? "Due Today" : urgency === "soon" ? "Due Soon" : "Due"}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}