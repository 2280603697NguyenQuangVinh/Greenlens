import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startSupertonicPreload } from "@/services/supertonic/preload";

startSupertonicPreload();

createRoot(document.getElementById("root")!).render(<App />);
