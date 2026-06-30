import { useEffect, useState } from "react";
import { VERDICT, type Case, type Verdict } from "../../domain/types";
import { canFinalize } from "../../domain/logic";
import { useStore } from "../../features/store";
import { StatusBadge } from "../components/shared";

export function Admin() {
  const { api, setUser, navigate } = useStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");

  const reload = () => api.adminCases().then(setCases);
  useEffect(() => { void reload(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pending = cases.filter((c) => c.status === "검토중");
  const selected = cases.find((c) => c.id === sel);

  async function accept(id: string) {
    setErr("");
    try { await api.accept(id); await reload(); }
    catch (e) { setErr(e instanceof Error ? e.message : "오류"); }
  }
  async function result(id: string, code: string, verdict: Verdict, measured: string) {
    await api.enterResult(id, code, { verdict, measured });
    await api.setTestStatus(id, code, "완료");
    await reload();
  }
  async function finalize(id: string) { await api.finalize(id, comment); setComment(""); await reload(); }

  return (
    <>
      <div className="header">
        <div><b>KHAV 관리자 CMS</b><small>접수 확정 · 결과 등록</small></div>
        <button className="btn sm sec" onClick={() => { setUser(null); navigate({ name: "login" }); }}>로그아웃</button>
      </div>
      <div className="main">
        {err && <div className="err">{err}</div>}
        <div className="card">
          <div className="title">도착 대기 (접수 확정)</div>
          <p className="note">의뢰서 제출만으론 접수 아님 — 실물 도착 확인 후 「접수 확정」 시 접수번호 발급·TAT 시작.</p>
          {pending.length === 0 && <p className="muted">대기 중인 의뢰가 없습니다.</p>}
          {pending.map((c) => (
            <div key={c.id} className="spread" style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <div><b>{c.species}</b><div className="muted">{c.tests.map((t) => t.testItemCode).join("·")} · {c.submittedAt.slice(0, 10)}</div></div>
              <button className="btn sm" onClick={() => accept(c.id)}>✓ 접수 확정</button>
            </div>
          ))}
        </div>

        <div className="title">의뢰 목록</div>
        {cases.map((c) => (
          <div key={c.id} className="card" onClick={() => setSel(c.id === sel ? null : c.id)}>
            <div className="spread">
              <b>{c.receiptNo ?? "발급 전"}</b>
              <StatusBadge status={c.status} />
            </div>
            <div className="muted" style={{ marginTop: 4 }}>{c.species} · {c.tests.map((t) => t.testItemCode).join("·")}</div>
          </div>
        ))}

        {selected && selected.status !== "검토중" && (
          <div className="card" style={{ borderColor: "var(--green-deep)" }}>
            <div className="title">결과 등록 · {selected.receiptNo}</div>
            {selected.tests.map((t) => (
              <ResultRow key={t.testItemCode} done={t.status === "완료"} verdict={t.verdict}
                onSubmit={(v, m) => result(selected.id, t.testItemCode, v, m)} code={t.testItemCode} />
            ))}
            <label>최종 통보 코멘트</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="결과 종합 코멘트" />
            {!canFinalize(selected) && <p className="muted">※ 모든 검사 완료 후 통보할 수 있습니다.</p>}
            <button className="btn" style={{ marginTop: 8 }} disabled={!comment.trim() || !canFinalize(selected)} onClick={() => finalize(selected.id)}>
              결과 발행 · 최종 통보
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function ResultRow({ code, done, verdict, onSubmit }: {
  code: string; done: boolean; verdict?: Verdict; onSubmit: (v: Verdict, m: string) => void;
}) {
  const [v, setV] = useState<Verdict>("음성");
  const [m, setM] = useState("");
  if (done) return <div className="spread" style={{ padding: "8px 0" }}><b>{code}</b><span className="badge b-완료">완료 · {verdict}</span></div>;
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <b>{code}</b>
      <div className="row" style={{ marginTop: 6 }}>
        <select value={v} onChange={(e) => setV(e.target.value as Verdict)} style={{ flex: 1 }}>
          {VERDICT.map((x) => <option key={x}>{x}</option>)}
        </select>
        <input placeholder="측정값(역가·CT)" value={m} onChange={(e) => setM(e.target.value)} style={{ flex: 1 }} />
        <button className="btn sm" onClick={() => onSubmit(v, m)}>입력</button>
      </div>
    </div>
  );
}
