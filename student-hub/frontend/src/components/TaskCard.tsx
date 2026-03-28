// src/components/TaskCard.tsx
import type { Task } from "../types/Task";

export default function TaskCard({ task }: { task: Task }) {
  return (
    <div style={{
      background: "#fff",
      padding: "15px",
      borderRadius: "10px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>{task.title}</h3>
      <p style={{ color: "#888", fontSize: "14px" }}>Due: {task.due_date}</p>
      <p style={{ color: task.completed ? "green" : "red", fontSize: "14px" }}>
        {task.completed ? "Completed" : "Pending"}
      </p>
    </div>
  );
}