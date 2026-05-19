// ============================================================
// admin-web services/api.ts
// 기본은 Mock 데이터를 반환합니다.
// VITE_API_MODE=http 일 때는 Spring Boot API 일부를 실제 호출합니다.
// ============================================================

import {
  buildings,
  stories,
  helpRequests,
  accessibilityReports,
  adminStats,
  monthlyReport,
  publicDataSources,
  publicDataComparisons,
  improvementTasks,
} from "../data/mockData";
import {
  clearStoredToken,
  getApiMode,
  getStoredAdmin,
  httpRequest,
  setStoredAdmin,
  setStoredToken,
  toQueryString,
} from "./httpClient";
export { ApiError } from "./apiTypes";
export type { ApiResponse, ApiFailure, ApiSuccess } from "./apiTypes";
import type {
  AdminProfile,
  Building,
  Story,
  HelpRequest,
  AccessibilityReport,
  ReportStatus,
  HelpRequestStatus,
  AdminStats,
  PublicDataSource,
  PublicDataComparison,
  ImprovementTask,
  WorkflowStage,
  Urgency,
  LoginResult,
} from "../types";

// ============================================================
// API transition contracts
// - 화면 컴포넌트는 이 파일의 함수만 호출합니다.
// - Mock/API 전환은 이 service layer 안에서만 처리합니다.
// ============================================================

import { ApiError } from "./apiTypes";

export type SortDirection = "asc" | "desc";

export interface ListQuery {
  query?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: SortDirection;
}

export interface ReportQuery extends ListQuery {
  status?: ReportStatus | "all";
  urgency?: Urgency | "all";
  assignee?: string | "all";
  buildingId?: string;
  problemType?: string;
}

export interface HelpRequestQuery extends ListQuery {
  status?: HelpRequestStatus | "all";
  type?: string;
  location?: string;
  unresolvedOnly?: boolean;
}

export interface StoryQuery extends ListQuery {
  visibility?: NonNullable<Story["visibility"]> | "all";
  anonymized?: NonNullable<Story["aiReview"]>["anonymized"] | "all";
  sensitiveInfo?: NonNullable<Story["aiReview"]>["sensitiveInfo"] | "all";
  reportReady?: boolean;
}

export interface ImprovementTaskQuery extends ListQuery {
  stage?: WorkflowStage | "all";
  owner?: string | "all";
  buildingName?: string;
}

const delay = <T>(value: T, ms = 200) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export type MockApiFailureScope =
  | "off"
  | "all"
  | "reports"
  | "helpRequests"
  | "stories"
  | "improvementTasks";

const MOCK_API_FAILURE_KEY = "onda_mock_api_failure_scope";

export function getMockApiFailureScope(): MockApiFailureScope {
  if (typeof window === "undefined") return "off";
  const value = window.localStorage.getItem(MOCK_API_FAILURE_KEY);
  return isMockApiFailureScope(value) ? value : "off";
}

export function setMockApiFailureScope(scope: MockApiFailureScope) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MOCK_API_FAILURE_KEY, scope);
}

const maybeFail = (scope: Exclude<MockApiFailureScope, "off" | "all">) => {
  const mode = getMockApiFailureScope();
  if (mode === "all" || mode === scope) {
    throw new ApiError(
      "MOCK_API_FAILURE",
      "Mock API 실패 시뮬레이션입니다. 실제 운영에서는 Spring Boot API 오류 응답을 이 UI로 표시합니다.",
      503
    );
  }
};

function isMockApiFailureScope(value: string | null): value is MockApiFailureScope {
  return (
    value === "off" ||
    value === "all" ||
    value === "reports" ||
    value === "helpRequests" ||
    value === "stories" ||
    value === "improvementTasks"
  );
}

const includesQuery = (fields: Array<string | number | undefined>, query?: string) => {
  const normalized = query?.trim().toLowerCase();
  if (!normalized) return true;
  return fields.join(" ").toLowerCase().includes(normalized);
};

let _reports: AccessibilityReport[] = JSON.parse(JSON.stringify(accessibilityReports));
let _helpRequests: HelpRequest[] = JSON.parse(JSON.stringify(helpRequests));
let _stories: Story[] = JSON.parse(JSON.stringify(stories));
let _tasks: ImprovementTask[] = JSON.parse(JSON.stringify(improvementTasks));

const MOCK_ADMIN: AdminProfile = {
  id: "mock-admin-1",
  email: "center@onda.test",
  name: "박주연",
  role: "CENTER",
  campusId: "mock-campus-1",
  campusName: "ONDA 대학교",
};

interface BackendReport {
  id: number;
  buildingId: number;
  buildingName: string;
  problemType: string;
  content: string;
  reportCount: number;
  empathyCount: number;
  urgency: Urgency;
  status: ReportStatus;
  createdAt: string;
  assignee?: string | null;
  department?: string | null;
  statusReason?: string | null;
  aiSuggestion?: string | null;
}

