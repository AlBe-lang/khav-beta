import type { ReactNode } from "react";
import type { CaseStatus } from "../../domain/types";
import { useStore } from "../../features/store";

export function StatusBadge({ status }: { status: CaseStatus }) {
  return <span className={`badge b-${status}`}>{status}</span>;
}

/** 의뢰인 상단 네비 (Figma: 흰 바 + 브랜드 + 가로 메뉴) */
export function TopNav() {
  const { me, view, navigate, logout } = useStore();
  if (!me) return null;
  const cur = view.name;
  return (
    <div className="topnav">
      <span className="brand">KHAV 동물질병진단센터</span>
      <nav>
        <a className={cur === "home" ? "on" : ""} onClick={() => navigate({ name: "home" })}>내 의뢰</a>
        <a className={cur === "farm" ? "on" : ""} onClick={() => navigate({ name: "farm" })}>농장</a>
        <a className={cur === "case" ? "on" : ""} onClick={() => navigate({ name: "case" })}>＋ 의뢰</a>
        <a className="user" onClick={logout} title="로그아웃">{me.name} ▾</a>
      </nav>
    </div>
  );
}

/** 의뢰인 레이아웃 셸 */
export function RequesterShell({ children }: { children: ReactNode }) {
  return <div className="shell"><TopNav /><div className="content">{children}</div></div>;
}

/** 관리자 다크 사이드바 셸 (Figma) */
export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const { me, logout } = useStore();
  const menu = ["대시보드", "의뢰 관리", "결과 관리", "통합 뷰", "검사 항목 관리"];
  return (
    <div className="shell">
      <div className="admin">
        <aside className="sidebar">
          <div className="sb-brand">KHAV 진단센터 CMS</div>
          {menu.map((m, i) => <a key={m} className={i === 0 ? "on" : ""}>{m}</a>)}
        </aside>
        <div className="adminmain">
          <div className="abar">
            <h1>{title}</h1>
            <span className="muted">{me?.role} · {me?.name} · <a style={{ cursor: "pointer", color: "var(--brand)" }} onClick={logout}>로그아웃</a></span>
          </div>
          <div className="content" style={{ paddingBottom: 36 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, req, children }: { label: string; req?: boolean; children: ReactNode }) {
  return <><label>{label} {req && <span className="req">*</span>}</label>{children}</>;
}
