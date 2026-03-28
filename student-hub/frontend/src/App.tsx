import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import type { Task } from "./types/Task";

function App() {
  const [aiTasks, setAiTasks] = useState<Task[]>([]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home onTasksLoaded={setAiTasks} />} />
        <Route path="/dashboard" element={<Dashboard aiTasks={aiTasks} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;