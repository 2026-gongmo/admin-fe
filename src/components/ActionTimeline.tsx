import React from "react";

export interface ActionTimelineItem {
  time: string;
  actor: string;
  action: string;
  note: string;
  tone?: "default" | "warning" | "danger" | "success";
}

interface Props {
  items: ActionTimelineItem[];
  compact?: boolean;
}

export const ActionTimeline: React.FC<Props> = ({ items, compact = false }) => {
  return (
    <div className={"action-timeline" + (compact ? " compact" : "")}>
      {items.map((item) => (
        <div className="action-timeline-item" key={`${item.time}-${item.actor}-${item.action}`}>
          <div className={"action-dot " + (item.tone ?? "default")} />
          <div>
            <div className="action-head">
              <b>{item.action}</b>
              <span>{item.time}</span>
            </div>
            <div className="action-meta">{item.actor}</div>
            <div className="action-note">{item.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
