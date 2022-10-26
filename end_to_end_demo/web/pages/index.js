import React from "react";
import { Container, Grid } from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import AuthForm from "../components/auth_form";

import { EventType, UserInfo } from "@upollo/web";

const functionsBaseUrl = process.env.API_URL;

export default function Home(props) {
  const [userId, setUserId] = React.useState("");
  const [deviceId, setDeviceId] = React.useState("");

  const doAuthComplete = (userId, deviceId, register, naughty) => {
    var userInfo = { userId: userId };
    props.upollo.track(userInfo, EventType.EVENT_TYPE_LOGIN_SUCCESS);
    setUserId(userId);
    setDeviceId(deviceId);
    console.log(
      "Auth complete!\n" +
        "  uid=" +
        userId +
        "\n" +
        "  did=" +
        deviceId +
        "\n" +
        (register ? "  register" : "  login") +
        (naughty ? " naughty" : " nice")
    );
    let destination = "offer/";
    if (register) {
      destination += naughty ? "paid" : "free";
    } else {
      destination += naughty ? "team" : "success";
    }
    window.location.href += destination;
  };

  const theme = useTheme();

  return (
    <Container maxWidth="lg">
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        spacing={2}
        style={{
          minHeight: useMediaQuery(theme.breakpoints.up("md")) ? "100vh" : "0",
        }}
      >
        {/* TODO: Should be using sx rather than style, figure out why it's not working. */}
        <Grid
          item
          xs={12}
          md={6}
          style={{
            backgroundImage: "url(/images/saas-register.png)",
            backgroundPosition: "center",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            height: useMediaQuery(theme.breakpoints.up("md"))
              ? "734px"
              : "128px",
          }}
        />
        <Grid item xs={12} md={6}>
          <AuthForm
            baseURL={functionsBaseUrl}
            upollo={props.upollo}
            callback={doAuthComplete}
            deviceId={deviceId}
            userId={userId}
            register={true}
            logo="/images/saas-company.png"
            logoAlt="btect"
          />
        </Grid>
      </Grid>
    </Container>
  );
}
