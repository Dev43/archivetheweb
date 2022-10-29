import { extendTheme } from "@chakra-ui/react";

// 3. extend the theme
const theme = extendTheme({
  heading: {
    default: "grey",
  },
  text: {
    default: "grey",
  },
  fonts: {
    heading: "Space Grotesk",
  },
  colors: {
    primary: "#EF6461",
    secondary: "rgb(23,22,145)",
    tertiary: "rgb(23,22,145)",
  },
  styles: {
    global: {
      "html, body": {
        background: "white",
        "min-height": "100vh",
        "font-family": "Space Grotesk",
        transition: "all 300ms",
      },
    },
  },
});

export default theme;
