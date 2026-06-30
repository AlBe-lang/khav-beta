// domain/logic — 순수 로직 (외부 의존 금지). 채번·주령·상태머신·전이가드.
import type { Case, CaseStatus, CaseTest, TestStatus } from "./types";

/** 주령 = (시료채취일 − 계군 생년월일)/7, 입추일 미사용 (FR-A5, DDL v3.7). 음수는 0. */
export function calcAgeWeeks(flockBirthDate: string, sampleDate: string): number {
  const b = Date.parse(flockBirthDate);
  const s = Date.parse(sampleDate);
  if (Number.isNaN(b) || Number.isNaN(s)) return 0;
  const days = Math.floor((s - b) / 86_400_000);
  return days <= 0 ? 0 : Math.floor(days / 7);
}

/**
 * 접수번호 채번 `YYYY-NNNN` (FR-S2). 확정된 의뢰들의 같은 연도 최대 일련번호 + 1.
 * 문자열 정렬 금지(rules/20 B4) — 일련번호를 숫자로 파싱해 max 계산.
 */
export function nextReceiptNo(existing: Array<string | null>, year: number): string {
  const prefix = `${year}-`;
  let max = 0;
  for (const r of existing) {
    if (!r || !r.startsWith(prefix)) continue;
    const n = Number.parseInt(r.slice(prefix.length), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

/** 영업일(주말 제외) 더하기 — TAT 약 3 영업일 (FR-S5, 단순화). */
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return d;
}

/** 검사 상태 → 의뢰 상태 자동 파생 (FR-S3). 접수확정 전에는 파생 안 함(가드). */
export function deriveCaseStatus(c: Case): CaseStatus {
  if (!c.acceptedAt) return "검토중";
  const allDone = c.tests.length > 0 && c.tests.every((t) => t.status === "완료");
  if (allDone && c.finalComment) return "통보"; // 통보는 전 검사 완료 후에만 (완료 스킵 금지)
  if (allDone) return "완료";
  if (c.tests.some((t) => t.status === "검사중" || t.status === "완료")) return "검사중";
  return "접수완료";
}

/** 통보 가능 여부 — 접수확정 + 전 검사 완료여야 함 (FR-B8). */
export function canFinalize(c: Case): boolean {
  return !!c.acceptedAt && c.tests.length > 0 && c.tests.every((t) => t.status === "완료");
}

/** 검사 상태 전이 가드 (FR-S4): 접수→검사중→완료 단방향만 허용. */
const TEST_FLOW: Record<TestStatus, TestStatus[]> = {
  접수: ["검사중"],
  검사중: ["완료"],
  완료: [],
};
export function canTransitionTest(from: TestStatus, to: TestStatus): boolean {
  return from === to || TEST_FLOW[from].includes(to);
}

/** 완료된 개별 검사만 의뢰인에게 선열람 허용 (FR-A13). */
export function viewableTests(tests: CaseTest[]): CaseTest[] {
  return tests.filter((t) => t.status === "완료");
}
