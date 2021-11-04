import {
  Button,
  Container,
  FormControl,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  Link,
  TextField,
  Typography,
} from "@material-ui/core";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import React from "react";

import { EmailInvalidReason, EventType, PhoneInvalidReason, ChallengeType, UserInfo } from "@userwatch/web";

import SMSVerification from "./sms_verification";

export default function EmailPassword(props) {
  const [values, setValues] = React.useState({
    password: "",
    email: "",
    showPassword: false,
  });
  const [emailValid, setEmailValid] = React.useState(true);
  const [emailHelperText, setEmailHelperText] = React.useState("yourname@domain.com or +15555555555");
  const [passwordValid, setPasswordValid] = React.useState(true);
  const [passwordHelperText, setPasswordHelperText] = React.useState("Choose something secure, but memorable");

  const [doSmsVerification, setDoSmsVerification] = React.useState(false);
  const [unableToRegister, setUnableToRegister] = React.useState(false);
  const [challengeID, setChallengeID] = React.useState("");
  const [smsSecretCode, setSmsSecretCode] = React.useState("");

  const [showAccountSharingAd, setShowAccountSharingAd] = React.useState(false);

  const handleChange = (prop) => (event) => {
    setValues({ ...values, [prop]: event.target.value });
    if (prop === "email" && props.register) {
      if (event.target.value.startsWith("+") && event.target.value.length > 9) {
        props.userwatch
          .checkPhoneNumber(event.target.value)
          .then((response) => {
            if (!response.getValid() && response.getReason() !== 0) {
              setEmailValid(false);
              setEmailHelperText(
                "This phone number is not valid: " +
                Object.keys(PhoneInvalidReason).find(
                  (key) => PhoneInvalidReason[key] === response.getReason()
                )
              );
            } else {
              setEmailValid(true);
              setEmailHelperText("");
            }
          });
      } else if (event.target.value.length > 0){
        props.userwatch.checkEmail(event.target.value).then((response) => {
          if (
            !response.getValid() &&
            event.target.value.localeCompare(event.target.value) === 0
          ) {
            setEmailValid(false);
            setEmailHelperText(
              "This email is not valid: " +
              Object.keys(EmailInvalidReason).find(
                (key) => EmailInvalidReason[key] === response.getReason()
              )
            );
          } else {
            setEmailValid(true);
            setEmailHelperText("Looks good!");
          }
        });
      } else {
        setEmailHelperText("yourname@domain.com or +15555555555")
      }
    } else if (prop === "password") {
      props.userwatch
        .checkPasswordHash(event.target.value)
        .then((compromised) => {
          if (
            compromised &&
            event.target.value.localeCompare(event.target.value) === 0
          ) {
            setPasswordValid(false);
            setPasswordHelperText("This password has been leaked");
          } else {
            setPasswordValid(true);
            setPasswordHelperText("Choose something secure, but memorable");
          }
        });
    }
  };

  const logout = () => {
    props.userIDCallback("");
  };

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword });
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (event, challengeID, smsSecretCode) => {
    if (event) {
      event.preventDefault();
    }

    let requestJson = {};
    let eventType = EventType.LOGIN
    if (props.register) {
      eventType = EventType.REGISTER
    } 

    // You can pass userInfo such as userid, email and phone to the validate function 
    // because we aren't logged in yet, we do not have knowledge of this so will send blank

    let userInfo = null
    if (values.email) {
      const msgUint8 = new TextEncoder().encode(values.email);                           // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      userInfo = new UserInfo()
      userInfo.setUserid(hashHex)
    }

    let userwatchToken = await props.userwatch.validate(userInfo, eventType, true);
    requestJson.userwatchToken = userwatchToken.getValidationtoken()
    requestJson.userwatchSignature = userwatchToken.getValidationsignature()

    requestJson.username = values.email;

    // Passwords aren't checked in this demo, so no point sending it

    if (challengeID !== "") {
      requestJson.challengeID = challengeID;
    }

    if (smsSecretCode !== "") {
      requestJson.challengeSecret = smsSecretCode;
    }

    // TODO Add in webauthn support here

    let endpoint = 'login';

    if (props.register) {
      endpoint = 'register';
    }

    fetch(props.baseURL + endpoint, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(requestJson)
    }).then((response) => {
      console.log(response)
      if (response.status === 403) {
        // Set some error text 

        setUnableToRegister(true)

        // This is here only to enable unbanning of a device. 
        // Outside of this example you would not do this
        response.json().then(async (respJson) => {
          props.deviceIDCallback(respJson.deviceID)
          props.userIDCallback(respJson.userID);
        });

      } else if (response.status === 200) {
        // Success 
        response.json().then(async (respJson) => {
          props.deviceIDCallback(respJson.deviceID)
          props.userIDCallback(respJson.userID);
          setDoSmsVerification(false);
          if (respJson.accountSharing) {
            setShowAccountSharingAd(true);
          } else {
            setShowAccountSharingAd(false);
          }
        });

      } else if (response.status == 401) {
        // Complete a challenge

        response.json().then(async (respJson) => {
          // set DeviceID and userID
          props.deviceIDCallback(respJson.deviceID)
          //props.userIDCallback(respJson.userID);

          // Randomly pick one of the two types
          // You will probably not want to randomize them
          // instead pick one that you feel fits your situation best
          // Eg. If you need a phone number for notification, sms may be reasonable for sign up 

          const challengeType = respJson.challengeTypes[Math.min(Math.floor(Math.random() * respJson.challengeTypes.length), respJson.challengeTypes.length - 1)]

          if (challengeType === ChallengeType.CHALLENGE_TYPE_WEBAUTHN) {
            // Kick off challenge if Webauthn is supported and show UI 
          } else {
            // Show challenge UI if SMS

            setDoSmsVerification(true);
          }

        })
      }
    })
  }

  const smsVerificationCallback = (challengeDetails) => {
    var [challengeID, challengeSecret] = challengeDetails;
    setChallengeID(challengeID);
    setSmsSecretCode(challengeSecret);
    handleSubmit(null, challengeID, challengeSecret);
  };

  return (
    <Container maxWidth="sm">
      {!unableToRegister && !doSmsVerification && !props.userID &&
      <form onSubmit={handleSubmit}>
        <Grid
          container
          direction="column"
          justifyContent="center"
          alignItems="center"
          spacing={2}
        >
           <Grid 
          container item
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
        >

          <Grid item xs={6}>
            <TextField
            fullWidth
              label="Email or Phone #"
              id="email"
              value={values.email}
              onChange={handleChange("email")}
              helperText={emailHelperText}
              error={!emailValid}
            />
          </Grid>
          </Grid>
          <Grid
          container item
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
        >
          <Grid item xs={6}>
            <TextField
            fullWidth
              label="Password"
              id="password"
              type={values.showPassword ? "text" : "password"}
              value={values.password}
              onChange={handleChange("password")}
              helperText={props.register ? passwordHelperText : " "}
              error={!passwordValid && props.register}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                    >
                      {values.showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            </Grid>
          </Grid>
          <Grid item>
            <Button type="submit" variant="contained" color="primary">Continue</Button>
          </Grid>
        </Grid>
      </form>}

      {unableToRegister && <Grid container direction="column" justifyContent="center" alignItems="center" spacing={2}>
        <Grid item>
          <Typography align="center">For security reasons, you will need to <Link>contact support</Link> to activate your account.</Typography>
        </Grid>
        <Grid item>
          <Typography align="center">If you have already signed up for this service, please try logging into your existing account.</Typography>
        </Grid>
        <Grid item>
          <Typography align="center">When contacting support please quote reference: AL2744TT</Typography>
        </Grid>
      </Grid>}

      {doSmsVerification && <SMSVerification baseURL={props.baseURL} deviceID={props.deviceID} verifyCallback={smsVerificationCallback} />}

      {!doSmsVerification && !unableToRegister && props.userID && 
      <Grid container direction="column" justifyContent="center" alignItems="center" spacing={2}>
        <Grid item>
          <Typography align="center">Logged in!</Typography>
        </Grid>
        <Grid item>
          <Typography  align="center">UserID: {props.userID}</Typography>
        </Grid>
        <Grid item>
          <Typography  align="center">deviceID: {props.deviceID}</Typography>
        </Grid>
        <Grid item>
            <Button variant="contained" color="primary" onClick={logout}>Logout</Button>
        </Grid>

        {showAccountSharingAd && <Grid item>
            <Link>Try our team product. Perfect for small teams like yours</Link>
        </Grid>}
      </Grid>
      }
    </Container>
  );
}


