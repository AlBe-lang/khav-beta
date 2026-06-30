import { useEffect, useMemo, useState } from "react";
import { HOUSING, PURPOSE, SPECIES, type CaseSaveRequest, type FarmResponse, type HousingType, type RequestPurpose, type Species, type TestItemResponse } from "../../domain/types";
import { calcAge } from "../../domain/logic";
import { errMsg, useStore } from "../../features/store";
import { Field } from "../components/shared";

const SYMPTOMS: Array<[keyof CaseSaveRequest, string]> = [
  ["mortalityIncrease", "폐사 증가"], ["layingRateDrop", "산란율 저하"], ["weightGainDrop", "증체 저하"],
  ["neurologicalSymptom", "신경증상"], ["respiratorySound", "호흡기음"], ["legAbnormality", "다리 이상"], ["symptomEtc", "기타"],
];

export function CaseForm() {
  const { api, navigate } = useStore();
  const [farms, setFarms] = useState<FarmResponse[]>([]);
  const [items, setItems] = useState<TestItemResponse[]>([]);
  const [farmId, setFarmId] = useState<number | "">("");
  const [species, setSpecies] = useState<Species>("산란계");
  const [purpose, setPurpose] = useState<RequestPurpose>("항원검사");
  const [flockBirthDate, setFlock] = useState("");
  const [sampleCollectedDate, setSample] = useState("");
  const [breedingScale, setScale] = useState("");
  const [sampleCount, setSampleCount] = useState("");
  const [breedingHouse, setHouse] = useState("");
  const [housingType, setHousing] = useState<HousingType>("케이지");
  const [sym, setSym] = useState<Record<string, boolean>>({});
  const [necropsy, setNecropsy] = useState("");
  const [testIds, setTestIds] = useState<number[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api.listFarms().then((f) => { setFarms(f); if (f[0]) setFarmId(f[0].id); }).catch(() => {});
    void api.listTestItems().then(setItems).catch(() => {});
  }, [api]);

  const age = useMemo(() => (flockBirthDate && sampleCollectedDate ? calcAge(flockBirthDate, sampleCollectedDate) : null), [flockBirthDate, sampleCollectedDate]);
  const toggle = (id: number) => setTestIds((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  async function submit() {
    setErr("");
    const symOn = Object.values(sym).some(Boolean);
    if (farmId === "" || !flockBirthDate || !sampleCollectedDate || !breedingHouse.trim() || !breedingScale || !sampleCount || !symOn || testIds.length === 0) {
      setErr("* 필수 항목(농장·날짜·사육규모·검체수·의뢰동·증상≥1·검사≥1)을 확인하세요.");
      return;
    }
    const req: CaseSaveRequest = {
      farmId: Number(farmId), species, purpose, sampleCollectedDate, flockBirthDate,
      breedingScale: Number(breedingScale) || 0, sampleCount: Number(sampleCount) || 0,
      breedingHouse, housingType, necropsyFindings: necropsy,
      mortalityIncrease: !!sym.mortalityIncrease, layingRateDrop: !!sym.layingRateDrop, weightGainDrop: !!sym.weightGainDrop,
      neurologicalSymptom: !!sym.neurologicalSymptom, respiratorySound: !!sym.respiratorySound, legAbnormality: !!sym.legAbnormality, symptomEtc: !!sym.symptomEtc,
      tests: testIds.map((id) => ({ testItemId: id })), vaccinations: [],
    };
    setBusy(true);
    try {
      const created = await api.createCase(req);
      const submitted = await api.submitCase(created.id);
      navigate({ name: "case-detail", id: submitted.id });
    } catch (e) {
      const ee = e as { violations?: Array<{ message: string }>; message?: string };
      setErr(ee.violations?.length ? ee.violations.map((v) => v.message).join(" · ") : errMsg(e));
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="pagehead"><div><h1>진단 의뢰</h1><p>의뢰인 (회원) · 멀티스텝 양식</p></div></div>
      <div className="formcol">
        <div className="info">* 필수 항목 미입력 시 제출되지 않습니다. (제출 = 접수 검토 중)</div>
        <div className="card">
          <div className="title">1. 농장·축종</div>
          <Field label="농장" req>
            <select value={farmId} onChange={(e) => setFarmId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">— 선택 —</option>{farms.map((f) => <option key={f.id} value={f.id}>{f.farmName} ({f.districtName})</option>)}
            </select>
          </Field>
          <button className="btn sec sm" style={{ marginTop: 8 }} onClick={() => navigate({ name: "farm" })}>＋ 새 농장</button>
          <Field label="축종" req><select value={species} onChange={(e) => setSpecies(e.target.value as Species)}>{SPECIES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="의뢰 목적"><select value={purpose} onChange={(e) => setPurpose(e.target.value as RequestPurpose)}>{PURPOSE.map((p) => <option key={p}>{p}</option>)}</select></Field>
          <Field label="계군 생년월일" req><input type="date" value={flockBirthDate} onChange={(e) => setFlock(e.target.value)} /></Field>
          <Field label="시료 채취일" req><input type="date" value={sampleCollectedDate} onChange={(e) => setSample(e.target.value)} /></Field>
          {age && <div className="muted" style={{ marginTop: 8 }}>주령(자동): <b>{age.ageWeeks}주령 ({age.ageDays}일령)</b></div>}
        </div>

        <div className="card">
          <div className="title">2. 사육 정보</div>
          <Field label="사육 규모(수수)" req><input type="number" value={breedingScale} onChange={(e) => setScale(e.target.value)} /></Field>
          <Field label="검체 수" req><input type="number" value={sampleCount} onChange={(e) => setSampleCount(e.target.value)} /></Field>
          <Field label="의뢰동" req><input value={breedingHouse} onChange={(e) => setHouse(e.target.value)} placeholder="예: 1동" /></Field>
          <Field label="사육 형태"><select value={housingType} onChange={(e) => setHousing(e.target.value as HousingType)}>{HOUSING.map((h) => <option key={h}>{h}</option>)}</select></Field>
        </div>

        <div className="card">
          <div className="title">3. 증상 (1개 이상) · 검사 항목 (1개 이상)</div>
          <Field label="임상 증상" req>
            <div className="chips">{SYMPTOMS.map(([k, label]) => <span key={k as string} className={`chip ${sym[k as string] ? "on" : ""}`} onClick={() => setSym((s) => ({ ...s, [k as string]: !s[k as string] }))}>{label}</span>)}</div>
          </Field>
          <Field label="검사 항목" req>
            <div className="chips">{items.map((t) => <span key={t.id} className={`chip ${testIds.includes(t.id) ? "on" : ""}`} onClick={() => toggle(t.id)}>{t.name}</span>)}</div>
          </Field>
          <Field label="부검 소견 (자유 입력)"><textarea value={necropsy} onChange={(e) => setNecropsy(e.target.value)} placeholder="예: 기관 출혈 등" /></Field>
          <div style={{ marginTop: 16 }}><button className="btn" disabled={busy} onClick={submit}>의뢰 제출 (접수 검토 중)</button></div>
          {err && <div className="err">{err}</div>}
        </div>
      </div>
    </>
  );
}
