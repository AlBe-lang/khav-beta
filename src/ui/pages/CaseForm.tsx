import { useEffect, useMemo, useState } from "react";
import { SPECIES, type Farm, type Species } from "../../domain/types";
import { calcAgeWeeks } from "../../domain/logic";
import { api as rawApi } from "../../adapters/mockApi";
import { useStore } from "../../features/store";
import { Field, Header } from "../components/shared";

export function CaseForm() {
  const { api, user, navigate } = useStore();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState("");
  const [species, setSpecies] = useState<Species>("산란계");
  const [flockBirthDate, setFlock] = useState("");
  const [sampleCollectedDate, setSample] = useState("");
  const [sampleInfo, setSampleInfo] = useState("");
  const [purpose, setPurpose] = useState("항원검사");
  const [items, setItems] = useState<string[]>([]);
  const [necropsy, setNecropsy] = useState("");
  const [vaccines, setVaccines] = useState<string[]>([]);
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) void api.listFarms(user.id).then((f) => { setFarms(f); if (f[0]) setFarmId(f[0].id); });
  }, [api, user]);

  const ageWeeks = useMemo(
    () => (flockBirthDate && sampleCollectedDate ? calcAgeWeeks(flockBirthDate, sampleCollectedDate) : null),
    [flockBirthDate, sampleCollectedDate],
  );
  const testItems = rawApi.listTestItems();
  const vaccineCodes = rawApi.listVaccines();

  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const missing =
    !farmId || !flockBirthDate || !sampleCollectedDate || !sampleInfo.trim() || items.length === 0 || !agree;

  async function submit() {
    setErr("");
    if (!user || missing) {
      setErr("* 필수 항목(농장·계군생년월일·채취일·시료·검사항목·동의)을 확인하세요.");
      return;
    }
    setBusy(true);
    try {
      const c = await api.submitCase({
        ownerId: user.id, farmId, species, flockBirthDate, sampleCollectedDate,
        sampleInfo, purpose, necropsy, vaccineCodes: vaccines, testItemCodes: items,
      });
      navigate({ name: "case-detail", id: c.id });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header title="진단 의뢰" sub="의뢰인 (회원)" />
      <div className="main">
        <div className="steps"><span className="on" /><span className="on" /><span className="on" /></div>
        <p className="note">* 필수 항목을 입력하지 않으면 제출되지 않습니다(누락 방지).</p>

        <div className="card">
          <div className="title">1. 농장·축종</div>
          <Field label="농장 선택" req>
            <select value={farmId} onChange={(e) => setFarmId(e.target.value)}>
              <option value="">— 농장 선택 —</option>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name || f.keeper} ({f.region})</option>)}
            </select>
          </Field>
          <button className="btn sec sm" style={{ marginTop: 8 }} onClick={() => navigate({ name: "farm" })}>＋ 새 농장 등록</button>
          <Field label="축종 (가금 7종 + 기타)" req>
            <select value={species} onChange={(e) => setSpecies(e.target.value as Species)}>
              {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="계군 생년월일" req>
            <input type="date" value={flockBirthDate} onChange={(e) => setFlock(e.target.value)} />
          </Field>
          <Field label="시료 채취일" req>
            <input type="date" value={sampleCollectedDate} onChange={(e) => setSample(e.target.value)} />
          </Field>
          {ageWeeks !== null && <div className="muted" style={{ marginTop: 8 }}>주령(자동): <b>{ageWeeks}주령</b> (계군생년월일·채취일 기준·수정 가능)</div>}
        </div>

        <div className="card">
          <div className="title">2. 시료·검사 항목</div>
          <Field label="시료 종류" req>
            <input value={sampleInfo} onChange={(e) => setSampleInfo(e.target.value)} placeholder="예: 장기 / 혈청 / 분변 / 스왑" />
          </Field>
          <Field label="의뢰 목적">
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              {["연구용", "항원검사", "혈청검사", "기타"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="검사 항목 (복수 선택)" req>
            <div className="chips">
              {testItems.map((t) => (
                <span key={t.code} className={`chip ${items.includes(t.code) ? "on" : ""}`} onClick={() => setItems((a) => toggle(a, t.code))}>
                  {t.name}
                </span>
              ))}
            </div>
          </Field>
        </div>

        <div className="card">
          <div className="title">3. 부검·백신·동의</div>
          <Field label="부검 소견 (자유 입력)">
            <textarea value={necropsy} onChange={(e) => setNecropsy(e.target.value)} placeholder="예: 기관 출혈, 기낭염 등 자유롭게 입력" />
          </Field>
          <Field label="백신 이력 (코드 선택)">
            <div className="chips">
              {vaccineCodes.map((v) => (
                <span key={v.code} className={`chip ${vaccines.includes(v.code) ? "on" : ""}`} onClick={() => setVaccines((a) => toggle(a, v.code))}>
                  {v.name}
                </span>
              ))}
            </div>
          </Field>
          <label className="row" style={{ marginTop: 16 }}>
            <input type="checkbox" style={{ width: 18 }} checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span style={{ fontWeight: 400 }}>개인정보 수집·이용에 동의합니다.</span>
          </label>
          <div style={{ marginTop: 16 }}>
            <button className="btn" disabled={busy} onClick={submit}>의뢰 제출 (접수 검토 중)</button>
          </div>
          {err && <div className="err">{err}</div>}
          <p className="muted" style={{ marginTop: 10 }}>
            ※ 제출 시 「접수 검토 중」 상태가 됩니다. 실물 도착 후 관리자가 접수를 확정하면 접수번호가 발급됩니다.
          </p>
        </div>
      </div>
    </>
  );
}
