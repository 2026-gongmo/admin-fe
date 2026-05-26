import React, { useState, useCallback, useEffect } from "react";
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
import { NotFoundPage } from "./pages/NotFoundPage";
import { AccessDeniedPage } from "./pages/AccessDeniedPage";
import { LoginPage } from "./pages/LoginPage";
import { getCurrentAdmin, isHttpMode, loginAdmin, logoutAdmin } from "./services/api";
import { getStoredToken, isDemoAutoLoginEnabled } from "./services/httpClient";
import type { AdminProfile } from "./types";

export type ToastTone = "info" | "success" | "warning" | "error";
export type AdminRolePreview = "center" | "facility" | "super";

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

export const ToastContext = React.createContext<{
  showToast: (msg: string, tone?: ToastTone) => void;
}>({ showToast: () => {} });

export const AuthContext = React.createContext<{
  admin: AdminProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}>({
  admin: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AdminUiContext = React.createContext<{
  rolePreview: AdminRolePreview;
  setRolePreview: (role: AdminRolePreview) => void;
  presentationMode: boolean;
  togglePresentationMode: () => void;
}>({
  rolePreview: "center",
  setRolePreview: () => {},
  presentationMode: false,
  togglePresentationMode: () => {},
});

export default function App() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [rolePreview, setRolePreview] = useState<AdminRolePreview>("center");
  const [presentationMode, setPresentationMode] = useState(false);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now();
    setToast({ id, message, tone });
    setTimeout(() => {
      setToast((cur) => (cur && cur.id === id ? null : cur));
    }, 2200);
  }, []);

  const togglePresentationMode = useCallback(() => {
    setPresentationMode((current) => {
      document.body.classList.toggle("presentation-mode", !current);
      return !current;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadAdmin = async () => {
      try {
        if (isHttpMode() && !getStoredToken()) {
          if (isDemoAutoLoginEnabled()) {
            const result = await loginAdmin("center@onda.test", "onda1234!");
            if (!cancelled) {
              setAdmin(result.admin);
              setRolePreview(rolePreviewFromAdmin(result.admin));
            }
            return;
          }
          if (!cancelled) setAdmin(null);
          return;
        }
        const current = await getCurrentAdmin();
        if (!cancelled) {
          setAdmin(current);
          setRolePreview(rolePreviewFromAdmin(current));
        }
      } catch {
        if (!cancelled) setAdmin(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };
    void loadAdmin();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginAdmin(email, password);
    setAdmin(result.admin);
    setRolePreview(rolePreviewFromAdmin(result.admin));
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin();
    setAdmin(null);
    setRolePreview("center");
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <AuthContext.Provider value={{ admin, isLoading: authLoading, login, logout }}>
        <AdminUiContext.Provider
          value={{ rolePreview, setRolePreview, presentationMode, togglePresentationMode }}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedAdminApp />} />
          </Routes>
          {toast && <Toast message={toast.message} tone={toast.tone} />}
        </AdminUiContext.Provider>
      </AuthContext.Provider>
    </ToastContext.Provider>
  );
}

function ProtectedAdminApp() {
  const { admin, isLoading } = React.useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="app-loading">
        <b>ONDA 관리자 웹을 준비하는 중입니다</b>
        <span>세션과 API 모드를 확인하고 있습니다.</span>
      </div>
    );
  }

  if (isHttpMode() && !admin) {
    return <Navigate to="/login" replace />;
  }

  return (
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
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

function rolePreviewFromAdmin(admin: AdminProfile): AdminRolePreview {
  if (admin.role === "FACILITY") return "facility";
  if (admin.role === "SUPER_ADMIN") return "super";
  return "center";
}
