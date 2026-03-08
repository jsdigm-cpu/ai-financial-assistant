import React, { useState } from 'react';
import { Transaction, BusinessInfo, AIReport, DeepDiveAIReport, LocationAnalysisReport } from '../../types';
import AIReportGenerator from '../AIReportGenerator';
import LocationAnalysisGenerator from '../LocationAnalysisGenerator';
import { exportAIReportToPdf } from '../../services/pdfExporter';

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  reports: {
    summary: AIReport | null;
    deepDive: DeepDiveAIReport | null;
    location: LocationAnalysisReport | null;
  };
  reportStatus: {
    summary: { isLoading: boolean; error: string | null };
    deepDive: { isLoading: boolean; error: string | null };
    location: { isLoading: boolean; error: string | null };
  };
  onGenerateFinancialReport: (type: 'summary' | 'deepDive') => void;
  onGenerateLocationReport: () => void;
}

const AIReportView: React.FC<Props> = ({ 
  transactions, 
  businessInfo, 
  reports, 
  reportStatus, 
  onGenerateFinancialReport, 
  onGenerateLocationReport 
}) => {
  const [activeTab, setActiveTab] = useState<'financial' | 'location'>('financial');

  const handleExport = () => {
    if (activeTab !== 'financial') return;
    
    const reportElement = document.getElementById('ai-report-content-to-export');
    if (reportElement) {
        exportAIReportToPdf(reportElement, businessInfo, `${businessInfo.name}_ai_report_${new Date().toISOString().slice(0,10)}`);
    } else {
        alert("리포트 내용을 찾을 수 없습니다. 먼저 리포트를 생성해주세요.");
    }
  };


  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-text-inverted">AI 분석 및 제안</h2>
            <p className="mt-1 text-text-inverted-muted">
              {activeTab === 'financial'
                ? 'AI가 종합적인 재무 데이터를 분석하여 비즈니스의 강점, 약점, 기회 요인을 진단하고 성장을 위한 실행 전략을 제안합니다.'
                : 'AI가 사업장 주소 기반의 상권, 경쟁사, 재무 현황을 종합 분석하여 맞춤형 영업/마케팅 전략을 제안합니다.'
              }
            </p>
          </div>
            <button 
                onClick={handleExport}
                disabled={activeTab !== 'financial'}
                className="px-4 py-2 bg-brand-accent text-white font-semibold rounded-lg shadow-sm hover:bg-sky-400 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                title={activeTab !== 'financial' ? '재무 분석 리포트만 PDF로 다운로드할 수 있습니다.' : 'PDF 다운로드'}
                >PDF 다운로드
            </button>
       </div>

      <div className="flex items-center p-1 bg-surface-card rounded-lg mt-2 w-fit border border-border-color">
          <button onClick={() => setActiveTab('financial')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'financial' ? 'bg-slate-50 text-brand-primary shadow' : 'text-slate-600 hover:bg-slate-100'}`}>재무 분석</button>
          <button onClick={() => setActiveTab('location')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'location' ? 'bg-slate-50 text-brand-primary shadow' : 'text-slate-600 hover:bg-slate-100'}`}>상권 분석 및 마케팅</button>
      </div>

      <div>
        {activeTab === 'financial' && (
          <AIReportGenerator 
            transactions={transactions} 
            businessInfo={businessInfo}
            summaryReport={reports.summary}
            deepDiveReport={reports.deepDive}
            summaryStatus={reportStatus.summary}
            deepDiveStatus={reportStatus.deepDive}
            onGenerate={onGenerateFinancialReport}
          />
        )}
        {activeTab === 'location' && (
          // FIX: Removed the 'transactions' prop from the LocationAnalysisGenerator component call, as it is not an expected prop and caused a TypeScript error.
          <LocationAnalysisGenerator
            businessInfo={businessInfo}
            report={reports.location}
            status={reportStatus.location}
            onGenerate={onGenerateLocationReport}
          />
        )}
      </div>
    </div>
  );
};

export default AIReportView;