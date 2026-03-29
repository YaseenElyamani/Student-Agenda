import axios from "axios";
import type { NewTask } from "../types/Task";

export const API = axios.create({
  baseURL: "http://localhost:5000",
});

export const getTasks = () => API.get("/tasks");
export const addTask = (task: NewTask) => API.post("/add-task", task);
export const toggleTask = (id: number) => API.patch(`/tasks/${id}/toggle`);
