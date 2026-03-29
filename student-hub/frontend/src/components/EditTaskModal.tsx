import { useState } from "react";
import type { Task } from "../types/Task";
import styles from "./EditTaskModal.module.css";

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updated: Task) => void;
}

const TASK_TYPES = ["Assignment", "Quiz", "Lab", "Exam", "Midterm", "Final Exam"];

export default function EditTaskModal({ task, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [type, setType] = useState(task.type);
  const [dueDate, setDueDate] = useState(task.due_date === "TBD" ? "" : task.due_date);
  const [dueTime, setDueTime] = useState(
    task.due_time && task.due_time !== "null" ? task.due_time : ""
  );
  const [weight, setWeight] = useState(task.weight === "N/A" ? "" : task.weight);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:5001/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          due_date: dueDate || "TBD",
          due_time: dueTime || null,
          weight: weight || "N/A",
        }),
      });

      if (!res.ok) {
        setError("Failed to save changes.");
        setSaving(false);
        return;
      }

      const updated = await res.json();
      onSave(updated);
      onClose();
    } catch {
      setError("Could not connect to backend.");
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit Task</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Task Name</label>
          <input
            className={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task name"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Type</label>
            <select
              className={styles.input}
              value={type}
              onChange={e => setType(e.target.value as Task["type"])}
            >
              {TASK_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Weight</label>
            <input
              className={styles.input}
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="e.g. 10%"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Due Date</label>
            <input
              className={styles.input}
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Due Time</label>
            <input
              className={styles.input}
              type="time"
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
            />
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}