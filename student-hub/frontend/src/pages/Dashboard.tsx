import { useState } from "react";
import Sidebar from "../components/Sidebar";
import WeekCalendar from "../components/WeekCalendar";
import TaskTable from "../components/TaskTable";
import UploadModal from "../components/UploadModal";
import AddTaskModal from "../components/AddTaskModal";
import type { Task } from "../types/Task";
import type { CourseInfo } from "../App";
import styles from "./Dashboard.module.css";

interface DashboardProps {
  courses: CourseInfo[];
  activeCourse: CourseInfo | null;
  activeCourseId: number | "all";
  onSelectCourse: (id: number | "all") => void;
  onCourseLoaded: (code: string, name: string, tasks: Task[]) => void;
  onRemoveCourse: (id: number) => void;
  completedIds: Set<number>;
  onToggleTask: (id: number) => void;
  onTaskUpdated: (updated: Task) => void;
  onTaskDeleted: (id: number) => void;
  onTaskAdded: (task: Task) => void;
  onLogout: () => void;
  isGuest?: boolean;
  token: string | null;
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatTime(due_time?: string | null): string {
  if (!due_time || due_time === "null") return "";
  if (due_time.toLowerCase().includes("am") || due_time.toLowerCase().includes("pm")) {
    return due_time.trim();
  }
  if (due_time.includes(":")) {
    const [h, m] = due_time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return "";
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  }
  return "";
}

function exportToICS(courses: CourseInfo[]) {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudHub//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  courses.forEach(course => {
    course.tasks.forEach(task => {
      if (!task.due_date || task.due_date === "TBD") return;
      const [year, month, day] = task.due_date.split("-").map(Number);
      const pad = (n: number) => String(n).padStart(2, "0");
      let dtstart: string;
      let dtend: string;

      if (task.due_time && task.due_time !== "null" && task.due_time.includes(":")) {
        const [h, m] = task.due_time.split(":").map(Number);
        const dateStr = `${year}${pad(month)}${pad(day)}T${pad(h)}${pad(m)}00`;
        dtstart = `DTSTART:${dateStr}`;
        const endH = h + 1 >= 24 ? 23 : h + 1;
        dtend = `DTEND:${year}${pad(month)}${pad(day)}T${pad(endH)}${pad(m)}00`;
      } else {
        dtstart = `DTSTART;VALUE=DATE:${year}${pad(month)}${pad(day)}`;
        dtend = `DTEND;VALUE=DATE:${year}${pad(month)}${pad(day)}`;
      }

      lines.push(
        "BEGIN:VEVENT",
        `UID:task-${task.id}-${course.code}@studhub`,
        dtstart,
        dtend,
        `SUMMARY:${course.code}: ${task.title}`,
        `DESCRIPTION:Type: ${task.type} | Weight: ${task.weight}`,
        "END:VEVENT"
      );
    });
  });

  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "studhub-schedule.ics";
  a.click();
  URL.revokeObjectURL(url);
}

const SHORT_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TYPE_COLORS: Record<string, string> = {
  Lab: "#818cf8",
  Quiz: "#34d399",
  Assignment: "#f59e0b",
  Exam: "#f472b6",
  Midterm: "#f472b6",
  "Final Exam": "#f472b6",
  Discussion: "#22d3ee",
};

