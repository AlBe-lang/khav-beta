// domain/types — 순수 타입 (외부 의존 금지, rules/40 C1). DDL v3.7 기준.

export type Role = "의뢰인" | "검사자" | "관리자";

/** 축종 — 가금 7종 + 기타 (비가금 차단, DDL v3.7) */
export const SPECIES = [
  "육계",
  "산란계",
  "육용종계",
  "산란종계",
  "백세미",
  "토종닭",
  "기타",
] as const;
export type Species = (typeof SPECIES)[number];

/** 의뢰(Case) 상태머신 */
export const CASE_STATUS = ["검토중", "접수완료", "검사중", "완료", "통보"] as const;
export type CaseStatus = (typeof CASE_STATUS)[number];

/** 검사(Test) 상태머신 */
export const TEST_STATUS = ["접수", "검사중", "완료"] as const;
export type TestStatus = (typeof TEST_STATUS)[number];

/** 검사 결과 판정 */
export const VERDICT = ["양성", "음성", "의심", "판정불가", "기타"] as const;
export type Verdict = (typeof VERDICT)[number];

export interface User {
  id: string;
  loginId: string;
  name: string; // 의뢰인 성명 (필수)
  org?: string; // 의뢰기관
  phone: string; // SMS 알림 (필수)
  email?: string;
  role: Role;
}

export interface Farm {
  id: string;
  ownerId: string;
  name: string; // 농장명 (농장명/축주명 택1)
  keeper?: string; // 축주명
  region: string; // 도로명·우편번호 검색 결과(mock) → 시군구 표기
}

export interface CaseTest {
  testItemCode: string; // 검사항목_마스터 참조
  status: TestStatus;
  verdict?: Verdict;
  measured?: string; // 정량값(항체가·CT 등)
  resultSummary?: string;
  completedAt?: string;
}

export interface Case {
  id: string;
  receiptNo: string | null; // 확정 전 NULL (FR-S2)
  status: CaseStatus;
  ownerId: string;
  farmId: string;
  species: Species; // 단일 축종
  flockBirthDate: string; // 계군 생년월일 (YYYY-MM-DD)
  sampleCollectedDate: string; // 시료 채취일
  ageWeeks: number; // 주령 (자동계산 스냅샷)
  sampleInfo: string; // 시료 종류
  purpose: string; // 의뢰 목적
  necropsy?: string; // 부검 소견 (자유 텍스트)
  vaccineCodes: string[]; // 백신 (코드)
  tests: CaseTest[];
  finalComment?: string; // 최종 통보
  submittedAt: string;
  acceptedAt?: string;
  tatDue?: string; // 영업일 기준 TAT
}

export interface TestItem {
  code: string;
  category: "항원" | "혈청" | "세균" | "기생충" | "기타";
  method: string;
  name: string;
}

export interface VaccineCode {
  code: string;
  name: string;
}
