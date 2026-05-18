import React, { useState, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Toast } from "./components/Toast";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportsPage } from "./pages/ReportsPage";
import { PublicDataPage } from "./pages/PublicDataPage";
import { AnalysisPage } from "./pages/AnalysisPage";
import { HelpRequestsPage } from "./pages/HelpRequestsPage";
import { StoriesPage } from "./pages/StoriesPage";
import { WorkflowPage } from "./pages/WorkflowPage";
import { MonthlyReportPage } from "./pages/MonthlyReportPage";
import { DemoGuidePage } from "./pages/DemoGuidePage";
import { SettingsPage } from "./pages/SettingsPage";

interface ToastState {
  id: number;
  message: string;
}

export const ToastContext = React.createContext<{
  showToast: (msg: string) => void;
}>({ showToast: () => {} });

export default function App() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToast({ id, message });
    setTimeout(() => {
      setToast((cur) => (cur && cur.id === id ? null : cur));
    }, 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/public-data" element={<PublicDataPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/help-requests" element={<HelpRequestsPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/workflow" element={<WorkflowPage />} />
          <Route path="/monthly-report" element={<MonthlyReportPage />} />
          <Route path="/demo-guide" element={<DemoGuidePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
      {toast && <Toast message={toast.message} />}
    </ToastContext.Provider>
  );
}
