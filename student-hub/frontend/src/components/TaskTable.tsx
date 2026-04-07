import { useState } from "react";
import type { Task } from "../types/Task";
import styles from "./TaskTable.module.css";
import EditTaskModal from "./EditTaskModal";

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  Lab:        { bg: "#1a1a3a", color: "#818cf8" },
  Quiz:       { bg: "#1a2a1a", color: "#34d399" },
  Assignment: { bg: "#2a1a00", color: "#f59e0b" },
  Exam:       { bg: "#2a1a1a", color: "#f472b6" },
  Midterm:    { bg: "#2a1a1a", color: "#f472b6" },
  "Final Exam": { bg: "#2a1a1a", color: "#f472b6" },
  Discussion: { bg: "#0e2a2a", color: "#22d3ee" },
};

function formatDueDate(due_date: string, due_time?: string | null): string {
  if (!due_date || due_date === "TBD") return "TBD";
  const [year, month, day] = due_date.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (due_time && due_time !== "null" && due_time.includes(":")) {
    const [h, m] = due_time.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 || 12;
      return `${dateStr} at ${hour}:${String(m).padStart(2, "0")} ${ampm}`;
    }
  }
  return dateStr;
}

function isOverdue(due_date: string, due_time?: string | null): boolean {
  if (!due_date || due_date === "TBD") return false;
  const [year, month, day] = due_date.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  if (due_time && due_time !== "null" && due_time.includes(":")) {
    const [h, m] = due_time.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      due.setHours(h, m, 0, 0);
    } else {
      due.setHours(23, 59, 59, 999);
    }
  } else {
    due.setHours(23, 59, 59, 999);
  }
  return due < new Date();
}

interface TaskTableProps {
  tasks: Task[];
  onToggle: (id: number) => void;
  onTaskUpdated: (updated: Task) => void;
  onTaskDeleted: (id: number) => void;
  editMode?: boolean;
}

export default function TaskTable({ tasks, onToggle, onTaskUpdated, onTaskDeleted, editMode }: TaskTableProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const allCompleted = tasks.length > 0 && tasks.every(t => t.completed);

  const handleToggleAll = () => {
    tasks.forEach(t => {
      if (allCompleted ? t.completed : !t.completed) {
        onToggle(t.id);
      }
    });
  };

  return (
    <>
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(updated) => { onTaskUpdated(updated); setEditingTask(null); }}
          onDelete={(id) => { onTaskDeleted(id); setEditingTask(null); }}
        />
      )}

      {/* Desktop table */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th} style={{ width: "40px" }}>
              <button
                className={`${styles.checkbox} ${allCompleted ? styles.checked : ""}`}
                onClick={handleToggleAll}
                aria-label="Toggle all tasks"
              />
            </th>
            <th className={styles.th}>Task Name</th>
            <th className={styles.th}>Type</th>
            <th className={styles.th}>Due Date ✦</th>
            <th className={styles.th}>Weight ✦</th>
            {editMode && <th className={styles.th}></th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const typeStyle = TYPE_COLORS[task.type] ?? TYPE_COLORS.Assignment;
            const overdue = !task.completed && isOverdue(task.due_date, task.due_time);
            const strike = task.completed || overdue;
            return (
              <tr
                key={task.id}
                className={`${styles.row} ${overdue ? styles.overdueRow : ""} ${task.completed ? styles.completedRow : ""}`}
              >
                <td className={styles.td}>
                  <button
                    className={`${styles.checkbox} ${task.completed ? styles.checked : ""}`}
                    onClick={() => onToggle(task.id)}
                    aria-label="Toggle task"
                  />
                </td>
                <td className={`${styles.td} ${styles.taskName} ${strike ? styles.strikethrough : ""}`}>
                  {task.title}
                  {overdue && !task.completed && (
                    <span className={styles.overdueTag}>Overdue</span>
                  )}
                  {task.completed && (
                    <span className={styles.completedTag}>Complete</span>
                  )}
                </td>
                <td className={styles.td}>
                  <span
                    className={styles.badge}
                    style={{ background: typeStyle.bg, color: typeStyle.color, borderColor: typeStyle.color }}
                  >
                    {task.type}
                  </span>
                </td>
                <td className={styles.td}>
                  <span className={`${styles.dueDate} ${overdue && !task.completed ? styles.overdueDate : ""} ${task.completed ? styles.completedDate : ""}`}>
                    ⏱ {formatDueDate(task.due_date, task.due_time)}
                  </span>
                </td>
                <td className={styles.td}>
                  <span className={styles.weight}>{task.weight}</span>
                </td>
                {editMode && (
                  <td className={styles.td}>
                    <button
                      className={styles.editBtn}
                      onClick={() => setEditingTask(task)}
                    >
                      ✎ Edit
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className={styles.mobileCards}>
        <div className={styles.mobileSelectAll}>
          <button
            className={`${styles.checkbox} ${allCompleted ? styles.checked : ""}`}
            onClick={handleToggleAll}
            aria-label="Toggle all tasks"
          />
          <span className={styles.mobileSelectLabel}>Select All</span>
        </div>
        {tasks.map((task) => {
          const typeStyle = TYPE_COLORS[task.type] ?? TYPE_COLORS.Assignment;
          const overdue = !task.completed && isOverdue(task.due_date, task.due_time);
          const strike = task.completed || overdue;
          return (
            <div
              key={task.id}
              className={`${styles.mobileCard} ${overdue ? styles.mobileCardOverdue : ""} ${task.completed ? styles.mobileCardCompleted : ""}`}
              style={{ borderLeftColor: overdue ? "#ef4444" : task.completed ? "#34d399" : typeStyle.color }}
            >
              <div className={styles.mobileCardTop}>
                <button
                  className={`${styles.checkbox} ${task.completed ? styles.checked : ""}`}
                  onClick={() => onToggle(task.id)}
                  aria-label="Toggle task"
                />
                <div className={styles.mobileCardInfo}>
                  <p className={`${styles.mobileCardTitle} ${strike ? styles.strikethrough : ""}`}>
                    {task.title}
                  </p>
                  <div className={styles.mobileCardMeta}>
                    <span
                      className={styles.badge}
                      style={{ background: typeStyle.bg, color: typeStyle.color, borderColor: typeStyle.color }}
                    >
                      {task.type}
                    </span>
                    {overdue && !task.completed && (
                      <span className={styles.overdueTag}>Overdue</span>
                    )}
                    {task.completed && (
                      <span className={styles.completedTag}>Complete</span>
                    )}
                  </div>
                </div>
                {editMode && (
                  <button
                    className={styles.editBtn}
                    onClick={() => setEditingTask(task)}
                  >
                    ✎
                  </button>
                )}
              </div>
              <div className={styles.mobileCardBottom}>
                <span className={`${styles.dueDate} ${overdue && !task.completed ? styles.overdueDate : ""} ${task.completed ? styles.completedDate : ""}`}>
                  ⏱ {formatDueDate(task.due_date, task.due_time)}
                </span>
                <span className={styles.weight}>{task.weight}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}