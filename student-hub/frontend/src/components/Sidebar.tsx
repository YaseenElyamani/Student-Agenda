import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Course } from "../types/Task";
import styles from "./Sidebar.module.css";

const COURSE_COLORS = ["#7c6fcd", "#a78bfa", "#f472b6"];

const defaultCourses: Course[] = [
  { id: 1, name: "CS 301", color: COURSE_COLORS[0], semester: "Winter 2026", tasks: [] },
  { id: 2, name: "MATH 205", color: COURSE_COLORS[1], semester: "Winter 2026", tasks: [] },
  { id: 3, name: "PHYS 102", color: COURSE_COLORS[2], semester: "Winter 2026", tasks: [] },
];

interface SidebarProps {
  activeCourse?: number;
  onSelectCourse?: (id: number) => void;
}

export default function Sidebar({ activeCourse, onSelectCourse }: SidebarProps) {
  const [courses, setCourses] = useState<Course[]>(defaultCourses);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleAddCourse = () => {
    const name = prompt("Enter course name (e.g. CS 401):");
    if (!name) return;
    const newCourse: Course = {
      id: courses.length + 1,
      name,
      color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
      semester: "Winter 2026",
      tasks: [],
    };
    setCourses([...courses, newCourse]);
  };

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      {/* Logo / Header */}
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

      {/* Active Courses — expanded */}
      {!collapsed && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>ACTIVE COURSES</p>
          {courses.map((course) => (
            <div
              key={course.id}
              className={`${styles.courseItem} ${activeCourse === course.id ? styles.active : ""}`}
              onClick={() => {
                onSelectCourse?.(course.id);
                navigate("/dashboard");
              }}
            >
              <span className={styles.dot} style={{ background: course.color }} />
              {course.name}
            </div>
          ))}
          <button className={styles.addCourse} onClick={handleAddCourse}>
            <span>+</span> Add Course
          </button>
        </div>
      )}

      {/* Active Courses — collapsed (just dots) */}
      {collapsed && (
        <div className={styles.collapsedCourses}>
          {courses.map((course) => (
            <div
              key={course.id}
              className={styles.collapsedDot}
              title={course.name}
              onClick={() => {
                onSelectCourse?.(course.id);
                navigate("/dashboard");
              }}
            >
              <span className={styles.dot} style={{ background: course.color }} />
            </div>
          ))}
        </div>
      )}

      {/* Quick Access */}
      {!collapsed && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>QUICK ACCESS</p>
          <div className={styles.quickItem}>
            <span>📅</span> Unified Calendar
          </div>
          <div className={styles.quickItem}>
            <span>🗂</span> Resource Vault
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        {!collapsed ? (
          <>
            <p className={styles.footerLabel}>Tasks Due</p>
            <div className={styles.footerCount}>8</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: "37.5%" }} />
            </div>
            <p className={styles.footerSub}>3 of 8 completed</p>
          </>
        ) : (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: "37.5%" }} />
          </div>
        )}
      </div>
    </div>
  );
}