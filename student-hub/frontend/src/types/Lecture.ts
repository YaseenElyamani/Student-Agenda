export interface Lecture {
  id: string;
  courseId: number;
  courseCode?: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
  location: string;
  type: "Lecture" | "Tutorial" | "Lab" | "Seminar";
}

/** Section option returned by the API when multiple sections exist */
export interface LectureSection {
  name: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
}

/** Raw lecture data from the /parse-syllabus API — fields may be missing */
export interface RawLecture {
  type: "Lecture" | "Tutorial" | "Lab" | "Seminar";
  sections?: LectureSection[];
  day?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
}

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const LECTURE_TYPES = ["Lecture", "Tutorial", "Lab", "Seminar"] as const;
