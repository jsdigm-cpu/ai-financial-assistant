import React from 'react';

interface Props {
  onStart: () => void;
  hasSavedSession: boolean;
  onRestoreSession?: () => void;
}

const IntroScreen: React.FC<Props> = ({ onStart, hasSavedSession, onRestoreSession }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-3xl mx-auto">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary rounded-2xl shadow-xl mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8l3 5m0 0l3-5m-3 5v4m0-4h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-5xl font-extrabold text-text-primary mb-4 tracking-tight">
            AI 통장정리
          </h1>
          <p className="text-xl text-text-muted leading-relaxed mb-2">
            통장 내역만 올리면, AI가 알아서 정리해드려요
          </p>
          <p className="text-base text-text-muted mb-10">
            개인부터 법인까지 — 수입/지출을 자동 분류하고, 한눈에 보는 재무 분석까지
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={onStart}
              className="w-full sm:w-auto px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-lg rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl"
            >
              시작하기
            </button>
            {hasSavedSession && onRestoreSession && (
              <button
                onClick={onRestoreSession}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-brand-primary font-semibold text-lg rounded-xl border-2 border-brand-primary shadow-sm transition-all hover:shadow-md"
              >
                이전 분석 이어하기
              </button>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4 mb-12">
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            }
            title="엑셀 파일만 올리면 끝"
            description="은행에서 다운로드한 입출금 내역 파일(Excel, CSV)을 올리기만 하면 됩니다. 복잡한 설정 없이 바로 시작!"
          />
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            title="AI가 자동 분류"
            description="카드매출, 식자재, 인건비, 임대료... AI가 거래 내역을 보고 자동으로 알맞은 항목에 분류해줍니다."
          />
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="한눈에 보는 재무 분석"
            description="수입/지출 차트, 월별 추이, 비용 구조 분석까지. 내 사업의 재무 상태를 깔끔한 대시보드로 확인하세요."
          />
        </div>

        {/* Sample Preview */}
        <div className="max-w-4xl mx-auto w-full px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-surface-subtle border-b border-gray-200 px-6 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="ml-3 text-sm text-text-muted font-medium">AI 통장정리 — 대시보드 미리보기</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <SampleStatCard label="총 수입" value="12,450,000" color="text-blue-600" bg="bg-blue-50" />
                <SampleStatCard label="총 지출" value="8,320,000" color="text-red-500" bg="bg-red-50" />
                <SampleStatCard label="순이익" value="4,130,000" color="text-green-600" bg="bg-green-50" />
                <SampleStatCard label="거래 건수" value="247건" color="text-purple-600" bg="bg-purple-50" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 h-32 flex items-center justify-center">
                  <div className="text-center text-text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-brand-primary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                    <p className="text-sm">지출 비율 차트</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 h-32 flex items-center justify-center">
                  <div className="text-center text-text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-brand-primary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p className="text-sm">월별 수입/지출 추이</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-text-muted">
        <p>Google Gemini AI 기반 · 데이터는 브라우저에만 저장됩니다 (서버 전송 없음)</p>
      </footer>
    </div>
  );
};

// Feature Card Component
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-brand-primary mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
    <p className="text-sm text-text-muted leading-relaxed">{description}</p>
  </div>
);

// Sample Stat Card for Preview
const SampleStatCard: React.FC<{ label: string; value: string; color: string; bg: string }> = ({ label, value, color, bg }) => (
  <div className={`${bg} rounded-lg p-3 text-center`}>
    <p className="text-xs text-text-muted mb-1">{label}</p>
    <p className={`text-lg font-bold ${color}`}>{value}</p>
  </div>
);

export default IntroScreen;
