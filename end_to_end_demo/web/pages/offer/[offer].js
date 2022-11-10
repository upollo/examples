import React from "react";
import { useRouter } from "next/router";
import {
  Button,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";
import { CheckCircle } from "@material-ui/icons";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { BrandedHeader, WideRow } from "../../components/helpers";
import useLocalStorageState from "use-local-storage-state";

// Page presenting the user with some type of offer, as specified in the url path.
//
// Utilises next.js dynamic routes to identify the offer type, hence the weird filename:
// https://nextjs.org/docs/routing/dynamic-routes
//
// Initial implementation is dumb (non-working buttons, etc) and intended just to
// demo how one might handle users of different classifications.
export default function GiveOffer(props) {
  const theme = useTheme();
  const router = useRouter();
  const { offer } = router.query;

  const [companyName, setCompanyName] = useLocalStorageState("companyName");

  let sellingPoints = [
    "Email Comments and Attachments",
    "Future Recurring Tasks on Calendar",
    "Drag and Drop Attachments",
    "Copy Projects, Spaces and Lists",
    "Natural Language Processing",
    "Firefox and Safari Extensions",
  ];

  // Use the company name to tailor the selling points.
  if (companyName) {
    sellingPoints = [
      "Give your workflow a boost at " + companyName + "!",
    ].concat(sellingPoints);
  }

  const whatsNew = [
    "Natural Language Processing",
    "Firefox and Safari Extensions",
  ];

  let background = "url(/images/saas-offer.png)";
  if (offer === "free" || offer === "success") {
    background = "url(/images/saas-register.png)";
  }

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
        <Grid
          item
          xs={12}
          md={6}
          style={{
            backgroundImage: background,
            backgroundPosition: "center",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            height: useMediaQuery(theme.breakpoints.up("md"))
              ? "640px"
              : "128px",
          }}
        />
        <Grid item xs={12} md={6}>
          {offer === "free" && (
            <Offer
              header="Three Months Free Trial"
              copy="As a special welcome offer, we're offering your first three months for free!"
              packageName="Plus Package"
              sellingPoints={sellingPoints}
              callToAction="Accept Offer"
            />
          )}
          {offer === "paid" && (
            <Offer
              header="$2 for Two Months"
              copy="Looks like you've already redeemed a trial. Try out again for a special price"
              packageName={companyName ? "Corporate Package" : "Deluxe Package"}
              sellingPoints={sellingPoints}
              callToAction="Choose Plan"
            />
          )}
          {offer === "team" && (
            <Offer
              header="Upgrade to Teams"
              copy="Tired of sharing? Get a better experience. Choose a Team plan and bring the team along"
              packageName="Team Plan"
              sellingPoints={["$5 per person"].concat(sellingPoints)}
              callToAction="Choose Plan"
            />
          )}
          {offer === "success" && (
            <Offer
              header="Welcome Back"
              copy="Check out some of the great improvements we've made in the last month"
              packageName="What's new"
              sellingPoints={whatsNew}
              callToAction="Continue"
            />
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

// Component for the actual details of an offer.
function Offer(props) {
  const navigateHome = () => {
    window.location.href = window.location.href.replace(/\/offer\/.*/, "");
  };

  return (
    <Container maxWidth="sm">
      <WideRow>
        <BrandedHeader
          logo="/images/saas-company.png"
          logoAlt="btect"
          text={props.header}
        />
        <div>{props.copy}</div>
      </WideRow>
      <WideRow>
        <h2>{props.packageName}</h2>
        <List>
          {props.sellingPoints.map((point, idx) => {
            return (
              <ListItem key={idx}>
                <ListItemIcon>
                  <CheckCircle color="primary" />
                </ListItemIcon>
                <ListItemText>{point}</ListItemText>
              </ListItem>
            );
          })}
        </List>
      </WideRow>
      <WideRow>
        <Button
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          color="primary"
          onClick={navigateHome}
        >
          {props.callToAction}
        </Button>
      </WideRow>
    </Container>
  );
}
