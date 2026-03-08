import React, { useState } from 'react';
import { Transaction, BusinessInfo, AIReport, DeepDiveAIReport } from '../types';

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  summaryReport: AIReport | null;
  deepDiveReport: DeepDiveAIReport | null;
  summaryStatus: { isLoading: boolean; error: string | null };
  deepDiveStatus: { isLoading: boolean; error: string | null };
  onGenerate: (type: 'summary' | 'deepDive') => void;
}

const AIReportGenerator: React.FC<Props> = ({ 
  transactions, 
  businessInfo,
  summaryReport,
  deepDiveReport,
  summaryStatus,
  deepDiveStatus,
  onGenerate 
}) => {
  const [reportType, setReportType] = useState<'summary' | 'deepDive'>('summary');

  const currentReport = reportType === 'summary' ? summaryReport : deepDiveReport;
  const currentStatus = reportType === 'summary' ? summaryStatus : deepDiveStatus;
  
  const renderSummaryReport = (report: AIReport) => (
      <div className="mt-6 space-y-6 animate-fade-in">
        <div>
          <h4 className="text-lg font-semibold text-text-primary mb-2 border-b border-border-color pb-2">종합 재무 요약</h4>
          <p className="text-text-muted">{report.summary}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-subtle p-4 rounded-lg border border-border-color">
              <h5 className="font-semibold text-green-400 mb-2">✅ 긍정적 측면</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-text-muted">
                  {report.positivePoints.map((point, i) => <li key={i}>{point}</li>)}
              </ul>
          </div>
            <div className="bg-surface-subtle p-4 rounded-lg border border-border-color">
              <h5 className="font-semibold text-yellow-400 mb-2">⚠️ 개선 필요 영역</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-text-muted">
                  {report.areasForImprovement.map((point, i) => <li key={i}>{point}</li>)}
              </ul>
          </div>
        </div>
          <div>
          <h4 className="text-lg font-semibold text-text-primary mb-3 border-b border-border-color pb-2">💡 AI 맞춤형 실행 전략</h4>
          <div className="space-y-4">
                {report.actionableSuggestions.map((suggestion, i) => (
                    <div key={i} className="bg-surface-subtle border-l-4 border-brand-primary p-4 rounded-r-lg">
                        <h5 className="font-semibold text-brand-primary mb-1">{suggestion.title}</h5>
                        <p className="text-sm text-text-muted">{suggestion.description}</p>
                    </div>
                ))}
          </div>
        </div>
      </div>
  );

  const renderDeepDiveReport = (report: DeepDiveAIReport) => (
      <div className="mt-6 space-y-8 animate-fade-in">
          <div>
              <h4 className="text-xl font-bold text-text-primary mb-3 border-b-2 border-border-color pb-2">Executive Summary</h4>
              <p className="text-text-muted leading-relaxed whitespace-pre-line">{report.executiveSummary}</p>
          </div>
          <div>
              <h4 className="text-xl font-bold text-text-primary mb-3 border-b-2 border-border-color pb-2">재무 건전성 분석</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {report.financialHealthAnalysis.map((item, i) => (
                      <div key={i} className="bg-surface-subtle p-4 rounded-lg border border-border-color">
                          <div className="flex justify-between items-baseline">
                              <h5 className="font-semibold text-text-primary">{item.title}</h5>
                              <span className={`font-bold text-lg ${item.score >= 8 ? 'text-green-500' : item.score >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>{item.score}/10</span>
                          </div>
                          <p className="text-sm text-text-muted mt-2">{item.analysis}</p>
                      </div>
                  ))}
              </div>
          </div>
          <div>
              <h4 className="text-xl font-bold text-text-primary mb-3 border-b-2 border-border-color pb-2">전략적 제안</h4>
              <div className="space-y-4">
                  {report.strategicRecommendations.map((item, i) => (
                      <div key={i} className="bg-blue-500/10 border-l-4 border-blue-400 p-4 rounded-r-lg">
                          <h5 className="font-semibold text-blue-300">{item.title}</h5>
                          <p className="text-sm text-blue-300 mt-1">{item.description}</p>
                          <p className="text-xs text-blue-400 mt-2 font-medium"><strong>기대 효과:</strong> {item.expectedImpact}</p>
                      </div>
                  ))}
              </div>
          </div>
          <div>
              <h4 className="text-xl font-bold text-text-primary mb-3 border-b-2 border-border-color pb-2">리스크 평가 및 관리 방안</h4>
               <div className="space-y-4">
                  {report.riskAssessment.map((item, i) => (
                      <div key={i} className="bg-red-500/10 border-l-4 border-red-400 p-4 rounded-r-lg">
                           <h5 className="font-semibold text-red-300">🚨 {item.risk}</h5>
                          <p className="text-sm text-red-400 mt-2"><strong>완화 방안:</strong> {item.mitigation}</p>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  return (
    <div className="bg-surface-card p-6 rounded-lg shadow-md border border-border-color">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-text-primary">
            <span className="text-brand-primary">AI</span> 기반 재무 분석 및 전략 제안
          </h3>
          <div className="flex items-center p-1 bg-surface-subtle rounded-lg mt-2 w-fit">
              <button onClick={() => setReportType('summary')} className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${reportType === 'summary' ? 'bg-brand-primary text-text-on-light shadow' : 'text-text-muted hover:text-text-primary'}`}>요약 제안</button>
              <button onClick={() => setReportType('deepDive')} className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${reportType === 'deepDive' ? 'bg-brand-primary text-text-on-light shadow' : 'text-text-muted hover:text-text-primary'}`}>심층 분석</button>
          </div>
        </div>
        <button
          onClick={() => onGenerate(reportType)}
          disabled={currentStatus.isLoading}
          className="mt-3 sm:mt-0 px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-text-on-light font-semibold rounded-lg shadow-md transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center"
        >
          {currentStatus.isLoading ? (
            <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-text-on-light" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>리포트 생성 중...</span>
            </>
          ) : (
            <>
              {currentReport && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m7 0a9 9 0 11-12.73 0" /></svg>
              )}
              <span>{currentReport ? '재분석' : 'AI 분석 리포트 생성'}</span>
            </>
          )}
        </button>
      </div>

      <div id="ai-report-content-to-export" className="text-text-primary">
          {currentStatus.error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg my-4">{currentStatus.error}</div>}

          {!currentReport && !currentStatus.isLoading && (
            <div className="text-center py-8 text-text-muted">
              <p>
                {
                   reportType === 'summary' && summaryStatus.isLoading ? 'AI가 요약 리포트를 생성하고 있습니다... 잠시 후 확인해주세요.' :
                   !currentReport ? '버튼을 클릭하여 맞춤형 재무 분석 리포트를 받아보세요.' : ''
                }
              </p>
              <p className="text-sm text-text-muted">
                {reportType === 'summary' 
                  ? '데이터를 기반으로 한 경영 및 마케팅 전략을 제안해 드립니다.' 
                  : 'MBA 수준의 전문적인 심층 분석 및 전략을 제안해 드립니다.'}
              </p>
            </div>
          )}
          
          {currentStatus.isLoading && !currentReport && (
             <div className="text-center py-8 text-text-muted">
               <svg className="animate-spin h-8 w-8 text-brand-primary mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>AI가 리포트를 생성하고 있습니다. 이 화면을 벗어나 다른 메뉴를 보셔도 됩니다.</span>
             </div>
          )}

          {reportType === 'summary' && summaryReport && renderSummaryReport(summaryReport)}
          {reportType === 'deepDive' && deepDiveReport && renderDeepDiveReport(deepDiveReport)}
      </div>
    </div>
  );
};

export default AIReportGenerator;