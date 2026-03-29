import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import styles from "./Home.module.css";
import type { Task } from "../types/Task";

interface HomeProps {
  onCourseLoaded: (code: string, name: string, tasks: Task[]) => void;
}

export default function Home({ onCourseLoaded }: HomeProps) {
  const navigate = useNavigate();
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

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
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
      }));

      onCourseLoaded(
        data.course?.code || "UNKNOWN",
        data.course?.name || "Unknown Course",
        tasks
      );
      navigate("/dashboard");
    } catch {
      setError("Could not connect to backend. Make sure Flask is running on port 5001.");
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
    <div className={styles.layout}>
      <Sidebar
        courses={[]}
        activeCourseId={null}
        onSelectCourse={() => {}}
        onAddCourse={() => fileInputRef.current?.click()}
      />

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Welcome to StudHub</h1>
          <p className={styles.subheading}>Upload a syllabus and let AI do the heavy lifting</p>

          <div
            className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ""}`}
            onClick={() => !loading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className={styles.uploadIcon}>
              {loading ? <span className={styles.spinner}>⟳</span> : <span>✨</span>}
            </div>

            {loading ? (
              <>
                <h2 className={styles.uploadTitle}>Analyzing your syllabus...</h2>
                <p className={styles.uploadSub}>AI is extracting assignments, exams, and deadlines</p>
              </>
            ) : (
              <>
                <h2 className={styles.uploadTitle}>Drop your Syllabus (PDF)</h2>
                <p className={styles.uploadSub}>AI will automatically extract assignments, exams, and deadlines</p>
                <button
                  className={styles.browseBtn}
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <span>⬆</span> Browse Files
                </button>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={handleFileInput}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>
      </main>
    </div>
  );
}