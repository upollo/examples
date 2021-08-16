import React from "react";
import {
    Button,
    Container,
    FormControl,
    Grid,
    IconButton,
    Input,
    InputAdornment,
    InputLabel,
    TextField,
    Typography,
} from "@material-ui/core";

import { ChallengeType } from "@userwatch/web";

export default function SMSVerification(props) {

    const [phoneNumber, setPhoneNumber] = React.useState("phoneNumber" in props ? props.phoneNumber : "");
    const [phoneValid, setPhoneValid] = React.useState(true);
    const [phoneHelperText, setPhoneHelperText] = React.useState("");

    const [getSecretCode, setGetSecretCode] = React.useState(phoneNumber in props);

    const [secretCode, setSecretCode] = React.useState("");

    const [challengeID, setChallengeID]  = React.useState("");

    const handleChangePhoneNumber = (event) => {
        setPhoneNumber(event.target.value);
    }

    const handleChangeSecretCode = (event) => {
        setSecretCode(event.target.value);
    }

    const handleSubmitPhoneNumber = (event) => {
        event.preventDefault();
        fetch(props.baseURL + "createChallenge", {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
            body: JSON.stringify({ challengeType: ChallengeType.CHALLENGE_TYPE_SMS, phoneNumber: phoneNumber, deviceID: props.deviceID, origin: window.location.href })
          }).then((response) => {
              response.json().then((respJson) => {
                  setChallengeID(respJson.challengeID)
                setGetSecretCode(true);
              })
          }).catch((error) => {
            setPhoneValid(false)
            setPhoneHelperText("Could not verify this number. Please try another number")
          })

    }

    const verify = (event) => {
        event.preventDefault();
        // Do callback if it exists 

        if (props.verifyCallback && secretCode !== "") {
            props.verifyCallback([challengeID, secretCode]);
        }
    }

    return (
        // Component 1: Phone number input (skipped if number was used for sign in/up)
        <Container>
            {!getSecretCode &&
            <form onSubmit={handleSubmitPhoneNumber}>
                <Grid
                    container
                    direction="column"
                    justifyContent="center"
                    alignItems="flex-start"
                    spacing={2}
                >
                    <Grid item>
                        <Typography>Please enter a phone number that we can send a verification code to</Typography>
                    </Grid>
                    <Grid item>
                        <TextField
                            label="Phone #"
                            id="phone"
                            value={phoneNumber}
                            onChange={handleChangePhoneNumber}
                            helperText={phoneHelperText}
                            error={!phoneValid}
                        />
                    </Grid>
                    <Grid item>
                        <Button type="submit" variant="contained">Continue</Button>
                    </Grid>
                </Grid>
            </form>}

            {/* Component 2: Verification input (Calls back to function given) */}

            {getSecretCode &&
            <form onSubmit={verify}>
                <Grid
                    container
                    direction="column"
                    justifyContent="center"
                    alignItems="flex-start"
                    spacing={2}
                >
                    <Grid item>
                        <Typography>Please enter the verification code sent to <b>{phoneNumber}</b></Typography>
                    </Grid>
                    <Grid item>
                        <TextField
                            label="Verification code"
                            id="secretCode"
                            value={secretCode}
                            onChange={handleChangeSecretCode}
                        />
                    </Grid>
                    <Grid item>
                        <Button type="submit" variant="contained">Verify</Button>
                        <Button onClick={handleSubmitPhoneNumber} variant="text">resend</Button>
                    </Grid>
                </Grid>
            </form>}
        </Container>
    );
}