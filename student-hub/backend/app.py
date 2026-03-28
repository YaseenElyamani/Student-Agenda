import os
import json
import fitz
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tasks.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ─── Models ───────────────────────────────────────────────

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(200))
    tasks = db.relationship("Task", backref="course", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "task_count": len(self.tasks)
        }

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50), default="Assignment")
    due_date = db.Column(db.String(20))
    weight = db.Column(db.String(20))
    completed = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "course_id": self.course_id,
            "course_code": self.course.code if self.course else None,
            "title": self.title,
            "type": self.type,
            "due_date": self.due_date,
            "weight": self.weight,
            "completed": self.completed
        }

with app.app_context():
    db.create_all()

# ─── Root ─────────────────────────────────────────────────

@app.route("/")
def home():
    return {"status": "online", "message": "StudHub API is running"}

# ─── Courses ──────────────────────────────────────────────

@app.route("/courses", methods=["GET"])
def get_courses():
    courses = Course.query.all()
    return jsonify([c.to_dict() for c in courses])

@app.route("/courses/<int:course_id>", methods=["DELETE"])
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    db.session.delete(course)
    db.session.commit()
    return jsonify({"message": f"Course {course_id} and all its tasks deleted"})

# ─── Parse Syllabus ───────────────────────────────────────

@app.route("/parse-syllabus", methods=["POST"])
def parse_syllabus():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        pdf_bytes = file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = ""
        for page in doc:
            full_text += page.get_text()
        doc.close()

        context_text = full_text if len(full_text) < 10000 else full_text[-10000:]

        chat_completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a precise academic data extractor. "
                        "Extract course information and graded items into valid JSON. "
                        "If a year is missing, assume 2026."
                    )
                },
                {
                    "role": "user",
                    "content": f"""
                    Extract all assignments, exams, and quizzes from this syllabus text.
                    Return ONLY a JSON object with this exact structure:
                    {{
                      "course_code": "e.g. CP264",
                      "course_name": "e.g. Data Structures",
                      "tasks": [
                        {{
                          "title": "Assignment 1",
                          "type": "Assignment",
                          "due_date": "YYYY-MM-DD",
                          "weight": "10%"
                        }}
                      ]
                    }}
                    Syllabus Content:
                    {context_text}
                    """
                }
            ],
            response_format={"type": "json_object"}
        )

        raw_output = chat_completion.choices[0].message.content.strip()
        extracted_data = json.loads(raw_output)

        course = Course(
            code=extracted_data.get("course_code", "UNKNOWN"),
            name=extracted_data.get("course_name", "")
        )
        db.session.add(course)
        db.session.flush()

        for t in extracted_data.get("tasks", []):
            task = Task(
                course_id=course.id,
                title=t.get("title", "Untitled"),
                type=t.get("type", "Assignment"),
                due_date=t.get("due_date"),
                weight=t.get("weight")
            )
            db.session.add(task)

        db.session.commit()

        return jsonify({
            "course": course.to_dict(),
            "tasks": [t.to_dict() for t in course.tasks]
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error: {str(e)}")
        return jsonify({"error": "Internal server error during parsing"}), 500

# ─── Tasks ────────────────────────────────────────────────

@app.route("/tasks", methods=["GET"])
def get_tasks():
    course_id = request.args.get("course_id")
    if course_id:
        tasks = Task.query.filter_by(course_id=course_id).all()
    else:
        tasks = Task.query.all()
    return jsonify([t.to_dict() for t in tasks])

@app.route("/tasks/upcoming", methods=["GET"])
def get_upcoming():
    from datetime import date, timedelta
    today = date.today()
    week_out = today + timedelta(days=7)
    tasks = Task.query.all()
    upcoming = [
        t.to_dict() for t in tasks
        if t.due_date and t.due_date != "TBD"
        and today <= date.fromisoformat(t.due_date) <= week_out
    ]
    upcoming.sort(key=lambda t: t["due_date"])
    return jsonify(upcoming)

@app.route("/add-task", methods=["POST"])
def add_task():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    if not data.get("title", "").strip():
        return jsonify({"error": "Title is required"}), 400
    if not data.get("course_id"):
        return jsonify({"error": "course_id is required"}), 400

    course = Course.query.get(data["course_id"])
    if not course:
        return jsonify({"error": "Course not found"}), 404

    task = Task(
        course_id=data["course_id"],
        title=data["title"].strip(),
        type=data.get("type", "Assignment"),
        due_date=data.get("due_date"),
        weight=data.get("weight")
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201

@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if "title" in data:
        if not data["title"].strip():
            return jsonify({"error": "Title cannot be empty"}), 400
        task.title = data["title"].strip()
    if "type" in data:
        task.type = data["type"]
    if "due_date" in data:
        task.due_date = data["due_date"]
    if "weight" in data:
        task.weight = data["weight"]

    db.session.commit()
    return jsonify(task.to_dict())

@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": f"Task {task_id} deleted"})

@app.route("/tasks/<int:task_id>/complete", methods=["POST"])
def toggle_complete(task_id):
    task = Task.query.get_or_404(task_id)
    task.completed = not task.completed
    db.session.commit()
    return jsonify(task.to_dict())

if __name__ == "__main__":
    app.run(debug=True, port=5001)