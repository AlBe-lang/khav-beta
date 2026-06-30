import { useState } from "react";
import { errMsg, useStore } from "../../features/store";
import { Field } from "../components/shared";

export function Login() {
  const { api, refreshMe } = useStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");

  async function sendCode() {
    setErr("");
    try { const r = await api.requestPhoneCode(phone); setDevCode(r.devCode); }
    catch (e) { setErr(errMsg(e)); }
  }
  async function verify() {
    setErr("");
    try { await api.verifyPhoneCode(phone, code); setVerified(true); }
    catch (e) { setErr(errMsg(e)); }
  }
  async function submit() {
    setErr("");
    try {
      if (mode === "login") { await api.login(loginId, password); }
      else {
        if (!verified) { setErr("휴대폰 인증을 완료하세요."); return; }
        await api.signup({ loginId, password, name, phone, organization: org, email, privacyConsent: agree });
        await api.login(loginId, password);
      }
      await refreshMe();
    } catch (e) { setErr(errMsg(e)); }
  }

  return (
    <>
      <div className="header"><div><b>KHAV 동물질병진단센터</b><small>KONKUK Univ. Poultry D-Lab</small></div></div>
      <div className="main">
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <button className={`btn sm ${mode === "login" ? "" : "sec"}`} onClick={() => setMode("login")}>로그인</button>
            <button className={`btn sm ${mode === "signup" ? "" : "sec"}`} onClick={() => setMode("signup")}>회원가입</button>
          </div>

          <Field label="아이디" req><input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="데모: vet / admin" /></Field>
          <Field label="비밀번호" req><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="데모: vet / admin" /></Field>

          {mode === "signup" && (
            <>
              <Field label="의뢰인 성명" req><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="의뢰기관명"><input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="예: ○○동물병원" /></Field>
              <Field label="이메일"><input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="연락처 (SMS 본인인증)" req>
                <div className="row">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" disabled={verified} />
                  <button className="btn sm sec" onClick={sendCode} disabled={!phone || verified}>인증번호</button>
                </div>
              </Field>
              {devCode && !verified && <div className="devcode">📩 (mock) 인증번호: <b>{devCode}</b> — 실서버는 SMS로만 발송됩니다.</div>}
              {!verified && devCode && (
                <Field label="인증번호 입력" req>
                  <div className="row">
                    <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6자리" />
                    <button className="btn sm" onClick={verify}>인증</button>
                  </div>
                </Field>
              )}
              {verified && <div className="note" style={{ marginTop: 8 }}>✓ 휴대폰 인증 완료</div>}
              <label className="row" style={{ marginTop: 12 }}>
                <input type="checkbox" style={{ width: 18 }} checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span style={{ fontWeight: 400 }}>개인정보 수집·이용에 동의합니다. (필수)</span>
              </label>
            </>
          )}

          <div style={{ marginTop: 16 }}>
            <button className="btn" onClick={submit}>{mode === "login" ? "로그인" : "가입하고 시작"}</button>
          </div>
          {err && <div className="err">{err}</div>}
          <p className="muted" style={{ marginTop: 12 }}>※ 회원제 · 가입 시 SMS 본인인증. 데이터는 mock(브라우저 저장).</p>
        </div>
      </div>
    </>
  );
}
