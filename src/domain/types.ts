// domain/types — 실 백엔드 계약(SDLC_development_backend) 기준. enum은 한글 문자열 그대로.

export const SPECIES = ["육계", "산란계", "육용종계", "산란종계", "백세미", "토종닭", "기타"] as const;
export type Species = (typeof SPECIES)[number];

export const CASE_STATUS = ["작성중", "검토중", "접수완료", "검사중", "완료", "통보"] as const;
export type CaseStatus = (typeof CASE_STATUS)[number];

export const TEST_STATUS = ["접수", "검사중", "완료"] as const;
export type TestStatus = (typeof TEST_STATUS)[number];

export const VERDICT = ["양성", "음성", "의심", "판정불가", "기타"] as const;
export type Verdict = (typeof VERDICT)[number];

export type Role = "의뢰인" | "검사자" | "관리자";
export const PURPOSE = ["연구용", "항원검사", "혈청검사", "기타"] as const;
export type RequestPurpose = (typeof PURPOSE)[number];
export const HOUSING = ["평사", "케이지", "기타"] as const;
export type HousingType = (typeof HOUSING)[number];

// ── 응답 DTO ──
export interface TokenResponse { accessToken: string; refreshToken: string; tokenType: string; expiresIn: number; }
export interface MeResponse {
  id: number; loginId: string; name: string; organization?: string;
  phone: string; email?: string; role: Role; emailVerified: boolean;
}
export interface FarmResponse {
  id: number; farmName: string; ownerName: string;
  provinceCode: string; provinceName: string; districtCode: string; districtName: string;
}
export interface AgeCalcResponse { ageWeeks: number; ageDays: number; }
export interface AddressResponse {
  roadAddress: string; zipNo: string; provinceCode: string; districtCode: string; siNm: string; sggNm: string;
}
export interface TestItemResponse {
  id: number; code: string; category: string; method?: string; name: string;
  pathogen?: string; recommendedSampleTypes: string[];
  antibioticSensitivitySupported: boolean; displayOrder: number; standardTatBusinessDays?: number; active: boolean;
}
export interface VaccineResponse { id: number; code: string; name: string; type?: string | null; targetDisease?: string; displayOrder: number; }
export interface RegionResponse { code: string; name: string; }

export interface CaseTestRequest {
  testItemId: number; actualSampleTypes?: string[]; actualSampleTypeEtc?: string; sampleCount?: number;
  antibioticSensitivityRequested?: boolean; antibioticDesiredDrug?: string;
  virusIsolationRequested?: boolean; virusIsolationTarget?: string; etcTestContent?: string; directInputTargetName?: string;
}
export interface VaccinationRequest { vaccineCodeId: number; vaccinatedDate?: string; method?: string; doseNumber?: number; note?: string; }

export interface CaseSaveRequest {
  farmId: number; species: Species; speciesEtc?: string;
  purpose: RequestPurpose; purposeEtc?: string;
  sampleCollectedDate: string; flockBirthDate: string; ageWeeks?: number; ageDays?: number;
  breedingScale: number; sampleCount: number; breedingHouse: string; housingType: HousingType; housingTypeEtc?: string;
  mortalityIncrease?: boolean; layingRateDrop?: boolean; weightGainDrop?: boolean; neurologicalSymptom?: boolean;
  respiratorySound?: boolean; legAbnormality?: boolean; symptomEtc?: boolean; symptomEtcInput?: string;
  historyDetail?: string; necropsyFindings?: string;
  tests: CaseTestRequest[]; vaccinations: VaccinationRequest[];
}

export interface CaseTestResponse {
  id: number; testItemId: number; testItemCode: string; testItemName: string; category: string; status: TestStatus;
  actualSampleTypes?: string[]; sampleCount?: number;
  verdict?: Verdict; measuredValue?: string; resultSummary?: string;
}
export interface CaseDetailResponse {
  id: number; status: CaseStatus; receiptNumber: string | null;
  farmId: number; farmName: string; species: Species; purpose: RequestPurpose;
  sampleCollectedDate: string; flockBirthDate: string; ageWeeks?: number; ageDays?: number;
  breedingScale?: number; sampleCount?: number; breedingHouse?: string; housingType?: HousingType;
  necropsyFindings?: string; historyDetail?: string;
  submittedAt: string | null; tests: CaseTestResponse[];
}
export interface CaseSummaryResponse {
  id: number; status: CaseStatus; receiptNumber: string | null;
  farmName: string; species: Species; sampleCollectedDate: string; submittedAt: string | null;
}
export interface FieldViolation { field: string; message: string; }
export interface CaseValidationResponse { valid: boolean; violations: FieldViolation[]; }

// 관리자
export interface PendingCaseResponse {
  caseId: number; submittedAt: string; farmName: string; ownerName: string;
  institution?: string; requesterName: string; phone: string; species: Species; sampleCollectedDate: string;
}
export interface DashboardResponse { reviewing: number; accepted: number; testing: number; completed: number; reported: number; total: number; }
export interface AdminCaseSummaryResponse {
  caseId: number; receiptNumber: string | null; status: CaseStatus; species: Species;
  farmName: string; institution?: string; requesterName: string; submittedAt: string | null; acceptedAt?: string;
}
export interface CaseResultRow { testName: string; verdict: string; memo?: string; measuredValue?: string; status: string; }
export interface CaseResultsResponse { caseId: number; receiptNumber: string | null; status: CaseStatus; finalComment?: string; results: CaseResultRow[]; }

export interface ApiError { status: number; message: string; violations?: FieldViolation[]; }
