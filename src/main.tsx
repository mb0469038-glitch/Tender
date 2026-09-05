import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SessionProvider } from "./modules/auth/ui/SessionContext";
import { AuthGate } from "./modules/auth/ui/AuthGate";
import { AdminOverlayProvider } from "./modules/auth/ui/AdminOverlay";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SessionProvider>
      <AuthGate>
        <AdminOverlayProvider>
          <App />
        </AdminOverlayProvider>
      </AuthGate>
    </SessionProvider>
  </React.StrictMode>,
);
