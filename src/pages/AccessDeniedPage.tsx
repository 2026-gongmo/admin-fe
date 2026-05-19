import React from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { PageState } from "../components/PageState";

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Topbar />
      <main className="page">
        <PageState
          kind="denied"
          title="권한이 필요한 관리자 기능입니다"
          description="현재는 권한 없음 상태를 보여주는 프론트 Mock 화면입니다. 실제 인가는 백엔드 붙여야 함."
          actionLabel="설정에서 권한 정책 보기"
          onAction={() => navigate("/settings")}
        />
      </main>
    </>
  );
};
