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

import useLocalStorageState from "use-local-storage-state";

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
  const [userId, setUserId] = useLocalStorageState("userId");
  const [companyName, setCompanyName] = useLocalStorageState("companyName");

  const handleEmailChange = (event) => {
    const email = event.target.value.trim();
    setValues({ ...values, ["email"]: email });
    if (register) {
      if (email.length > 0) {
        props.upollo.checkEmail(email).then((response) => {
          if (!response.valid && email.localeCompare(email) === 0) {
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
            if (response.company && response.company.name) {
              // Save the company name to the local storage so we can use
              // it throughout the web app. For more company fields, see
              // https://github.com/upollo/userwatch-proto/userwatch_public.proto
              setCompanyName(response.company.name);
            } else {
              // Clear company name in case we have a new user.
              setCompanyName(undefined);
            }
          }
        });
      } else {
        setEmailHelperText("yourname@domain.com");
      }
    }
  };

  const handlePasswordChange = (event) => {
    const password = event.target.value;
    setValues({ ...values, ["password"]: password });
    if (register) {
      props.upollo.checkPassword(password).then((response) => {
        if (response.compromised && password.localeCompare(password) === 0) {
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

    // Track that the user is attempting to register or login.
    // You can pass userInfo such as userid, username, email and phone to the track function.
    let userInfo = { userEmail: values.email };
    let response = await props.upollo.track(userInfo, eventType);
    requestJson.eventToken = response.eventToken;
    requestJson.userEmail = values.email;
    // Passwords aren't checked in this demo, so no point sending it

    fetch(props.baseURL + (register ? "register" : "login"), {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(requestJson),
    })
      .then((response) => {
        response.json().then(async (respJson) => {
          if (response.status !== 200) {
            // Ideally we'd show an error message to the user.
            console.log("Server returned an error.");
            return;
          }
          setUserId(respJson.userId);
          // Let whoever set up this auth form know the result
          props.callback(respJson.deviceId, register, respJson.upsell);
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
              onChange={handleEmailChange}
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
              onChange={handlePasswordChange}
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