interface BackendHelpRequest {
  id: number;
  type: string;
  location: string;
  status: HelpRequestStatus;
  responderCount: number;
  avgResponseTime?: string | null;
  createdAt: string;
  memo?: string | null;
  centerDecision?: string | null;
  linkedReport?: string | null;
  history?: string[];
}

interface BackendAdminProfile {
  id: number;
  email: string;
  name: string;
  role: AdminProfile["role"];
  campusId: number;
  campusName: string;
}

interface BackendLoginResult {
  accessToken: string;
  tokenType: "Bearer";
  admin: BackendAdminProfile;
}

export function isHttpMode(): boolean {
  return getApiMode() === "http";
}

export function getModeLabel(): string {
  return isHttpMode() ? "Spring Boot API" : "Mock 데이터";
}

export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  if (!isHttpMode()) {
    const result: LoginResult = {
      accessToken: "mock-access-token",
      tokenType: "Bearer",
      admin: MOCK_ADMIN,
    };
    setStoredToken(result.accessToken);
    setStoredAdmin(result.admin);
    return delay(result, 180);
  }

  const result = await httpRequest<BackendLoginResult>("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const mapped: LoginResult = {
    accessToken: result.accessToken,
    tokenType: result.tokenType,
    admin: mapAdmin(result.admin),
  };
  setStoredToken(mapped.accessToken);
  setStoredAdmin(mapped.admin);
  return mapped;
}

export async function getCurrentAdmin(): Promise<AdminProfile> {
  if (!isHttpMode()) {
    return delay(getStoredAdmin<AdminProfile>() ?? MOCK_ADMIN, 120);
  }
  const admin = await httpRequest<BackendAdminProfile>("/api/admin/me");
  const mapped = mapAdmin(admin);
  setStoredAdmin(mapped);
  return mapped;
}

