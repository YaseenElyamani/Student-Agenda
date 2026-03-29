export interface Task {
  id: number;
  course_id?: number;
  course_code?: string;
  title: string;
  type: "Lab" | "Quiz" | "Assignment" | "Exam" | "Midterm";
  due_date: string;
  due_time?: string | null;
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
  type: "Lab" | "Quiz" | "Assignment" | "Exam" | "Midterm";
  due_date: string;
  due_time?: string | null;
  weight: string;
  completed?: boolean;
}
