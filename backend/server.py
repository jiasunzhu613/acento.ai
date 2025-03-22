from flask import Flask, make_response

app = Flask(__name__)

@app.route("/", methods=["GET"])
def index():
    response = make_response("hello world")
    return response