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
  AdminStats,
  PublicDataSource,
  PublicDataComparison,
  ImprovementTask,
  WorkflowStage,
} from "../types";

const delay = <T>(value: T, ms = 200) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

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
export async function getReports(): Promise<AccessibilityReport[]> {
  return delay(_reports);
}
export async function updateReportStatus(
  id: string,
  status: ReportStatus
): Promise<AccessibilityReport | undefined> {
  _reports = _reports.map((r) => (r.id === id ? { ...r, status } : r));
  return delay(_reports.find((r) => r.id === id));
}
export async function getHelpRequests(): Promise<HelpRequest[]> {
  return delay(_helpRequests);
}
export async function getStoriesForAdmin(): Promise<Story[]> {
  return delay(_stories);
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
export async function getImprovementTasks(): Promise<ImprovementTask[]> {
  return delay(_tasks);
}
export async function updateImprovementTaskStage(
  id: string,
  stage: WorkflowStage
): Promise<ImprovementTask | undefined> {
  _tasks = _tasks.map((task) => (task.id === id ? { ...task, stage } : task));
  return delay(_tasks.find((task) => task.id === id));
}
