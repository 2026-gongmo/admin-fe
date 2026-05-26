// ============================================================
// ONDA 공통 타입 정의
// 모바일 앱(mobile)과 웹 관리자(admin-web)가 공유하는 도메인 타입.
// 실제 백엔드 연결 시 이 타입에 맞춰 API 응답을 매핑하면 됩니다.
// ============================================================

export type Role = "student_disability" | "student_ally" | "admin_demo";

export type AccessibilityStatus = "accessible" | "warning" | "blocked" | "unknown";

export interface User {
  id: string;
  nickname: string;
  role: Role;
  school: string;
  major?: string;
  interests?: string[];
  availableHours?: string;
}

export type AdminRole = "CENTER" | "FACILITY" | "SUPER_ADMIN";

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  campusId: string;
  campusName: string;
}

export interface LoginResult {
  accessToken: string;
  tokenType: "Bearer";
  admin: AdminProfile;
}

export interface Building {
  id: string;
  name: string;
  description: string;
  status: AccessibilityStatus;
  reportCount: number;
  empathyCount: number;
  recentReport: string;
  features: {
    elevator: boolean;
    ramp: boolean;
    accessibleRestroom: boolean;
    autoDoor: boolean;
  };
  // 미니 지도용 좌표 (퍼센트)
  position: { x: number; y: number };
  // 실제 지도 표시용 좌표
  lat?: number;
  lng?: number;
}

export type ReportStatus = "received" | "checking" | "scheduled" | "resolved";
export type Urgency = "high" | "mid" | "low";

export interface AccessibilityReport {
  id: string;
  buildingId: string;
  buildingName: string;
  problemType: string;
  content: string;
  reportCount: number;
  empathyCount: number;
  urgency: Urgency;
  status: ReportStatus;
  createdAt: string;
  assignee?: string;
  aiSuggestion?: string;
}

export type EmpathyAction = "first_known" | "empathize" | "must_change" | "can_help";

export interface Story {
  id: string;
  authorNickname: string;
  buildingName: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  empathyCount: number;
  commentCount: number;
  reactions: Record<EmpathyAction, number>;
  selectedReaction?: EmpathyAction;
  schoolStatus?: "검토 중" | "조치 예정" | "해결됨";
  reportedCount?: number;
  visibility?: "public" | "private" | "center_only";
  aiReview?: {
    anonymized: "완료" | "검수 필요" | "보류";
    sensitiveInfo: "감지 안 됨" | "확인 필요" | "감지됨";
    reportReady: boolean;
    note: string;
  };
  createdAt: string;
}

export type HelpRequestStatus = "requesting" | "responded" | "cancelled" | "center_check";

export interface HelpRequest {
  id: string;
  type: string;
  location: string;
  status: HelpRequestStatus;
  responderCount: number;
  avgResponseTime?: string;
  createdAt: string;
  memo?: string;
  centerDecision?: string;
  linkedReport?: string;
  history?: string[];
}

export interface CompanionCandidate {
  id: string;
  nickname: string;
  interests: string[];
  availableTime: string;
  activities: string[];
  requested?: boolean;
}

export interface AdminStats {
  newReports: number;
  totalEmpathy: number;
  helpRequests: number;
  avgResponseTime: string;
  unresolved: number;
}

export interface DistributionItem {
  label: string;
  count: number;
}

export interface RepeatedIssue {
  reportId: string;
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

export interface Recommendation {
  linkedReportId?: string;
  title: string;
  buildingName: string;
  problemType: string;
  evidence: string;
  publicDataGap: string;
  recommendedAction: string;
  confidence: number;
  status: "recommendation-ready" | "insufficient-data" | string;
}

export interface AnalysisSummary {
  totalReports: number;
  repeatedPatternCount: number;
  topBuilding: string;
  topProblemType: string;
  summary: string;
  typeDistribution: DistributionItem[];
  buildingDistribution: DistributionItem[];
  repeatedIssues: RepeatedIssue[];
  recommendation: Recommendation;
}

export type PublicDataCoverage = "matched" | "missing" | "outdated" | "field_only";

export interface PublicDataSource {
  id: string;
  name: string;
  provider: string;
  category: "대학" | "시설" | "건축물" | "교통" | "복지";
  useCase: string;
  status: "연동 가능" | "샘플 적용" | "확인 필요";
  updateCycle: string;
}

export interface PublicDataComparison {
  id: string;
  buildingName: string;
  publicRecord: string;
  fieldReport: string;
  coverage: PublicDataCoverage;
  risk: Urgency;
  action: string;
}

export type WorkflowStage =
  | "reported"
  | "reviewing"
  | "sent_to_facility"
  | "scheduled"
  | "resolved";

export interface ImprovementTask {
  id: string;
  title: string;
  buildingName: string;
  problemType: string;
  stage: WorkflowStage;
  owner: string;
  dueDate: string;
  evidence: string;
  nextAction: string;
}
