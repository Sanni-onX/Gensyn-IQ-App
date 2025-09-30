import React from "react";
import ReactDOM from "react-dom/client";
import BrevisIQApp from "./App.jsx";  // or whatever your component file is named
import "./index.css";                 // <-- IMPORTANT

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrevisIQApp />
  </React.StrictMode>
);
