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
  httpDownload,
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
  AnalysisSummary,
  DistributionItem,
  Recommendation,
  RepeatedIssue,
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

interface BackendReportNote {
  id: number;
  adminName: string;
  content: string;
  createdAt: string;
}

interface BackendBuilding {
  id: number;
  name: string;
  description: string;
  status: Building["status"];
  reportCount: number;
  empathyCount: number;
  recentReport: string;
  features: Building["features"];
  position: Building["position"];
  lat?: number | null;
  lng?: number | null;
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

interface BackendPublicDataSource {
  id: number;
  name: string;
  provider: string;
  category: PublicDataSource["category"];
  useCase: string;
  status: PublicDataSource["status"];
  updateCycle: string;
}

interface BackendPublicDataComparison {
  id: number;
  buildingName: string;
  publicRecord: string;
  fieldReport: string;
  coverage: PublicDataComparison["coverage"];
  risk: Urgency;
  action: string;
}

interface BackendPublicDataProviderStatus {
  dataGoKrEnabled: boolean;
  dataGoKrKeyConfigured: boolean;
  mode: "seed" | "external-ready" | "key-configured-disabled" | "endpoint-required";
  message: string;
}

interface BackendPublicDataSyncResponse {
  attempted: boolean;
  success: boolean;
  mode: "disabled" | "missing-key" | "missing-endpoint" | "unknown-dataset" | "external-live" | "external-failed";
  datasetName: string;
  fetchedCount: number;
  totalCount?: number | null;
  message: string;
  syncedAt: string;
}

interface BackendPublicDataSyncBatchResponse {
  totalDatasets: number;
  attemptedDatasets: number;
  successDatasets: number;
  skippedDatasets: number;
  results: BackendPublicDataSyncResponse[];
  syncedAt: string;
}

interface BackendStory {
  id: number;
  authorNickname: string;
  buildingName: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  empathyCount: number;
  commentCount: number;
  reactions: Story["reactions"];
  schoolStatus?: Story["schoolStatus"] | null;
  visibility?: Story["visibility"] | null;
  aiReview?: Story["aiReview"] | null;
  createdAt: string;
}

interface BackendImprovementTask {
  id: number;
  title: string;
  buildingName: string;
  problemType: string;
  stage: WorkflowStage;
  owner: string;
  dueDate: string;
  evidence: string;
  nextAction: string;
}

interface BackendDistributionItem {
  label: string;
  count: number;
}

interface BackendRepeatedIssue {
  reportId: number;
  buildingName: string;
  problemType: string;
  content: string;
  reportCount: number;
  empathyCount: number;
  urgency: Urgency;
  priorityScore: number;
  publicDataGap: string;
  recommendedAction: string;
}

interface BackendRecommendation {
  linkedReportId?: number | null;
  title: string;
  buildingName: string;
  problemType: string;
  evidence: string;
  publicDataGap: string;
  recommendedAction: string;
  confidence: number;
  status: string;
}

interface BackendAnalysisSummary {
  totalReports: number;
  repeatedPatternCount: number;
  topBuilding: string;
  topProblemType: string;
  summary: string;
  typeDistribution: BackendDistributionItem[];
  buildingDistribution: BackendDistributionItem[];
  repeatedIssues: BackendRepeatedIssue[];
  recommendation: BackendRecommendation;
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
  if (isHttpMode()) {
    return httpRequest<AdminStats>("/api/admin/dashboard/stats");
  }
  return delay(adminStats);
}

export async function getAnalysisSummary(): Promise<AnalysisSummary> {
  if (isHttpMode()) {
    const response = await httpRequest<BackendAnalysisSummary>("/api/admin/analysis/summary");
    return mapAnalysisSummary(response);
  }
  return delay(buildMockAnalysisSummary());
}

export async function getRepeatedIssues(): Promise<RepeatedIssue[]> {
  if (isHttpMode()) {
    const response = await httpRequest<BackendRepeatedIssue[]>("/api/admin/analysis/repeated-issues");
    return response.map(mapRepeatedIssue);
  }
  return delay(buildMockRepeatedIssues());
}

export async function getRecommendation(): Promise<Recommendation> {
  if (isHttpMode()) {
    const response = await httpRequest<BackendRecommendation>("/api/admin/recommendations");
    return mapRecommendation(response);
  }
  return delay(buildMockAnalysisSummary().recommendation);
}

export async function getBuildings(): Promise<Building[]> {
  if (isHttpMode()) {
    const response = await httpRequest<BackendBuilding[]>("/api/admin/buildings");
    return response.map(mapBuilding);
  }
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
export async function updateReportAssignee(
  id: string,
  assignee: string
): Promise<AccessibilityReport | undefined> {
  if (isHttpMode()) {
    const assigneeId = ASSIGNEE_ID_BY_NAME[assignee];
    if (assignee !== "미배정" && !assigneeId) {
      throw new ApiError("INVALID_ASSIGNEE", "알 수 없는 담당자는 API 저장할 수 없습니다.", 400);
    }
    const response = await httpRequest<BackendReport>(`/api/admin/reports/${id}/assignee`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeId: assigneeId ?? null }),
    });
    return mapReport(response);
  }
  maybeFail("reports");
  const value = assignee === "미배정" ? undefined : assignee;
  _reports = _reports.map((r) => (r.id === id ? { ...r, assignee: value } : r));
  return delay(_reports.find((r) => r.id === id));
}
export async function updateReportUrgency(
  id: string,
  urgency: Urgency
): Promise<AccessibilityReport | undefined> {
  if (isHttpMode()) {
    const response = await httpRequest<BackendReport>(`/api/admin/reports/${id}/priority`, {
      method: "PATCH",
      body: JSON.stringify({ urgency }),
    });
    return mapReport(response);
  }
  maybeFail("reports");
  _reports = _reports.map((r) => (r.id === id ? { ...r, urgency } : r));
  return delay(_reports.find((r) => r.id === id));
}
export async function createReportNote(
  id: string,
  content: string
): Promise<BackendReportNote> {
  if (isHttpMode()) {
    return httpRequest<BackendReportNote>(`/api/admin/reports/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }
  maybeFail("reports");
  return delay({
    id: Date.now(),
    adminName: MOCK_ADMIN.name,
    content,
    createdAt: new Date().toISOString(),
  });
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
export async function updateHelpRequestDecision(
  id: string,
  centerDecision: string,
  linkedReportId?: string
): Promise<HelpRequest | undefined> {
  if (isHttpMode()) {
    const response = await httpRequest<BackendHelpRequest>(`/api/admin/help-requests/${id}/decision`, {
      method: "PATCH",
      body: JSON.stringify({
        centerDecision,
        linkedReportId: linkedReportId ? Number(linkedReportId) : undefined,
      }),
    });
    return mapHelpRequest(response);
  }
  maybeFail("helpRequests");
  _helpRequests = _helpRequests.map((request) =>
    request.id === id ? { ...request, centerDecision } : request
  );
  return delay(_helpRequests.find((request) => request.id === id));
}
export async function getStoriesForAdmin(query: StoryQuery = {}): Promise<Story[]> {
  if (isHttpMode()) {
    const params = toQueryString({
      visibility: query.visibility,
      query: query.query,
    });
    const response = await httpRequest<BackendStory[]>(`/api/admin/stories${params}`);
    return response.map(mapStory);
  }
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
  if (isHttpMode()) {
    const response = await httpRequest<BackendStory>(`/api/admin/stories/${id}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ visibility }),
    });
    return mapStory(response);
  }
  maybeFail("stories");
  _stories = _stories.map((s) => (s.id === id ? { ...s, visibility } : s));
  return delay(_stories.find((s) => s.id === id));
}
export async function getMonthlyReport() {
  if (isHttpMode()) {
    return httpRequest<typeof monthlyReport>("/api/admin/monthly-report");
  }
  return delay(monthlyReport);
}

