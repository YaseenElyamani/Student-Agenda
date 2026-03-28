import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import styles from "./Home.module.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Welcome to StudHub</h1>
          <p className={styles.subheading}>Upload a syllabus and let AI do the heavy lifting</p>

          <div className={styles.uploadZone} onClick={() => navigate("/dashboard")}>
            <div className={styles.uploadIcon}>
              <span>✨</span>
            </div>
            <h2 className={styles.uploadTitle}>Drop Winter 2026 Syllabus (PDF)</h2>
            <p className={styles.uploadSub}>AI will automatically extract assignments, exams, and deadlines</p>
            <button className={styles.browseBtn}>
              <span>⬆</span> Browse Files
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}