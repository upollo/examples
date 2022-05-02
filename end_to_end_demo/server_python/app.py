from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from userwatch import userwatch
from userwatch import userwatch_public_pb2
import getopt
import sys

app = Flask(__name__)
CORS(app)


privateApiKey = "YOUR_PRIVATE_API_KEY"
userwatchClient = userwatch.Userwatch(privateApiKey)


@app.route("/")
def pythonExample():
    return "<p>Welcome to the Userwatch Python example.</p>"


@app.route('/register', methods=['POST'])
def register():
    jsonRequest = request.json
    username = jsonRequest["username"]
    userwatchToken = jsonRequest["userwatchToken"]

    validateResponse = userwatchClient.validate(
        userwatchToken,
        userwatch_public_pb2.UserInfo(user_name=username),
        userwatch_public_pb2.EVENT_TYPE_REGISTER
    )

    status = 200
    if validateResponse.action == userwatch_public_pb2.OUTCOME_DENY:
        print("deny returning 403")
        status = 403
    if validateResponse.action == userwatch_public_pb2.OUTCOME_CHALLENGE:
        print("challenge returning 401")
        status = 401

    return Response(status=status, response="{}", content_type="application/json")

def usage():
    print('app.py --port <port>')

if __name__ == "__main__":
    port=5000
    try:
        opts, args = getopt.getopt(sys.argv[1:], "hp:", ["port="])
    except getopt.GetoptError:
        usage()
        sys.exit(2)
    for opt, arg in opts:
      if opt == '-h':
         usage()
         sys.exit()
      elif opt in ("-p", "--port"):
         port = arg
    
    app.run(port=port)
