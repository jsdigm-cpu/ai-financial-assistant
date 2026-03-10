# 🧾 AI 통장정리 - 소상공인 재무관리 앱

통장 입출금 내역 엑셀 파일을 업로드하면, AI가 자동으로 사업 수입/지출과 개인 지출을 분류하고 재무 분석 보고서를 생성합니다.

## ✨ 주요 기능

- **자동 거래 분류**: 사업 매출, 영업비용, 개인 지출을 AI가 자동 분류
- **대시보드**: 매출, 비용, 영업이익, 순이익 등 핵심 KPI 한눈에 확인
- **AI 재무 보고서**: 재무 건전성 분석, 개선 제안, 리스크 평가
- **상권 분석**: 사업장 주소 기반 경쟁사 분석, SWOT, 4P 마케팅 전략
- **PDF 내보내기**: 대시보드를 PDF로 다운로드
- **학습 기능**: 수동 수정 사항을 학습하여 분류 정확도 자동 향상

## 🚀 설치 및 실행 방법

### 1. 사전 준비

- **Node.js** 18 이상 설치 ([다운로드](https://nodejs.org/ko))
- **Google Gemini API 키** 발급 ([Google AI Studio](https://aistudio.google.com/apikey))

### 2. 설치

```bash
# 프로젝트 폴더로 이동
cd ai-재무관리-(소상공인)

# 의존성 설치
npm install
```

### 3. 실행

```bash
npm run dev
```

브라우저에서 자동으로 `http://localhost:3000` 이 열립니다.

### 4. 사용

1. **API 키 입력**: 발급받은 Gemini API 키를 입력합니다 (한 번만 입력하면 브라우저에 저장)
2. **사업 정보 입력**: 상호명, 대표자명, 업종 선택 (업종 선택 시 기본값 자동 채움)
3. **파일 업로드**: 은행 입출금 내역 엑셀(xlsx/csv) 파일 업로드
4. **분석 시작**: AI가 자동으로 거래 분류 및 재무 분석 실행

### 5. 은행 입출금 내역 다운로드 방법

각 은행 인터넷뱅킹 또는 모바일뱅킹에서 "거래내역조회" → "엑셀 다운로드"

필요한 컬럼: **거래일시, 적요(내용), 입금액, 출금액, 잔액**

## 🔧 기술 스택

- React 19 + TypeScript
- Vite (빌드 도구)
- Google Gemini AI API (거래 분류 및 분석)
- Recharts (차트)
- Tailwind CSS (스타일링)

## 📁 프로젝트 구조

```
├── App.tsx                  # 앱 진입점
├── types.ts                 # TypeScript 타입 정의
├── constants.ts             # 기본 카테고리, 업종별 프리셋
├── components/
│   ├── SetupScreen.tsx      # 초기 설정 화면
│   ├── MainLayout.tsx       # 메인 레이아웃
│   ├── CategoryReviewModal  # 카테고리 검토 모달
│   └── views/               # 각 탭 화면 (대시보드, 거래내역 등)
├── services/
│   ├── geminiService.ts     # Gemini AI 연동
│   ├── parser.ts            # 엑셀 파싱 (Web Worker)
│   └── pdfExporter.ts       # PDF 내보내기
└── index.html               # HTML 엔트리
```

## ⚠️ 주의사항

- Gemini API 키는 브라우저 localStorage에 저장됩니다. 공용 PC에서는 사용 후 브라우저 데이터를 삭제하세요.
- Gemini API는 무료 할당량이 있으며, 대량 사용 시 비용이 발생할 수 있습니다.
- 거래 건수가 많을수록 AI 분석 시간이 길어집니다 (200건당 약 3~5초).
