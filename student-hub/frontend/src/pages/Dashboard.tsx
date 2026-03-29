import { useState } from "react";
import Sidebar from "../components/Sidebar";
import WeekCalendar from "../components/WeekCalendar";
import TaskTable from "../components/TaskTable";
import UploadModal from "../components/UploadModal";
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
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatTime(due_time?: string | null): string {
  if (!due_time || due_time === "null" || !due_time.includes(":")) return "";
  const [h, m] = due_time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "";
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
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
};

export default function Dashboard({
  courses,
  activeCourseId,
  onSelectCourse,
  onCourseLoaded,
  onRemoveCourse,
}: DashboardProps) {
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);

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

  const upcomingTasks = (activeCourseId === "all" ? allTasks : allTasks.filter(t => t.course_id === activeCourseId))
    .filter(t => {
      if (!t.due_date || t.due_date === "TBD") return false;
      const d = parseLocalDate(t.due_date);
      return d >= today && d <= in7Days && !completedIds.has(t.id);
    })
    .sort((a, b) => parseLocalDate(a.due_date).getTime() - parseLocalDate(b.due_date).getTime());

  const toggleTask = (id: number) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
      />

      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onCourseLoaded={handleCourseLoaded}
        />
      )}

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Dashboard</h1>
          <p className={styles.subheading}>Everything you need, automatically organized</p>

          <WeekCalendar tasks={allTasks} />

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
              {activeCourseId !== "all" && (
                <button
                  className={styles.showAllBtn}
                  onClick={() => onSelectCourse("all")}
                >
                  Show All Courses
                </button>
              )}
            </div>

            {filteredTasks.length > 0
              ? <TaskTable tasks={filteredTasks} onToggle={toggleTask} />
              : <p className={styles.empty}>
                  {courses.length === 0 ? "Upload a syllabus to get started." : "No tasks for this course."}
                </p>
            }
          </div>
        </div>
      </main>
    </div>
  );
}