// ============================================================
// admin-web services/api.ts
// 현재는 Mock 데이터를 반환. 추후 Spring Boot API 연동 시 이 파일만 교체합니다.
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
import type {
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
} from "../types";

// ============================================================
// API transition contracts
// - 실제 fetch는 아직 사용하지 않습니다.
// - Spring Boot API 연결 시 아래 타입과 함수 시그니처를 유지하고
//   Mock delay 부분만 HTTP client로 교체하는 것을 목표로 합니다.
// ============================================================

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message: null;
};

export type ApiFailure = {
  success: false;
  data: null;
  message: string;
  code: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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

const includesQuery = (fields: Array<string | number | undefined>, query?: string) => {
  const normalized = query?.trim().toLowerCase();
  if (!normalized) return true;
  return fields.join(" ").toLowerCase().includes(normalized);
};

let _reports: AccessibilityReport[] = JSON.parse(JSON.stringify(accessibilityReports));
let _helpRequests: HelpRequest[] = JSON.parse(JSON.stringify(helpRequests));
let _stories: Story[] = JSON.parse(JSON.stringify(stories));
let _tasks: ImprovementTask[] = JSON.parse(JSON.stringify(improvementTasks));

export async function getStats(): Promise<AdminStats> {
  return delay(adminStats);
}
export async function getBuildings(): Promise<Building[]> {
  return delay(buildings);
}
export async function getReports(query: ReportQuery = {}): Promise<AccessibilityReport[]> {
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
  _reports = _reports.map((r) => (r.id === id ? { ...r, status } : r));
  return delay(_reports.find((r) => r.id === id));
}
export async function getHelpRequests(
  query: HelpRequestQuery = {}
): Promise<HelpRequest[]> {
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
  _helpRequests = _helpRequests.map((request) =>
    request.id === id ? { ...request, status } : request
  );
  return delay(_helpRequests.find((request) => request.id === id));
}
export async function getStoriesForAdmin(query: StoryQuery = {}): Promise<Story[]> {
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
  _tasks = _tasks.map((task) => (task.id === id ? { ...task, stage } : task));
  return delay(_tasks.find((task) => task.id === id));
}
