import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import AdminApp from "@/admin/AdminApp.tsx";
import { registerServiceWorker } from "@/pwa/registerServiceWorker";
import { startSupertonicPreload } from "@/services/supertonic/preload";

startSupertonicPreload();
registerServiceWorker();

const isAdminApp =
  import.meta.env.VITE_FORCE_ADMIN_APP === "true" ||
  window.location.pathname === "/admin" ||
  window.location.pathname === "/admin/";

createRoot(document.getElementById("root")!).render(
  isAdminApp ? <AdminApp /> : <App />,
);
