import React from 'react';
import { BusinessInfo, LocationAnalysisReport } from '../types';
import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis, Tooltip, Legend, Scatter, Cell } from 'recharts';


interface PositioningMapChartProps {
    data: LocationAnalysisReport['positioningMap'];
}

const PositioningMapChart: React.FC<PositioningMapChartProps> = ({ data }) => {
    if (!data || !data.points || data.points.length === 0) return null;

    const selfPoint = data.points.find(p => p.isSelf);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <div className="bg-surface-card p-2 border border-border-color rounded-md shadow-lg text-sm">
                    <p className={`font-bold ${point.isSelf ? 'text-brand-primary' : 'text-text-primary'}`}>{point.name}</p>
                </div>
            );
        }
        return null;
    };
    
    return (
        <div className="w-full h-96 bg-surface-subtle p-4 rounded-lg">
            <ResponsiveContainer>
                <ScatterChart
                    margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#415A77" />
                    
                    <XAxis 
                        type="number" 
                        dataKey="x" 
                        name={data.xAxis.label} 
                        domain={[-10, 10]} 
                        ticks={[-10, 0, 10]}
                        tickFormatter={(tick) => {
                            if (tick === -10) return data.xAxis.min;
                            if (tick === 10) return data.xAxis.max;
                            return '';
                        }}
                        label={{ value: data.xAxis.label, position: 'insideBottom', offset: -25, fill: '#ccd6f6' }}
                        stroke="#8892b0"
                    />
                    <YAxis 
                        type="number" 
                        dataKey="y" 
                        name={data.yAxis.label} 
                        domain={[-10, 10]}
                        ticks={[-10, 0, 10]}
                        tickFormatter={(tick) => {
                            if (tick === -10) return data.yAxis.min;
                            if (tick === 10) return data.yAxis.max;
                            return '';
                        }}
                        label={{ value: data.yAxis.label, angle: -90, position: 'insideLeft', offset: -25, fill: '#ccd6f6' }}
                        stroke="#8892b0"
                    />
                    
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />

                    <Scatter name="Competitors" data={data.points} fill="#8884d8">
                         {data.points.map((point, index) => (
                            <Cell key={`cell-${index}`} fill={point.isSelf ? '#f59e0b' : '#06b6d4'} />
                        ))}
                    </Scatter>

                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};


interface Props {
  businessInfo: BusinessInfo;
  report: LocationAnalysisReport | null;
  status: { isLoading: boolean; error: string | null };
  onGenerate: () => void;
}

