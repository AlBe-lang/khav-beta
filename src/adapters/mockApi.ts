// adapters/mockApi — 실 백엔드 계약을 흉내내는 교체형 mock. 백엔드 뜨면 이 파일만 httpApi로 교체.
import {
  addBusinessDays, calcAge, canFinalize, canTransitionTest, deriveCaseStatus, nextReceiptNo,
} from "../domain/logic";
import type {
  AddressResponse, AdminCaseSummaryResponse, AgeCalcResponse, ApiError, CaseDetailResponse, CaseResultsResponse,
  CaseSaveRequest, CaseSummaryResponse, CaseValidationResponse, CaseStatus, DashboardResponse, FarmResponse,
  MeResponse, PendingCaseResponse, RegionResponse, Role, TestItemResponse, TestStatus, TokenResponse,
  VaccineResponse, Verdict,
} from "../domain/types";

// ── 내부 모델 (DTO보다 풍부) ──
interface Member { id: number; loginId: string; password: string; name: string; organization?: string; phone: string; email?: string; role: Role; emailVerified: boolean; }
interface Farm { id: number; ownerId: number; farmName: string; ownerName: string; provinceCode: string; provinceName: string; districtCode: string; districtName: string; }
interface Test { id: number; testItemId: number; status: TestStatus; verdict?: Verdict; measuredValue?: string; resultSummary?: string; delayReason?: string; startedAt?: string; completedAt?: string; }
interface Case {
  id: number; ownerId: number; status: CaseStatus; receiptNumber: string | null; req: CaseSaveRequest;
  acceptedAt: string | null; finalComment: string | null; submittedAt: string | null; tatDue?: string; tests: Test[];
}
interface DB { members: Member[]; farms: Farm[]; cases: Case[]; seq: number; }

function err(status: number, message: string, violations?: ApiError["violations"]): ApiError { return { status, message, violations }; }

const TEST_ITEMS: TestItemResponse[] = [
  { id: 1, code: "AG_AIV", category: "항원", method: "PCR", name: "AIV 항원검사", recommendedSampleTypes: ["Swab", "조직"], antibioticSensitivitySupported: false, displayOrder: 10, standardTatBusinessDays: 3, active: true },
  { id: 2, code: "AG_IBV", category: "항원", method: "PCR", name: "IBV 항원검사", recommendedSampleTypes: ["Swab", "조직"], antibioticSensitivitySupported: false, displayOrder: 11, active: true },
  { id: 3, code: "BAC_SALMO", category: "세균", method: "배양", name: "살모넬라 분리동정", recommendedSampleTypes: ["폐사계", "조직"], antibioticSensitivitySupported: true, displayOrder: 30, active: true },
  { id: 4, code: "PARA_COCCI", category: "기생충", method: "검경", name: "콕시듐 검사", recommendedSampleTypes: ["폐사계"], antibioticSensitivitySupported: false, displayOrder: 40, active: true },
  { id: 5, code: "SERO_HI_NDV", category: "혈청", method: "HI", name: "NDV 항체가(HI)", recommendedSampleTypes: ["혈청"], antibioticSensitivitySupported: false, displayOrder: 70, active: true },
];
const VACCINES: VaccineResponse[] = [
  { id: 1, code: "VAC_ND", name: "ND 백신", type: "생독", displayOrder: 1 },
  { id: 2, code: "VAC_IB", name: "IB 백신", type: "생독", displayOrder: 2 },
];
const REGIONS: RegionResponse[] = [{ code: "47", name: "경상북도" }, { code: "41", name: "경기도" }, { code: "46", name: "전라남도" }];
const ADDRESSES: AddressResponse[] = [
  { roadAddress: "경북 칠곡군 석적읍 강변대로 1", zipNo: "39900", provinceCode: "47", districtCode: "47850", siNm: "경상북도", sggNm: "칠곡군" },
  { roadAddress: "전남 나주시 빛가람로 1", zipNo: "58326", provinceCode: "46", districtCode: "46170", siNm: "전라남도", sggNm: "나주시" },
];

