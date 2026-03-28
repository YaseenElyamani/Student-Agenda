# backend/app.py
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows React to talk to Flask

@app.route("/")
def home():
    return {"message": "Flask is working"}

if __name__ == "__main__":
    app.run(debug=True)