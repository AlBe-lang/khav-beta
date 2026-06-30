// domain/logic — 순수 로직 (외부 의존 0). 주령·채번·상태 파생·전이 가드. 백엔드 규칙 반영.
import type { CaseStatus, TestStatus } from "./types";

/** 주령·일령 = (시료채취일 − 계군 생년월일). 입추일 미사용. 음수 0. */
export function calcAge(flockBirthDate: string, sampleDate: string): { ageWeeks: number; ageDays: number } {
  const b = Date.parse(flockBirthDate);
  const s = Date.parse(sampleDate);
  if (Number.isNaN(b) || Number.isNaN(s) || s <= b) return { ageWeeks: 0, ageDays: 0 };
  const days = Math.floor((s - b) / 86_400_000);
  return { ageWeeks: Math.floor(days / 7), ageDays: days };
}

/** 접수번호 `YYYY-NNNN`. 같은 연도 최대 일련번호 + 1 (문자열 정렬 금지 — 숫자 파싱). */
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

/** 영업일(주말 제외) 더하기 — TAT 약 3 영업일. */
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

/** 검사 상태 → 의뢰 상태 자동 파생. 접수확정(acceptedAt) 전엔 파생 안 함(가드). */
export function deriveCaseStatus(opts: {
  acceptedAt: string | null; finalComment: string | null; testStatuses: TestStatus[];
}): CaseStatus {
  if (!opts.acceptedAt) return "검토중";
  const all = opts.testStatuses;
  const allDone = all.length > 0 && all.every((t) => t === "완료");
  if (allDone && opts.finalComment) return "통보";
  if (allDone) return "완료";
  if (all.some((t) => t === "검사중" || t === "완료")) return "검사중";
  return "접수완료";
}

const TEST_FLOW: Record<TestStatus, TestStatus[]> = { 접수: ["검사중"], 검사중: ["완료"], 완료: [] };
export function canTransitionTest(from: TestStatus, to: TestStatus): boolean {
  return from === to || TEST_FLOW[from].includes(to);
}

/** 최종 통보 가능: 접수확정 + 전 검사 완료. */
export function canFinalize(acceptedAt: string | null, testStatuses: TestStatus[]): boolean {
  return !!acceptedAt && testStatuses.length > 0 && testStatuses.every((t) => t === "완료");
}
