import React from "react";
import { Sidebar } from "./Sidebar";
import { getModeLabel, isHttpMode } from "../services/api";
import { getApiBaseUrl } from "../services/httpClient";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-col">
        <DeploymentNotice />
        {children}
      </div>
    </div>
  );
};

const DeploymentNotice: React.FC = () => {
  const httpMode = isHttpMode();

  return (
    <div className={httpMode ? "deployment-notice api" : "deployment-notice mock"}>
      <span className={httpMode ? "api-pill" : "backend-needed"}>
        {httpMode ? "백엔드 API 연결" : "정적 배포 화면"}
      </span>
      <div>
        <b>
          {httpMode
            ? "Spring Boot API와 로컬 DB 저장이 적용된 상태입니다."
            : "Dothome 공개 화면은 프론트 정적 화면입니다."}
        </b>
        <span>
          {httpMode
            ? `현재 API 기준: ${getApiBaseUrl()} · 제보/도움 요청/경험 피드/개선 과제/리포트 조회는 API 기준입니다. 파일 업로드와 PDF 생성은 아직 구현 안 됨 · 추가 예정입니다.`
            : `${getModeLabel()} 기준 · 공개 배포에서 백엔드를 쓰려면 Spring Boot를 Oracle/Render/Railway 같은 Java 서버에 별도 배포해야 합니다.`}
        </span>
      </div>
    </div>
  );
};
