import React from "react";
import type { ToastTone } from "../App";

export const Toast: React.FC<{ message: string; tone?: ToastTone }> = ({
  message,
  tone = "info",
}) => (
  <div className={`toast ${tone}`} role="status" aria-live="polite">
    {message}
  </div>
);
