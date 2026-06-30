import { useEffect, useState } from "react";
import type { Farm } from "../../domain/types";
import { api as rawApi } from "../../adapters/mockApi";
import { useStore } from "../../features/store";
import { Field, Header } from "../components/shared";

export function FarmForm() {
  const { api, user, navigate } = useStore();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [name, setName] = useState("");
  const [keeper, setKeeper] = useState("");
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user) void api.listFarms(user.id).then(setFarms);
  }, [api, user]);

  async function save() {
    setErr("");
    if (!user) return;
    try {
      await api.addFarm({ ownerId: user.id, name, keeper, region });
      navigate({ name: "case" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    }
  }

  const results = q ? rawApi.addressSearch(q) : [];

  return (
    <>
      <Header title="농장 관리" />
      <div className="main">
        <div className="card">
          <div className="muted">등록한 농장은 의뢰 시 선택·재사용합니다.</div>
          {farms.map((f) => (
            <div key={f.id} className="spread" style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <div>
                <b>{f.name || f.keeper}</b>
                <div className="muted">{f.region}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="title">＋ 새 농장 등록</div>
          <p className="note">농장명 또는 축주명 중 하나 이상은 필수입니다.</p>
          <Field label="농장명">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 성원농장" />
          </Field>
          <Field label="축주명">
            <input value={keeper} onChange={(e) => setKeeper(e.target.value)} />
          </Field>
          <Field label="농장 주소 (도로명·우편번호 검색)" req>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 시·군 입력 (예: 칠곡)" />
          </Field>
          <div className="chips" style={{ marginTop: 8 }}>
            {results.map((r) => (
              <span key={r} className={`chip ${region === r ? "on" : ""}`} onClick={() => setRegion(r)}>
                {r}
              </span>
            ))}
          </div>
          {region && <div className="muted" style={{ marginTop: 8 }}>선택: {region}</div>}
          <div style={{ marginTop: 16 }}>
            <button className="btn" disabled={!region} onClick={save}>
              농장 저장
            </button>
          </div>
          {err && <div className="err">{err}</div>}
        </div>
      </div>
    </>
  );
}
