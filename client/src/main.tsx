import { HelmetProvider } from "react-helmet-async";
import { createRoot } from "react-dom/client";
import App from "./App";
import { reportWebVitals } from "./lib/reportWebVitals";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

reportWebVitals();
