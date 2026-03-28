import type { Task } from "../types/Task";
import styles from "./TaskTable.module.css";

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  Lab: { bg: "#1a1a3a", color: "#818cf8" },
  Quiz: { bg: "#1a2a1a", color: "#34d399" },
  Assignment: { bg: "#2a1a00", color: "#f59e0b" },
  Exam: { bg: "#2a1a1a", color: "#f472b6" },
};

interface TaskTableProps {
  tasks: Task[];
  onToggle: (id: number) => void;
}

export default function TaskTable({ tasks, onToggle }: TaskTableProps) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.th}>Status</th>
          <th className={styles.th}>Task Name</th>
          <th className={styles.th}>Type</th>
          <th className={styles.th}>Due Date ✦</th>
          <th className={styles.th}>Weight ✦</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => {
          const typeStyle = TYPE_COLORS[task.type] ?? TYPE_COLORS.Assignment;
          return (
            <tr key={task.id} className={styles.row}>
              <td className={styles.td}>
                <button
                  className={`${styles.checkbox} ${task.completed ? styles.checked : ""}`}
                  onClick={() => onToggle(task.id)}
                  aria-label="Toggle task"
                />
              </td>
              <td className={`${styles.td} ${styles.taskName} ${task.completed ? styles.strikethrough : ""}`}>
                {task.title}
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
                <span className={styles.dueDate}>⏱ {task.due_date}</span>
              </td>
              <td className={styles.td}>
                <span className={styles.weight}>{task.weight}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}