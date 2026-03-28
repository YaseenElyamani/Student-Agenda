import os
import re
import json
import fitz  # pymupdf
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.route("/")
def home():
    return {"status": "online", "message": "Syllabus Parser API is running"}

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

        # 4. Request Structured JSON from Groq (Llama 3)
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

        return jsonify(extracted_data)

    except Exception as e:
        print(f"Error processing syllabus: {str(e)}")
        return jsonify({"error": "Internal server error during parsing"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)