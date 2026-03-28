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
  activeCourseId: number | null;
  onSelectCourse: (id: number) => void;
  onCourseLoaded: (code: string, name: string, tasks: Task[]) => void;
}

export default function Dashboard({
  courses,
  activeCourse,
  activeCourseId,
  onSelectCourse,
  onCourseLoaded,
}: DashboardProps) {
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);

  const baseTasks = activeCourse?.tasks ?? [];
  const tasks = baseTasks.map(t => ({ ...t, completed: completedIds.has(t.id) }));
  const completedCount = completedIds.size;

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

  const courseLabel = activeCourse
    ? `${activeCourse.code}: ${activeCourse.name}`
    : "No course loaded";

  return (
    <div className={styles.layout}>
      <Sidebar
        courses={courses}
        activeCourseId={activeCourseId}
        onSelectCourse={onSelectCourse}
        onAddCourse={() => setShowModal(true)}
      />

      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onCourseLoaded={handleCourseLoaded}
        />
      )}

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Your Course Dashboard</h1>
          <p className={styles.subheading}>Everything you need, automatically organized</p>

          <WeekCalendar tasks={tasks} />

          <div className={styles.courseCard}>
            <div className={styles.courseHeader}>
              <div className={styles.courseInfo}>
                <span className={styles.courseIcon}>🏆</span>
                <div>
                  <h2 className={styles.courseName}>{courseLabel}</h2>
                  <p className={styles.courseMeta}>
                    Winter 2026 • {tasks.length} tasks extracted • {completedCount} completed
                  </p>
                </div>
              </div>
              {activeCourse && <span className={styles.aiTag}>✦ AI-Generated</span>}
            </div>

            {tasks.length > 0
              ? <TaskTable tasks={tasks} onToggle={toggleTask} />
              : <p className={styles.empty}>Upload a syllabus to get started.</p>
            }
          </div>
        </div>
      </main>
    </div>
  );
}