export async function downloadMonthlyReportCsv(
  yearMonth = monthlyReport.yearMonth
): Promise<{ blob: Blob; filename: string; apiBacked: boolean }> {
  const filename = `onda-monthly-report-${yearMonth}.csv`;
  if (isHttpMode()) {
    const params = toQueryString({ yearMonth });
    const blob = await httpDownload(`/api/admin/monthly-report/export/csv${params}`);
    return { blob, filename, apiBacked: true };
  }
  const csv = buildMonthlyReportCsv(monthlyReport);
  return delay({
    blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
    filename,
    apiBacked: false,
  });
}

export async function getPublicDataSources(): Promise<PublicDataSource[]> {
  if (isHttpMode()) {
    const response = await httpRequest<BackendPublicDataSource[]>("/api/admin/public-data/sources");
    return response.map(mapPublicDataSource);
  }
  return delay(publicDataSources);
}
export async function getPublicDataComparisons(): Promise<PublicDataComparison[]> {
  if (isHttpMode()) {
    const response = await httpRequest<BackendPublicDataComparison[]>(
      "/api/admin/public-data/comparisons"
    );
    return response.map(mapPublicDataComparison);
  }
  return delay(publicDataComparisons);
}
export async function getPublicDataProviderStatus(): Promise<BackendPublicDataProviderStatus> {
  if (isHttpMode()) {
    return httpRequest<BackendPublicDataProviderStatus>("/api/admin/public-data/provider-status");
  }
  return delay({
    dataGoKrEnabled: false,
    dataGoKrKeyConfigured: false,
    mode: "seed",
    message: "Mock 모드에서는 공공데이터포털 API 키를 사용하지 않습니다.",
  });
}
export async function syncPublicDataAccessibilityFacilities(): Promise<BackendPublicDataSyncResponse> {
  if (isHttpMode()) {
    return httpRequest<BackendPublicDataSyncResponse>("/api/admin/public-data/sync/accessibility-facilities", {
      method: "POST",
    });
  }
  return delay({
    attempted: false,
    success: false,
    mode: "missing-key",
    datasetName: "전국 장애인 편의시설 표준데이터",
    fetchedCount: 0,
    totalCount: null,
    message: "Mock 모드에서는 실제 공공데이터 API를 호출하지 않습니다. 백엔드에 DATA_GO_KR_SERVICE_KEY와 endpoint 설정이 필요합니다.",
    syncedAt: new Date().toISOString(),
  });
}
export async function syncAllPublicDataSources(): Promise<BackendPublicDataSyncBatchResponse> {
  if (isHttpMode()) {
    return httpRequest<BackendPublicDataSyncBatchResponse>("/api/admin/public-data/sync/all", {
      method: "POST",
    });
  }
  const results: BackendPublicDataSyncResponse[] = publicDataSources.map((source) => ({
    attempted: false,
    success: false,
    mode: "missing-key",
    datasetName: source.name,
    fetchedCount: 0,
    totalCount: null,
    message: "Mock 모드에서는 실제 공공데이터 API를 호출하지 않습니다. 백엔드 .env에 인증키와 dataset path 설정이 필요합니다.",
    syncedAt: new Date().toISOString(),
  }));
  return delay({
    totalDatasets: results.length,
    attemptedDatasets: 0,
    successDatasets: 0,
    skippedDatasets: results.length,
    results,
    syncedAt: new Date().toISOString(),
  });
}
export async function getImprovementTasks(
  query: ImprovementTaskQuery = {}
): Promise<ImprovementTask[]> {
  if (isHttpMode()) {
    const params = toQueryString({
      stage: query.stage,
      owner: query.owner,
      buildingName: query.buildingName,
      query: query.query,
    });
    const response = await httpRequest<BackendImprovementTask[]>(`/api/admin/improvement-tasks${params}`);
    return response.map(mapImprovementTask);
  }
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
  if (isHttpMode()) {
    const response = await httpRequest<BackendImprovementTask>(`/api/admin/improvement-tasks/${id}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });
    return mapImprovementTask(response);
  }
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

const ASSIGNEE_ID_BY_NAME: Record<string, number | undefined> = {
  "박주연": 1,
  "김도현": 2,
  "이수민": 3,
};

function mapBuilding(building: BackendBuilding): Building {
  return {
    id: String(building.id),
    name: building.name,
    description: building.description,
    status: building.status,
    reportCount: building.reportCount,
    empathyCount: building.empathyCount,
    recentReport: building.recentReport,
    features: building.features,
    position: building.position,
    lat: building.lat ?? undefined,
    lng: building.lng ?? undefined,
  };
}

function mapStory(story: BackendStory): Story {
  return {
    id: String(story.id),
    authorNickname: story.authorNickname,
    buildingName: story.buildingName,
    title: story.title,
    content: story.content,
    category: story.category,
    tags: story.tags,
    empathyCount: story.empathyCount,
    commentCount: story.commentCount,
    reactions: story.reactions,
    schoolStatus: story.schoolStatus ?? undefined,
    visibility: story.visibility ?? undefined,
    aiReview: story.aiReview ?? undefined,
    createdAt: story.createdAt,
  };
}

function mapImprovementTask(task: BackendImprovementTask): ImprovementTask {
  return {
    id: String(task.id),
    title: task.title,
    buildingName: task.buildingName,
    problemType: task.problemType,
    stage: task.stage,
    owner: task.owner,
    dueDate: task.dueDate,
    evidence: task.evidence,
    nextAction: task.nextAction,
  };
}

function mapAnalysisSummary(summary: BackendAnalysisSummary): AnalysisSummary {
  return {
    ...summary,
    typeDistribution: summary.typeDistribution.map(mapDistributionItem),
    buildingDistribution: summary.buildingDistribution.map(mapDistributionItem),
    repeatedIssues: summary.repeatedIssues.map(mapRepeatedIssue),
    recommendation: mapRecommendation(summary.recommendation),
  };
}

function mapDistributionItem(item: BackendDistributionItem): DistributionItem {
  return {
    label: item.label,
    count: item.count,
  };
}

function mapRepeatedIssue(issue: BackendRepeatedIssue): RepeatedIssue {
  return {
    reportId: String(issue.reportId),
    buildingName: issue.buildingName,
    problemType: issue.problemType,
    content: issue.content,
    reportCount: issue.reportCount,
    empathyCount: issue.empathyCount,
    urgency: issue.urgency,
    priorityScore: issue.priorityScore,
    publicDataGap: issue.publicDataGap,
    recommendedAction: issue.recommendedAction,
  };
}

function mapRecommendation(recommendation: BackendRecommendation): Recommendation {
  return {
    linkedReportId:
      recommendation.linkedReportId === null || recommendation.linkedReportId === undefined
        ? undefined
        : String(recommendation.linkedReportId),
    title: recommendation.title,
    buildingName: recommendation.buildingName,
    problemType: recommendation.problemType,
    evidence: recommendation.evidence,
    publicDataGap: recommendation.publicDataGap,
    recommendedAction: recommendation.recommendedAction,
    confidence: recommendation.confidence,
    status: recommendation.status,
  };
}

function buildMockAnalysisSummary(): AnalysisSummary {
  const repeatedIssues = buildMockRepeatedIssues();
  const recommendation = repeatedIssues[0]
    ? {
        linkedReportId: repeatedIssues[0].reportId,
        title: `${repeatedIssues[0].buildingName} ${repeatedIssues[0].problemType} 개선`,
        buildingName: repeatedIssues[0].buildingName,
        problemType: repeatedIssues[0].problemType,
        evidence: `제보 ${repeatedIssues[0].reportCount}건 · 공감 ${repeatedIssues[0].empathyCount}명 · 긴급도 ${urgencyLabel(repeatedIssues[0].urgency)}`,
        publicDataGap: repeatedIssues[0].publicDataGap,
        recommendedAction: repeatedIssues[0].recommendedAction,
        confidence: Math.min(96, 62 + Math.floor(repeatedIssues[0].priorityScore / 8)),
        status: "recommendation-ready",
      }
    : {
        title: "반복 제보 데이터 수집 필요",
        buildingName: "-",
        problemType: "-",
        evidence: "반복 제보가 충분하지 않습니다.",
        publicDataGap: "공공데이터 비교 전",
        recommendedAction: "제보와 공감 데이터를 더 수집한 뒤 개선 과제로 전환합니다.",
        confidence: 0,
        status: "insufficient-data",
      };
  const typeDistribution = toDistribution(_reports, (report) => report.problemType);
  const buildingDistribution = toDistribution(_reports, (report) => report.buildingName);
  return {
    totalReports: _reports.reduce((sum, report) => sum + report.reportCount, 0),
    repeatedPatternCount: repeatedIssues.length,
    topBuilding: buildingDistribution[0]?.label ?? "-",
    topProblemType: typeDistribution[0]?.label ?? "-",
    summary: `${buildingDistribution[0]?.label ?? "캠퍼스"}에서 ${typeDistribution[0]?.label ?? "접근성"} 관련 반복 제보가 가장 두드러집니다. ${recommendation.recommendedAction}`,
    typeDistribution,
    buildingDistribution,
    repeatedIssues,
    recommendation,
  };
}

function buildMockRepeatedIssues(): RepeatedIssue[] {
  return [..._reports]
    .filter((report) => report.reportCount >= 9)
    .map((report) => {
      const comparison = publicDataComparisons.find(
        (item) => item.buildingName === report.buildingName
      );
      const publicDataGap = comparison
        ? comparison.coverage === "matched"
          ? "공공데이터와 대체로 일치하나 현장 운영 상태 확인 필요"
          : `${comparison.publicRecord} / 현장: ${comparison.fieldReport}`
        : "연결된 공공데이터 비교 항목 없음";
      const recommendedAction = comparison?.action ?? report.aiSuggestion ?? "센터 검토 후 시설팀 전달";
      const priorityScore =
        report.reportCount * 3 +
        report.empathyCount +
        (report.urgency === "high" ? 100 : report.urgency === "mid" ? 45 : 15) +
        (comparison ? (comparison.coverage === "matched" ? 10 : 35) : 0);
      return {
        reportId: report.id,
        buildingName: report.buildingName,
        problemType: report.problemType,
        content: report.content,
        reportCount: report.reportCount,
        empathyCount: report.empathyCount,
        urgency: report.urgency,
        priorityScore,
        publicDataGap,
        recommendedAction,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);
}

function toDistribution(
  reports: AccessibilityReport[],
  selectLabel: (report: AccessibilityReport) => string
): DistributionItem[] {
  const grouped = reports.reduce<Record<string, number>>((acc, report) => {
    const label = selectLabel(report);
    acc[label] = (acc[label] ?? 0) + report.reportCount;
    return acc;
  }, {});
  return Object.entries(grouped)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function urgencyLabel(urgency: Urgency): string {
  if (urgency === "high") return "높음";
  if (urgency === "mid") return "중간";
  return "낮음";
}

function buildMonthlyReportCsv(report: typeof monthlyReport): string {
  const rows = [
    ["구분", "항목", "값", "비고"],
    ["기본", "대상 월", report.yearMonth, "ONDA 관리자 리포트"],
    ["주요 지표", "신규 제보", String(report.metrics.newReports), "건"],
    ["주요 지표", "총 공감", String(report.metrics.totalEmpathy), "명"],
    ["주요 지표", "도움 요청", String(report.metrics.helpRequests), "건"],
    ["주요 지표", "해결 완료", String(report.metrics.resolved), "건"],
    ...report.topBuildings.map((item) => [
      "반복 제보 건물",
      item.name,
      String(item.count),
      item.reason,
    ]),
    ...report.topEmpathy.map((item) => [
      "공감 이슈",
      item.topic,
      String(item.empathy),
      "공감 수",
    ]),
    ...report.priorities.map((item) => [
      "개선 우선순위",
      item.term,
      item.text,
      "센터 검토 필요",
    ]),
    ["센터 권장 조치", "요약", report.centerNote, "Mock 생성"],
  ];
  return `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\n")}\n`;
}

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
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

function mapPublicDataSource(source: BackendPublicDataSource): PublicDataSource {
  return {
    id: String(source.id),
    name: source.name,
    provider: source.provider,
    category: source.category,
    useCase: source.useCase,
    status: source.status,
    updateCycle: source.updateCycle,
  };
}

function mapPublicDataComparison(
  comparison: BackendPublicDataComparison
): PublicDataComparison {
  return {
    id: String(comparison.id),
    buildingName: comparison.buildingName,
    publicRecord: comparison.publicRecord,
    fieldReport: comparison.fieldReport,
    coverage: comparison.coverage,
    risk: comparison.risk,
    action: comparison.action,
  };
}