export default function Dashboard({
  courses,
  activeCourseId,
  onSelectCourse,
  onCourseLoaded,
  onRemoveCourse,
  completedIds,
  onToggleTask,
  onTaskUpdated,
  onTaskDeleted,
  onTaskAdded,
  onLogout,
  isGuest,
}: DashboardProps) {
  const [showModal, setShowModal] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const allTasks = courses.flatMap(c =>
    c.tasks.map(t => ({ ...t, courseCode: c.code, courseColor: c.color }))
  );

  const filteredTasks = (activeCourseId === "all"
    ? allTasks
    : allTasks.filter(t => t.course_id === activeCourseId)
  ).map(t => ({ ...t, completed: completedIds.has(t.id) }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);

  const upcomingTasks = (activeCourseId === "all"
    ? allTasks
    : allTasks.filter(t => t.course_id === activeCourseId))
    .filter(t => {
      if (!t.due_date || t.due_date === "TBD") return false;
      const d = parseLocalDate(t.due_date);
      return d >= today && d <= in7Days && !completedIds.has(t.id);
    })
    .sort((a, b) => parseLocalDate(a.due_date).getTime() - parseLocalDate(b.due_date).getTime());

  const handleCourseLoaded = (code: string, name: string, tasks: Task[]) => {
    onCourseLoaded(code, name, tasks);
    setShowModal(false);
  };

  const completedCount = completedIds.size;
  const totalCount = filteredTasks.length;

  return (
    <div className={styles.layout}>
      <Sidebar
        courses={courses}
        activeCourseId={activeCourseId === "all" ? null : activeCourseId}
        onSelectCourse={onSelectCourse}
        onAddCourse={() => setShowModal(true)}
        onRemoveCourse={onRemoveCourse}
        completedIds={completedIds}
        onLogout={onLogout}
        isGuest={isGuest}
      />

      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onCourseLoaded={handleCourseLoaded}
        />
      )}

      {showAddTask && (
        <AddTaskModal
          courses={courses}
          defaultCourseId={activeCourseId === "all" ? null : activeCourseId}
          onClose={() => setShowAddTask(false)}
          onTaskAdded={onTaskAdded}
        />
      )}

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Dashboard</h1>
          <p className={styles.subheading}>Everything you need, automatically organized</p>

          <WeekCalendar tasks={allTasks.map(t => ({ ...t, completed: completedIds.has(t.id) }))} />

          {upcomingTasks.length > 0 && (
            <div className={styles.upcomingCard}>
              <div className={styles.upcomingHeader}>
                <h2 className={styles.sectionTitle}>⚡ Due This Week</h2>
                <span className={styles.upcomingCount}>{upcomingTasks.length} tasks</span>
              </div>
              <div className={styles.upcomingList}>
                {upcomingTasks.map((t, i) => {
                  const due = parseLocalDate(t.due_date);
                  const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const dateLabel = `${SHORT_MONTH_NAMES[due.getMonth()]} ${due.getDate()}`;
                  const timeLabel = formatTime(t.due_time);
                  const urgentColor = daysLeft === 0 ? "#f59e0b" : daysLeft <= 2 ? "#ef4444" : "#34d399";
                  return (
                    <div key={i} className={styles.upcomingItem}>
                      <div className={styles.upcomingBar} style={{ background: t.courseColor }} />
                      <div className={styles.upcomingInfo}>
                        <p className={styles.upcomingName}>{t.title}</p>
                        <p className={styles.upcomingMeta}>
                          {t.courseCode} • {dateLabel}
                          {timeLabel && (
                            <span className={styles.upcomingTime}> • {timeLabel}</span>
                          )}
                        </p>
                      </div>
                      <span className={styles.daysLeft} style={{ color: urgentColor }}>
                        {daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                      </span>
                      <span
                        className={styles.typeTag}
                        style={{
                          color: TYPE_COLORS[t.type] ?? "#9ca3af",
                          background: (TYPE_COLORS[t.type] ?? "#9ca3af") + "22"
                        }}
                      >
                        {t.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.courseCard}>
            <div className={styles.courseHeader}>
              <div className={styles.courseInfo}>
                <span className={styles.courseIcon}>📋</span>
                <div>
                  <h2 className={styles.courseName}>
                    {activeCourseId === "all"
                      ? "All Tasks"
                      : courses.find(c => c.id === activeCourseId)?.code + " Tasks"}
                  </h2>
                  <p className={styles.courseMeta}>
                    {totalCount} tasks • {completedCount} completed
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <button
                  className={styles.exportBtn}
                  onClick={() => exportToICS(courses)}
                  title="Export to Google Calendar / Apple Calendar"
                >
                  📅 Export Calendar
                </button>
                <button
                  className={styles.addTaskBtn}
                  onClick={() => setShowAddTask(true)}
                >
                  + Add Task
                </button>
                <button
                  className={editMode ? styles.editModeActiveBtn : styles.editModeBtn}
                  onClick={() => setEditMode(e => !e)}
                >
                  {editMode ? "✓ Done" : "✎ Edit Tasks"}
                </button>
                {activeCourseId !== "all" && (
                  <button
                    className={styles.showAllBtn}
                    onClick={() => onSelectCourse("all")}
                  >
                    Show All Courses
                  </button>
                )}
              </div>
            </div>

            <div className={styles.filterRow}>
              {courses.map(c => (
                <button
                  key={c.id}
                  className={`${styles.filterBtn} ${activeCourseId === c.id ? styles.filterActive : ""}`}
                  style={activeCourseId === c.id
                    ? { background: c.color + "33", borderColor: c.color, color: c.color }
                    : { borderColor: c.color + "66", color: c.color }
                  }
                  onClick={() => onSelectCourse(c.id)}
                >
                  <span className={styles.filterDot} style={{ background: c.color }} />
                  {c.code}
                </button>
              ))}
            </div>

            {filteredTasks.length > 0
              ? <TaskTable
                  tasks={filteredTasks}
                  onToggle={onToggleTask}
                  onTaskUpdated={onTaskUpdated}
                  onTaskDeleted={onTaskDeleted}
                  editMode={editMode}
                />
              : <p className={styles.empty}>
                  {courses.length === 0 ? "Upload a syllabus to get started." : "No tasks for this course."}
                </p>
            }
          </div>

                  {/* Mobile upcoming deadline */}
        {upcomingTasks.length > 0 && (
          <div className={styles.mobileDeadlineCard}>
            <p className={styles.mobileDeadlineLabel}>Upcoming Deadline</p>
            <p className={styles.mobileDeadlineDate}>
              {SHORT_MONTH_NAMES[parseLocalDate(upcomingTasks[0].due_date).getMonth()]} {parseLocalDate(upcomingTasks[0].due_date).getDate()}
            </p>
            <p className={styles.mobileDeadlineTask}>{upcomingTasks[0].title}</p>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}