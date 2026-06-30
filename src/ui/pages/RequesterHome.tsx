import { useEffect, useState } from "react";
import type { Case } from "../../domain/types";
import { useStore } from "../../features/store";
import { Header, StatusBadge } from "../components/shared";

export function RequesterHome() {
  const { api, user, navigate } = useStore();
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    if (user) void api.listMyCases(user.id).then(setCases);
  }, [api, user]);

  const counts = {
    검토중: cases.filter((c) => c.status === "검토중").length,
    진행중: cases.filter((c) => c.status === "접수완료" || c.status === "검사중").length,
    완료: cases.filter((c) => c.status === "완료" || c.status === "통보").length,
  };

  return (
    <>
      <Header title="내 의뢰 현황" sub="회원 · 본인 의뢰만" />
      <div className="main">
        <div className="card row" style={{ justifyContent: "space-around", textAlign: "center" }}>
          {(["검토중", "진행중", "완료"] as const).map((k) => (
            <div key={k}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--green-deep)" }}>{counts[k]}</div>
              <div className="muted">{k}</div>
            </div>
          ))}
        </div>

        <button className="btn" onClick={() => navigate({ name: "case" })}>
          ＋ 새 검사 의뢰
        </button>

        <div className="title" style={{ marginTop: 20 }}>
          내 의뢰 목록
        </div>
        {cases.length === 0 && <p className="muted">아직 의뢰가 없습니다. 새 검사 의뢰를 시작하세요.</p>}
        {cases.map((c) => (
          <div key={c.id} className="card" onClick={() => navigate({ name: "case-detail", id: c.id })}>
            <div className="spread">
              <b>{c.receiptNo ?? "접수번호 발급 전"}</b>
              <StatusBadge status={c.status} />
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              {c.species} · {c.tests.map((t) => t.testItemCode).join("·")} · {c.submittedAt.slice(0, 10)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
