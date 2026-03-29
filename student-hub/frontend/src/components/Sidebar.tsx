import { useNavigate, useLocation } from "react-router-dom";
import type { CourseInfo } from "../App";
import styles from "./Sidebar.module.css";
import { useState } from "react";

interface SidebarProps {
  courses: CourseInfo[];
  activeCourseId: number | "all" | null;
  onSelectCourse: (id: number | "all") => void;
  onAddCourse: () => void;
  onRemoveCourse: (id: number) => void;
  completedIds?: Set<number>;
}

export default function Sidebar({ courses, activeCourseId, onSelectCourse, onAddCourse, onRemoveCourse, completedIds }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredCourseId, setHoveredCourseId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const courseToDelete = courses.find(c => c.id === confirmDeleteId);

  const totalTasks = courses.reduce((acc, c) => acc + c.tasks.length, 0);
  const completedCount = completedIds
    ? courses.reduce((acc, c) => acc + c.tasks.filter(t => completedIds.has(t.id)).length, 0)
    : courses.reduce((acc, c) => acc + c.tasks.filter(t => t.completed).length, 0);
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>

      {confirmDeleteId !== null && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <p className={styles.confirmText}>
              Remove <strong>{courseToDelete?.code}</strong>?
            </p>
            <p className={styles.confirmSub}>This will delete all tasks for this course.</p>
            <div className={styles.confirmBtns}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button
                className={styles.removeBtn}
                onClick={() => { onRemoveCourse(confirmDeleteId); setConfirmDeleteId(null); }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.logo} onClick={() => navigate("/")}>
        <span className={styles.logoIcon}>✦</span>
        {!collapsed && <span className={styles.logoText}>StudHub</span>}
        <span
          className={styles.collapseBtn}
          onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
        >
          {collapsed ? "›" : "‹"}
        </span>
      </div>

      {!collapsed && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>NAVIGATION</p>
          <div
            className={`${styles.quickItem} ${location.pathname === "/dashboard" ? styles.active : ""}`}
            onClick={() => { onSelectCourse("all"); navigate("/dashboard"); }}
          >
            <span>🏠</span> Dashboard
          </div>
          <div
            className={`${styles.quickItem} ${location.pathname === "/calendar" ? styles.active : ""}`}
            onClick={() => navigate("/calendar")}
          >
            <span>📅</span> Unified Calendar
          </div>
          <div className={styles.quickItem}>
            <span>🗂</span> Resource Vault
          </div>
        </div>
      )}

      {!collapsed && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>ACTIVE COURSES</p>
          {courses.map((course) => (
            <div
              key={course.id}
              className={`${styles.courseItem} ${activeCourseId === course.id ? styles.active : ""}`}
              onMouseEnter={() => setHoveredCourseId(course.id)}
              onMouseLeave={() => setHoveredCourseId(null)}
              onClick={() => { onSelectCourse(course.id); navigate("/dashboard"); }}
            >
              <span className={styles.dot} style={{ background: course.color }} />
              <span className={styles.courseCode}>{course.code}</span>
              {hoveredCourseId === course.id && (
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(course.id); }}
                  title="Remove course"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button className={styles.addCourse} onClick={onAddCourse}>
            <span>+</span> Add Course
          </button>
        </div>
      )}

      {collapsed && (
        <div className={styles.collapsedCourses}>
          {courses.map((course) => (
            <div
              key={course.id}
              className={styles.collapsedDot}
              title={course.code}
              onClick={() => { onSelectCourse(course.id); navigate("/dashboard"); }}
            >
              <span className={styles.dot} style={{ background: course.color }} />
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        {!collapsed ? (
          <>
            <p className={styles.footerLabel}>Tasks Due</p>
            <div className={styles.footerCount}>{totalTasks - completedCount}</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
            <p className={styles.footerSub}>{completedCount} of {totalTasks} completed</p>
          </>
        ) : (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}