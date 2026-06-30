// adapters/mockApi — 인메모리 Mock API (백엔드 없음). localStorage 지속.
// API 계약은 mock 가정(User Challenge #1). 실서버 확정 시 이 파일만 교체.
import type { Case, Farm, TestItem, User, VaccineCode, Verdict } from "../domain/types";
import {
  addBusinessDays,
  calcAgeWeeks,
  canFinalize,
  canTransitionTest,
  deriveCaseStatus,
  nextReceiptNo,
} from "../domain/logic";

interface DB {
  users: User[];
  farms: Farm[];
  cases: Case[];
}

// ── seed (잠정 — 센터 제공 후 교체, User Challenge #2) ──────────────
const SEED_TEST_ITEMS: TestItem[] = [
  { code: "AG_AIV", category: "항원", method: "PCR", name: "AIV 항원검사" },
  { code: "AG_IBV", category: "항원", method: "PCR", name: "IBV 항원검사" },
  { code: "AG_aMPV", category: "항원", method: "PCR", name: "aMPV 항원검사" },
  { code: "BAC_SALMO", category: "세균", method: "배양", name: "살모넬라 분리동정" },
  { code: "BAC_ECOLI", category: "세균", method: "배양", name: "대장균 분리동정" },
  { code: "PARA_COCCI", category: "기생충", method: "검경", name: "콕시듐 검사" },
  { code: "SERO_HI_NDV", category: "혈청", method: "HI", name: "NDV 항체가(HI)" },
  { code: "SERO_HI_AIV_Y280", category: "혈청", method: "HI", name: "AIV(Y280) 항체가(HI)" },
];
const SEED_VACCINES: VaccineCode[] = [
  { code: "VAC_ND", name: "ND 백신" },
  { code: "VAC_IB", name: "IB 백신" },
  { code: "VAC_AI", name: "AI 백신" },
];
export const REGIONS = ["경기 화성시", "경북 칠곡군", "전남 나주시", "충남 천안시", "전북 정읍시"];

const KEY = "khav-beta-db-v1";

function seedDb(): DB {
  return {
    users: [
      { id: "u-admin", loginId: "admin", name: "홍길동", phone: "010-0000-0000", role: "관리자" },
      { id: "u-demo", loginId: "vet", name: "이정근", org: "영남동물병원", phone: "010-1111-2222", email: "vet@example.com", role: "의뢰인" },
    ],
    farms: [{ id: "f-1", ownerId: "u-demo", name: "성원농장", keeper: "김성원", region: "경북 칠곡군" }],
    cases: [],
  };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* ignore */
  }
  const db = seedDb();
  save(db);
  return db;
}
function save(db: DB): void {
  localStorage.setItem(KEY, JSON.stringify(db));
}

