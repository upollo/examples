import React from "react";
import { Container, Grid } from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import AuthForm from "../components/auth_form";
import { useRouter } from "next/router";
import useLocalStorageState from "use-local-storage-state";

import { EventType } from "@upollo/web";

const functionsBaseUrl = process.env.API_URL;

export default function Home(props) {
  const router = useRouter();
  const [deviceId, setDeviceId] = React.useState("");
  const [userId, setUserId] = useLocalStorageState("userId");
  const [companyName, setCompanyName] = useLocalStorageState("companyName");

  const doAuthComplete = (deviceId, register, upsell) => {
    var userInfo = { userId: userId };
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
        "\n" +
        (upsell ? " upsell" : " no upsell") +
        "\n" +
        "  company=" +
        companyName +
        "\n"
    );

    // Track the successful register/login event.
    const eventType = register
      ? EventType.EVENT_TYPE_REGISTER_SUCCESS
      : EventType.EVENT_TYPE_LOGIN_SUCCESS;
    props.upollo.track(userInfo, eventType).then(() => {
      // Once the track call completes, navigate to the offer page.
      let destination = "offer/";
      if (register) {
        destination += upsell ? "paid" : "free";
      } else {
        destination += upsell ? "team" : "success";
      }
      router.push(destination);
    });
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
