import { describe, expect, it } from "vitest";
import { addBusinessDays, calcAge, canFinalize, canTransitionTest, deriveCaseStatus, nextReceiptNo } from "./logic";

describe("calcAge", () => {
  it("(채취-생년)/7, 음수 0", () => {
    expect(calcAge("2026-01-01", "2026-01-15")).toEqual({ ageWeeks: 2, ageDays: 14 });
    expect(calcAge("2026-02-01", "2026-01-01")).toEqual({ ageWeeks: 0, ageDays: 0 });
  });
});
describe("nextReceiptNo", () => {
  it("최대+1, 문자열정렬 버그 없음", () => {
    expect(nextReceiptNo([null, "2026-0001", "2026-0003"], 2026)).toBe("2026-0004");
    expect(nextReceiptNo(["2026-9999", "2026-10000"], 2026)).toBe("2026-10001");
  });
});
describe("deriveCaseStatus", () => {
  it("접수확정 전 검토중", () => { expect(deriveCaseStatus({ acceptedAt: null, finalComment: null, testStatuses: ["완료"] })).toBe("검토중"); });
  it("전검사 완료면 완료, finalComment 있으면 통보(완료 후에만)", () => {
    expect(deriveCaseStatus({ acceptedAt: "x", finalComment: null, testStatuses: ["완료"] })).toBe("완료");
    expect(deriveCaseStatus({ acceptedAt: "x", finalComment: "c", testStatuses: ["완료"] })).toBe("통보");
    expect(deriveCaseStatus({ acceptedAt: "x", finalComment: "c", testStatuses: ["검사중"] })).toBe("검사중");
  });
  it("일부 검사중이면 검사중, 전부 접수면 접수완료", () => {
    expect(deriveCaseStatus({ acceptedAt: "x", finalComment: null, testStatuses: ["검사중", "접수"] })).toBe("검사중");
    expect(deriveCaseStatus({ acceptedAt: "x", finalComment: null, testStatuses: ["접수"] })).toBe("접수완료");
  });
});
describe("canTransitionTest / canFinalize", () => {
  it("전이·통보 가드", () => {
    expect(canTransitionTest("접수", "검사중")).toBe(true);
    expect(canTransitionTest("완료", "접수")).toBe(false);
    expect(canFinalize("x", ["완료"])).toBe(true);
    expect(canFinalize("x", ["검사중"])).toBe(false);
    expect(canFinalize(null, ["완료"])).toBe(false);
  });
});
describe("addBusinessDays", () => {
  it("주말 제외", () => { expect(addBusinessDays(new Date("2026-07-03T00:00:00Z"), 1).getUTCDate()).toBe(6); }); // 금→월
});
