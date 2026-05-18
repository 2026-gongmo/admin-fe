import React from "react";
import { Sidebar } from "./Sidebar";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-col">{children}</div>
    </div>
  );
};
