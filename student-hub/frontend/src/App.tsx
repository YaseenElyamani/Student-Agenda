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

<<<<<<< HEAD
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
        const ids = new Set<number>(
          restored.flatMap(c => c.tasks.filter(t => t.completed).map(t => t.id))
        );
        setCompletedIds(ids);
      })
      .catch(err => console.error("Failed to load courses:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCourseLoaded = (code: string, name: string, tasks: Task[]) => {
    setCourses(prev => {
      if (prev.some(c => c.code === code)) return prev;
      const color = COURSE_COLORS[prev.length % COURSE_COLORS.length];
      const id = tasks[0]?.course_id ?? prev.length + 1;
      const newCourse = { id, code, name, color, tasks };
      setActiveCourseId(id);
      return [...prev, newCourse];
    });
  };

  const handleRemoveCourse = (id: number) => {
    fetch(`http://localhost:5001/courses/${id}`, { method: "DELETE" })
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
    fetch(`http://localhost:5001/tasks/${id}/complete`, { method: "POST" })
      .catch(err => console.error("Failed to toggle task:", err));
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
=======
const COURSE_COLORS = ["#7c6fcd", "#a78bfa", "#f472b6", "#34d399", "#f59e0b"];

function App() {
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);

  const handleCourseLoaded = (code: string, name: string, tasks: Task[]) => {
    setCourses(prev => {
      const id = prev.length + 1;
      const color = COURSE_COLORS[prev.length % COURSE_COLORS.length];
      return [...prev, { id, code, name, color, tasks }];
    });
  };

  const activeCourse = courses.find(c => c.id === activeCourseId) ?? courses[0] ?? null;
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)

  return (
    <BrowserRouter>
      <Routes>
<<<<<<< HEAD
        <Route path="/" element={
          <Home
            courses={courses}
            activeCourseId={activeCourseId}
            onSelectCourse={handleSelectCourse}
            onCourseLoaded={handleCourseLoaded}
            onRemoveCourse={handleRemoveCourse}
          />
        } />
=======
        <Route path="/" element={<Home onCourseLoaded={handleCourseLoaded} />} />
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
        <Route path="/dashboard" element={
          <Dashboard
            courses={courses}
            activeCourse={activeCourse}
            activeCourseId={activeCourseId}
<<<<<<< HEAD
            onSelectCourse={handleSelectCourse}
            onCourseLoaded={handleCourseLoaded}
            onRemoveCourse={handleRemoveCourse}
            completedIds={completedIds}
            onToggleTask={handleToggleTask}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            onTaskAdded={handleTaskAdded}
=======
            onSelectCourse={setActiveCourseId}
            onCourseLoaded={handleCourseLoaded}
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
          />
        } />
        <Route path="/calendar" element={
          <Calendar
            courses={courses}
<<<<<<< HEAD
            activeCourseId={activeCourseId === "all" ? null : activeCourseId}
            onSelectCourse={(id) => handleSelectCourse(id)}
            onAddCourse={() => {}}
            onCourseLoaded={handleCourseLoaded}
            onRemoveCourse={handleRemoveCourse}
=======
            activeCourseId={activeCourseId}
            onSelectCourse={setActiveCourseId}
            onAddCourse={() => {}}
            onCourseLoaded={handleCourseLoaded}
>>>>>>> 43e6732 (finished on most of the frontend, calendar complete etc.., now work on backend)
          />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;