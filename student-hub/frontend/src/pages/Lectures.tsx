import { useState } from "react";
import Sidebar from "../components/Sidebar";
import type { CourseInfo } from "../App";
import type { Lecture } from "../types/Lecture";
import { DAYS_OF_WEEK, LECTURE_TYPES } from "../types/Lecture";
import styles from "./Lectures.module.css";

interface LecturesProps {
  courses: CourseInfo[];
  activeCourseId: number | "all";
  onSelectCourse: (id: number | "all") => void;
  onRemoveCourse: (id: number) => void;
  onLogout: () => void;
  isGuest?: boolean;
  onOpenLogin?: () => void;
  completedIds?: Set<number>;
  lectures: Lecture[];
  onLecturesChange: (lectures: Lecture[]) => void;
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

const DAY_SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  Lecture:  { bg: "rgba(139, 92, 246, 0.12)", color: "#a78bfa" },
  Tutorial: { bg: "rgba(52, 211, 153, 0.12)", color: "#34d399" },
  Lab:      { bg: "rgba(96, 165, 250, 0.12)", color: "#60a5fa" },
  Seminar:  { bg: "rgba(251, 146, 60, 0.12)", color: "#fb923c" },
};

const SCHEDULE_HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8AM to 9PM

export default function Lectures({
  courses, activeCourseId, onSelectCourse, onRemoveCourse,
  onLogout, isGuest, onOpenLogin, completedIds,
  lectures, onLecturesChange,
}: LecturesProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCourseId, setFilterCourseId] = useState<number | "all">("all");

  // Form state
  const [formCourseId, setFormCourseId] = useState<number | "">(courses[0]?.id ?? "");
  const [formDay, setFormDay] = useState<Lecture["day"]>("Monday");
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("10:00");
  const [formLocation, setFormLocation] = useState("");
  const [formType, setFormType] = useState<Lecture["type"]>("Lecture");

  const filteredLectures = filterCourseId === "all"
    ? lectures
    : lectures.filter(l => l.courseId === filterCourseId);

  const resetForm = (keepOpen = false) => {
    setFormCourseId(courses[0]?.id ?? "");
    setFormDay("Monday");
    setFormStart("09:00");
    setFormEnd("10:00");
    setFormLocation("");
    setFormType("Lecture");
    setEditingId(null);
    if (!keepOpen) setShowAddForm(false);
  };

  const handleSave = () => {
    if (!formCourseId) return;
    if (editingId) {
      onLecturesChange(lectures.map(l =>
        l.id === editingId
          ? { ...l, courseId: formCourseId as number, day: formDay, startTime: formStart, endTime: formEnd, location: formLocation, type: formType }
          : l
      ));
    } else {
      const newLecture: Lecture = {
        id: `lec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        courseId: formCourseId as number,
        day: formDay,
        startTime: formStart,
        endTime: formEnd,
        location: formLocation,
        type: formType,
      };
      onLecturesChange([...lectures, newLecture]);
    }
    resetForm();
  };

  const handleEdit = (lecture: Lecture) => {
    setEditingId(lecture.id);
    setFormCourseId(lecture.courseId);
    setFormDay(lecture.day);
    setFormStart(lecture.startTime);
    setFormEnd(lecture.endTime);
    setFormLocation(lecture.location);
    setFormType(lecture.type);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    onLecturesChange(lectures.filter(l => l.id !== id));
  };

  const getCourseForLecture = (l: Lecture) => courses.find(c => c.id === l.courseId);

  // Build weekly schedule grid data
  const weekDays = DAYS_OF_WEEK.filter(d => d !== "Saturday" && d !== "Sunday");
  const getLecturesForDayHour = (day: string, hour: number) =>
    filteredLectures.filter(l => {
      if (l.day !== day) return false;
      const startH = parseInt(l.startTime.split(":")[0]);
      return startH === hour;
    });

  const getLectureDuration = (l: Lecture) => {
    const startH = parseInt(l.startTime.split(":")[0]);
    const endH = parseInt(l.endTime.split(":")[0]);
    return Math.max(1, endH - startH);
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        courses={courses}
        activeCourseId={activeCourseId === "all" ? null : activeCourseId}
        onSelectCourse={onSelectCourse}
        onAddCourse={() => {}}
        onRemoveCourse={onRemoveCourse}
        onLogout={onLogout}
        isGuest={isGuest}
        onOpenLogin={onOpenLogin}
        completedIds={completedIds}
      />

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.heading}>Lectures</h1>
              <p className={styles.subheading}>Your weekly class schedule</p>
            </div>
            <button
              className={styles.addBtn}
              onClick={() => { resetForm(true); setShowAddForm(true); }}
            >
              + Add Lecture
            </button>
          </div>

          {/* Course filter */}
          {courses.length > 0 && (
            <div className={styles.filterRow}>
              <button
                className={`${styles.filterBtn} ${filterCourseId === "all" ? styles.filterActive : ""}`}
                onClick={() => setFilterCourseId("all")}
              >
                All
              </button>
              {courses.map(c => (
                <button
                  key={c.id}
                  className={`${styles.filterBtn} ${filterCourseId === c.id ? styles.filterActive : ""}`}
                  style={filterCourseId === c.id
                    ? { background: c.color + "33", borderColor: c.color, color: c.color }
                    : { borderColor: c.color + "66", color: c.color }
                  }
                  onClick={() => setFilterCourseId(c.id)}
                >
                  <span className={styles.filterDot} style={{ background: c.color }} />
                  {c.code}
                </button>
              ))}
            </div>
          )}

          {/* Add / Edit form */}
          {showAddForm && (
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>
                {editingId ? "Edit Lecture" : "Add Lecture"}
              </h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Course</label>
                  <select
                    className={styles.formSelect}
                    value={formCourseId}
                    onChange={e => setFormCourseId(Number(e.target.value))}
                  >
                    <option value="">Select course...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Type</label>
                  <select
                    className={styles.formSelect}
                    value={formType}
                    onChange={e => setFormType(e.target.value as Lecture["type"])}
                  >
                    {LECTURE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Day</label>
                  <select
                    className={styles.formSelect}
                    value={formDay}
                    onChange={e => setFormDay(e.target.value as Lecture["day"])}
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Location</label>
                  <input
                    className={styles.formInput}
                    placeholder="e.g. Room 204"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Start Time</label>
                  <input
                    className={styles.formInput}
                    type="time"
                    value={formStart}
                    onChange={e => setFormStart(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>End Time</label>
                  <input
                    className={styles.formInput}
                    type="time"
                    value={formEnd}
                    onChange={e => setFormEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button className={styles.cancelBtn} onClick={resetForm}>Cancel</button>
                <button
                  className={styles.saveBtn}
                  disabled={!formCourseId}
                  onClick={handleSave}
                >
                  {editingId ? "Save Changes" : "Add Lecture"}
                </button>
              </div>
            </div>
          )}

          {/* Weekly schedule grid */}
          {filteredLectures.length > 0 ? (
            <div className={styles.scheduleCard}>
              <h2 className={styles.sectionTitle}>Weekly Schedule</h2>
              <div className={styles.scheduleGrid}>
                {/* Header row */}
                <div className={styles.timeHeader} />
                {weekDays.map(d => (
                  <div key={d} className={styles.dayHeader}>{DAY_SHORT[d]}</div>
                ))}

                {/* Hour rows */}
                {SCHEDULE_HOURS.map(hour => (
                  <>
                    <div key={`time-${hour}`} className={styles.timeLabel}>
                      {formatTime12(`${hour}:00`)}
                    </div>
                    {weekDays.map(day => {
                      const dayLectures = getLecturesForDayHour(day, hour);
                      return (
                        <div key={`${day}-${hour}`} className={styles.scheduleCell}>
                          {dayLectures.map(l => {
                            const course = getCourseForLecture(l);
                            const duration = getLectureDuration(l);
                            const typeColor = TYPE_COLORS[l.type] ?? TYPE_COLORS.Lecture;
                            return (
                              <div
                                key={l.id}
                                className={styles.scheduleBlock}
                                style={{
                                  background: course?.color ? course.color + "22" : typeColor.bg,
                                  borderLeftColor: course?.color ?? typeColor.color,
                                  height: `${duration * 100}%`,
                                  minHeight: `${duration * 48}px`,
                                }}
                                onClick={() => handleEdit(l)}
                                title={`${course?.code} ${l.type} — ${l.location}`}
                              >
                                <span className={styles.blockCode} style={{ color: course?.color ?? typeColor.color }}>
                                  {course?.code}
                                </span>
                                <span className={styles.blockType}>{l.type}</span>
                                {l.location && <span className={styles.blockLoc}>{l.location}</span>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📚</span>
              <h3 className={styles.emptyTitle}>No lectures yet</h3>
              <p className={styles.emptySub}>
                {courses.length === 0
                  ? "Upload a syllabus first, then add your lecture times here."
                  : "Add your lecture times to see your weekly schedule."}
              </p>
              {courses.length > 0 && (
                <button
                  className={styles.emptyBtn}
                  onClick={() => { resetForm(true); setShowAddForm(true); }}
                >
                  + Add Your First Lecture
                </button>
              )}
            </div>
          )}

          {/* Lecture list */}
          {filteredLectures.length > 0 && (
            <div className={styles.listCard}>
              <h2 className={styles.sectionTitle}>All Lectures</h2>
              <div className={styles.lectureList}>
                {filteredLectures
                  .sort((a, b) => DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day) || a.startTime.localeCompare(b.startTime))
                  .map(l => {
                    const course = getCourseForLecture(l);
                    const typeColor = TYPE_COLORS[l.type] ?? TYPE_COLORS.Lecture;
                    return (
                      <div key={l.id} className={styles.lectureItem}>
                        <div className={styles.lectureBar} style={{ background: course?.color ?? "#8b5cf6" }} />
                        <div className={styles.lectureInfo}>
                          <p className={styles.lectureName}>
                            {course?.code} — {l.type}
                          </p>
                          <p className={styles.lectureMeta}>
                            {DAY_SHORT[l.day]} • {formatTime12(l.startTime)} – {formatTime12(l.endTime)}
                            {l.location && ` • ${l.location}`}
                          </p>
                        </div>
                        <span
                          className={styles.lectureType}
                          style={{ background: typeColor.bg, color: typeColor.color }}
                        >
                          {l.type}
                        </span>
                        <div className={styles.lectureActions}>
                          <button className={styles.editBtn} onClick={() => handleEdit(l)}>✎</button>
                          <button className={styles.deleteBtn} onClick={() => handleDelete(l.id)}>✕</button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
