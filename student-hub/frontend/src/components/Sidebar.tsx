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
  onLogout: () => void;
  isGuest?: boolean;
}

export default function Sidebar({ courses, activeCourseId, onSelectCourse, onAddCourse, onRemoveCourse, completedIds, onLogout, isGuest }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const handleNavClick = (path: string, courseId?: number | "all") => {
    if (courseId !== undefined) onSelectCourse(courseId);
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(true)}
      >
        ☰
      </button>

      {mobileOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}>

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
            onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); setMobileOpen(false); }}
          >
            {collapsed ? "›" : "‹"}
          </span>
        </div>

        {!collapsed && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>NAVIGATION</p>
            <div
              className={`${styles.quickItem} ${location.pathname === "/dashboard" ? styles.active : ""}`}
              onClick={() => handleNavClick("/dashboard", "all")}
            >
              <span>🏠</span> Dashboard
            </div>
            <div
              className={`${styles.quickItem} ${location.pathname === "/calendar" ? styles.active : ""}`}
              onClick={() => handleNavClick("/calendar")}
            >
              <span>📅</span> Unified Calendar
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
                onClick={() => handleNavClick("/dashboard", course.id)}
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
                onClick={() => handleNavClick("/dashboard", course.id)}
              >
                <span className={styles.dot} style={{ background: course.color }} />
              </div>
            ))}
          </div>
        )}

        <div className={styles.bottomSection}>
          {!collapsed && (
            <a
              href="https://github.com/YaseenElyamani/Student-Agenda"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>
          )}

          <div className={styles.footer}>
            {!collapsed ? (
              <>
                {isGuest && (
                  <div className={styles.guestBanner}>
                    👤 Guest Mode
                    <span className={styles.guestSub}>Data won't be saved</span>
                  </div>
                )}
                <p className={styles.footerLabel}>Tasks Due</p>
                <div className={styles.footerCount}>{totalTasks - completedCount}</div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                </div>
                <p className={styles.footerSub}>{completedCount} of {totalTasks} completed</p>
                <button className={styles.logoutBtn} onClick={onLogout}>
                  {isGuest ? "Exit Guest Mode" : "Sign Out"}
                </button>
              </>
            ) : (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}