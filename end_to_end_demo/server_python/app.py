from dotenv import load_dotenv
from flask import Flask, request, Response
from flask_cors import CORS
import grpc
from upollo import upollo, upollo_public_pb2
import getopt
import json
import os
import sys

app = Flask(__name__)
CORS(app)

load_dotenv()

options = {"url": os.getenv('UPOLLO_API_URL')} if os.getenv('UPOLLO_API_URL') else {}
upolloClient = upollo.Upollo(os.getenv('UPOLLO_SECRET_API_KEY'), options)

@app.route("/")
def pythonExample():
    return "<p>Welcome to the Upollo Python example.</p>"

@app.route('/login', methods=['POST'])
def login():
    return register(False)

@app.route('/register', methods=['POST'])
def register(isRegister = True):
    jsonRequest = request.json
    userEmail = jsonRequest["userEmail"]
    eventToken = jsonRequest["eventToken"]

    status = 200
    responseJson = {}

    try:
        validateResponse = upolloClient.verify(
            eventToken,
            upollo_public_pb2.UserInfo(user_email=userEmail)
        )

        flagTypes = list(map(lambda f: f.type, validateResponse.flags))
        isAccountSharing = upollo_public_pb2.ACCOUNT_SHARING in flagTypes
        hadPreviousTrial = upollo_public_pb2.MULTIPLE_ACCOUNTS in flagTypes

        if validateResponse.action == upollo_public_pb2.OUTCOME_DENY:
            print("deny, returning 403")
            status = 403
        elif validateResponse.action == upollo_public_pb2.OUTCOME_CHALLENGE and not (isAccountSharing or hadPreviousTrial):
            print("challenge, returning 401")
            status = 401
        elif validateResponse.action == upollo_public_pb2.OUTCOME_CHALLENGE and (isAccountSharing or hadPreviousTrial):
            print("flag is allowed, returning 200")
            status = 200

        responseJson["userId"] = validateResponse.user_info.user_id
        responseJson["deviceId"] = validateResponse.device_info.device_id
        # If it's a register request, upsell if they have had a previous trail.
        # If it's a login request, upsell if they are account sharing.
        responseJson["upsell"] = hadPreviousTrial if isRegister else isAccountSharing

    except grpc.RpcError as err:
        if err and err.code() == grpc.StatusCode.INVALID_ARGUMENT:
            print("Token was invalid, could be a malicious request, challenge 401")
            status = 401
        else:
            print("Other errors suggest a system issue. Give benefit of the doubt. 200")
            status = 200

    return Response(status=status, response=json.dumps(responseJson, indent=2), content_type="application/json")


def usage():
    print('app.py --port <port>')


if __name__ == "__main__":
    port = 5000
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
