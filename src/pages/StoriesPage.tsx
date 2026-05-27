import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { anonymizeStory, ApiError, getStoriesForAdmin, updateStoryVisibility } from "../services/api";
import type { Story } from "../types";
import { VisibilityBadge } from "../components/StatusBadge";
import { ToastContext } from "../App";
import { OperationalStatus } from "../components/OperationalStatus";
import { PageState } from "../components/PageState";
import { ActionTimeline, type ActionTimelineItem } from "../components/ActionTimeline";
import { ApiFailureBanner } from "../components/ApiFailureBanner";

const PRIVACY_REVIEWS: Record<
  string,
  {
    original: string;
    anonymized: string;
    riskItems: string[];
    decision: string;
  }
> = {
  s_1: {
    original: "중앙도서관 5층, 비 오는 날 혼자 이동이 어려웠습니다.",
    anonymized: "캠퍼스 내 도서관 고층 구역에서 우천 시 이동 어려움이 있었습니다.",
    riskItems: ["장소 일반화", "시간 표현 완화"],
    decision: "공개 가능. 반복 제보 리포트 근거로 사용 가능.",
  },
  s_2: {
    original: "학생회관 식당 키오스크 앞에서 친구에게 주문을 부탁했습니다.",
    anonymized: "캠퍼스 식당 주문기 앞에서 접근성 문제로 타인의 도움이 필요했습니다.",
    riskItems: ["장소 일반화", "관계 표현 완화"],
    decision: "공개 가능. 키오스크 접근성 항목과 연결 가능.",
  },
  s_3: {
    original: "조별과제 회의 장소가 계단 위 카페였고, 다른 곳을 제안하기 어려웠습니다.",
    anonymized: "팀 활동 장소가 접근하기 어려운 공간으로 정해져 참여 부담이 있었습니다.",
    riskItems: ["조별과제 특정 가능성", "장소 정보 제거", "상황 맥락 완화"],
    decision: "센터 검수 후 공개 권장. 원문 저장과 공개본 분리 필요.",
  },
  s_4: {
    original: "수업은 3층에서 열렸지만 엘리베이터가 없어 강의실에 갈 수 없었습니다.",
    anonymized: "강의실 접근 동선에 승강기 대안이 없어 수업 참여가 어려웠습니다.",
    riskItems: ["층수 표현 완화", "수업 특정 가능성 점검"],
    decision: "공개 가능. 강의실 배정 기준 개선 근거로 사용 가능.",
  },
};

