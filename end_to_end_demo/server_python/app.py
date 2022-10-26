from dotenv import load_dotenv
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import grpc
from upollo import upollo, upollo_public_pb2
import getopt
import os
import sys

app = Flask(__name__)
CORS(app)

load_dotenv()

options = {"url": os.getenv('UPOLLO_API_URL')} if os.getenv('UPOLLO_API_URL') else {}
upolloClient = upollo.Upollo(os.getenv('UPOLLO_API_KEY'), options)

@app.route("/")
def pythonExample():
    return "<p>Welcome to the Upollo Python example.</p>"


@app.route('/register', methods=['POST'])
def register():
    jsonRequest = request.json
    username = jsonRequest["username"]
    upolloToken = jsonRequest["upolloToken"]

    status = 200

    try:
        validateResponse = upolloClient.verify(
            upolloToken,
            upollo_public_pb2.UserInfo(user_name=username)
        )
        if validateResponse.action == upollo_public_pb2.OUTCOME_DENY:
            print("deny returning 403")
            status = 403
        if validateResponse.action == upollo_public_pb2.OUTCOME_CHALLENGE:
            print("challenge returning 401")
            status = 401

    except grpc.RpcError as err:
        if err and err.code() == grpc.StatusCode.INVALID_ARGUMENT:
            print("Token was invalid, could be a malicious request, challenge 401")
            status = 401
        else:
            print("Other errors suggest a system issue. Give benefit of the doubt. 200")
            status = 200

    return Response(status=status, response="{}", content_type="application/json")


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
