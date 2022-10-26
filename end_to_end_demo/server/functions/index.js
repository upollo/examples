const functions = require("firebase-functions");

const crypto = require("crypto");

const admin = require("firebase-admin");
admin.initializeApp();

require("dotenv").config();
const upollo = require("@upollo/node");
const UPOLLO_API_KEY = process.env.UPOLLO_API_KEY;
const UPOLLO_API_OPTIONS = process.env.UPOLLO_API_URL ?
    {url: process.env.UPOLLO_API_URL} : {};
const upClient = new upollo.Upollo(UPOLLO_API_KEY, UPOLLO_API_OPTIONS);

exports.createChallenge = functions.https.onRequest((request, response) => {
  // This should be set to allow your servers rather than any URL
  response.set("Access-Control-Allow-Origin", "*");

  if (request.method === "OPTIONS") {
    // Send response to OPTIONS requests
    response.set("Access-Control-Allow-Methods", "POST");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    response.set("Access-Control-Max-Age", "3600");
    response.status(204).send("");
    return;
  }

  // Create userInfo object
  const userinfo = {};

  // Check which challenge type to create
  if (
    request.body.challengeType === upollo.ChallengeType.CHALLENGE_TYPE_SMS
  ) {
    userinfo.userPhone = request.body.phoneNumber;
  }

  return upClient
      .createChallenge(
          request.body.challengeType,
          userinfo,
          request.body.deviceId,
          request.body.origin
      )
      .then((challengeResp) => {
        response
            .status(200)
            .json({
              challengeId: challengeResp.challengeId,
              webauthnCredentials: challengeResp.webauthnCredentials,
            })
            .send();
      });
});

exports.register = functions.https.onRequest((request, response) => {
  return exports.validate(request, response, true);
});

exports.login = functions.https.onRequest((request, response) => {
  return exports.validate(request, response, false);
});

exports.validate = function(request, response, register) {
  response.set("Access-Control-Allow-Origin", "*");
  if (request.method === "OPTIONS") {
    // Send response to OPTIONS requests
    response.set("Access-Control-Allow-Methods", "POST");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    response.set("Access-Control-Max-Age", "3600");
    response.status(204).send("");
    return;
  }

  let challengeVerification;
  if (
    request.body.challengeId &&
    (request.body.challengeSecret || request.body.challengeWebauthnResponse)
  ) {
    challengeVerification = {};
    challengeVerification.challengeId = request.body.challengeId;

    if (request.body.challengeSecret) {
      challengeVerification.secretResponse = request.body.challengeSecret;
      challengeVerification.type = upollo.ChallengeType.CHALLENGE_TYPE_SMS;
    }
    // Add webauthnResponse if it exists
    if (request.body.challengeWebauthnResponse) {
      // Turn this back from base64 to bytes
      challengeVerification.type =
        upollo.ChallengeType.CHALLENGE_TYPE_WEBAUTHN;
    }
  }

  const userId = crypto
      .createHash("sha256")
      .update(request.body.username)
      .digest("hex");

  const userInfo = {};
  userInfo.userId = userId;

  // This validates that the token and the information therein is valid
  // and performs the validation check with Upollo servers

  return upClient
      .verify(
          request.body.upolloToken,
          userInfo,
          challengeVerification ? challengeVerification : null
      )
      .then((result) => { // Handle the AnalysisResponse
        let isAccountSharing = false;
        result.flags.forEach((flag) => {
          if (flag.type === upollo.FlagType.ACCOUNT_SHARING) {
            isAccountSharing = true;
          }
        });

        if (result.action === upollo.Outcome.OUTCOME_DENY) {
        // This exists only to allow support for unbanning yourself
        // if you have banned your device
        // In the real world you would not allow this
          response
              .status(403)
              .json({
                deviceId: result.deviceInfo.deviceId,
                userId: userId,
              })
              .send();
          return;
        } else if (
          result.action === upollo.Outcome.OUTCOME_CHALLENGE &&
        !isAccountSharing
        ) {
        // Return a 401 with a request for a challenge to be completed
          response
              .status(401)
              .json({
                challenge: true,
                challengeTypes: result.supportedChallenges,
                deviceId: result.deviceInfo.deviceId,
              })
              .send();
          return;
        } else if (
          result.action === upollo.Outcome.OUTCOME_CHALLENGE &&
        isAccountSharing
        ) {
        // Return a 200 with a flag to show an ad
          response
              .status(200)
              .json({
                deviceId: result.deviceInfo.deviceId,
                userId: userId,
                accountSharing: true,
              })
              .send();
          return;
        } else {
        // Allow
          response
              .status(200)
              .json({
                deviceId: result.deviceInfo.deviceId,
                userId: userId,
              })
              .send();
          return;
        }
      })
      .catch((err) => {
        console.error("unexpected error validating", err);
        throw err;
      });

  // TODO report success of registration or login
};

exports.listDevices = functions.https.onRequest((request, response) => {
  // This should be set to allow your servers
  response.set("Access-Control-Allow-Origin", "*");

  if (request.method === "OPTIONS") {
    // Send response to OPTIONS requests
    response.set("Access-Control-Allow-Methods", "POST");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    response.set("Access-Control-Max-Age", "3600");
    response.status(204).send("");
    return;
  }

  // This is for demo purposes only!
  // You should never trust data like this directly from the client
  return upClient.getDeviceList(request.body.userId).then((result) => {
    response.status(200).json(result).send();
  });
});

exports.blockDevice = functions.https.onRequest((request, response) => {
  response.set("Access-Control-Allow-Origin", "*");

  if (request.method === "OPTIONS") {
    // Send response to OPTIONS requests
    response.set("Access-Control-Allow-Methods", "POST");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    response.set("Access-Control-Max-Age", "3600");
    response.status(204).send("");
    return;
  }

  // This is for demo purposes only!
  // You should never trust data like this directly from the client

  // If userId is not given, this will block globally
  return upClient
      .blockDevice(request.body.deviceId, request.body.userId)
      .then((result) => {
        response.status(200).json(result).send();
      });
});

exports.unblockDevice = functions.https.onRequest((request, response) => {
  response.set("Access-Control-Allow-Origin", "*");

  if (request.method === "OPTIONS") {
    // Send response to OPTIONS requests
    response.set("Access-Control-Allow-Methods", "POST");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    response.set("Access-Control-Max-Age", "3600");
    response.status(204).send("");
    return;
  }

  // This is for demo purposes only!
  // You should never trust data like this directly from the client

  // If userId is not given, this will unblock globally
  return upClient
      .unblockDevice(request.body.deviceId, request.body.userId)
      .then((result) => {
        response.status(200).json(result).send();
      });
});
