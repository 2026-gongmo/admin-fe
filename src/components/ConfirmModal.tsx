import React from "react";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "danger";
  notice?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({
  open,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  tone = "default",
  notice = "현재는 Mock 동작입니다. 실제 저장은 백엔드 붙여야 함.",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-modal-title" id="confirm-modal-title">
          {title}
        </div>
        <div className="confirm-modal-desc">{description}</div>
        <div className="confirm-modal-notice">{notice}</div>
        <div className="confirm-modal-actions">
          <button className="h-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={"h-btn" + (tone === "danger" ? " danger" : " primary")}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
