import { useState } from "react";
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

  const handleCourseLoaded = (code: string, name: string, tasks: Task[]) => {
    setCourses(prev => {
      const id = prev.length + 1;
      const color = COURSE_COLORS[prev.length % COURSE_COLORS.length];
      return [...prev, { id, code, name, color, tasks }];
    });
  };

  const activeCourse = courses.find(c => c.id === activeCourseId) ?? courses[0] ?? null;

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