let _seq = 0;
function uid(prefix: string): string {
  _seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${_seq}-${Math.floor(Math.random() * 1e6)}`;
}

// 인위적 지연으로 비동기 흉내
const delay = <T,>(v: T): Promise<T> => new Promise((r) => setTimeout(() => r(v), 120));

export const api = {
  // ── 코드 마스터 ──
  listTestItems: (): TestItem[] => SEED_TEST_ITEMS,
  listVaccines: (): VaccineCode[] => SEED_VACCINES,
  addressSearch: (q: string): string[] => REGIONS.filter((r) => r.includes(q.trim())),

  // ── 인증 (mock 세션, User Challenge #3) ──
  async login(loginId: string): Promise<User> {
    const u = load().users.find((x) => x.loginId === loginId.trim());
    if (!u) throw new Error("등록되지 않은 아이디입니다. (데모: vet / admin)");
    return delay(u);
  },
  async signup(input: Omit<User, "id" | "role">): Promise<User> {
    if (!input.loginId?.trim() || !input.name?.trim() || !input.phone?.trim())
      throw new Error("아이디·성명·연락처는 필수입니다."); // FR-A1 (서버측)
    const db = load();
    if (db.users.some((x) => x.loginId === input.loginId)) throw new Error("이미 존재하는 아이디입니다.");
    const u: User = { ...input, id: uid("u"), role: "의뢰인" };
    db.users.push(u);
    save(db);
    return delay(u);
  },

  // ── 농장 (FR-A3/A4) ──
  async listFarms(ownerId: string): Promise<Farm[]> {
    return delay(load().farms.filter((f) => f.ownerId === ownerId));
  },
  async addFarm(input: Omit<Farm, "id">): Promise<Farm> {
    if (!input.name?.trim() && !input.keeper?.trim()) throw new Error("농장명 또는 축주명 중 하나는 필수입니다.");
    if (!input.region?.trim()) throw new Error("농장 주소(지역)는 필수입니다.");
    const db = load();
    // 농장명이 있을 때만 중복 검사 (빈 농장명끼리 거짓 매칭 방지)
    if (input.name?.trim() && db.farms.some((f) => f.ownerId === input.ownerId && f.name === input.name))
      throw new Error("이미 등록된 농장명입니다.");
    const f: Farm = { ...input, id: uid("f") };
    db.farms.push(f);
    save(db);
    return delay(f);
  },

  // ── 의뢰 (FR-A7/A10) ──
  async submitCase(
    input: Omit<Case, "id" | "receiptNo" | "status" | "ageWeeks" | "tests" | "submittedAt"> & { testItemCodes: string[] },
  ): Promise<Case> {
    // 서버측 필수 검증 (FR-A8 — 클라이언트와 양측). 클라 우회 방지.
    if (!input.farmId || !input.flockBirthDate || !input.sampleCollectedDate || !input.sampleInfo?.trim())
      throw new Error("농장·계군생년월일·시료채취일·시료종류는 필수입니다.");
    if (input.testItemCodes.length === 0) throw new Error("검사 항목을 1개 이상 선택하세요.");
    const db = load();
    const c: Case = {
      ...input,
      id: uid("c"),
      receiptNo: null, // 확정 전 NULL (FR-S2)
      status: "검토중",
      ageWeeks: calcAgeWeeks(input.flockBirthDate, input.sampleCollectedDate),
      tests: input.testItemCodes.map((code) => ({ testItemCode: code, status: "접수" })),
      submittedAt: new Date().toISOString(),
    };
    db.cases.push(c);
    save(db);
    return delay(c);
  },
  async listMyCases(ownerId: string): Promise<Case[]> {
    return delay(load().cases.filter((c) => c.ownerId === ownerId).reverse());
  },
  async getCase(id: string): Promise<Case | undefined> {
    return delay(load().cases.find((c) => c.id === id));
  },

  // ── 관리자 (FR-B1/B2/B5/B6) ──
  async pending(): Promise<Case[]> {
    return delay(load().cases.filter((c) => c.status === "검토중"));
  },
  async adminCases(): Promise<Case[]> {
    return delay([...load().cases].reverse());
  },
  /** 접수 확정 — 원자 채번 + 상태 가드(double-accept 방지, R4 교훈). */
  async accept(caseId: string): Promise<Case> {
    const db = load();
    const c = db.cases.find((x) => x.id === caseId);
    if (!c) throw new Error("의뢰를 찾을 수 없습니다.");
    if (c.status !== "검토중") throw new Error("이미 접수 확정된 의뢰입니다."); // 가드
    const now = new Date();
    c.receiptNo = nextReceiptNo(db.cases.map((x) => x.receiptNo), now.getFullYear());
    c.acceptedAt = now.toISOString();
    c.tatDue = addBusinessDays(now, 3).toISOString();
    c.status = "접수완료";
    save(db);
    return delay(c);
  },
  async setTestStatus(caseId: string, code: string, to: CaseTestStatus): Promise<Case> {
    const db = load();
    const c = db.cases.find((x) => x.id === caseId);
    const t = c?.tests.find((x) => x.testItemCode === code);
    if (!c || !t) throw new Error("검사를 찾을 수 없습니다.");
    if (!c.acceptedAt) throw new Error("접수 확정 후에만 검사를 진행할 수 있습니다."); // FR-S3 가드
    if (!canTransitionTest(t.status, to)) throw new Error(`허용되지 않은 전이: ${t.status}→${to}`); // 전이 가드
    t.status = to;
    if (to === "완료") t.completedAt = new Date().toISOString();
    c.status = deriveCaseStatus(c);
    save(db);
    return delay(c);
  },
  async enterResult(caseId: string, code: string, r: { verdict: Verdict; measured?: string; summary?: string }): Promise<Case> {
    const db = load();
    const c = db.cases.find((x) => x.id === caseId);
    const t = c?.tests.find((x) => x.testItemCode === code);
    if (!c || !t) throw new Error("검사를 찾을 수 없습니다.");
    if (!c.acceptedAt) throw new Error("접수 확정 후에만 결과를 입력할 수 있습니다."); // FR-S3 가드
    if (t.status === "완료") throw new Error("완료된 검사는 수정할 수 없습니다."); // 결과 변조 방지
    t.verdict = r.verdict;
    t.measured = r.measured;
    t.resultSummary = r.summary;
    if (t.status === "접수" && canTransitionTest("접수", "검사중")) t.status = "검사중";
    c.status = deriveCaseStatus(c);
    save(db);
    return delay(c);
  },
  async finalize(caseId: string, comment: string): Promise<Case> {
    const db = load();
    const c = db.cases.find((x) => x.id === caseId);
    if (!c) throw new Error("의뢰를 찾을 수 없습니다.");
    if (!canFinalize(c)) throw new Error("모든 검사가 완료된 후에만 최종 통보할 수 있습니다."); // A-1: 완료 스킵 차단
    c.finalComment = comment;
    c.status = deriveCaseStatus(c);
    save(db);
    return delay(c);
  },
};

type CaseTestStatus = import("../domain/types").TestStatus;