export const StoriesPage: React.FC = () => {
  const { showToast } = useContext(ToastContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState<Story[]>([]);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [anonymizingId, setAnonymizingId] = useState<string | null>(null);

  const resetSearch = () => {
    setQuery("");
    setSearchParams({}, { replace: true });
  };

  useEffect(() => {
    setIsLoading(true);
    setApiError(null);
    getStoriesForAdmin({ query })
      .then((items) => {
        setStories(items);
      })
      .catch((error) => {
        setApiError(toApiError(error));
        setStories([]);
      })
      .finally(() => setIsLoading(false));
  }, [query, reloadKey]);

  const filteredStories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length === 0) return stories;
    return stories.filter((story) =>
      [
        story.title,
        story.content,
        story.buildingName,
        story.category,
        ...story.tags,
        story.aiReview?.note ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [stories, query]);

  const setVisibility = async (
    id: string,
    visibility: NonNullable<Story["visibility"]>
  ) => {
    try {
      const updated = await updateStoryVisibility(id, visibility);
      if (updated) {
        setStories((cur) => cur.map((s) => (s.id === id ? updated : s)));
        const label =
          visibility === "public"
            ? "공개"
            : visibility === "private"
            ? "비공개"
            : "센터 전용";
        showToast(`이야기 공개 범위가 "${label}"(으)로 변경되었습니다.`);
      }
    } catch (error) {
      const apiError = toApiError(error);
      showToast(`저장 실패: ${apiError.message}`, "error");
    }
  };

  const requestAnonymize = async (story: Story) => {
    setAnonymizingId(story.id);
    try {
      const result = await anonymizeStory(story.id);
      setStories((current) =>
        current.map((item) =>
          item.id === story.id
            ? {
                ...item,
                anonymizedContent: result.anonymizedContent,
                aiReview: {
                  anonymized: "완료",
                  sensitiveInfo: result.sensitiveInfoStatus,
                  reportReady: result.reportReady,
                  note: result.reviewNote,
                },
              }
            : item
        )
      );
      showToast("AI 익명화 API 검수를 완료했습니다.");
    } catch (error) {
      const apiError = toApiError(error);
      showToast(`익명화 실패: ${apiError.message}`, "error");
    } finally {
      setAnonymizingId(null);
    }
  };

  return (
    <>
      <Topbar />
      <main className="page">
        <div className="page-h">
          <div>
            <h1>경험 피드 관리</h1>
            <div className="sub">
              {stories.length}건 · 비공개 전환은 익명화 검수 후 24시간 이내 가능
            </div>
          </div>
        </div>

        <OperationalStatus
          title="경험 피드 검수 동기화 상태"
          onRetry={() => setReloadKey((key) => key + 1)}
        />
        {apiError && (
          <ApiFailureBanner
            message={apiError.message}
            code={`${apiError.code}${apiError.status ? ` · HTTP ${apiError.status}` : ""}`}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        )}

        <div className="toolbar">
          <input
            className="search-input"
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              const next = new URLSearchParams(searchParams);
              if (value.trim()) {
                next.set("q", value.trim());
              } else {
                next.delete("q");
              }
              setSearchParams(next, { replace: true });
            }}
            placeholder="제목, 본문, 건물명, 태그, AI 검수 메모 검색"
          />
          <span className="small-muted">
            검색 결과 {filteredStories.length}건 · 실제 서버 검색은 아직 구현 안 됨 · 추가 예정
          </span>
          <button className="h-btn" onClick={resetSearch}>
            필터 초기화
          </button>
        </div>

        <div className="story-admin-grid">
          {isLoading && (
            <PageState
              kind="loading"
              title="경험 피드를 불러오는 중입니다"
              description="현재는 Mock API 기준입니다. 원문/공개본 저장과 검수 이력은 아직 구현 안 됨 · 추가 예정."
            />
          )}
          {!isLoading && apiError && (
            <PageState
              kind="error"
              title="경험 피드를 불러오지 못했습니다"
              description="익명화 검수 API 실패 시 원문/공개본 저장과 공개 상태 변경을 중단해야 합니다. 현재는 Mock 실패 시뮬레이션입니다."
              actionLabel="다시 불러오기"
              onAction={() => setReloadKey((key) => key + 1)}
            />
          )}
          {!isLoading && filteredStories.map((s) => {
            const totalReactions =
              s.reactions.first_known +
              s.reactions.empathize +
              s.reactions.must_change +
              s.reactions.can_help;
            return (
              <div className="story-card" key={s.id}>
                <div className="top">
                  <span className="nick">{s.authorNickname}</span>
                  <span className="place">{s.buildingName}</span>
                  <span className="small-muted">·</span>
                  <span className="small-muted">{s.category}</span>
                  <span style={{ marginLeft: "auto" }}>
                    <VisibilityBadge visibility={s.visibility ?? "public"} />
                  </span>
                </div>
                <div className="ttl">{s.title}</div>
                <div className="body">{s.content}</div>

                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: "var(--primary-50)",
                        color: "var(--primary)",
                        padding: "3px 9px",
                        borderRadius: 999,
                        fontSize: 11.5,
                        fontWeight: 700,
                      }}
                    >
                      # {t}
                    </span>
                  ))}
                </div>

                <div className="meta">
                  <span>♡ 공감 {s.empathyCount}</span>
                  <span>💬 댓글 {s.commentCount}</span>
                  <span>총 반응 {totalReactions}</span>
                  <span>
                    📣 "바뀌어야" {s.reactions.must_change}명 ·
                    ✋ "도움 가능" {s.reactions.can_help}명
                  </span>
                  <span>신고 {s.reportedCount ?? 0}</span>
                </div>

                <div className="ai-review-box">
                  <div>
                    <span className="field-l">AI 익명화</span>
                    <b>{s.aiReview?.anonymized ?? "검수 필요"}</b>
                  </div>
                  <div>
                    <span className="field-l">민감 정보</span>
                    <b>{s.aiReview?.sensitiveInfo ?? "확인 필요"}</b>
                  </div>
                  <div>
                    <span className="field-l">리포트 반영</span>
                    <b>{s.aiReview?.reportReady ? "가능" : "검수 후 가능"}</b>
                  </div>
                  <div className="ai-review-note">
                    {s.aiReview?.note ?? "AI 검수 결과 저장은 아직 구현 안 됨 · 추가 예정."}
                  </div>
                </div>

                <div className="privacy-review-box">
                  <div className="privacy-review-head">
                    <div>
                      <div className="field-l">익명화 전/후 비교</div>
                      <b>공개본 검수 Mock</b>
                    </div>
                    <span className="backend-needed">원문/공개본 저장은 아직 구현 안 됨 · 추가 예정</span>
                  </div>
                  <div className="privacy-compare">
                    <div>
                      <span className="field-l">원문 위험 표현</span>
                      <p>{PRIVACY_REVIEWS[s.id]?.original ?? s.content}</p>
                    </div>
                    <div>
                      <span className="field-l">공개용 변환안</span>
                      <p>{s.anonymizedContent ?? PRIVACY_REVIEWS[s.id]?.anonymized ?? s.content}</p>
                    </div>
                  </div>
                  <div className="risk-chip-row">
                    {(PRIVACY_REVIEWS[s.id]?.riskItems ?? ["검수 필요"]).map((risk) => (
                      <span className="risk-chip" key={risk}>{risk}</span>
                    ))}
                  </div>
                  <div className="small-muted">
                    {PRIVACY_REVIEWS[s.id]?.decision ?? "관리자 검수 후 공개 여부 결정 필요."}
                  </div>
                </div>

                <div className="privacy-review-box">
                  <div className="privacy-review-head">
                    <div>
                      <div className="field-l">검수/공개 처리 이력</div>
                      <b>AI 익명화와 관리자 검수 로그 Mock</b>
                    </div>
                    <span className="backend-needed">검수 로그 저장은 아직 구현 안 됨 · 추가 예정</span>
                  </div>
                  <ActionTimeline items={storyHistory(s)} compact />
                </div>

                <div className="acts">
                  <button
                    className="h-btn"
                    onClick={() => setVisibility(s.id, "public")}
                  >
                    공개 유지
                  </button>
                  <button
                    className="h-btn"
                    onClick={() => setVisibility(s.id, "private")}
                  >
                    비공개 전환
                  </button>
                  <button
                    className="h-btn"
                    onClick={() => setVisibility(s.id, "center_only")}
                  >
                    센터 검토 요청
                  </button>
                  <button
                    className="h-btn primary"
                    onClick={() =>
                      showToast(`"${s.title}" 리포트 반영 동작입니다. 실제 저장은 아직 구현 안 됨 · 추가 예정.`)
                    }
                  >
                    개선 리포트에 추가
                  </button>
                  <button
                    className="h-btn"
                    onClick={() => void requestAnonymize(s)}
                    disabled={anonymizingId === s.id}
                  >
                    {anonymizingId === s.id ? "익명화 중" : "익명화 다시 검수"}
                  </button>
                  <button
                    className="h-btn"
                    onClick={() =>
                      showToast("익명화 승인 이력 저장은 아직 구현 안 됨 · 추가 예정.")
                    }
                  >
                    익명화 승인
                  </button>
                </div>
              </div>
            );
          })}
          {!isLoading && !apiError && filteredStories.length === 0 && (
            <PageState
              kind="empty"
              title="검색 조건에 맞는 경험 피드가 없습니다"
              description="검색어를 바꾸거나 필터를 초기화해 주세요. 실제 서버 검색은 아직 구현 안 됨 · 추가 예정."
              actionLabel="검색 초기화"
              onAction={resetSearch}
            />
          )}
        </div>
      </main>
    </>
  );
};

