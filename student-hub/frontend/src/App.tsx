import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Calendar from "./pages/Calendar";
import Lectures from "./pages/Lectures";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LoginModal from "./components/LoginModal";
import type { Task } from "./types/Task";
import type { Lecture, RawLecture } from "./types/Lecture";
import LectureResolveModal from "./components/LectureResolveModal";

export interface CourseInfo {
  id: number;
  code: string;
  name: string;
  color: string;
  tasks: Task[];
}

const COURSE_COLORS = [
  "#7c6fcd",
  "#f472b6",
  "#34d399",
  "#f59e0b",
  "#60a5fa",
  "#fb7185",
  "#a3e635",
  "#e879f9",
];

function App() {
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<number | "all">("all");
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem("studhub_token"));
  const [isGuest, setIsGuest] = useState(true); // Guest by default — no login required
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [lectures, setLectures] = useState<Lecture[]>(() => {
    try {
      const saved = localStorage.getItem("studhub_lectures");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Lecture resolve modal state
  const [pendingRawLectures, setPendingRawLectures] = useState<RawLecture[] | null>(null);
  const [pendingLectureCourseId, setPendingLectureCourseId] = useState<number>(0);
  const [pendingLectureCourseCode, setPendingLectureCourseCode] = useState<string>("");

  const handleLecturesChange = (updated: Lecture[]) => {
    setLectures(updated);
    localStorage.setItem("studhub_lectures", JSON.stringify(updated));
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setCourses([]);
      setCompletedIds(new Set());
      return;
    }

    let cancelled = false;

    fetch("https://student-agenda.onrender.com/courses/full", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.status === 401 ? null : res.json())
      .then(data => {
        if (cancelled) return;
        if (!data) {
          localStorage.removeItem("studhub_token");
          setToken(null);
          setLoading(false);
          return;
        }
        const restored: CourseInfo[] = data.map((c: CourseInfo, i: number) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          color: COURSE_COLORS[i % COURSE_COLORS.length],
          tasks: c.tasks,
        }));
        setCourses(restored);
        setCompletedIds(new Set<number>(
          restored.flatMap(c => c.tasks.filter(t => t.completed).map(t => t.id))
        ));
        setLoading(false);
      })
      .catch(err => {
        if (!cancelled) {
          console.error("Failed to load courses:", err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    const handleExpired = () => {
      localStorage.removeItem("studhub_token");
      setToken(null);
      setIsGuest(true);
      setCourses([]);
      setCompletedIds(new Set());
      setSessionExpired(true);
      setShowLoginModal(true);
    };

    window.addEventListener("studhub:session-expired", handleExpired);
    return () => window.removeEventListener("studhub:session-expired", handleExpired);
  }, []);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    setIsGuest(false);
    setCourses([]);
    setCompletedIds(new Set());
    setSessionExpired(false);
  };

  const handleGuest = () => {
    setIsGuest(true);
    setToken(null);
    setCourses([]);
    setCompletedIds(new Set());
  };

  const handleLogout = () => {
    localStorage.removeItem("studhub_token");
    setToken(null);
    setIsGuest(true); // Stay as guest after logout
    setCourses([]);
    setCompletedIds(new Set());
    setActiveCourseId("all");
  };

  const handleCourseLoaded = (code: string, name: string, tasks: Task[], rawLectures?: RawLecture[]) => {
    let courseId = tasks[0]?.course_id ?? 0;

    setCourses(prev => {
      if (prev.some(c => c.code === code)) return prev;
      const color = COURSE_COLORS[prev.length % COURSE_COLORS.length];
      const id = tasks[0]?.course_id ?? prev.length + 1;
      courseId = id;
      const newCourse = { id, code, name, color, tasks };
      setActiveCourseId(id);
      return [...prev, newCourse];
    });

    // Handle parsed lectures from syllabus
    if (rawLectures && rawLectures.length > 0) {
      const needsResolution = rawLectures.some(
        rl => (rl.sections && rl.sections.length > 1) || !rl.day || !rl.startTime || !rl.endTime
      );

      if (needsResolution) {
        // Show resolve modal for user to fill in missing info
        setPendingRawLectures(rawLectures);
        setPendingLectureCourseId(courseId);
        setPendingLectureCourseCode(code);
      } else {
        // All data is complete — auto-add lectures
        const autoLectures: Lecture[] = rawLectures.map(rl => ({
          id: `lec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          courseId,
          courseCode: code,
          day: rl.day as Lecture["day"],
          startTime: rl.startTime!,
          endTime: rl.endTime!,
          location: rl.location || "",
          type: rl.type,
        }));
        handleLecturesChange([...lectures, ...autoLectures]);
      }
    }
  };

  const handleRemoveCourse = (id: number) => {
    fetch(`https://student-agenda.onrender.com/courses/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(() => {
        setCourses(prev => {
          const updated = prev.filter(c => c.id !== id);
          if (activeCourseId === id) setActiveCourseId("all");
          return updated;
        });
      })
      .catch(err => console.error("Failed to delete course:", err));
  };

  const handleToggleTask = (id: number) => {
    fetch(`https://student-agenda.onrender.com/tasks/${id}/complete`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(err => console.error("Failed to toggle task:", err));

    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleTaskUpdated = (updated: Task) => {
    setCourses(prev =>
      prev.map(c => ({
        ...c,
        tasks: c.tasks.map(t => t.id === updated.id ? { ...t, ...updated } : t),
      }))
    );
  };

  const handleTaskDeleted = (id: number) => {
    setCourses(prev =>
      prev.map(c => ({
        ...c,
        tasks: c.tasks.filter(t => t.id !== id),
      }))
    );
    setCompletedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleTaskAdded = (task: Task) => {
    setCourses(prev =>
      prev.map(c =>
        c.id === task.course_id
          ? { ...c, tasks: [...c.tasks, task] }
          : c
      )
    );
  };

  const handleSelectCourse = (id: number | "all") => {
    setActiveCourseId(id);
  };

  const activeCourse = activeCourseId === "all"
    ? null
    : courses.find(c => c.id === activeCourseId) ?? null;

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#060812",
        color: "#8b5cf6",
        fontFamily: "'DM Sans', Inter, sans-serif",
        fontSize: "15px",
        gap: "10px"
      }}>
        <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
        Loading your courses...
      </div>
    );
  }

  const handleLecturesResolved = (resolved: Lecture[]) => {
    handleLecturesChange([...lectures, ...resolved]);
    setPendingRawLectures(null);
  };

  const handleLecturesSkipped = () => {
    setPendingRawLectures(null);
  };

  const openLogin = () => setShowLoginModal(true);

  return (
    <BrowserRouter>
      {showLoginModal && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
          sessionExpired={sessionExpired}
          onClearExpired={() => setSessionExpired(false)}
        />
      )}

      {pendingRawLectures && (
        <LectureResolveModal
          rawLectures={pendingRawLectures}
          courseId={pendingLectureCourseId}
          courseCode={pendingLectureCourseCode}
          onResolved={handleLecturesResolved}
          onSkip={handleLecturesSkipped}
        />
      )}

      <Routes>
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />
        <Route
          path="/login"
          element={<Navigate to="/" replace />}
        />
        <Route
          path="/"
          element={
            courses.length > 0
              ? <Navigate to="/dashboard" replace />
              : <Home
                  courses={courses}
                  activeCourseId={activeCourseId}
                  onSelectCourse={handleSelectCourse}
                  onCourseLoaded={handleCourseLoaded}
                  onRemoveCourse={handleRemoveCourse}
                  onLogout={handleLogout}
                  isGuest={isGuest && !token}
                  onOpenLogin={openLogin}
                />
          }
        />
        <Route
          path="/dashboard"
          element={
            courses.length === 0
              ? <Navigate to="/" replace />
              : <Dashboard
                  courses={courses}
                  activeCourse={activeCourse}
                  activeCourseId={activeCourseId}
                  onSelectCourse={handleSelectCourse}
                  onCourseLoaded={handleCourseLoaded}
                  onRemoveCourse={handleRemoveCourse}
                  completedIds={completedIds}
                  onToggleTask={handleToggleTask}
                  onTaskUpdated={handleTaskUpdated}
                  onTaskDeleted={handleTaskDeleted}
                  onTaskAdded={handleTaskAdded}
                  onLogout={handleLogout}
                  isGuest={isGuest && !token}
                  token={token}
                  onOpenLogin={openLogin}
                />
          }
        />
        <Route
          path="/calendar"
          element={
            <Calendar
              courses={courses}
              activeCourseId={activeCourseId === "all" ? null : activeCourseId}
              onSelectCourse={handleSelectCourse}
              onAddCourse={() => {}}
              onCourseLoaded={handleCourseLoaded}
              onRemoveCourse={handleRemoveCourse}
              onLogout={handleLogout}
              isGuest={isGuest && !token}
              completedIds={completedIds}
              onOpenLogin={openLogin}
              lectures={lectures}
            />
          }
        />
        <Route
          path="/lectures"
          element={
            <Lectures
              courses={courses}
              activeCourseId={activeCourseId}
              onSelectCourse={handleSelectCourse}
              onRemoveCourse={handleRemoveCourse}
              onLogout={handleLogout}
              isGuest={isGuest && !token}
              onOpenLogin={openLogin}
              completedIds={completedIds}
              lectures={lectures}
              onLecturesChange={handleLecturesChange}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;