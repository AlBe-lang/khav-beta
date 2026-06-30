import type { ReactNode } from "react";
import type { CaseStatus } from "../../domain/types";
import { useStore } from "../../features/store";

export function StatusBadge({ status }: { status: CaseStatus }) {
  return <span className={`badge b-${status}`}>{status}</span>;
}
export function Header({ title, sub }: { title: string; sub?: string }) {
  const { me } = useStore();
  return (
    <div className="header">
      <div><b>{title}</b>{sub && <small>{sub}</small>}</div>
      {me && <small>{me.organization ?? me.name}</small>}
    </div>
  );
}
export function TabBar() {
  const { me, view, navigate } = useStore();
  if (!me || me.role !== "의뢰인") return null;
  const cur = view.name;
  return (
    <div className="tabbar">
      <button className={cur === "home" ? "on" : ""} onClick={() => navigate({ name: "home" })}>내 의뢰</button>
      <button className={cur === "farm" ? "on" : ""} onClick={() => navigate({ name: "farm" })}>농장</button>
      <button className={cur === "case" ? "on" : ""} onClick={() => navigate({ name: "case" })}>＋ 의뢰</button>
    </div>
  );
}
export function Field({ label, req, children }: { label: string; req?: boolean; children: ReactNode }) {
  return <><label>{label} {req && <span className="req">*</span>}</label>{children}</>;
}
