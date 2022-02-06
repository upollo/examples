const functions = require("firebase-functions");

const crypto = require("crypto");

const admin = require("firebase-admin");
admin.initializeApp();

const userwatch = require("@userwatch/node");
const userwatchKey =
  // eslint-disable-next-line max-len
  "ADD_KEY_HERE";

const uwClient = new userwatch.Userwatch(userwatchKey);

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
  const userinfo = new userwatch.UserInfo();

  // Check which challenge type to create
  if (
    request.body.challengeType === userwatch.ChallengeType.CHALLENGE_TYPE_SMS
  ) {
    userinfo.setUserphone(request.body.phoneNumber);
  }

  return uwClient
      .createChallenge(
          request.body.challengeType,
          userinfo,
          request.body.deviceID,
          request.body.origin
      )
      .then((challengeResp) => {
        response
            .status(200)
            .json({
              challengeID: challengeResp.getChallengeid(),
              webauthnCredentials: challengeResp.getWebauthncredentials(),
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
    request.body.challengeID &&
    (request.body.challengeSecret || request.body.challengeWebauthnResponse)
  ) {
    challengeVerification = new userwatch.ChallengeVerificationRequest();
    challengeVerification.setChallengeid(request.body.challengeID);

    if (request.body.challengeSecret) {
      challengeVerification.setSecretresponse(request.body.challengeSecret);
      challengeVerification.setType(userwatch.ChallengeType.CHALLENGE_TYPE_SMS);
    }
    // Add webauthnResponse if it exists
    if (request.body.challengeWebauthnResponse) {
      // Turn this back from base64 to bytes
      challengeVerification.setType(
          userwatch.ChallengeType.CHALLENGE_TYPE_WEBAUTHN
      );
      challengeVerification.setWebauthncredentialresponse();
    }
  }

  const userID = crypto
      .createHash("sha256")
      .update(request.body.username)
      .digest("hex");

  const userInfo = new userwatch.UserInfo();
  userInfo.setUserid(userID);

  // This validates that the token and the information therein is valid
  // and performs the validation check with Userwatch servers

  // "45d95f9b26ea6a8ff736459ef5aa99de3745c15eb2087770af36523cb434f90a"

  return uwClient
      .validate(
          request.body.userwatchToken,
          request.body.userwatchSignature,
          userInfo,
      register ? userwatch.EventType.REGISTER : userwatch.EventType.LOGIN,
      challengeVerification ? challengeVerification : null
      )
      .then((result) => {
        let isAccountSharing = false;
        result.getFlagList().forEach((flag) => {
          if (flag.getType() === userwatch.FlagType.ACCOUNT_SHARING) {
            isAccountSharing = true;
          }
        });

        if (result.getAction() === userwatch.Outcomes.DENY) {
        // This exists only to allow support for unbanning yourself
        // if you have banned your device
        // In the real world you would not allow this
          response
              .status(403)
              .json({
                deviceID: result.getDeviceinfo().getDeviceid(),
                userID: userID,
              })
              .send();
          return;
        } else if (
          result.getAction() === userwatch.Outcomes.CHALLENGE &&
        !isAccountSharing
        ) {
        // Return a 401 with a request for a challenge to be completed
          response
              .status(401)
              .json({
                challenge: true,
                challengeTypes: result.getSupportedchallengesList(),
                deviceID: result.getDeviceinfo().getDeviceid(),
              })
              .send();
          return;
        } else if (
          result.getAction() === userwatch.Outcomes.CHALLENGE &&
        isAccountSharing
        ) {
        // Return a 200 with a flag to show an ad
          response
              .status(200)
              .json({
                deviceID: result.getDeviceinfo().getDeviceid(),
                userID: userID,
                accountSharing: true,
              })
              .send();
          return;
        } else {
        // Allow
          response
              .status(200)
              .json({
                deviceID: result.getDeviceinfo().getDeviceid(),
                userID: userID,
              })
              .send();
          return;
        }
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
  return uwClient.getDeviceList(request.body.userID).then((result) => {
    const resultObj = result.toObject();
    response.status(200).json(resultObj).send();
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

  // If userID is not given, this will block globally
  return uwClient
      .blockDevice(request.body.deviceID, request.body.userID)
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

  // If userID is not given, this will unblock globally
  return uwClient
      .unblockDevice(request.body.deviceID, request.body.userID)
      .then((result) => {
        response.status(200).json(result).send();
      });
});
