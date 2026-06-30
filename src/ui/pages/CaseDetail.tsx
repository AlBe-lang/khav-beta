import { useEffect, useState } from "react";
import type { CaseDetailResponse, CaseResultsResponse } from "../../domain/types";
import { useStore } from "../../features/store";
import { StatusBadge } from "../components/shared";

export function CaseDetail({ id }: { id: number }) {
  const { api, navigate } = useStore();
  const [c, setC] = useState<CaseDetailResponse | null>(null);
  const [results, setResults] = useState<CaseResultsResponse | null>(null);

  useEffect(() => {
    void api.getCase(id).then(setC).catch(() => {});
    void api.caseResults(id).then(setResults).catch(() => {});
  }, [api, id]);

  if (!c) return <div className="content">불러오는 중…</div>;
  return (
    <>
      <div className="pagehead"><div><h1>의뢰 상세</h1><p>본인 의뢰 진행·결과</p></div>
        <button className="btn sec sm" onClick={() => navigate({ name: "home" })}>목록으로</button></div>
      <div className="formcol">
        <div className="card">
          <div className="spread"><b style={{ fontSize: 18 }}>{c.receiptNumber ?? "접수번호 발급 전"}</b><StatusBadge status={c.status} /></div>
          <div className="muted" style={{ marginTop: 8 }}>{c.farmName} · {c.species} · {c.ageWeeks ?? "-"}주령 · 채취 {c.sampleCollectedDate}</div>
          {c.status === "검토중" && <p className="info" style={{ marginTop: 10 }}>실물 도착 후 관리자가 접수를 확정하면 접수번호가 발급됩니다.</p>}
        </div>

        <div className="title">검사별 진행상황</div>
        {c.tests.map((t) => (
          <div key={t.id} className="card">
            <div className="spread"><b>{t.testItemName}</b>
              <span className={`badge b-${t.status === "완료" ? "완료" : t.status === "검사중" ? "검사중" : "접수완료"}`}>{t.status}</span></div>
            {t.status === "완료" && t.verdict && (
              <div style={{ marginTop: 8 }}>결과: <b>{t.verdict}</b>{t.measuredValue && <> · {t.measuredValue}</>}{t.resultSummary && <div className="muted">{t.resultSummary}</div>}</div>
            )}
          </div>
        ))}
        <p className="muted">※ 완료된 개별 검사는 최종 통보 전에도 먼저 열람할 수 있습니다.</p>

        {results?.finalComment && (
          <div className="card" style={{ borderColor: "var(--brand)" }}>
            <div className="title">최종 통보</div><div>{results.finalComment}</div>
          </div>
        )}
      </div>
    </>
  );
}
