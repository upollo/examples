const functions = require("firebase-functions");

const crypto = require("crypto")

const admin = require("firebase-admin");
admin.initializeApp();

const userwatch = require("@userwatch/node");
const userwatch_key = ""

const uwClient = new userwatch.Userwatch(
  userwatch_key
);

exports.createChallenge = functions.https.onRequest(
  async (request, response) => {
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

    let challengeResp = await uwClient.createChallenge(
      request.body.challengeType,
      userinfo,
      request.body.deviceID,
      request.body.origin
    );

    response
      .status(200)
      .json({
        challengeID: challengeResp.getChallengeid(),
        webauthnCredentials: challengeResp.getWebauthncredentials(),
      })
      .send();
  }
);

exports.register = functions.https.onRequest(async (request, response) => {
  await validate(request, response, true)
});

exports.login = functions.https.onRequest(async (request, response) => {
  await validate(request, response, false)
});

validate = async function(request, response, register) {
  response.set("Access-Control-Allow-Origin", "*");
  if (request.method === "OPTIONS") {
    // Send response to OPTIONS requests
    response.set("Access-Control-Allow-Methods", "POST");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    response.set("Access-Control-Max-Age", "3600");
    response.status(204).send("");
    return;
  }

  var challengeVerification;
  if (request.body.challengeID && (request.body.challengeSecret || request.body.challengeWebauthnResponse)) {
    challengeVerification = new userwatch.ChallengeVerificationRequest();
    challengeVerification.setChallengeid(request.body.challengeID);

    if (request.body.challengeSecret) {
      challengeVerification.setSecretresponse(request.body.challengeSecret);
      challengeVerification.setType(userwatch.ChallengeType.CHALLENGE_TYPE_SMS);
    }
    // Add webauthnResponse if it exists
    if (request.body.challengeWebauthnResponse) {
      // Turn this back from base64 to bytes
      challengeVerification.setType(userwatch.ChallengeType.CHALLENGE_TYPE_WEBAUTHN);
      challengeVerification.setWebauthncredentialresponse();
    }
  }

  userID = crypto.createHash("sha256").update(request.body.username).digest("hex")

  var userInfo = new userwatch.UserInfo()
  userInfo.setUserid(userID)

  // This validates that the token and the information therein is valid and performs the validation check
  // with Userwatch servers

  let result = await uwClient.validate(
    request.body.userwatchToken,
    request.body.userwatchSignature,
    userInfo, 
    register ? userwatch.EventType.REGISTER : userwatch.EventType.LOGIN,
    challengeVerification ? challengeVerification : null
  );

  // TODO report success of registration or login

  if (result.getAction() === userwatch.Outcomes.DENY) {

    // This exists only to allow support for unbanning yourself if you have banned your device
    // In the real world you would not allow this
    response.status(403).json({
      deviceID: result.getDeviceinfo().getDeviceid(),
      userID: userID
    }).send();
    return;
  } else if (result.getAction() === userwatch.Outcomes.CHALLENGE) {
    // Return a 401 with a request for a challenge to be completed
    response
      .status(401)
      .json({
        challenge: true,
        challengeTypes: result.getSupportedchallengesList(),
        deviceID: result.getDeviceinfo().getDeviceid()
      })
      .send();
    return;
  } else {
    // Allow
    response.status(200).json({
      deviceID: result.getDeviceinfo().getDeviceid(),
      userID: userID
    }).send();
    return;
  }
}

exports.listDevices = functions.https.onRequest(async (request, response) => {
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
  let result = await uwClient.getDeviceList(
    request.body.userID
  );
  resultObj = result.toObject();
  response.status(200).json(resultObj).send();

});

exports.blockDevice = functions.https.onRequest(async (request, response) => {
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
  let result = await uwClient.blockDevice(
    request.body.deviceID,
    request.body.userID
  );

  response.status(200).json(result).send();
});

exports.unblockDevice = functions.https.onRequest(async (request, response) => {
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
  let result = await uwClient.unblockDevice(
    request.body.deviceID,
    request.body.userID
  );

  response.status(200).json(result).send();
});
