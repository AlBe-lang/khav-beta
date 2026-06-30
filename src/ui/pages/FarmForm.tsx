import { useEffect, useState } from "react";
import type { AddressResponse, FarmResponse } from "../../domain/types";
import { errMsg, useStore } from "../../features/store";
import { Field } from "../components/shared";

export function FarmForm() {
  const { api, navigate } = useStore();
  const [farms, setFarms] = useState<FarmResponse[]>([]);
  const [farmName, setFarmName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AddressResponse[]>([]);
  const [addr, setAddr] = useState<AddressResponse | null>(null);
  const [err, setErr] = useState("");

  const reload = () => api.listFarms().then(setFarms).catch(() => {});
  useEffect(() => { void reload(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function search() { setResults(await api.addressSearch(q)); }
  async function save() {
    setErr("");
    if (!addr) { setErr("주소를 검색·선택하세요."); return; }
    try {
      await api.createFarm({ farmName, ownerName, provinceCode: addr.provinceCode, districtCode: addr.districtCode });
      navigate({ name: "case" });
    } catch (e) { setErr(errMsg(e)); }
  }

  return (
    <>
      <div className="pagehead"><div><h1>농장 관리</h1><p>등록한 농장은 의뢰 시 선택·재사용합니다.</p></div></div>
      <div className="grid2">
        <div className="card">
          <div className="title">내 농장</div>
          {farms.length === 0 && <p className="muted">등록된 농장이 없습니다.</p>}
          {farms.map((f) => (
            <div key={f.id} className="farmrow">
              <b>{f.farmName}</b> <span className="muted">({f.ownerName})</span>
              <div className="muted">{f.provinceName} {f.districtName}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="title">＋ 새 농장 등록</div>
          <p className="info">농장명·축주명·주소가 필수입니다.</p>
          <Field label="농장명" req><input value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder="예: 성원농장" /></Field>
          <Field label="축주명" req><input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} /></Field>
          <Field label="농장 주소 (도로명·우편번호 검색)" req>
            <div className="row"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 시·군 입력 (예: 칠곡)" /><button className="btn sm sec" onClick={search}>검색</button></div>
          </Field>
          {results.map((r) => (
            <div key={r.zipNo} className={`chip ${addr?.zipNo === r.zipNo ? "on" : ""}`} style={{ display: "block", marginTop: 8 }} onClick={() => setAddr(r)}>
              [{r.zipNo}] {r.roadAddress}
            </div>
          ))}
          <div style={{ marginTop: 16 }}><button className="btn" disabled={!addr} onClick={save}>농장 저장</button></div>
          {err && <div className="err">{err}</div>}
        </div>
      </div>
    </>
  );
}
