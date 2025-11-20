import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./style.css";
import '@/assets/pico.min.css'
import GlobalError from "@/components/GlobalError.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalError>
      <App />
    </GlobalError>
  </React.StrictMode>
);