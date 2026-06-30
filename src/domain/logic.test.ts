import { describe, expect, it } from "vitest";
import type { Case } from "./types";
import {
  calcAgeWeeks,
  canFinalize,
  canTransitionTest,
  deriveCaseStatus,
  nextReceiptNo,
} from "./logic";

function baseCase(partial: Partial<Case> = {}): Case {
  return {
    id: "c1", receiptNo: null, status: "검토중", ownerId: "u", farmId: "f",
    species: "산란계", flockBirthDate: "2025-01-01", sampleCollectedDate: "2025-12-31",
    ageWeeks: 0, sampleInfo: "혈청", purpose: "항원검사", vaccineCodes: [],
    tests: [], submittedAt: "2026-07-01T00:00:00Z", ...partial,
  };
}

describe("nextReceiptNo (FR-S2 채번)", () => {
  it("같은 연도 최대 일련번호 + 1", () => {
    expect(nextReceiptNo([null, "2026-0001", "2026-0003"], 2026)).toBe("2026-0004");
  });
  it("문자열 정렬 버그 없음: 10000 > 9999 (숫자 비교)", () => {
    expect(nextReceiptNo(["2026-9999", "2026-10000"], 2026)).toBe("2026-10001");
  });
  it("해당 연도 없으면 0001", () => {
    expect(nextReceiptNo(["2025-0005"], 2026)).toBe("2026-0001");
  });
});

describe("calcAgeWeeks (FR-A5 주령)", () => {
  it("(채취일-생년월일)/7 floor", () => {
    expect(calcAgeWeeks("2026-01-01", "2026-01-15")).toBe(2); // 14일 → 2주
  });
  it("음수/역전은 0", () => {
    expect(calcAgeWeeks("2026-02-01", "2026-01-01")).toBe(0);
  });
});

describe("deriveCaseStatus (FR-S3 자동파생)", () => {
  it("접수확정 전이면 검토중(가드)", () => {
    expect(deriveCaseStatus(baseCase({ tests: [{ testItemCode: "AG_AIV", status: "완료" }] }))).toBe("검토중");
  });
  it("접수확정 + 전검사 접수면 접수완료", () => {
    expect(deriveCaseStatus(baseCase({ acceptedAt: "x", tests: [{ testItemCode: "a", status: "접수" }] }))).toBe("접수완료");
  });
  it("일부 검사중이면 검사중", () => {
    expect(deriveCaseStatus(baseCase({ acceptedAt: "x", tests: [{ testItemCode: "a", status: "검사중" }, { testItemCode: "b", status: "접수" }] }))).toBe("검사중");
  });
  it("전검사 완료면 완료", () => {
    expect(deriveCaseStatus(baseCase({ acceptedAt: "x", tests: [{ testItemCode: "a", status: "완료" }] }))).toBe("완료");
  });
  it("[A-1 회귀] finalComment 있어도 미완료면 통보 아님(완료 스킵 금지)", () => {
    const c = baseCase({ acceptedAt: "x", finalComment: "통보", tests: [{ testItemCode: "a", status: "검사중" }] });
    expect(deriveCaseStatus(c)).toBe("검사중");
  });
  it("전검사 완료 + finalComment면 통보", () => {
    expect(deriveCaseStatus(baseCase({ acceptedAt: "x", finalComment: "ok", tests: [{ testItemCode: "a", status: "완료" }] }))).toBe("통보");
  });
});

describe("canTransitionTest (FR-S4 전이가드)", () => {
  it("접수→검사중 허용, 완료→접수 금지", () => {
    expect(canTransitionTest("접수", "검사중")).toBe(true);
    expect(canTransitionTest("완료", "접수")).toBe(false);
    expect(canTransitionTest("검사중", "완료")).toBe(true);
  });
});

describe("canFinalize (A-1 통보 가드)", () => {
  it("접수확정 + 전검사 완료여야 true", () => {
    expect(canFinalize(baseCase({ acceptedAt: "x", tests: [{ testItemCode: "a", status: "완료" }] }))).toBe(true);
    expect(canFinalize(baseCase({ acceptedAt: "x", tests: [{ testItemCode: "a", status: "검사중" }] }))).toBe(false);
    expect(canFinalize(baseCase({ tests: [{ testItemCode: "a", status: "완료" }] }))).toBe(false); // 미접수
  });
});