const KEY = "khav-fe-db-v1";
function seed(): DB {
  return {
    members: [
      { id: 1, loginId: "admin", password: "admin", name: "홍길동", phone: "010-0000-0000", role: "관리자", emailVerified: true },
      { id: 2, loginId: "vet", password: "vet", name: "이정근", organization: "영남동물병원", phone: "010-1111-2222", email: "vet@example.com", role: "의뢰인", emailVerified: true },
    ],
    farms: [{ id: 1, ownerId: 2, farmName: "성원농장", ownerName: "김성원", provinceCode: "47", provinceName: "경상북도", districtCode: "47850", districtName: "칠곡군" }],
    cases: [], seq: 100,
  };
}
function load(): DB { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r) as DB; } catch { /* */ } const d = seed(); save(d); return d; }
function save(d: DB) { localStorage.setItem(KEY, JSON.stringify(d)); }
function nextId(d: DB): number { d.seq += 1; return d.seq; }

// mock 세션 + SMS 코드
let session: { memberId: number } | null = JSON.parse(localStorage.getItem("khav-fe-session") || "null");
function setSession(s: typeof session) { session = s; localStorage.setItem("khav-fe-session", JSON.stringify(s)); }
const phoneCodes = new Map<string, string>();
const verifiedPhones = new Set<string>();

const d100 = <T,>(v: T): Promise<T> => new Promise((r) => setTimeout(() => r(v), 100));
const now = () => new Date().toISOString();

function memberById(id: number): Member { const m = load().members.find((x) => x.id === id); if (!m) throw err(404, "회원을 찾을 수 없습니다"); return m; }
function requireRole(...roles: Role[]): Member { if (!session) throw err(401, "인증이 필요합니다"); const m = memberById(session.memberId); if (!roles.includes(m.role)) throw err(403, "권한이 없습니다"); return m; }
function currentMember(): Member { if (!session) throw err(401, "인증이 필요합니다"); return memberById(session.memberId); }
/** 의뢰 접근 가드(RLS): 의뢰인은 본인 의뢰만, 관리자·검사자는 전체. */
function caseAccess(id: number): { d: DB; c: Case; me: Member } {
  const me = currentMember(); const d = load(); const c = d.cases.find((x) => x.id === id);
  if (!c) throw err(404, "의뢰를 찾을 수 없습니다");
  if (me.role === "의뢰인" && c.ownerId !== me.id) throw err(403, "권한이 없습니다");
  return { d, c, me };
}

function toFarmResp(f: Farm): FarmResponse { return { id: f.id, farmName: f.farmName, ownerName: f.ownerName, provinceCode: f.provinceCode, provinceName: f.provinceName, districtCode: f.districtCode, districtName: f.districtName }; }
function toDetail(c: Case, d: DB): CaseDetailResponse {
  const farm = d.farms.find((f) => f.id === c.req.farmId);
  return {
    id: c.id, status: c.status, receiptNumber: c.receiptNumber, farmId: c.req.farmId, farmName: farm?.farmName ?? "",
    species: c.req.species, purpose: c.req.purpose, sampleCollectedDate: c.req.sampleCollectedDate, flockBirthDate: c.req.flockBirthDate,
    ageWeeks: c.req.ageWeeks, ageDays: c.req.ageDays, breedingScale: c.req.breedingScale, sampleCount: c.req.sampleCount,
    breedingHouse: c.req.breedingHouse, housingType: c.req.housingType, necropsyFindings: c.req.necropsyFindings, historyDetail: c.req.historyDetail,
    submittedAt: c.submittedAt,
    tests: c.tests.map((t) => { const ti = TEST_ITEMS.find((x) => x.id === t.testItemId)!; return { id: t.id, testItemId: t.testItemId, testItemCode: ti.code, testItemName: ti.name, category: ti.category, status: t.status, verdict: t.verdict, measuredValue: t.measuredValue, resultSummary: t.resultSummary }; }),
  };
}
function validateForSubmit(c: Case): CaseValidationResponse {
  const v: CaseValidationResponse["violations"] = [];
  const r = c.req;
  if (!r.farmId) v.push({ field: "farmId", message: "농장을 선택하세요" });
  if (!r.flockBirthDate) v.push({ field: "flockBirthDate", message: "계군 생년월일 필수" });
  if (!r.sampleCollectedDate) v.push({ field: "sampleCollectedDate", message: "시료 채취일 필수" });
  if (!r.breedingHouse?.trim()) v.push({ field: "breedingHouse", message: "의뢰동 필수" });
  if (!(r.breedingScale > 0)) v.push({ field: "breedingScale", message: "사육 규모 필수" });
  if (!(r.sampleCount > 0)) v.push({ field: "sampleCount", message: "검체 수 필수" });
  if (Date.parse(r.sampleCollectedDate) <= Date.parse(r.flockBirthDate)) v.push({ field: "sampleCollectedDate", message: "채취일은 계군 생년월일 이후여야 함" });
  if (!(r.tests?.length)) v.push({ field: "tests", message: "검사 항목을 1개 이상 선택" });
  const sym = [r.mortalityIncrease, r.layingRateDrop, r.weightGainDrop, r.neurologicalSymptom, r.respiratorySound, r.legAbnormality, r.symptomEtc];
  if (!sym.some(Boolean)) v.push({ field: "symptoms", message: "증상을 1개 이상 선택" });
  return { valid: v.length === 0, violations: v };
}

