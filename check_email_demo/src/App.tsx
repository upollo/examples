import { Box, Button, Container, IconButton, Link, TextField, ThemeProvider, Typography } from '@mui/material';
import { EmailInvalidReason, UpolloClient } from "@upollo/web";
import {
  uwproto_CheckEmailResponse, uwproto_EmailType
} from "@upollo/web/proto";
import React from "react";
import theme, { themeExtras } from "./material-theme";


function App() {
  const [upollo] = React.useState(
    () =>
    process.env.REACT_APP_UPOLLO_API_KEY &&
      new UpolloClient(process.env.REACT_APP_UPOLLO_API_KEY)
  );
  const [email, setEmail] = React.useState("");
  const [result, setResult] = React.useState<uwproto_CheckEmailResponse>();

  if (!upollo) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="sm" sx={{mt: 20}} >
          <Typography>API key not found.</Typography>
        </Container>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm" sx={{mt: 20}} >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            upollo.checkEmail(email).then((result) => {
              console.log(result);
              setResult(result);
            });
          }}
        >
          <Typography variant="h1" >Check Email Demo</Typography>
          <Typography>Enter an email:</Typography>
          <TextField
            type="text"
            value={email}
            fullWidth
            name="email"
            placeholder="name@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button variant="contained" type="submit" fullWidth sx={{ mt: 3 }} >Check</Button>
        </form>
        {result && <EmailCheckResult result={result} />}
        <Box sx={{ display: "flex", alignItems: "center", mt: 3 }}>
          <Typography>
            Powered by:
          </Typography>
        <Link
          href="https://upollo.ai"
          aria-label="Upollo logo"
          component={IconButton}
        >
          <img
            src="./upollo.svg"
            height="27px"
            width="27px"
            alt="Upollo logo"
          />
        </Link>
          <Link variant="h5" sx={{
            fontSize: "1.75rem",
          }}
          color="textPrimary"
          underline="none"
          href="https://upollo.ai" >Upollo</Link>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

function EmailCheckResult(props: { result: uwproto_CheckEmailResponse }) {
  if (props.result.valid) {
    return (
      <Box mt={3} >
        <Typography variant="h2" color={themeExtras.palette.success.main} >Valid</Typography>
        <Typography>
          {props.result.emailType && (
            <>
              <b>Type:</b> {typeToString(props.result.emailType)}
              <br />
            </>
          )}
          {props.result.company?.name && (
            <>
              <b>Company name:</b> {props.result.company.name}
              <br />
            </>
          )}
          {props.result.company?.industry && (
            <>
              <b>Industry:</b> {props.result.company.industry}
              <br />
            </>
          )}
          {props.result.company?.companySize && (
            <>
              <b>Number of Employees:</b>{" "}
              {props.result.company.companySize.employeesMin} -{" "}
              {props.result.company.companySize.employeesMax}
              <br />
            </>
          )}
          {props.result && (
            <>
              <b>Raw:</b> <code>{JSON.stringify(props.result)}</code>
            </>
          )}
        </Typography>
      </Box>
    );
  }

  return (
    <Box mt={3} >
      <Typography variant="h2" color={themeExtras.palette.danger.main}>Invalid Email</Typography>
      <Typography>Reason: {reasonToString(props.result.reason)}</Typography>
    </Box>
  );
}

function reasonToString(reason?: EmailInvalidReason) {
  switch (reason) {
    case EmailInvalidReason.EMAIL_INVALID_REASON_FORMAT:
      return "Invalid format";
    case EmailInvalidReason.EMAIL_INVALID_REASON_INVALID_DOMAIN:
      return "Invalid domain";
    case EmailInvalidReason.EMAIL_INVALID_REASON_DISPOSABLE:
      return "Disposable email domain";
    case EmailInvalidReason.EMAIL_INVALID_REASON_INVALID_USER:
      return "Invalid user";
    default:
      return "";
  }
}

function typeToString(type?: uwproto_EmailType) {
  // currently @upollo/web does not export the company type enum currently so we need to use numbers.
  switch (type) {
    case 1:
      return "Public";
    case 2:
      return "Disposable";
    case 3:
      return "Company";
    case 4:
      return "Other";
    case 5:
      return "Education";
    case 6:
      return "Not for profit";
    default:
      return "";
  }
}

export default App;
