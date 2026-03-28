// src/components/TaskCard.tsx
import type { Task } from "../types/Task";

export default function TaskCard({ task }: { task: Task }) {
  return (
    <div style={{
      border: "1px solid #ccc",
      padding: "10px",
      marginTop: "10px",
      borderRadius: "8px"
    }}>
      <h3>{task.title}</h3>
      <p>Due: {task.due_date}</p>
    </div>
  );
}