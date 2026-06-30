import { useEffect, useState } from "react";
import type { Case } from "../../domain/types";
import { useStore } from "../../features/store";
import { Header, StatusBadge } from "../components/shared";

export function CaseDetail({ id }: { id: string }) {
  const { api, navigate } = useStore();
  const [c, setC] = useState<Case | undefined>();

  useEffect(() => {
    void api.getCase(id).then(setC);
  }, [api, id]);

  if (!c) return <div className="main">불러오는 중…</div>;

  return (
    <>
      <Header title="의뢰 상세" />
      <div className="main">
        <div className="card">
          <div className="spread">
            <b style={{ fontSize: 18 }}>{c.receiptNo ?? "접수번호 발급 전"}</b>
            <StatusBadge status={c.status} />
          </div>
          <div className="muted" style={{ marginTop: 8 }}>
            {c.species} · {c.ageWeeks}주령 · 채취 {c.sampleCollectedDate}
          </div>
          {c.status === "검토중" && (
            <p className="note" style={{ marginTop: 10 }}>
              실물(검체) 도착 후 관리자가 접수를 확정하면 접수번호가 발급되고 SMS·이메일로 안내됩니다.
            </p>
          )}
          {c.tatDue && <div className="muted" style={{ marginTop: 8 }}>예상 결과(TAT): {c.tatDue.slice(0, 10)}</div>}
        </div>

        <div className="title">검사별 진행상황</div>
        {c.tests.map((t) => (
          <div key={t.testItemCode} className="card">
            <div className="spread">
              <b>{t.testItemCode}</b>
              <span className={`badge b-${t.status === "완료" ? "완료" : t.status === "검사중" ? "검사중" : "접수완료"}`}>
                {t.status}
              </span>
            </div>
            {/* 완료된 개별 검사는 최종통보 전에도 선열람 (FR-A13) */}
            {t.status === "완료" && t.verdict && (
              <div style={{ marginTop: 8 }}>
                결과: <b>{t.verdict}</b>
                {t.measured && <> · {t.measured}</>}
                {t.resultSummary && <div className="muted">{t.resultSummary}</div>}
              </div>
            )}
          </div>
        ))}
        <p className="muted">※ 완료된 개별 검사는 최종 통보 전에도 결과를 먼저 열람할 수 있습니다.</p>

        {c.finalComment && (
          <div className="card" style={{ borderColor: "var(--green-deep)" }}>
            <div className="title">최종 통보</div>
            <div>{c.finalComment}</div>
          </div>
        )}

        <button className="btn sec" onClick={() => navigate({ name: "home" })}>목록으로</button>
      </div>
    </>
  );
}