export const api = {
  // ── auth ──
  async requestPhoneCode(phone: string): Promise<{ devCode: string }> {
    if (!phone?.trim()) throw err(400, "phone: 필수");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    phoneCodes.set(phone, code);
    return d100({ devCode: code }); // mock: 화면에 표시(실서버는 SMS로만)
  },
  async verifyPhoneCode(phone: string, code: string): Promise<void> {
    if (phoneCodes.get(phone) !== code) throw err(400, "인증번호가 일치하지 않습니다");
    verifiedPhones.add(phone); return d100(undefined);
  },
  async signup(req: { loginId: string; password: string; name: string; phone: string; organization?: string; email?: string; privacyConsent: boolean }): Promise<{ memberId: number }> {
    if (!req.loginId?.trim() || !req.password || !req.name?.trim() || !req.phone?.trim()) throw err(400, "필수 항목을 입력하세요");
    if (!req.privacyConsent) throw err(400, "개인정보 수집·이용 동의 필요");
    if (!verifiedPhones.has(req.phone)) throw err(400, "휴대폰 인증이 필요합니다");
    const d = load();
    if (d.members.some((m) => m.loginId === req.loginId)) throw err(400, "이미 존재하는 아이디입니다");
    const m: Member = { id: nextId(d), loginId: req.loginId, password: req.password, name: req.name, organization: req.organization, phone: req.phone, email: req.email, role: "의뢰인", emailVerified: false };
    d.members.push(m); save(d); verifiedPhones.delete(req.phone);
    return d100({ memberId: m.id });
  },
  async login(loginId: string, password: string): Promise<TokenResponse> {
    const m = load().members.find((x) => x.loginId === loginId.trim());
    if (!m || m.password !== password) throw err(400, "아이디 또는 비밀번호가 올바르지 않습니다");
    setSession({ memberId: m.id });
    return d100({ accessToken: `mock-${m.id}`, refreshToken: `mock-r-${m.id}`, tokenType: "Bearer", expiresIn: 3600 });
  },
  logout() { setSession(null); },
  async me(): Promise<MeResponse> {
    if (!session) throw err(401, "인증이 필요합니다");
    const m = memberById(session.memberId);
    return d100({ id: m.id, loginId: m.loginId, name: m.name, organization: m.organization, phone: m.phone, email: m.email, role: m.role, emailVerified: m.emailVerified });
  },

  // ── codes / address ──
  listRegions: async (): Promise<RegionResponse[]> => d100(REGIONS),
  listTestItems: async (): Promise<TestItemResponse[]> => d100(TEST_ITEMS.filter((t) => t.active)),
  listVaccines: async (): Promise<VaccineResponse[]> => d100(VACCINES),
  addressSearch: async (keyword: string): Promise<AddressResponse[]> => d100(ADDRESSES.filter((a) => (a.roadAddress + a.sggNm).includes(keyword.trim()))),

  // ── farms ──
  async listFarms(): Promise<FarmResponse[]> { const m = requireRole("의뢰인"); return d100(load().farms.filter((f) => f.ownerId === m.id).map(toFarmResp)); },
  async createFarm(req: { farmName: string; ownerName: string; provinceCode: string; districtCode: string }): Promise<FarmResponse> {
    const m = requireRole("의뢰인");
    if (!req.farmName?.trim() || !req.ownerName?.trim() || !req.provinceCode || !req.districtCode) throw err(400, "농장명·축주명·지역 필수");
    const d = load();
    const region = ADDRESSES.find((a) => a.districtCode === req.districtCode) || ADDRESSES.find((a) => a.provinceCode === req.provinceCode);
    const f: Farm = { id: nextId(d), ownerId: m.id, farmName: req.farmName, ownerName: req.ownerName, provinceCode: req.provinceCode, provinceName: region?.siNm ?? "", districtCode: req.districtCode, districtName: region?.sggNm ?? "" };
    d.farms.push(f); save(d); return d100(toFarmResp(f));
  },
  ageCalc: async (flockBirthDate: string, sampleCollectedDate: string): Promise<AgeCalcResponse> => d100(calcAge(flockBirthDate, sampleCollectedDate)),

  // ── cases (의뢰인) ──
  async createCase(req: CaseSaveRequest): Promise<CaseDetailResponse> {
    const m = requireRole("의뢰인"); const d = load();
    const age = calcAge(req.flockBirthDate, req.sampleCollectedDate);
    const c: Case = { id: nextId(d), ownerId: m.id, status: "작성중", receiptNumber: null, req: { ...req, ageWeeks: age.ageWeeks, ageDays: age.ageDays }, acceptedAt: null, finalComment: null, submittedAt: null, tests: (req.tests || []).map((t) => ({ id: nextId(d), testItemId: t.testItemId, status: "접수" })) };
    d.cases.push(c); save(d); return d100(toDetail(c, d));
  },
  async getCase(id: number): Promise<CaseDetailResponse> { const { c, d } = caseAccess(id); return d100(toDetail(c, d)); },
  async listMyCases(): Promise<CaseSummaryResponse[]> {
    const m = requireRole("의뢰인"); const d = load();
    return d100(d.cases.filter((c) => c.ownerId === m.id).reverse().map((c) => { const farm = d.farms.find((f) => f.id === c.req.farmId); return { id: c.id, status: c.status, receiptNumber: c.receiptNumber, farmName: farm?.farmName ?? "", species: c.req.species, sampleCollectedDate: c.req.sampleCollectedDate, submittedAt: c.submittedAt }; }));
  },
  async validateCase(id: number): Promise<CaseValidationResponse> { const { c } = caseAccess(id); return d100(validateForSubmit(c)); },
  async submitCase(id: number): Promise<CaseDetailResponse> {
    const { d, c, me } = caseAccess(id); if (me.role !== "의뢰인") throw err(403, "권한이 없습니다");
    const val = validateForSubmit(c); if (!val.valid) throw err(400, "필수항목 검증에 실패했습니다", val.violations);
    c.status = "검토중"; c.submittedAt = now(); save(d); return d100(toDetail(c, d));
  },
  async caseResults(id: number): Promise<CaseResultsResponse> {
    const { c } = caseAccess(id);
    return d100({ caseId: c.id, receiptNumber: c.receiptNumber, status: c.status, finalComment: c.finalComment ?? undefined, results: c.tests.filter((t) => t.status === "완료").map((t) => { const ti = TEST_ITEMS.find((x) => x.id === t.testItemId)!; return { testName: ti.name, verdict: t.verdict ?? "", memo: t.resultSummary, measuredValue: t.measuredValue, status: t.status }; }) });
  },

  // ── 관리자 ──
  async pending(): Promise<PendingCaseResponse[]> {
    requireRole("관리자"); const d = load();
    return d100(d.cases.filter((c) => c.status === "검토중").map((c) => { const f = d.farms.find((x) => x.id === c.req.farmId); const owner = d.members.find((x) => x.id === c.ownerId); return { caseId: c.id, submittedAt: c.submittedAt ?? now(), farmName: f?.farmName ?? "", ownerName: f?.ownerName ?? "", institution: owner?.organization, requesterName: owner?.name ?? "", phone: owner?.phone ?? "", species: c.req.species, sampleCollectedDate: c.req.sampleCollectedDate }; }));
  },
  async accept(caseId: number): Promise<CaseDetailResponse> {
    requireRole("관리자"); const d = load(); const c = d.cases.find((x) => x.id === caseId); if (!c) throw err(404, "의뢰 없음");
    if (c.status !== "검토중") throw err(409, "이미 접수 확정된 의뢰입니다");
    const t = new Date(); c.receiptNumber = nextReceiptNo(d.cases.map((x) => x.receiptNumber), t.getFullYear()); c.acceptedAt = t.toISOString(); c.tatDue = addBusinessDays(t, 3).toISOString(); c.status = "접수완료";
    save(d); return d100(toDetail(c, d));
  },
  async dashboard(): Promise<DashboardResponse> {
    requireRole("관리자"); const cs = load().cases; const cnt = (s: CaseStatus) => cs.filter((c) => c.status === s).length;
    return d100({ reviewing: cnt("검토중"), accepted: cnt("접수완료"), testing: cnt("검사중"), completed: cnt("완료"), reported: cnt("통보"), total: cs.length });
  },
  async adminCases(q: { receiptNumber?: string; institution?: string; farmName?: string; positive?: boolean }): Promise<AdminCaseSummaryResponse[]> {
    requireRole("관리자", "검사자"); const d = load();
    let list = d.cases.filter((c) => c.status !== "작성중");
    if (q.farmName) list = list.filter((c) => d.farms.find((f) => f.id === c.req.farmId)?.farmName.includes(q.farmName!));
    if (q.receiptNumber) list = list.filter((c) => c.receiptNumber?.includes(q.receiptNumber!));
    if (q.positive) list = list.filter((c) => c.tests.some((t) => t.verdict === "양성"));
    return d100(list.reverse().map((c) => { const f = d.farms.find((x) => x.id === c.req.farmId); const o = d.members.find((x) => x.id === c.ownerId); return { caseId: c.id, receiptNumber: c.receiptNumber, status: c.status, species: c.req.species, farmName: f?.farmName ?? "", institution: o?.organization, requesterName: o?.name ?? "", submittedAt: c.submittedAt, acceptedAt: c.acceptedAt ?? undefined }; }));
  },
  async setTestStatus(caseId: number, testId: number, to: TestStatus): Promise<CaseDetailResponse> {
    requireRole("관리자", "검사자"); const d = load(); const c = d.cases.find((x) => x.id === caseId); const t = c?.tests.find((x) => x.id === testId); if (!c || !t) throw err(404, "검사 없음");
    if (!c.acceptedAt) throw err(400, "접수 확정 후 진행 가능"); if (!canTransitionTest(t.status, to)) throw err(400, `허용되지 않은 전이: ${t.status}→${to}`);
    t.status = to; if (to === "완료") t.completedAt = now(); c.status = deriveCaseStatus({ acceptedAt: c.acceptedAt, finalComment: c.finalComment, testStatuses: c.tests.map((x) => x.status) }); save(d); return d100(toDetail(c, d));
  },
  async enterResult(caseId: number, testId: number, r: { verdict: Verdict; measuredValue?: string; resultSummary?: string }): Promise<CaseDetailResponse> {
    requireRole("관리자", "검사자"); const d = load(); const c = d.cases.find((x) => x.id === caseId); const t = c?.tests.find((x) => x.id === testId); if (!c || !t) throw err(404, "검사 없음");
    if (!c.acceptedAt) throw err(400, "접수 확정 후 입력 가능"); if (t.status === "완료") throw err(400, "완료된 검사는 수정 불가");
    t.verdict = r.verdict; t.measuredValue = r.measuredValue; t.resultSummary = r.resultSummary; if (t.status === "접수") t.status = "검사중";
    c.status = deriveCaseStatus({ acceptedAt: c.acceptedAt, finalComment: c.finalComment, testStatuses: c.tests.map((x) => x.status) }); save(d); return d100(toDetail(c, d));
  },
  async finalize(caseId: number, finalComment: string): Promise<CaseDetailResponse> {
    requireRole("관리자"); const d = load(); const c = d.cases.find((x) => x.id === caseId); if (!c) throw err(404, "의뢰 없음");
    if (!finalComment?.trim()) throw err(400, "통보 코멘트는 필수입니다");
    if (!canFinalize(c.acceptedAt, c.tests.map((t) => t.status))) throw err(400, "모든 검사 완료 후 통보 가능");
    c.finalComment = finalComment; c.status = "통보"; save(d); return d100(toDetail(c, d));
  },
  exportCsv(): string {
    requireRole("관리자");
    const cell = (s: string) => { const v = /^[=+\-@]/.test(s) ? `'${s}` : s; return `"${v.replace(/"/g, '""')}"`; }; // 수식 인젝션·구분자 방어
    const d = load(); const rows = [["접수번호", "농장", "축종", "상태", "검사", "판정"]];
    for (const c of d.cases) { const f = d.farms.find((x) => x.id === c.req.farmId); for (const t of c.tests) { const ti = TEST_ITEMS.find((x) => x.id === t.testItemId)!; rows.push([c.receiptNumber ?? "", f?.farmName ?? "", c.req.species, c.status, ti.name, t.verdict ?? ""]); } }
    return rows.map((r) => r.map(cell).join(",")).join("\n");
  },
};

export function currentSession() { return session; }
