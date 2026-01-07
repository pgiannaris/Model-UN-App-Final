import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

import { createTheme, ThemeProvider } from "flowbite-react";

// To customize the theme refer to:
// https://flowbite-react.com/docs/customize/theme
const customTheme = createTheme({
  button: {
    color: {
      testColor: "bg-red-500 hover:bg-red-600",
    },
  },
});

const queryClient = new QueryClient();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element with ID 'root' not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={customTheme}>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
