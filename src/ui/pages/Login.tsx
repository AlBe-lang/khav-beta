import { useState } from "react";
import { useStore } from "../../features/store";
import { Field } from "../components/shared";

export function Login() {
  const { api, setUser, navigate } = useStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginId, setLoginId] = useState("");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    if (!loginId.trim() || (mode === "signup" && (!name.trim() || !phone.trim()))) {
      setErr("* 필수 항목(아이디·성명·연락처)을 입력하세요.");
      return;
    }
    try {
      const u =
        mode === "login"
          ? await api.login(loginId)
          : await api.signup({ loginId, name, org, phone });
      setUser(u);
      navigate({ name: u.role === "관리자" ? "admin" : "home" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    }
  }

  return (
    <>
      <div className="header">
        <div>
          <b>KHAV 동물질병진단센터</b>
          <small>KONKUK Univ. Poultry D-Lab · 베타</small>
        </div>
      </div>
      <div className="main">
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <button className={`btn sm ${mode === "login" ? "" : "sec"}`} onClick={() => setMode("login")}>
              로그인
            </button>
            <button className={`btn sm ${mode === "signup" ? "" : "sec"}`} onClick={() => setMode("signup")}>
              회원가입
            </button>
          </div>

          <Field label="아이디" req>
            <input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="데모: vet / admin" />
          </Field>

          {mode === "signup" && (
            <>
              <Field label="의뢰인 성명" req>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="의뢰기관명">
                <input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="예: ○○동물병원" />
              </Field>
              <Field label="연락처 (SMS 알림)" req>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
              </Field>
            </>
          )}

          <div style={{ marginTop: 16 }}>
            <button className="btn" onClick={submit}>
              {mode === "login" ? "로그인" : "가입하고 시작"}
            </button>
          </div>
          {err && <div className="err">{err}</div>}
          <p className="muted" style={{ marginTop: 12 }}>
            ※ 베타: 회원제 기반(개별코드 조회 미사용). 데이터는 mock(브라우저 저장).
          </p>
        </div>
      </div>
    </>
  );
}