function storyHistory(story: Story): ActionTimelineItem[] {
  const items: ActionTimelineItem[] = [
    {
      time: story.createdAt,
      actor: story.authorNickname,
      action: "경험 글 등록",
      note: "원문 저장과 공개본 분리 저장은 아직 구현 안 됨 · 추가 예정.",
    },
    {
      time: "AI 검수",
      actor: "ONDA AI",
      action:
        story.aiReview?.anonymized === "완료"
          ? "익명화 완료"
          : story.aiReview?.anonymized === "보류"
          ? "익명화 보류"
          : "익명화 검수 필요",
      note: story.aiReview?.note ?? "AI 검수 결과 저장은 아직 구현 안 됨 · 추가 예정.",
      tone: story.aiReview?.anonymized === "완료" ? "success" : "warning",
    },
  ];
  if (story.visibility === "private") {
    return [
      ...items,
      {
        time: "관리자",
        actor: "장애학생지원센터",
        action: "비공개 전환",
        note: "비공개 사유, 승인자, 처리 시간 저장은 아직 구현 안 됨 · 추가 예정.",
        tone: "danger",
      },
    ];
  }
  if (story.visibility === "center_only") {
    return [
      ...items,
      {
        time: "관리자",
        actor: "장애학생지원센터",
        action: "센터 전용 검토",
        note: "공개 전 추가 확인이 필요한 상태입니다.",
        tone: "warning",
      },
    ];
  }
  return [
    ...items,
    {
      time: "공개",
      actor: "관리자",
      action: "피드 공개 유지",
      note: story.aiReview?.reportReady
        ? "리포트 근거로 반영 가능한 상태입니다."
        : "리포트 반영 전 관리자 추가 검수가 필요합니다.",
      tone: story.aiReview?.reportReady ? "success" : "warning",
    },
  ];
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError("UNKNOWN_ERROR", "알 수 없는 API 오류가 발생했습니다.");
}
