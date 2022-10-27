import {
  Button,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  TextField,
} from "@material-ui/core";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import React from "react";

import { EmailInvalidReason, EventType } from "@upollo/web";

import { BrandedHeader, WideRow } from "./helpers";

export default function AuthForm(props) {
  const [register, setRegister] = React.useState(props.register);
  const [values, setValues] = React.useState({
    password: "",
    email: "",
    showPassword: false,
  });
  const [emailValid, setEmailValid] = React.useState(true);
  const [emailHelperText, setEmailHelperText] = React.useState(
    "yourname@domain.com"
  );
  const [passwordValid, setPasswordValid] = React.useState(true);
  const [passwordHelperText, setPasswordHelperText] = React.useState(
    "Choose something secure, but memorable"
  );
  const [waiting, setWaiting] = React.useState(false);

  const handleChange = (prop) => (event) => {
    setValues({ ...values, [prop]: event.target.value });
    if (prop === "email" && register) {
      if (event.target.value.length > 0) {
        props.upollo.checkEmail(event.target.value).then((response) => {
          if (
            !response.valid &&
            event.target.value.localeCompare(event.target.value) === 0
          ) {
            setEmailValid(false);
            setEmailHelperText(
              "This email is not valid: " +
                Object.keys(EmailInvalidReason).find(
                  (key) => EmailInvalidReason[key] === response.reason
                )
            );
          } else {
            setEmailValid(true);
            setEmailHelperText("Looks good!");
          }
        });
      } else {
        setEmailHelperText("yourname@domain.com");
      }
    } else if (prop === "password") {
      props.upollo.checkPassword(event.target.value).then((response) => {
        if (
          response.compromised &&
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

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword });
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault();
    }
    setWaiting(true);

    let requestJson = {};
    let eventType = register
      ? EventType.EVENT_TYPE_REGISTER
      : EventType.EVENT_TYPE_LOGIN;

    // You can pass userInfo such as userid, email and phone to the track function.
    // Because we aren't logged in yet, we do not have knowledge of this so will send blank.

    let userInfo = {};
    if (values.email) {
      const msgUint8 = new TextEncoder().encode(values.email); // encode as (utf-8) Uint8Array
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
      const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      userInfo = { userId: hashHex };
    }

    let upolloToken = await props.upollo.track(userInfo, eventType, true);
    requestJson.upolloToken = upolloToken.eventToken;

    requestJson.username = values.email;
    // Passwords aren't checked in this demo, so no point sending it

    fetch(props.baseURL + (register ? "register" : "login"), {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(requestJson),
    })
      .then((response) => {
        console.log(response);
        response.json().then(async (respJson) => {
          // In all cases except account sharing, the status code is sufficient to know
          // how legit the user is.
          let naughty = response.status !== 200;
          if (!register) {
            naughty = naughty || respJson.accountSharing;
          }
          // Let whoever set up this auth form know the result
          props.callback(respJson.userId, respJson.deviceId, register, naughty);
        });
      })
      .finally(() => setWaiting(false));
  };

  return (
    <Container maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <Grid
          container
          direction="column"
          justifyContent="center"
          alignItems="center"
          spacing={4}
        >
          <WideRow>
            <div>
              <BrandedHeader
                logo={props.logo}
                logoAlt={props.logoAlt}
                text={register ? "Register Account" : "Welcome Back"}
              />
              {register && (
                <div>
                  Already have an account?{" "}
                  <Link
                    onClick={() => {
                      setRegister(false);
                    }}
                  >
                    Sign in
                  </Link>
                </div>
              )}
              {!register && (
                <div>
                  Don&apos;t have an account?{" "}
                  <Link
                    onClick={() => {
                      setRegister(true);
                    }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </WideRow>
          <WideRow>
            <TextField
              fullWidth
              variant="outlined"
              label="Enter email address"
              id="email"
              value={values.email}
              onChange={handleChange("email")}
              helperText={emailHelperText}
              error={!emailValid}
            />
          </WideRow>
          <WideRow>
            <TextField
              fullWidth
              variant="outlined"
              label="Enter password"
              id="password"
              type={values.showPassword ? "text" : "password"}
              value={values.password}
              onChange={handleChange("password")}
              helperText={
                register ? (
                  passwordHelperText
                ) : (
                  <Link>Forgot your password?</Link>
                )
              }
              error={!passwordValid && register}
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
          </WideRow>
          {register && (
            <WideRow>
              <div>
                By clicking Register, I agree that I have read and accepted the{" "}
                <Link>Terms of Use</Link> and <Link>Privacy Policy</Link>.
              </div>
            </WideRow>
          )}
          <WideRow>
            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              color="primary"
              disabled={waiting}
            >
              {register ? "Register" : "Sign in"}
            </Button>
          </WideRow>
        </Grid>
      </form>
    </Container>
  );
}
