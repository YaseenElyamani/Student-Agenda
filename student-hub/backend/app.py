import os
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from google import genai
from google.genai import types
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import requests as http_requests
import secrets
import resend
from datetime import datetime, timedelta, timezone
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

load_dotenv()

app = Flask(__name__)
CORS(app, 
    origins=[
        "http://localhost:5173",
        "https://studhub.work",
        "https://www.studhub.work",
        "https://student-agenda-yaseenelyamanis-projects.vercel.app"
    ],
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)
database_url = os.getenv("DATABASE_URL", "sqlite:///tasks.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "supersecretkey123")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)

db = SQLAlchemy(app)
jwt = JWTManager(app)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
resend.api_key = os.getenv("RESEND_API_KEY")

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://"
)

# ─── Models ───────────────────────────────────────────────
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    courses = db.relationship("Course", backref="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {"id": self.id, "email": self.email}

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
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
    due_time = db.Column(db.String(10))
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
            "due_time": self.due_time,
            "weight": self.weight,
            "completed": self.completed
        }

class PasswordResetToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)

# ─── Initialize DB ────────────────────────────────────────
with app.app_context():
    db.create_all()

# ─── Root ─────────────────────────────────────────────────
@app.route("/")
def home():
    return {"status": "online", "message": "StudHub API is running"}

# ─── Auth ─────────────────────────────────────────────────
@app.route("/auth/signup", methods=["POST"])
@limiter.limit("5 per minute")
def signup():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(email=email, password=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201

@app.route("/auth/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()})

@app.route("/auth/google", methods=["POST"])
def google_auth():
    data = request.get_json()
    access_token = data.get("access_token")

    if not access_token:
        return jsonify({"error": "No token provided"}), 400

    google_res = http_requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )

    if google_res.status_code != 200:
        return jsonify({"error": "Invalid Google token"}), 401

    google_data = google_res.json()
    email = google_data.get("email", "").lower()

    if not email:
        return jsonify({"error": "Could not get email from Google"}), 401

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            email=email,
            password=generate_password_hash(os.urandom(32).hex())
        )
        db.session.add(user)
        db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()})

@app.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "If that email exists, a reset link has been sent."}), 200

    PasswordResetToken.query.filter_by(user_id=user.id, used=False).delete()

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.session.add(reset_token)
    db.session.commit()

    reset_link = f"http://localhost:5173/reset-password?token={token}"

    resend.Emails.send({
        "from": "StudHub <onboarding@resend.dev>",
        "to": "tarryuster@gmail.com",
        "subject": "Reset your StudHub password",
        "html": f"""
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #0d0f14; padding: 40px; border-radius: 16px;">
            <div style="margin-bottom: 32px;">
                <span style="color: #7c6fcd; font-size: 24px;">✦</span>
                <span style="color: #ffffff; font-size: 20px; font-weight: 700; margin-left: 8px;">StudHub</span>
            </div>
            <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Reset your password</h1>
            <p style="color: #4a4f62; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
                We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.
            </p>
            <a href="{reset_link}" style="display: inline-block; background: #7c6fcd; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Reset Password
            </a>
            <p style="color: #4a4f62; font-size: 12px; margin: 28px 0 0;">
                If you didn't request this, you can safely ignore this email.
            </p>
        </div>
        """
    })

    return jsonify({"message": "If that email exists, a reset link has been sent."}), 200

@app.route("/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    token = data.get("token", "")
    new_password = data.get("password", "")

    if not token or not new_password:
        return jsonify({"error": "Token and password are required"}), 400
    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    reset_token = PasswordResetToken.query.filter_by(token=token, used=False).first()

    if not reset_token:
        return jsonify({"error": "Invalid or expired reset link"}), 400

    if datetime.now(timezone.utc) > reset_token.expires_at.replace(tzinfo=timezone.utc):
        return jsonify({"error": "This reset link has expired. Please request a new one."}), 400

    user = User.query.get(reset_token.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.password = generate_password_hash(new_password)
    reset_token.used = True
    db.session.commit()

    return jsonify({"message": "Password reset successfully"}), 200

# ─── Courses ──────────────────────────────────────────────
@app.route("/courses", methods=["GET"])
@jwt_required()
def get_courses():
    user_id = int(get_jwt_identity())
    courses = Course.query.filter_by(user_id=user_id).all()
    return jsonify([c.to_dict() for c in courses])

@app.route("/courses/full", methods=["GET"])
@jwt_required()
def get_courses_full():
    user_id = int(get_jwt_identity())
    courses = Course.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "tasks": [t.to_dict() for t in c.tasks]
        }
        for c in courses
    ])

