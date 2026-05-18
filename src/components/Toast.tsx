import React from "react";

export const Toast: React.FC<{ message: string }> = ({ message }) => (
  <div className="toast" role="status" aria-live="polite">
    {message}
  </div>
);