export async function logoutAdmin(): Promise<void> {
  if (isHttpMode()) {
    try {
      await httpRequest<unknown>("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // 로그아웃은 로컬 토큰 제거가 핵심이므로 서버 실패가 있어도 세션을 비웁니다.
    }
  }
  clearStoredToken();
}

export async function getStats(): Promise<AdminStats> {
  return delay(adminStats);
}
export async function getBuildings(): Promise<Building[]> {
  return delay(buildings);
}
export async function getReports(query: ReportQuery = {}): Promise<AccessibilityReport[]> {
  if (isHttpMode()) {
    const params = toQueryString({
      status: query.status,
      urgency: query.urgency,
      assignee: query.assignee,
      buildingId: query.buildingId,
      problemType: query.problemType,
      query: query.query,
    });
    const response = await httpRequest<BackendReport[]>(`/api/admin/reports${params}`);
    return response.map(mapReport);
  }
  maybeFail("reports");
  const filtered = _reports.filter((report) => {
    const statusMatched =
      !query.status || query.status === "all" || report.status === query.status;
    const urgencyMatched =
      !query.urgency || query.urgency === "all" || report.urgency === query.urgency;
    const assigneeMatched =
      !query.assignee ||
      query.assignee === "all" ||
      (query.assignee === "미배정"
        ? !report.assignee
        : report.assignee === query.assignee);
    const buildingMatched = !query.buildingId || report.buildingId === query.buildingId;
    const problemMatched = !query.problemType || report.problemType === query.problemType;
    const textMatched = includesQuery(
      [
        report.buildingName,
        report.problemType,
        report.content,
        report.assignee,
        report.aiSuggestion,
      ],
      query.query
    );
    return (
      statusMatched &&
      urgencyMatched &&
      assigneeMatched &&
      buildingMatched &&
      problemMatched &&
      textMatched
    );
  });
  return delay(clone(filtered));
}
export async function updateReportStatus(
  id: string,
  status: ReportStatus
): Promise<AccessibilityReport | undefined> {
  if (isHttpMode()) {
    const response = await httpRequest<BackendReport>(`/api/admin/reports/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        reason: "관리자 웹에서 상태 변경",
        department: "장애학생지원센터",
      }),
    });
    return mapReport(response);
  }
  maybeFail("reports");
  _reports = _reports.map((r) => (r.id === id ? { ...r, status } : r));
  return delay(_reports.find((r) => r.id === id));
}
export async function getHelpRequests(
  query: HelpRequestQuery = {}
): Promise<HelpRequest[]> {
  if (isHttpMode()) {
    const params = toQueryString({
      status: query.status,
      type: query.type,
      location: query.location,
      unresolvedOnly: query.unresolvedOnly,
      query: query.query,
    });
    const response = await httpRequest<BackendHelpRequest[]>(`/api/admin/help-requests${params}`);
    return response.map(mapHelpRequest);
  }
  maybeFail("helpRequests");
  const filtered = _helpRequests.filter((request) => {
    const statusMatched =
      !query.status || query.status === "all" || request.status === query.status;
    const typeMatched = !query.type || request.type === query.type;
    const locationMatched = !query.location || request.location.includes(query.location);
    const unresolvedMatched =
      !query.unresolvedOnly ||
      request.status === "requesting" ||
      request.status === "center_check";
    const textMatched = includesQuery(
      [
        request.location,
        request.type,
        request.memo,
        request.centerDecision,
        request.linkedReport,
      ],
      query.query
    );
    return statusMatched && typeMatched && locationMatched && unresolvedMatched && textMatched;
  });
  return delay(clone(filtered));
}
export async function updateHelpRequestStatus(
  id: string,
  status: HelpRequestStatus
): Promise<HelpRequest | undefined> {
  if (isHttpMode()) {
    const response = await httpRequest<BackendHelpRequest>(`/api/admin/help-requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return mapHelpRequest(response);
  }
  maybeFail("helpRequests");
  _helpRequests = _helpRequests.map((request) =>
    request.id === id ? { ...request, status } : request
  );
  return delay(_helpRequests.find((request) => request.id === id));
}
export async function getStoriesForAdmin(query: StoryQuery = {}): Promise<Story[]> {
  maybeFail("stories");
  const filtered = _stories.filter((story) => {
    const visibilityMatched =
      !query.visibility ||
      query.visibility === "all" ||
      (story.visibility ?? "public") === query.visibility;
    const anonymizedMatched =
      !query.anonymized ||
      query.anonymized === "all" ||
      story.aiReview?.anonymized === query.anonymized;
    const sensitiveMatched =
      !query.sensitiveInfo ||
      query.sensitiveInfo === "all" ||
      story.aiReview?.sensitiveInfo === query.sensitiveInfo;
    const reportReadyMatched =
      query.reportReady === undefined || story.aiReview?.reportReady === query.reportReady;
    const textMatched = includesQuery(
      [
        story.title,
        story.content,
        story.buildingName,
        story.category,
        story.tags.join(" "),
        story.aiReview?.note,
      ],
      query.query
    );
    return (
      visibilityMatched &&
      anonymizedMatched &&
      sensitiveMatched &&
      reportReadyMatched &&
      textMatched
    );
  });
  return delay(clone(filtered));
}
export async function updateStoryVisibility(
  id: string,
  visibility: NonNullable<Story["visibility"]>
): Promise<Story | undefined> {
  maybeFail("stories");
  _stories = _stories.map((s) => (s.id === id ? { ...s, visibility } : s));
  return delay(_stories.find((s) => s.id === id));
}
export async function getMonthlyReport() {
  return delay(monthlyReport);
}
export async function getPublicDataSources(): Promise<PublicDataSource[]> {
  return delay(publicDataSources);
}
export async function getPublicDataComparisons(): Promise<PublicDataComparison[]> {
  return delay(publicDataComparisons);
}
export async function getImprovementTasks(
  query: ImprovementTaskQuery = {}
): Promise<ImprovementTask[]> {
  maybeFail("improvementTasks");
  const filtered = _tasks.filter((task) => {
    const stageMatched =
      !query.stage || query.stage === "all" || task.stage === query.stage;
    const ownerMatched =
      !query.owner || query.owner === "all" || task.owner === query.owner;
    const buildingMatched = !query.buildingName || task.buildingName === query.buildingName;
    const textMatched = includesQuery(
      [
        task.title,
        task.buildingName,
        task.problemType,
        task.owner,
        task.evidence,
        task.nextAction,
      ],
      query.query
    );
    return stageMatched && ownerMatched && buildingMatched && textMatched;
  });
  return delay(clone(filtered));
}
export async function updateImprovementTaskStage(
  id: string,
  stage: WorkflowStage
): Promise<ImprovementTask | undefined> {
  maybeFail("improvementTasks");
  _tasks = _tasks.map((task) => (task.id === id ? { ...task, stage } : task));
  return delay(_tasks.find((task) => task.id === id));
}

function mapAdmin(admin: BackendAdminProfile): AdminProfile {
  return {
    id: String(admin.id),
    email: admin.email,
    name: admin.name,
    role: admin.role,
    campusId: String(admin.campusId),
    campusName: admin.campusName,
  };
}

function mapReport(report: BackendReport): AccessibilityReport {
  return {
    id: String(report.id),
    buildingId: String(report.buildingId),
    buildingName: report.buildingName,
    problemType: report.problemType,
    content: report.content,
    reportCount: report.reportCount,
    empathyCount: report.empathyCount,
    urgency: report.urgency,
    status: report.status,
    createdAt: report.createdAt,
    assignee: report.assignee ?? undefined,
    aiSuggestion: report.aiSuggestion ?? undefined,
  };
}

function mapHelpRequest(request: BackendHelpRequest): HelpRequest {
  return {
    id: String(request.id),
    type: request.type,
    location: request.location,
    status: request.status,
    responderCount: request.responderCount,
    avgResponseTime: request.avgResponseTime ?? undefined,
    createdAt: request.createdAt.replace("T", " ").slice(0, 16),
    memo: request.memo ?? undefined,
    centerDecision: request.centerDecision ?? undefined,
    linkedReport: request.linkedReport ?? undefined,
    history: request.history ?? [],
  };
}
