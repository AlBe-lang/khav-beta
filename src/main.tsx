import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StoreProvider } from "./features/store";
import { App } from "./ui/App";
import "./ui/styles/tokens.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
