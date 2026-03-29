import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import UploadModal from "../components/UploadModal";
import type { CourseInfo } from "../App";
import type { Task } from "../types/Task";
import styles from "./Calendar.module.css";

interface CalendarProps {
  courses: CourseInfo[];
  activeCourseId: number | null;
<<<<<<< HEAD
  onSelectCourse: (id: number | "all") => void;
  onAddCourse: () => void;
  onCourseLoaded: (code: string, name: string, tasks: Task[]) => void;
  onRemoveCourse: (id: number) => void;
=======
  onSelectCourse: (id: number) => void;
  onAddCourse: () => void;
  onCourseLoaded: (code: string, name: string, tasks: Task[]) => void;
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

<<<<<<< HEAD
function formatTime(due_time?: string | null): string {
  if (!due_time || due_time === "null" || !due_time.includes(":")) return "";
  const [h, m] = due_time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "";
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

=======
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const SHORT_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

<<<<<<< HEAD
export default function Calendar({ courses, activeCourseId, onSelectCourse, onCourseLoaded, onRemoveCourse }: CalendarProps) {
=======
export default function Calendar({ courses, activeCourseId, onSelectCourse, onCourseLoaded }: CalendarProps) {
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [filterCourseId, setFilterCourseId] = useState<number | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const filteredCourses = filterCourseId === "all"
    ? courses
    : courses.filter(c => c.id === filterCourseId);

  const allTasks = filteredCourses.flatMap(c =>
    c.tasks.map(t => ({ ...t, courseCode: c.code, courseColor: c.color }))
  );

  const getTasksForDay = (day: number) =>
    allTasks.filter(t => {
      if (!t.due_date || t.due_date === "TBD") return false;
      const d = parseLocalDate(t.due_date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === day;
    });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
<<<<<<< HEAD
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
=======
  const firstDayOfMonth = (() => {
    const day = new Date(currentYear, currentMonth, 1).getDay();
    return (day + 6) % 7; // Monday = 0
  })();

>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
  const cells = Array(firstDayOfMonth).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

<<<<<<< HEAD
=======
  // Upcoming tasks sorted by date
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
  const upcomingTasks = allTasks
    .filter(t => {
      if (!t.due_date || t.due_date === "TBD") return false;
      return parseLocalDate(t.due_date) >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
    })
    .sort((a, b) => parseLocalDate(a.due_date).getTime() - parseLocalDate(b.due_date).getTime())
    .slice(0, 8);

  const handleCourseLoaded = (code: string, name: string, tasks: Task[]) => {
    onCourseLoaded(code, name, tasks);
    setShowModal(false);
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        courses={courses}
        activeCourseId={activeCourseId}
        onSelectCourse={(id) => { onSelectCourse(id); navigate("/dashboard"); }}
        onAddCourse={() => setShowModal(true)}
<<<<<<< HEAD
        onRemoveCourse={onRemoveCourse}
=======
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
      />

      {showModal && (
        <UploadModal onClose={() => setShowModal(false)} onCourseLoaded={handleCourseLoaded} />
      )}

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Unified Calendar</h1>
          <p className={styles.subheading}>View all your assignments and deadlines</p>

<<<<<<< HEAD
=======
          {/* Course Filter */}
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>⚙ Filter by course:</span>
            <button
              className={`${styles.filterBtn} ${filterCourseId === "all" ? styles.filterActive : ""}`}
              onClick={() => setFilterCourseId("all")}
            >
              All Courses
            </button>
            {courses.map(c => (
              <button
                key={c.id}
                className={`${styles.filterBtn} ${filterCourseId === c.id ? styles.filterActive : ""}`}
                style={filterCourseId === c.id ? { background: c.color, borderColor: c.color } : { borderColor: c.color }}
                onClick={() => setFilterCourseId(c.id)}
              >
                <span className={styles.filterDot} style={{ background: c.color }} />
                {c.code}
              </button>
            ))}
          </div>

<<<<<<< HEAD
=======
          {/* Calendar */}
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
          <div className={styles.calendarCard}>
            <div className={styles.calendarHeader}>
              <h2 className={styles.monthTitle}>{MONTH_NAMES[currentMonth]} {currentYear}</h2>
              <div className={styles.navBtns}>
                <button className={styles.navBtn} onClick={prevMonth}>‹</button>
                <button className={styles.navBtn} onClick={nextMonth}>›</button>
              </div>
            </div>

            <div className={styles.calendarGrid}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className={styles.weekdayHeader}>{d}</div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className={styles.emptyCell} />;
                const dayTasks = getTasksForDay(day);
                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                return (
                  <div key={day} className={`${styles.dayCell} ${isToday ? styles.todayCell : ""}`}>
                    <span className={`${styles.dayNum} ${isToday ? styles.todayNum : ""}`}>{day}</span>
                    {dayTasks.map((t, idx) => (
                      <div
                        key={idx}
                        className={styles.taskChip}
                        style={{ background: t.courseColor + "33", borderLeft: `3px solid ${t.courseColor}`, color: "#e5e7eb" }}
                        title={t.title}
                      >
                        <span className={styles.chipTitle}>{t.title}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

<<<<<<< HEAD
=======
          {/* Upcoming Assignments */}
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
          <div className={styles.upcomingCard}>
            <h2 className={styles.upcomingTitle}>Upcoming Assignments</h2>
            {upcomingTasks.length === 0 ? (
              <p className={styles.empty}>No upcoming tasks found.</p>
            ) : (
              upcomingTasks.map((t, i) => {
                const due = parseLocalDate(t.due_date);
                const dateLabel = `${SHORT_MONTH_NAMES[due.getMonth()]} ${due.getDate()}`;
<<<<<<< HEAD
                const timeLabel = formatTime(t.due_time);
=======
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
                return (
                  <div key={i} className={styles.upcomingItem}>
                    <div className={styles.upcomingBar} style={{ background: t.courseColor }} />
                    <div className={styles.upcomingInfo}>
                      <p className={styles.upcomingName}>{t.title}</p>
<<<<<<< HEAD
                      <p className={styles.upcomingMeta}>
                        {t.courseCode} • {dateLabel}
                        {timeLabel && (
                          <span style={{ color: "#7c6fcd", fontWeight: 600 }}> • {timeLabel}</span>
                        )}
                      </p>
=======
                      <p className={styles.upcomingMeta}>{t.courseCode} • {dateLabel}</p>
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
                    </div>
                    <div className={styles.upcomingRight}>
                      <span className={styles.upcomingWeight}>{t.weight}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}