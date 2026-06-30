# KHAV 동물질병진단센터 — 7/1 최소모듈 베타

건국대 가금질병 진단검사실(KHAV)의 **의뢰 접수 + 결괏값** 흐름을 시연하는 모바일 우선 베타.
KHAV 하이브리드 하네스로 제작(스펙 동결 → 구현 → 적대적 리뷰 → 게이트 → 개발일지). **데이터는 mock**(브라우저 localStorage), 백엔드 불필요.

## 실행
```bash
cd KHAV-Beta
npm install
npm run dev        # http://localhost:5173 자동 오픈
```
기타: `npm run build`(프로덕션 빌드) · `npm run test`(도메인 테스트 13건) · `npm run typecheck`

## 데모 계정 (mock)
- **의뢰인**: 아이디 `vet`  → 의뢰 작성·조회
- **관리자**: 아이디 `admin` → 접수 확정·결과 입력·통보
- (회원가입으로 새 의뢰인 생성도 가능)

## 체험 시나리오 (end-to-end)
1. `vet` 로그인 → **＋ 새 검사 의뢰** → 농장 선택·축종(가금 7종)·계군 생년월일·시료채취일(주령 자동) → 검사항목 선택 → 제출 → **접수 검토 중**(접수번호 발급 전)
2. 로그아웃 → `admin` 로그인 → **도착 대기**에서 **✓ 접수 확정** → 접수번호 발급(`2026-NNNN`)·TAT 시작
3. `admin` 의뢰 목록 → 해당 의뢰 → 검사별 **결과 입력**(판정·측정값) → **최종 통보**(전 검사 완료 후)
4. `vet` 재로그인 → 의뢰 상세에서 **진행상황·완료검사 선열람·최종 통보** 확인

## 적용된 핵심 정책 (Notion 스펙 v3.7 기준)
- 접수 2단계(검토중→접수완료, 채번은 확정 시 원자 발급) · 상태머신 `검토중→접수완료→검사중→완료→통보`
- 축종 가금 7종+기타 · 주령=(시료채취일−계군생년월일)/7 · 회원제 · 부검 자유텍스트/백신 코드
- 필수항목 클라+서버 양측 검증 · 검사 전이 가드(역행 금지)

## ⚠️ Mock 가정 (실 KHAV 확인 필요 — User Challenge)
API 계약·코드 마스터(검사항목·백신·지역)·인증 방식은 잠정 mock. 실서버 확정 시 `src/adapters/mockApi.ts`만 교체.
범위 외(2차): 모바일 관리자·알림 실발송·엑셀 export·결과서 PDF.

## 구조
```
src/domain/      types · logic(채번·주령·상태머신) · logic.test
src/adapters/    mockApi (인메모리 + seed)
src/features/    store (세션·라우팅)
src/ui/          App · components · pages(6)
.khav/           하네스 (spec_snapshot · journal · 규칙)
```
개발 과정·결정은 `.khav/journal/2026-07-01_beta_cycle1.md` 참조.