const LocationAnalysisGenerator: React.FC<Props> = ({ businessInfo, report, status, onGenerate }) => {

    const SWOTCard: React.FC<{ title: string; items: string[]; color: string; icon: React.ReactNode }> = ({ title, items, color, icon }) => (
        <div className="bg-surface-subtle p-4 rounded-lg">
            <h5 className={`font-semibold ${color} mb-2 flex items-center gap-2`}>{icon} {title}</h5>
            <ul className="list-disc list-inside space-y-1 text-sm text-text-muted">
                {items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>
    );

    const Marketing4PCard: React.FC<{ title: string; strategies: {title: string; description: string}[]; icon: React.ReactNode }> = ({ title, strategies, icon }) => (
         <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h5 className="font-semibold text-blue-600 flex items-center gap-2">{icon} {title}</h5>
            <div className="mt-2 space-y-3">
             {strategies.map((item, i) => (
                <div key={i}>
                    <p className="text-sm text-blue-600 font-semibold">{item.title}</p>
                    <p className="text-xs text-blue-500 mt-1">{item.description}</p>
                </div>
             ))}
            </div>
         </div>
    );
    
    const renderReport = (report: LocationAnalysisReport) => (
      <div className="mt-6 space-y-10 animate-fade-in">
          {/* SWOT Analysis */}
          <div>
              <h4 className="text-xl font-bold text-text-primary mb-3 border-b-2 border-border-color pb-2">
                <span className="text-brand-primary">{businessInfo.name}</span> SWOT 분석
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SWOTCard title="Strengths (강점)" items={report.swotAnalysis.strengths} color="text-green-600" icon={<span>💪</span>} />
                  <SWOTCard title="Weaknesses (약점)" items={report.swotAnalysis.weaknesses} color="text-red-600" icon={<span>😥</span>} />
                  <SWOTCard title="Opportunities (기회)" items={report.swotAnalysis.opportunities} color="text-blue-600" icon={<span>📈</span>} />
                  <SWOTCard title="Threats (위협)" items={report.swotAnalysis.threats} color="text-yellow-600" icon={<span>⚠️</span>} />
              </div>
          </div>
          
          {/* Competitor Analysis */}
          <div>
              <h4 className="text-xl font-bold text-text-primary mb-3 border-b-2 border-border-color pb-2">
                주요 경쟁사 분석 (온라인 노출 상위 5)
              </h4>
               <div className="space-y-4">
                  {report.competitorAnalysis.map((item, i) => (
                      <details key={i} className="bg-surface-subtle p-3 rounded-lg border border-border-color open:ring-2 open:ring-brand-primary transition-all">
                          <summary className="font-semibold text-text-primary cursor-pointer">{i + 1}. {item.competitorName}</summary>
                          <div className="mt-3 pt-3 border-t border-border-color">
                              <p className="text-sm text-text-muted mt-1 italic">"{item.description}"</p>
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                  <div className="bg-green-50 p-2 rounded"><strong className="text-green-600">강점:</strong> {item.strength}</div>
                                  <div className="bg-red-50 p-2 rounded"><strong className="text-red-600">약점:</strong> {item.weakness}</div>
                              </div>
                          </div>
                      </details>
                  ))}
              </div>
          </div>
          
          {/* Positioning Map */}
          <div>
              <h4 className="text-xl font-bold text-text-primary mb-3 border-b-2 border-border-color pb-2">
                시장 포지셔닝 맵
              </h4>
              <PositioningMapChart data={report.positioningMap} />
          </div>

          {/* 4P Marketing Mix Strategy */}
          <div>
              <h4 className="text-xl font-bold text-text-primary mb-3 border-b-2 border-border-color pb-2">
                맞춤형 마케팅 믹스(4P) 전략 제안
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Marketing4PCard title="Product (제품 전략)" strategies={report.marketingMix4P.product} icon={<span>📦</span>} />
                 <Marketing4PCard title="Price (가격 전략)" strategies={report.marketingMix4P.price} icon={<span>💰</span>} />
                 <Marketing4PCard title="Place (유통 전략)" strategies={report.marketingMix4P.place} icon={<span>🚚</span>} />
                 <Marketing4PCard title="Promotion (촉진 전략)" strategies={report.marketingMix4P.promotion} icon={<span>📣</span>} />
              </div>
          </div>
      </div>
  );

  const isAddressMissing = !businessInfo.address;

  return (
    <div className="bg-surface-card p-6 rounded-lg shadow-md border border-border-color">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-text-primary">
            <span className="text-brand-primary">AI</span> 기반 상권 분석 및 마케팅 전략
          </h3>
        </div>
        <button
          onClick={onGenerate}
          disabled={status.isLoading || isAddressMissing}
          className="mt-3 sm:mt-0 px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-text-on-light font-semibold rounded-lg shadow-md transition-colors duration-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center"
          title={isAddressMissing ? "상권 분석을 위해서는 사업장 주소가 필요합니다." : "AI 분석 리포트 생성"}
        >
          {status.isLoading ? (
            <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-text-on-light" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>리포트 생성 중...</span>
            </>
          ) : (
             <>
              {report && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m7 0a9 9 0 11-12.73 0" /></svg>
              )}
              <span>{report ? '재분석' : 'AI 분석 리포트 생성'}</span>
            </>
          )}
        </button>
      </div>

      <div className="text-text-primary">
          {status.error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg my-4">{status.error}</div>}

          {!report && !status.isLoading && (
            <div className="text-center py-8 text-text-muted">
              {isAddressMissing 
                ? <p>사업장 주소가 입력되지 않았습니다. '새 분석'으로 돌아가 주소를 입력하면 상권 분석 기능을 이용할 수 있습니다.</p>
                : <p>
                    { status.isLoading ? 'AI가 상권 분석 리포트를 생성하고 있습니다... 잠시 후 확인해주세요.' : '버튼을 클릭하여 우리 가게 맞춤형 상권 분석 및 마케팅 전략을 받아보세요.'}
                  </p>
              }
            </div>
          )}

           {status.isLoading && !report && (
             <div className="text-center py-8 text-text-muted">
               <svg className="animate-spin h-8 w-8 text-brand-primary mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>AI가 리포트를 생성하고 있습니다. 이 화면을 벗어나 다른 메뉴를 보셔도 됩니다.</span>
             </div>
          )}

          {report && renderReport(report)}
      </div>
    </div>
  );
};

export default LocationAnalysisGenerator;