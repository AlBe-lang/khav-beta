# KHAV-Beta 배포 가이드 (Vercel)

> 목표: 의사·교수님이 **링크만 눌러 폰에서 바로 쓰는** 공개 URL 만들기.
> 배포는 **Albe(개발자)** 가 1회만, 최종 사용자는 링크만 받습니다.
> KHAV-Beta는 정적 SPA(데이터는 각자 브라우저 localStorage) → 백엔드·서버 불필요.

---

## 방법 A — Vercel CLI (GitHub 없이 가장 빠름)
```bash
cd ~/Desktop/KHAV-Beta
npm install                 # 최초 1회
npm i -g vercel             # vercel CLI 설치(최초 1회)
vercel login               # 브라우저로 로그인 (이메일/GitHub)
vercel                     # 프롬프트 기본값 엔터 → 미리보기 URL 발급
vercel --prod              # 정식 공개 URL 발급 (예: khav-beta.vercel.app)
```
- Vite는 자동 인식 → 빌드 명령/출력(dist) 설정 불필요(`vercel.json` 없어도 됨).
- 발급된 `*.vercel.app` URL을 카카오톡/문자로 공유.

## 방법 B — GitHub + Vercel 대시보드 (자동 재배포)
```bash
cd ~/Desktop/KHAV-Beta
git add -A && git commit -m "KHAV-Beta 7/1 베타"
# GitHub에 새 레포 생성 후:
git remote add origin <레포 URL>
git push -u origin main
```
→ vercel.com → **Add New Project** → 그 레포 import → Deploy → 공개 URL.
이후 `git push`만 하면 자동 재배포.

---

## 최종 사용자(의사·교수)에게 안내할 내용 (그대로 복붙용)
```
KHAV 진단센터 베타입니다. 아래 링크를 휴대폰에서 눌러주세요.
👉 https://<배포후-URL>.vercel.app

· 의뢰인 체험: 아이디 vet 로 로그인 (또는 회원가입)
· 관리자 체험: 아이디 admin 로 로그인
※ 설치 필요 없음. 입력하신 데이터는 본인 휴대폰에만 저장됩니다(체험용).
```

---

## 주의 (페르소나 — 비개발자 사용자)
- 사용자는 **링크 클릭만**. npm·터미널 안내는 절대 사용자에게 주지 말 것(그건 배포자용).
- localStorage라 **사용자마다 데이터 독립**(체험엔 적합). 10명이 *공유* 데이터로 쓰려면 실제 백엔드 필요(추후).
- 실제 게시는 Vercel **로그인(Albe 계정)** 이 필요 → 이 단계는 직접 진행.
