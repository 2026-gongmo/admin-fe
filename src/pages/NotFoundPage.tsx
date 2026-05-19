import React from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { PageState } from "../components/PageState";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Topbar />
      <main className="page">
        <PageState
          kind="empty"
          title="요청한 관리자 화면을 찾을 수 없습니다"
          description="시연 중 잘못된 주소로 들어온 경우 대시보드로 돌아가면 됩니다."
          actionLabel="대시보드로 이동"
          onAction={() => navigate("/dashboard")}
        />
      </main>
    </>
  );
};
