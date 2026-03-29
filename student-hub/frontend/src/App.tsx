import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Calendar from "./pages/Calendar";
import type { Task } from "./types/Task";

export interface CourseInfo {
  id: number;
  code: string;
  name: string;
  color: string;
  tasks: Task[];
}

const COURSE_COLORS = ["#7c6fcd", "#a78bfa", "#f472b6", "#34d399", "#f59e0b"];

function App() {
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Load saved courses from backend on startup ──
  useEffect(() => {
    fetch("http://localhost:5001/courses/full")
      .then(res => res.json())
      .then(data => {
        const restored: CourseInfo[] = data.map((c: CourseInfo, i: number) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          color: COURSE_COLORS[i % COURSE_COLORS.length],
          tasks: c.tasks,
        }));
        setCourses(restored);
        if (restored.length > 0) {
          setActiveCourseId(restored[0].id);
        }
      })
      .catch(err => console.error("Failed to load courses:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCourseLoaded = (code: string, name: string, tasks: Task[]) => {
    setCourses(prev => {
      const colorIndex = prev.length % COURSE_COLORS.length;
      // Generate a new ID based on the current number of courses
      const id = prev.length + 1;
      const color = COURSE_COLORS[colorIndex];
      return [...prev, { id, code, name, color, tasks }];
    });
  };

  const activeCourse = courses.find(c => c.id === activeCourseId) ?? courses[0] ?? null;

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0d0f14",
        color: "#7c6fcd",
        fontFamily: "Inter, sans-serif",
        fontSize: "16px",
        gap: "10px"
      }}>
        <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
        Loading your courses...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home onCourseLoaded={handleCourseLoaded} />} />
        <Route path="/dashboard" element={
          <Dashboard
            courses={courses}
            activeCourse={activeCourse}
            activeCourseId={activeCourseId}
            onSelectCourse={setActiveCourseId}
            onCourseLoaded={handleCourseLoaded}
          />
        } />
        <Route path="/calendar" element={
          <Calendar
            courses={courses}
            activeCourseId={activeCourseId}
            onSelectCourse={setActiveCourseId}
            onAddCourse={() => {}}
            onCourseLoaded={handleCourseLoaded}
          />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;