import { red } from '@material-ui/core/colors';
import { createTheme } from '@material-ui/core/styles';

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: '#000044',
    },
    secondary: {
      main: '#fff',
      dark: '#000044',
      contrastText: '#fff'
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fff',
    },
    text: {
      primary: '#000000DE',
      dark: '#fff',
      contrastText: '#fff'
    }
  },
});

export default theme;