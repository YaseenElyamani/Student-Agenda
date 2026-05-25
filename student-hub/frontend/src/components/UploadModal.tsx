import { useState, useRef } from "react";
import type { Task } from "../types/Task";
import type { RawLecture } from "../types/Lecture";
import TermSelect from "./TermSelect";
import type { Term } from "./TermSelect";
import styles from "./UploadModal.module.css";

interface UploadModalProps {
  onClose: () => void;
  onCourseLoaded: (code: string, name: string, tasks: Task[], rawLectures?: RawLecture[]) => void;
}

function getFriendlyError(status: number, serverMessage?: string): string {
  if (serverMessage?.includes("already exists") || status === 409) {
    return "This course is already in your dashboard.";
  }
  if (status === 401) {
    return "Your session expired. Please sign in again.";
  }
  if (status === 429) {
    return "Too many requests — please wait a moment and try again.";
  }
  if (status === 500) {
    if (serverMessage?.toLowerCase().includes("quota")) {
      return "AI service is temporarily unavailable. Please try again in a few minutes.";
    }
    if (serverMessage?.toLowerCase().includes("json")) {
      return "The AI couldn't read this syllabus properly. Try a clearer PDF.";
    }
    return "Something went wrong on our end. Please try again.";
  }
  if (status === 0) {
    return "Could not connect to the server. Make sure the backend is running.";
  }
  return serverMessage || "Something went wrong. Please try again.";
}

export default function UploadModal({ onClose, onCourseLoaded }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  const handleFileSelected = (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF file — other formats aren't supported.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Please upload a PDF under 20MB.");
      return;
    }
    setError(null);
    setPendingFile(file);
  };

  const handleUpload = async () => {
    if (!pendingFile || !selectedTerm) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", pendingFile);
    formData.append("term", selectedTerm);

    try {
      const token = localStorage.getItem("studhub_token");
      const res = await fetch("https://student-agenda.onrender.com/parse-syllabus", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(getFriendlyError(res.status, data.error));
        setLoading(false);
        return;
      }

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

      if (tasks.length === 0) {
        setError("No tasks were found in this syllabus. Try a different PDF or add tasks manually.");
        setLoading(false);
        return;
      }

      // Extract raw lectures from API response
      const rawLectures: RawLecture[] = (data.lectures || []).map((l: RawLecture) => ({
        type: l.type || "Lecture",
        sections: l.sections,
        day: l.day,
        startTime: l.startTime,
        endTime: l.endTime,
        location: l.location,
      }));

      onCourseLoaded(
        data.course?.code || "UNKNOWN",
        data.course?.name || "Unknown Course",
        tasks,
        rawLectures.length > 0 ? rawLectures : undefined
      );
    } catch {
      setError("Could not connect to the server. Make sure the backend is running.");
      setLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  // Step: uploading / analyzing
  if (loading) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.uploadIcon}>
            <span className={styles.spinner}>⟳</span>
          </div>
          <h2 className={styles.title}>Analyzing syllabus...</h2>
          <p className={styles.sub}>AI is extracting assignments and deadlines</p>
          <p className={styles.loadingHint}>This usually takes 5–15 seconds</p>
        </div>
      </div>
    );
  }

  // Step 2: term selection (file chosen, pick term)
  if (pendingFile && !loading) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
          <div className={styles.uploadIcon}><span>📅</span></div>

          <h2 className={styles.title}>Select Your Term</h2>
          <p className={styles.sub}>
            Which term is <strong className={styles.fileName}>{pendingFile.name}</strong> for?
          </p>

          <TermSelect selectedTerm={selectedTerm} onSelect={setSelectedTerm} />

          {error && (
            <div className={styles.errorBox}>
              <span className={styles.errorIcon}>⚠</span>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          <div className={styles.termActions}>
            <button
              className={styles.backBtn}
              onClick={() => { setPendingFile(null); setSelectedTerm(null); setError(null); }}
            >
              ← Back
            </button>
            <button
              className={`${styles.uploadBtn} ${!selectedTerm ? styles.uploadBtnDisabled : ""}`}
              disabled={!selectedTerm}
              onClick={handleUpload}
            >
              Upload & Analyze
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: file selection
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <div className={styles.uploadIcon}><span>✨</span></div>

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

        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorIcon}>⚠</span>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
