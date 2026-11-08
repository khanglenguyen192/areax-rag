import { createTheme } from "@mui/material/styles";

// Keep the palette in sync with the CSS custom properties in src/styles/_tokens.scss.
export const theme = createTheme({
  palette: {
    primary: { main: "#3b5bdb" },
    secondary: { main: "#495057" },
    error: { main: "#c92a2a" },
    success: { main: "#2b8a3e" },
    warning: { main: "#e67700" },
    background: { default: "#f6f7fb", paper: "#ffffff" },
    text: { primary: "#1c2333", secondary: "#5b6478" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "var(--font-sans)",
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});
