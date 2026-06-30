import { useEffect, useState } from "react";
import type { CaseSummaryResponse } from "../../domain/types";
import { useStore } from "../../features/store";
import { Header, StatusBadge } from "../components/shared";

export function RequesterHome() {
  const { api, navigate } = useStore();
  const [cases, setCases] = useState<CaseSummaryResponse[]>([]);
  useEffect(() => { void api.listMyCases().then(setCases).catch(() => {}); }, [api]);

  const c = {
    작성중: cases.filter((x) => x.status === "작성중").length,
    검토중: cases.filter((x) => x.status === "검토중").length,
    진행중: cases.filter((x) => x.status === "접수완료" || x.status === "검사중").length,
    완료: cases.filter((x) => x.status === "완료" || x.status === "통보").length,
  };

  return (
    <>
      <Header title="내 의뢰 현황" sub="회원 · 본인 의뢰만" />
      <div className="main">
        <div className="card row" style={{ justifyContent: "space-around", textAlign: "center" }}>
          {(["검토중", "진행중", "완료"] as const).map((k) => (
            <div key={k}><div style={{ fontSize: 22, fontWeight: 800, color: "var(--green-deep)" }}>{c[k]}</div><div className="muted">{k}</div></div>
          ))}
        </div>
        <button className="btn" onClick={() => navigate({ name: "case" })}>＋ 새 검사 의뢰</button>
        <div className="title" style={{ marginTop: 20 }}>내 의뢰 목록</div>
        {cases.length === 0 && <p className="muted">아직 의뢰가 없습니다.</p>}
        {cases.map((x) => (
          <div key={x.id} className="card" onClick={() => navigate({ name: "case-detail", id: x.id })}>
            <div className="spread"><b>{x.receiptNumber ?? "접수번호 발급 전"}</b><StatusBadge status={x.status} /></div>
            <div className="muted" style={{ marginTop: 6 }}>{x.farmName} · {x.species} · 채취 {x.sampleCollectedDate}</div>
          </div>
        ))}
      </div>
    </>
  );
}
