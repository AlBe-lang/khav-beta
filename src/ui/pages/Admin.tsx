import { useEffect, useState } from "react";
import { VERDICT, type AdminCaseSummaryResponse, type CaseDetailResponse, type DashboardResponse, type PendingCaseResponse, type Verdict } from "../../domain/types";
import { errMsg, useStore } from "../../features/store";
import { StatusBadge } from "../components/shared";

export function Admin() {
  const { api, logout, me } = useStore();
  const isAdmin = me?.role === "관리자";
  const [dash, setDash] = useState<DashboardResponse | null>(null);
  const [pending, setPending] = useState<PendingCaseResponse[]>([]);
  const [cases, setCases] = useState<AdminCaseSummaryResponse[]>([]);
  const [sel, setSel] = useState<CaseDetailResponse | null>(null);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");

  async function reload() {
    setErr("");
    try {
      if (isAdmin) { setDash(await api.dashboard()); setPending(await api.pending()); }
      setCases(await api.adminCases({}));
      if (sel) setSel(await api.getCase(sel.id));
    } catch (e) { setErr(errMsg(e)); }
  }
  useEffect(() => { void reload(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function act(fn: () => Promise<unknown>) { setErr(""); try { await fn(); await reload(); } catch (e) { setErr(errMsg(e)); } }
  const open = async (id: number) => setSel(sel?.id === id ? null : await api.getCase(id));
  function exportCsv() {
    const blob = new Blob([api.exportCsv()], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "cases_export.csv"; a.click();
  }

  return (
    <>
      <div className="header"><div><b>KHAV 관리자 CMS</b><small>접수·결과·통보</small></div>
        <button className="btn sm sec" onClick={logout}>로그아웃</button></div>
      <div className="main">
        {err && <div className="err">{err}</div>}
        {dash && (
          <div className="card row" style={{ justifyContent: "space-around", textAlign: "center" }}>
            {([["검토중", dash.reviewing], ["접수", dash.accepted], ["검사중", dash.testing], ["완료", dash.completed]] as const).map(([k, v]) => (
              <div key={k}><div style={{ fontSize: 20, fontWeight: 800, color: "var(--green-deep)" }}>{v}</div><div className="muted">{k}</div></div>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="card">
            <div className="title">도착 대기 (접수 확정)</div>
            <p className="note">실물 도착 확인 후 「접수 확정」 시 접수번호 발급·TAT 시작.</p>
            {pending.length === 0 && <p className="muted">대기 없음.</p>}
            {pending.map((p) => (
              <div key={p.caseId} className="spread" style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                <div><b>{p.farmName} / {p.species}</b><div className="muted">{p.requesterName} · {p.submittedAt.slice(0, 10)}</div></div>
                <button className="btn sm" onClick={() => act(() => api.accept(p.caseId))}>✓ 접수 확정</button>
              </div>
            ))}
          </div>
        )}

        <div className="spread"><div className="title">의뢰 목록</div><button className="btn sm sec" onClick={exportCsv}>엑셀 내보내기</button></div>
        {cases.map((x) => (
          <div key={x.caseId} className="card" onClick={() => open(x.caseId)}>
            <div className="spread"><b>{x.receiptNumber ?? "발급 전"}</b><StatusBadge status={x.status} /></div>
            <div className="muted" style={{ marginTop: 4 }}>{x.farmName} / {x.species} · {x.institution ?? x.requesterName}</div>
          </div>
        ))}

        {sel && sel.status !== "검토중" && (
          <div className="card" style={{ borderColor: "var(--green-deep)" }}>
            <div className="title">결과 등록 · {sel.receiptNumber}</div>
            {sel.tests.map((t) => <ResultRow key={t.id} name={t.testItemName} done={t.status === "완료"} verdict={t.verdict}
              onSubmit={(v, m) => act(async () => { await api.enterResult(sel.id, t.id, { verdict: v, measuredValue: m }); await api.setTestStatus(sel.id, t.id, "완료"); })} />)}
            {isAdmin && (
              <>
                <label>최종 통보 코멘트</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="결과 종합 코멘트" />
                {!sel.tests.every((t) => t.status === "완료") && <p className="muted">※ 모든 검사 완료 후 통보 가능.</p>}
                <button className="btn" style={{ marginTop: 8 }} disabled={!comment.trim() || !sel.tests.length || !sel.tests.every((t) => t.status === "완료")}
                  onClick={() => act(async () => { await api.finalize(sel.id, comment); setComment(""); })}>결과 발행 · 최종 통보</button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ResultRow({ name, done, verdict, onSubmit }: { name: string; done: boolean; verdict?: Verdict; onSubmit: (v: Verdict, m: string) => void }) {
  const [v, setV] = useState<Verdict>("음성");
  const [m, setM] = useState("");
  if (done) return <div className="spread" style={{ padding: "8px 0" }}><b>{name}</b><span className="badge b-완료">완료 · {verdict}</span></div>;
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <b>{name}</b>
      <div className="row" style={{ marginTop: 6 }}>
        <select value={v} onChange={(e) => setV(e.target.value as Verdict)} style={{ flex: 1 }}>{VERDICT.map((x) => <option key={x}>{x}</option>)}</select>
        <input placeholder="측정값" value={m} onChange={(e) => setM(e.target.value)} style={{ flex: 1 }} />
        <button className="btn sm" onClick={() => onSubmit(v, m)}>입력</button>
      </div>
    </div>
  );
}
