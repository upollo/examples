import { Grid } from "@material-ui/core";
import PropTypes from "prop-types";

export function BrandedHeader(props) {
  return (
    <>
      <img src={props.logo} alt={props.logoAlt} />
      <h1>{props.text}</h1>
    </>
  );
}

export function WideRow({ children }) {
  return (
    <Grid
      container
      item
      direction="row"
      justifyContent="center"
      alignItems="center"
      spacing={2}
    >
      <Grid item xs={10}>
        {children}
      </Grid>
    </Grid>
  );
}

WideRow.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.element.isRequired,
  ]),
};
