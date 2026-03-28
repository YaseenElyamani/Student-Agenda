from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # pymupdf
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.route("/")
def home():
    return {"message": "Flask is working"}

@app.route("/parse-syllabus", methods=["POST"])
def parse_syllabus():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    # Extract text from PDF
    pdf_bytes = file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()

    # Send to Groq AI
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that extracts assignments, exams, and due dates from university syllabi. Always respond with valid JSON only, no extra text."
            },
            {
                "role": "user",
                "content": f"""Extract all assignments, exams, quizzes, and due dates from this syllabus. 
                Return ONLY a JSON array like this:
                [
                  {{
                    "title": "Assignment 1",
                    "type": "Assignment",
                    "due_date": "2024-02-15",
                    "weight": "10%"
                  }}
                ]
                
                Syllabus text:
                {text[:4000]}"""
            }
        ]
    )

    raw = response.choices[0].message.content.strip()

    # Clean up response
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    import json
    tasks = json.loads(raw)

    return jsonify({"tasks": tasks})

if __name__ == "__main__":
    app.run(debug=True, port=5001)