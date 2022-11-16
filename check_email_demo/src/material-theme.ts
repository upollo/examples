import { createTheme } from "@mui/material/styles";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/signika/300.css";
import "@fontsource/signika/400.css";
import "@fontsource/signika/500.css";
import "@fontsource/signika/700.css";

export const themeExtras = {
  palette: {
    primary: {
      main: "linear-gradient(117.03deg, #FFA51E 3.13%, #FA5A92 100%), #126065;",
    },
    danger: {
      main: "#CC4844",
    },
    success: {
      main: "#84BD82",
    },
  },
};

const theme = createTheme({
  palette: {
    primary: {
      main: "#FB6262",
      light: "#3D3D3D",
      contrastText: "#999999",
    },
    secondary: {
      main: "#fff",
      dark: "#000044",
      light: "#707070",
      contrastText: "#fff",
    },
  },
  typography: {
    allVariants: {
      fontFamily: '"Signika","Roboto", "Helvetica", "Arial", sans-serif',
    },
    h1: {
      fontSize: "3.5rem", // 56px
      lineHeight: "4.5rem",
      fontWeight: 600,
    },
    h2: {
      // Heading XL
      fontSize: "2.75rem", // 44px
      lineHeight: "3.5rem",
      fontWeight: 600,
    },
    h3: {
      // Heading L
      fontSize: "2.25rem", // 36px
      lineHeight: "3rem",
      fontWeight: 500,
    },
    h4: {
      // Heading M
      fontSize: "1.75rem", // 28px
      lineHeight: "2.25rem",
      fontWeight: 500,
    },
    h5: {
      // Heading S
      fontSize: "1.25rem", // 20px
      lineHeight: "1.5rem",
      fontWeight: 400,
    },
    body1: {
      // Text M
      fontSize: "0.875rem", // 14px
      lineHeight: "1.25rem",
      fontWeight: 300,
    },
    body2: {
      // Text S
      fontSize: "0.75rem", // 12px
      lineHeight: "1.25rem",
      fontWeight: 300,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.variant === "contained" && {
            boxShadow: "none",
          }),
          ...(ownerState.variant === "contained" &&
            ownerState.color === "primary" && {
              color: "white",
              background: themeExtras.palette.primary.main,
              ":hover": {
                color: "white",
              },
            }),
            textTransform: "none",
        }),
      },
    },
  },
});

export default theme;
