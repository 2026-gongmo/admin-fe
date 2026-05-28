import React, { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext, ToastContext } from "../App";
import { getApiBaseUrl, getApiMode } from "../services/httpClient";

export const LoginPage: React.FC = () => {
  const { admin, login, isLoading } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const [email, setEmail] = useState("center@onda.test");
  const [password, setPassword] = useState("onda1234!");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && admin) {
    return <Navigate to="/dashboard" replace />;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      showToast("관리자 로그인에 성공했습니다.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "로그인에 실패했습니다.";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-mark">베프</div>
        <h1>관리자 웹 로그인</h1>
        <p>
          접근성 제보, 도움 요청, 경험 피드 검수 데이터를 학교 개선 업무로 전환하는
          운영 대시보드입니다.
        </p>
        <div className="login-mode-card">
          <span>현재 모드</span>
          <b>{getApiMode() === "http" ? "Spring Boot API 연결" : "Mock 시연 모드"}</b>
          <small>
            {getApiMode() === "http"
              ? `API Base URL: ${getApiBaseUrl()}`
              : "실제 백엔드 호출 없이 프론트 Mock 데이터로 로그인합니다."}
          </small>
        </div>
      </section>

      <form className="login-card" onSubmit={submit}>
        <div>
          <h2>센터 관리자 계정</h2>
          <p>로컬 MVP seed 계정이 기본 입력되어 있습니다.</p>
        </div>

        <label className="login-field">
          <span>이메일</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="username"
            required
          />
        </label>

        <label className="login-field">
          <span>비밀번호</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        <button className="login-submit" disabled={isSubmitting}>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </button>

        <div className="login-seed">
          <b>로컬 seed 계정</b>
          <span>center@onda.test / onda1234!</span>
          <span>facility@onda.test / onda1234!</span>
          <span>super@onda.test / onda1234!</span>
        </div>
      </form>
    </main>
  );
};
