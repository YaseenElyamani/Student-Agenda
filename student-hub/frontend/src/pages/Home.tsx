import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TermSelect from "../components/TermSelect";
import type { Term } from "../components/TermSelect";
import styles from "./Home.module.css";
import type { Task } from "../types/Task";
import type { RawLecture } from "../types/Lecture";
import type { CourseInfo } from "../App";

interface HomeProps {
  courses: CourseInfo[];
  activeCourseId: number | "all";
  onSelectCourse: (id: number | "all") => void;
  onCourseLoaded: (code: string, name: string, tasks: Task[], rawLectures?: RawLecture[]) => void;
  onRemoveCourse: (id: number) => void;
  onLogout: () => void;
  isGuest?: boolean;
  onOpenLogin?: () => void;
}

export default function Home({ courses, activeCourseId, onSelectCourse, onCourseLoaded, onRemoveCourse, onLogout, isGuest, onOpenLogin }: HomeProps) {
  const navigate = useNavigate();
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

    const token = localStorage.getItem("studhub_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch("https://student-agenda.onrender.com/parse-syllabus", {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await res.json();

      if (res.status === 409) {
        setError(data.error || "This course is already added.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
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
      navigate("/dashboard");
    } catch {
      setError("Could not connect to backend.");
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

  return (
    <div className={styles.layout}>
      <Sidebar
        courses={courses}
        activeCourseId={activeCourseId}
        onSelectCourse={onSelectCourse}
        onAddCourse={() => fileInputRef.current?.click()}
        onRemoveCourse={onRemoveCourse}
        onLogout={onLogout}
        isGuest={isGuest}
        onOpenLogin={onOpenLogin}
      />

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Welcome to StudHub</h1>
          <p className={styles.subheading}>Upload a syllabus and let AI do the heavy lifting</p>

          {isGuest && (
            <div className={styles.guestWarning}>
              👤 You're in guest mode — your data won't be saved.
              <button className={styles.signUpLink} onClick={onOpenLogin}>
                Sign in to save your progress →
              </button>
            </div>
          )}

          {/* Term selection step — shown after file is chosen */}
          {pendingFile && !loading && (
            <div className={styles.termCard}>
              <div className={styles.termHeader}>
                <span className={styles.termHeaderIcon}>📅</span>
                <div>
                  <h2 className={styles.termTitle}>Select Your Term</h2>
                  <p className={styles.termSub}>
                    Which term is <strong className={styles.termFileName}>{pendingFile.name}</strong> for?
                  </p>
                </div>
              </div>

              <TermSelect selectedTerm={selectedTerm} onSelect={setSelectedTerm} />

              <div className={styles.termActions}>
                <button
                  className={styles.termBackBtn}
                  onClick={() => { setPendingFile(null); setSelectedTerm(null); setError(null); }}
                >
                  ← Change File
                </button>
                <button
                  className={`${styles.termUploadBtn} ${!selectedTerm ? styles.termUploadBtnDisabled : ""}`}
                  disabled={!selectedTerm}
                  onClick={handleUpload}
                >
                  Upload & Analyze
                </button>
              </div>
            </div>
          )}

          {/* Upload zone — hidden when term selection is showing */}
          {!pendingFile && !loading && (
            <div
              className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className={styles.uploadIcon}><span>✨</span></div>
              <h2 className={styles.uploadTitle}>Drop your Syllabus (PDF)</h2>
              <p className={styles.uploadSub}>AI will automatically extract assignments, exams, and deadlines</p>
              <button
                className={styles.browseBtn}
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                <span>⬆</span> Browse Files
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className={styles.uploadZone} style={{ cursor: "default" }}>
              <div className={styles.uploadIcon}>
                <span className={styles.spinner}>⟳</span>
              </div>
              <h2 className={styles.uploadTitle}>Analyzing your syllabus...</h2>
              <p className={styles.uploadSub}>AI is extracting assignments, exams, and deadlines</p>
            </div>
          )}

          {/* File input — always rendered so ref works */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handleFileInput}
          />

          {error && <p className={styles.error}>{error}</p>}
        </div>
      </main>
    </div>
  );
}
