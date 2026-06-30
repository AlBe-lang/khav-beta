import { useEffect, useState } from "react";
import type { CaseSummaryResponse } from "../../domain/types";
import { useStore } from "../../features/store";
import { StatusBadge } from "../components/shared";

export function RequesterHome() {
  const { api, navigate } = useStore();
  const [cases, setCases] = useState<CaseSummaryResponse[]>([]);
  useEffect(() => { void api.listMyCases().then(setCases).catch(() => {}); }, [api]);

  const c = {
    검토중: cases.filter((x) => x.status === "검토중").length,
    진행중: cases.filter((x) => x.status === "접수완료" || x.status === "검사중").length,
    완료: cases.filter((x) => x.status === "완료" || x.status === "통보").length,
  };

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>내 의뢰 현황</h1>
          <p>회원 · 본인 의뢰만 표시됩니다.</p>
        </div>
        <button className="btn sm" onClick={() => navigate({ name: "case" })}>＋ 새 검사 의뢰</button>
      </div>

      <div className="stats">
        <div className="stat warn"><span className="label">검토중</span><span className="num">{c.검토중}</span></div>
        <div className="stat"><span className="label">진행중</span><span className="num">{c.진행중}</span></div>
        <div className="stat done"><span className="label">완료</span><span className="num">{c.완료}</span></div>
      </div>

      <div className="listcard">
        <div className="lhead"><span>접수번호</span><span>농장 · 축종</span><span>상태</span></div>
        {cases.length === 0 && <div className="lrow empty">아직 의뢰가 없습니다.</div>}
        {cases.map((x) => (
          <div key={x.id} className="lrow" onClick={() => navigate({ name: "case-detail", id: x.id })}>
            <span><b>{x.receiptNumber ?? "발급 전"}</b><div className="pills"><span className="pill">{x.sampleCollectedDate}</span></div></span>
            <span>{x.farmName} · {x.species}</span>
            <span><StatusBadge status={x.status} /></span>
          </div>
        ))}
      </div>
    </>
  );
}
