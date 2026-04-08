import { useState } from "react";
import type { Task } from "../types/Task";
import type { CourseInfo } from "../App";
import styles from "./AddTaskModal.module.css";
import { authFetch } from "../utils/authFetch";

interface AddTaskModalProps {
  courses: CourseInfo[];
  defaultCourseId?: number | null;
  onClose: () => void;
  onTaskAdded: (task: Task) => void;
}

const TASK_TYPES = ["Assignment", "Quiz", "Lab", "Exam", "Midterm", "Final Exam", "Discussion"];

export default function AddTaskModal({ courses, defaultCourseId, onClose, onTaskAdded }: AddTaskModalProps) {
  const [courseId, setCourseId] = useState<number>(
    defaultCourseId ?? courses[0]?.id ?? 0
  );
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Assignment");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!courseId) { setError("Please select a course."); return; }
    setSaving(true);
    setError(null);

    try {
      const res = await authFetch("${import.meta.env.VITE_API_URL}/add-task", {
        method: "POST",
        body: JSON.stringify({
          course_id: courseId,
          title: title.trim(),
          type,
          due_date: dueDate || "TBD",
          due_time: dueTime || null,
          weight: weight || "N/A",
        }),
      });

      if (!res.ok) { setError("Failed to add task."); setSaving(false); return; }
      const newTask = await res.json();
      onTaskAdded(newTask);
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
          <h2 className={styles.title}>Add Task</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Course</label>
          <select className={styles.input} value={courseId} onChange={e => setCourseId(Number(e.target.value))}>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Task Name</label>
          <input
            className={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Assignment 3: Normalization"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Type</label>
            <select className={styles.input} value={type} onChange={e => setType(e.target.value)}>
              {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Weight</label>
            <input className={styles.input} value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 10%" />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Due Date</label>
            <input className={styles.input} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Due Time</label>
            <input className={styles.input} type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? "Adding..." : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}