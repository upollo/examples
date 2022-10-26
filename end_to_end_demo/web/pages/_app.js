import React from "react";
import PropTypes from "prop-types";
import Head from "next/head";
import { ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import theme from "../styles/theme";
import { UpolloClient } from "@upollo/web";

export default function MyApp(props) {
  const { Component, pageProps } = props;

  // Sets a single Upollo client for use across this demo

  const API_KEY = process.env.UPOLLO_API_KEY;
  const API_OPTIONS = process.env.UPOLLO_API_URL
    ? {
        url: process.env.UPOLLO_API_URL,
      }
    : undefined;

  pageProps.upollo = new UpolloClient(API_KEY, API_OPTIONS);

  React.useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <React.Fragment>
      <Head>
        <title>Upollo Demo</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </React.Fragment>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
};
