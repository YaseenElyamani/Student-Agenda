export interface Task {
  id: number;
  title: string;
  type: "Lab" | "Quiz" | "Assignment" | "Exam";
  due_date: string;
  weight: string;
  completed: boolean;
}

export interface Course {
  id: number;
  name: string;
  color: string;
  semester: string;
  tasks: Task[];
}

export interface NewTask {
  title: string;
  type: "Lab" | "Quiz" | "Assignment" | "Exam";
  due_date: string;
  weight: string;
  completed?: boolean;
}