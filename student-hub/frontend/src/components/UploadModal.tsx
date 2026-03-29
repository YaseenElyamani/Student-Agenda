import { useState, useRef } from "react";
import type { Task } from "../types/Task";
import styles from "./UploadModal.module.css";

interface UploadModalProps {
  onClose: () => void;
  onCourseLoaded: (code: string, name: string, tasks: Task[]) => void;
}

export default function UploadModal({ onClose, onCourseLoaded }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5001/parse-syllabus", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

<<<<<<< HEAD
      if (res.status === 409) {
        setError(data.error || "This course is already added.");
        setLoading(false);
        return;
    }

=======
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
<<<<<<< HEAD
    }

      // Use real task data directly from backend (includes id, course_id, due_time)
      const tasks: Task[] = (data.tasks || []).map((t: Task) => ({
        id: t.id,
        course_id: t.course_id,
        course_code: t.course_code,
        title: t.title ?? "Untitled",
        type: t.type ?? "Assignment",
        due_date: t.due_date ?? "TBD",
        due_time: t.due_time ?? null,
        weight: t.weight ?? "N/A",
        completed: t.completed ?? false,
=======
      }

      const tasks: Task[] = (data.tasks || []).map((t: Partial<Task>, i: number) => ({
        id: Date.now() + i,
        title: t.title ?? "Untitled",
        type: (t.type as Task["type"]) ?? "Assignment",
        due_date: t.due_date ?? "TBD",
        weight: t.weight ?? "N/A",
        completed: false,
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
      }));

      onCourseLoaded(
        data.course?.code || "UNKNOWN",
        data.course?.name || "Unknown Course",
        tasks
      );
    } catch {
      setError("Could not connect to backend.");
      setLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <div className={styles.uploadIcon}>
          {loading ? <span className={styles.spinner}>⟳</span> : <span>✨</span>}
        </div>

        {loading ? (
          <>
            <h2 className={styles.title}>Analyzing syllabus...</h2>
            <p className={styles.sub}>AI is extracting assignments and deadlines</p>
          </>
        ) : (
          <>
            <h2 className={styles.title}>Add a New Course</h2>
            <p className={styles.sub}>Drop your syllabus PDF to extract tasks automatically</p>

            <div
              className={`${styles.dropZone} ${dragOver ? styles.dragOver : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <span>⬆</span> Drop PDF here or click to browse
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={handleFileInput}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}