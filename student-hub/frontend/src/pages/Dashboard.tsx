import { useState } from "react";
import Sidebar from "../components/Sidebar";
import WeekCalendar from "../components/WeekCalendar";
import TaskTable from "../components/TaskTable";
import type { Task } from "../types/Task";
import styles from "./Dashboard.module.css";

const initialTasks: Task[] = [
  { id: 1, title: "Lab 1: Intro to Java", type: "Lab", due_date: "Mar 28, 2026", weight: "5%", completed: false },
  { id: 2, title: "Quiz 1: Variables & Types", type: "Quiz", due_date: "Apr 2, 2026", weight: "10%", completed: false },
  { id: 3, title: "Assignment 1: Calculator", type: "Assignment", due_date: "Apr 8, 2026", weight: "15%", completed: false },
  { id: 4, title: "Midterm Exam", type: "Exam", due_date: "Apr 15, 2026", weight: "25%", completed: false },
  { id: 5, title: "Lab 2: Object-Oriented Design", type: "Lab", due_date: "Apr 18, 2026", weight: "5%", completed: false },
  { id: 6, title: "Assignment 2: Data Structures", type: "Assignment", due_date: "Apr 25, 2026", weight: "15%", completed: false },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeCourse, setActiveCourse] = useState(1);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className={styles.layout}>
      <Sidebar activeCourse={activeCourse} onSelectCourse={setActiveCourse} />

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Your Course Dashboard</h1>
          <p className={styles.subheading}>Everything you need, automatically organized</p>

          <WeekCalendar />

          <div className={styles.courseCard}>
            <div className={styles.courseHeader}>
              <div className={styles.courseInfo}>
                <span className={styles.courseIcon}>🏆</span>
                <div>
                  <h2 className={styles.courseName}>CS 301: Advanced Programming</h2>
                  <p className={styles.courseMeta}>Winter 2026 • {tasks.length} tasks extracted</p>
                </div>
              </div>
              <span className={styles.aiTag}>✦ AI-Generated</span>
            </div>

            <TaskTable tasks={tasks} onToggle={toggleTask} />
          </div>
        </div>
      </main>
    </div>
  );
}