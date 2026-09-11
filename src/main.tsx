import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { SessionProvider } from "./modules/auth/ui/SessionContext";
import { AuthGate } from "./modules/auth/ui/AuthGate";
import { AdminOverlayProvider } from "./modules/auth/ui/AdminOverlay";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <AuthGate>
          <AdminOverlayProvider>
            <App />
          </AdminOverlayProvider>
        </AuthGate>
      </SessionProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
