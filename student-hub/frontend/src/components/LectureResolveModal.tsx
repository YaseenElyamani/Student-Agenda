import { useState } from "react";
import type { RawLecture, Lecture } from "../types/Lecture";
import { DAYS_OF_WEEK } from "../types/Lecture";
import styles from "./LectureResolveModal.module.css";

interface LectureResolveModalProps {
  rawLectures: RawLecture[];
  courseId: number;
  courseCode: string;
  onResolved: (lectures: Lecture[]) => void;
  onSkip: () => void;
}

interface ResolveState {
  selectedSection: number | null; // index into sections array
  day: string;
  startTime: string;
  endTime: string;
  location: string;
}

export default function LectureResolveModal({
  rawLectures, courseId, courseCode, onResolved, onSkip,
}: LectureResolveModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [resolvedLectures, setResolvedLectures] = useState<Lecture[]>([]);
  const [state, setState] = useState<ResolveState>(() => initState(rawLectures[0]));

  function initState(raw: RawLecture): ResolveState {
    return {
      selectedSection: raw.sections && raw.sections.length > 0 ? null : -1,
      day: raw.day || "",
      startTime: raw.startTime || "",
      endTime: raw.endTime || "",
      location: raw.location || "",
    };
  }

  const raw = rawLectures[currentIdx];
  const hasSections = raw.sections && raw.sections.length > 1;
  const needsDay = !raw.day && (state.selectedSection === null || state.selectedSection === -1 || !raw.sections?.[state.selectedSection]?.day);
  const needsTime = !raw.startTime && (state.selectedSection === null || state.selectedSection === -1 || !raw.sections?.[state.selectedSection]?.startTime);

  // When a section is selected, populate fields from it
  const handleSelectSection = (idx: number) => {
    const sec = raw.sections![idx];
    setState({
      selectedSection: idx,
      day: sec.day || state.day || "",
      startTime: sec.startTime || state.startTime || "",
      endTime: sec.endTime || state.endTime || "",
      location: sec.location || state.location || "",
    });
  };

  const canConfirm = state.day && state.startTime && state.endTime && (hasSections ? state.selectedSection !== null : true);

  const handleConfirm = () => {
    const newLecture: Lecture = {
      id: `lec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      courseId,
      courseCode,
      day: state.day as Lecture["day"],
      startTime: state.startTime,
      endTime: state.endTime,
      location: state.location,
      type: raw.type,
    };

    const updated = [...resolvedLectures, newLecture];

    if (currentIdx < rawLectures.length - 1) {
      setResolvedLectures(updated);
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setState(initState(rawLectures[nextIdx]));
    } else {
      onResolved(updated);
    }
  };

  const allComplete = !hasSections && !needsDay && !needsTime;

  // If everything is already filled (no ambiguity), show a simpler confirmation
  if (allComplete && state.day && state.startTime) {
    // Auto-fill from raw data
    if (!state.day && raw.day) setState(s => ({ ...s, day: raw.day! }));
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>📚</div>
          <h2 className={styles.title}>Set Up Lectures</h2>
          <p className={styles.subtitle}>
            We found <strong>{rawLectures.length}</strong> lecture{rawLectures.length > 1 ? "s" : ""} for <strong>{courseCode}</strong>
          </p>
          {rawLectures.length > 1 && (
            <div className={styles.progress}>
              {rawLectures.map((_, i) => (
                <div
                  key={i}
                  className={`${styles.progressDot} ${i < currentIdx ? styles.progressDone : ""} ${i === currentIdx ? styles.progressActive : ""}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.typeBadge}>{raw.type}</span>
            <span className={styles.stepLabel}>
              {rawLectures.length > 1 ? `${currentIdx + 1} of ${rawLectures.length}` : ""}
            </span>
          </div>

          {/* Section picker */}
          {hasSections && (
            <div className={styles.sectionBlock}>
              <p className={styles.fieldLabel}>Which section are you in?</p>
              <div className={styles.sectionGrid}>
                {raw.sections!.map((sec, i) => (
                  <button
                    key={i}
                    className={`${styles.sectionBtn} ${state.selectedSection === i ? styles.sectionActive : ""}`}
                    onClick={() => handleSelectSection(i)}
                  >
                    <span className={styles.sectionName}>Section {sec.name}</span>
                    {sec.day && <span className={styles.sectionDetail}>{sec.day}</span>}
                    {sec.startTime && sec.endTime && (
                      <span className={styles.sectionDetail}>{sec.startTime} - {sec.endTime}</span>
                    )}
                    {sec.location && <span className={styles.sectionDetail}>{sec.location}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day picker — show if day is missing */}
          {(needsDay || !state.day) && (
            <div className={styles.fieldBlock}>
              <p className={styles.fieldLabel}>What day is this {raw.type.toLowerCase()}?</p>
              <div className={styles.dayGrid}>
                {DAYS_OF_WEEK.map(d => (
                  <button
                    key={d}
                    className={`${styles.dayBtn} ${state.day === d ? styles.dayActive : ""}`}
                    onClick={() => setState(s => ({ ...s, day: d }))}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time picker — show if time is missing */}
          {(needsTime || !state.startTime) && (
            <div className={styles.fieldBlock}>
              <p className={styles.fieldLabel}>What time?</p>
              <div className={styles.timeRow}>
                <div className={styles.timeField}>
                  <label className={styles.timeLabel}>Start</label>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={state.startTime}
                    onChange={e => setState(s => ({ ...s, startTime: e.target.value }))}
                  />
                </div>
                <span className={styles.timeSep}>to</span>
                <div className={styles.timeField}>
                  <label className={styles.timeLabel}>End</label>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={state.endTime}
                    onChange={e => setState(s => ({ ...s, endTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location — optional edit */}
          <div className={styles.fieldBlock}>
            <p className={styles.fieldLabel}>Location <span className={styles.optional}>(optional)</span></p>
            <input
              className={styles.locationInput}
              placeholder="e.g. Room H-110"
              value={state.location}
              onChange={e => setState(s => ({ ...s, location: e.target.value }))}
            />
          </div>

          {/* Summary of what's set */}
          {state.day && state.startTime && (
            <div className={styles.summary}>
              <span className={styles.summaryIcon}>✓</span>
              {state.day.slice(0, 3)} {state.startTime} – {state.endTime || "?"}
              {state.location && ` • ${state.location}`}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.skipBtn} onClick={onSkip}>
            Skip Lectures
          </button>
          <button
            className={styles.confirmBtn}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {currentIdx < rawLectures.length - 1 ? "Next" : "Confirm All"}
          </button>
        </div>
      </div>
    </div>
  );
}