@app.route("/courses/<int:course_id>", methods=["DELETE"])
@jwt_required()
def delete_course(course_id):
    user_id = int(get_jwt_identity())
    course = Course.query.filter_by(id=course_id, user_id=user_id).first_or_404()
    db.session.delete(course)
    db.session.commit()
    return jsonify({"message": f"Course {course_id} deleted"})

# ─── Parse Syllabus ───────────────────────────────────────
@app.route("/parse-syllabus", methods=["POST"])
@jwt_required(optional=True)
@limiter.limit("5 per day")
def parse_syllabus():
    user_id = get_jwt_identity()
    user_id = int(user_id) if user_id else None

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        pdf_bytes = file.read()

        prompt = """
Extract all graded items from this syllabus PDF.
Return JSON ONLY with this exact structure, no explanation, no markdown:
{
    "course_code": "e.g. CP363",
    "course_name": "e.g. Database I",
    "tasks": [
        {
            "title": "Assignment 1: Simple Queries",
            "type": "Assignment",
            "due_date": "2026-01-31",
            "due_time": "10:30",
            "weight": "10%"
        }
    ]
}

IMPORTANT RULES:
- Valid types are: Assignment, Quiz, Exam, Lab, Midterm, Final Exam, Discussion
- due_time MUST always be in 24-hour "HH:MM" format (e.g. "23:59", "10:30") or null
- NEVER store text like "in-class time", "TBD", or any other text in due_time — use null instead
- Convert 12hr times to 24hr: "11:59 pm" = "23:59", "10:30 am" = "10:30"
- ALWAYS scan the entire syllabus for a default submission time and apply it to ALL tasks that don't have a specific time
- For in-class tasks like midterms or quizzes, look for the class schedule and use that start time in 24hr format. If multiple sections exist, use the earliest section time
- For recurring weekly tasks like discussion posts, participation, or weekly responses:
  * Create a SEPARATE task entry for EACH occurrence
  * Title them like "Discussion Post - Week 1", "Discussion Post - Week 2", etc.
  * Look at the weekly schedule to find which weeks have them and which don't
  * If total weight is given for all posts combined divide evenly per post
- For one-time tasks create one entry each
- Read the ENTIRE PDF including all tables and schedules to find due dates
- Look carefully for inline due dates like "Assignment 1 (due 11:59 PM)" in weekly schedules
- If no specific due date exists or the task is ongoing/participation-based with no clear deadline, use TBD
- Do NOT assign a due date to participation grades, attendance, or engagement metrics
- Only extract tasks that have clear individual submission deadlines
- If year is missing, assume current year, but if month has already passed assume next year
- Final exam dates set by the university should use TBD for due_date
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
                prompt
            ]
        )

        raw_output = response.text.strip()
        if raw_output.startswith("```"):
            raw_output = raw_output.split("```")[1]
            if raw_output.startswith("json"):
                raw_output = raw_output[4:]
        raw_output = raw_output.strip()

        print("Gemini response:", raw_output)
        extracted_data = json.loads(raw_output)

        course_code = extracted_data.get("course_code", "UNKNOWN")
        course_name = extracted_data.get("course_name", "")

        existing = Course.query.filter_by(code=course_code, user_id=user_id).first() if user_id else None
        if existing:
            return jsonify({
                "error": f"Course {course_code} already exists.",
                "duplicate": True
            }), 409

        if user_id:
            course = Course(user_id=user_id, code=course_code, name=course_name)
            db.session.add(course)
            db.session.flush()

            for t in extracted_data.get("tasks", []):
                task = Task(
                    course_id=course.id,
                    title=t.get("title", "Untitled"),
                    type=t.get("type", "Assignment"),
                    due_date=t.get("due_date"),
                    due_time=t.get("due_time"),
                    weight=t.get("weight")
                )
                db.session.add(task)
            db.session.commit()

            return jsonify({
                "course": course.to_dict(),
                "tasks": [t.to_dict() for t in course.tasks]
            })
        else:
            # Guest mode — return parsed data without saving to DB
            tasks = []
            for i, t in enumerate(extracted_data.get("tasks", [])):
                tasks.append({
                    "id": i + 1,
                    "course_id": 1,
                    "course_code": course_code,
                    "title": t.get("title", "Untitled"),
                    "type": t.get("type", "Assignment"),
                    "due_date": t.get("due_date"),
                    "due_time": t.get("due_time"),
                    "weight": t.get("weight"),
                    "completed": False
                })
            return jsonify({
                "course": {"id": 1, "code": course_code, "name": course_name},
                "tasks": tasks
            })

    except Exception as e:
        db.session.rollback()
        print(f"Error: {str(e)}")
        return jsonify({"error": "Internal server error during parsing"}), 500

# ─── Tasks ────────────────────────────────────────────────
@app.route("/tasks", methods=["GET"])
@jwt_required()
def get_tasks():
    user_id = int(get_jwt_identity())
    course_id = request.args.get("course_id")
    if course_id:
        tasks = Task.query.join(Course).filter(
            Task.course_id == course_id,
            Course.user_id == user_id
        ).all()
    else:
        tasks = Task.query.join(Course).filter(Course.user_id == user_id).all()
    return jsonify([t.to_dict() for t in tasks])

@app.route("/tasks/upcoming", methods=["GET"])
@jwt_required()
def get_upcoming():
    from datetime import date
    user_id = int(get_jwt_identity())
    today = date.today()
    week_out = today + timedelta(days=7)
    tasks = Task.query.join(Course).filter(Course.user_id == user_id).all()
    upcoming = [
        t.to_dict() for t in tasks
        if t.due_date and t.due_date != "TBD"
        and today <= date.fromisoformat(t.due_date) <= week_out
    ]
    upcoming.sort(key=lambda t: t["due_date"])
    return jsonify(upcoming)

@app.route("/add-task", methods=["POST"])
@jwt_required()
def add_task():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or not data.get("title") or not data.get("course_id"):
        return jsonify({"error": "Title and course_id are required"}), 400
    course = Course.query.filter_by(id=data["course_id"], user_id=user_id).first()
    if not course:
        return jsonify({"error": "Course not found"}), 404

    task = Task(
        course_id=data["course_id"],
        title=data["title"].strip(),
        type=data.get("type", "Assignment"),
        due_date=data.get("due_date"),
        due_time=data.get("due_time"),
        weight=data.get("weight")
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201

@app.route("/tasks/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.join(Course).filter(
        Task.id == task_id,
        Course.user_id == user_id
    ).first_or_404()
    data = request.get_json()
    if "title" in data:
        task.title = data["title"].strip()
    if "type" in data:
        task.type = data["type"]
    if "due_date" in data:
        task.due_date = data["due_date"]
    if "due_time" in data:
        task.due_time = data["due_time"]
    if "weight" in data:
        task.weight = data["weight"]
    db.session.commit()
    return jsonify(task.to_dict())

@app.route("/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.join(Course).filter(
        Task.id == task_id,
        Course.user_id == user_id
    ).first_or_404()
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": f"Task {task_id} deleted"})

@app.route("/tasks/<int:task_id>/complete", methods=["POST"])
@jwt_required()
def toggle_complete(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.join(Course).filter(
        Task.id == task_id,
        Course.user_id == user_id
    ).first_or_404()
    task.completed = not task.completed
    db.session.commit()
    return jsonify(task.to_dict())

# ─── Run app ──────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)