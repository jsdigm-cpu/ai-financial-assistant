import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, BusinessInfo, Category } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { suggestFixedCostCategories } from '../../services/geminiService';


const formatCurrency = (val: number | string, compact = false) => {
    const num = Number(val);
    if (isNaN(num)) return '-';
    if (compact && Math.abs(num) >= 10000) {
        return `${(num / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만원`;
    }
    return `${num.toLocaleString('ko-KR')}원`;
};

const getAvailablePeriods = (transactions: Transaction[]) => {
    if (transactions.length === 0) {
        return { years: [], halves: [], quarters: [], months: [] };
    }
    const periods = {
        years: new Set<string>(),
        halves: new Set<string>(),
        quarters: new Set<string>(),
        months: new Set<string>(),
    };
    transactions.forEach(tx => {
        const year = tx.date.getFullYear();
        const month = tx.date.getMonth();
        periods.years.add(String(year));
        periods.months.add(`${year}-${String(month + 1).padStart(2, '0')}`);
        periods.quarters.add(`${year}-Q${Math.floor(month / 3) + 1}`);
        periods.halves.add(`${year}-H${month < 6 ? 1 : 2}`);
    });
    return {
        years: Array.from(periods.years).sort().reverse(),
        halves: Array.from(periods.halves).sort().reverse(),
        quarters: Array.from(periods.quarters).sort().reverse(),
        months: Array.from(periods.months).sort().reverse(),
    };
};


const IncomeStatementAnalysis: React.FC<{ transactions: Transaction[], categories: Category[], periodBadge?: React.ReactNode }> = ({ transactions, categories, periodBadge }) => {
    const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
    const categoryTypeMap = useMemo(() => new Map(categories.map(c => [c.name, c.type])), [categories]);

    const metrics = useMemo(() => {
        const result = transactions.reduce((acc, t) => {
            const type = categoryTypeMap.get(t.category);
            
            switch (type) {
                case 'operating_income':
                    acc.operatingRevenue += t.credit;
                    acc.operatingRevenueDetails[t.category] = (acc.operatingRevenueDetails[t.category] || 0) + t.credit;
                    break;
                case 'operating_expense':
                    acc.operatingExpense += t.debit;
                    acc.operatingExpenseDetails[t.category] = (acc.operatingExpenseDetails[t.category] || 0) + t.debit;
                    break;
                case 'non_operating_income':
                    acc.nonOperatingIncome += t.credit;
                    acc.nonOperatingIncomeDetails[t.category] = (acc.nonOperatingIncomeDetails[t.category] || 0) + t.credit;
                    break;
                case 'non_operating_expense':
                    acc.nonOperatingExpense += t.debit;
                    acc.nonOperatingExpenseDetails[t.category] = (acc.nonOperatingExpenseDetails[t.category] || 0) + t.debit;
                    break;
                default:
                    // Uncategorized or mis-categorized
                     if (t.credit > 0) {
                        acc.operatingRevenue += t.credit;
                        acc.operatingRevenueDetails[t.category] = (acc.operatingRevenueDetails[t.category] || 0) + t.credit;
                    } else {
                        acc.operatingExpense += t.debit;
                        acc.operatingExpenseDetails[t.category] = (acc.operatingExpenseDetails[t.category] || 0) + t.debit;
                    }
                    break;
            }
            return acc;
        }, {
            operatingRevenue: 0,
            operatingExpense: 0,
            nonOperatingIncome: 0,
            nonOperatingExpense: 0,
            operatingRevenueDetails: {} as Record<string, number>,
            operatingExpenseDetails: {} as Record<string, number>,
            nonOperatingIncomeDetails: {} as Record<string, number>,
            nonOperatingExpenseDetails: {} as Record<string, number>,
        });

        const operatingProfit = result.operatingRevenue - result.operatingExpense;
        const nonOperatingProfit = result.nonOperatingIncome - result.nonOperatingExpense;
        const netProfit = operatingProfit + nonOperatingProfit;

        const sortDetails = (details: Record<string, number>) => Object.entries(details).sort(([, a], [, b]) => b - a);

        return { 
            ...result, 
            operatingProfit, 
            nonOperatingProfit, 
            netProfit,
            operatingRevenueDetailsSorted: sortDetails(result.operatingRevenueDetails),
            operatingExpenseDetailsSorted: sortDetails(result.operatingExpenseDetails),
            nonOperatingIncomeDetailsSorted: sortDetails(result.nonOperatingIncomeDetails),
            nonOperatingExpenseDetailsSorted: sortDetails(result.nonOperatingExpenseDetails),
        };
    }, [transactions, categoryTypeMap]);
    
    // FIX: Explicitly type component props with React.FC to correctly handle the 'key' prop and improve type safety.
    const MetricRow: React.FC<{ label: string; value: number; isSub?: boolean; isTotal?: boolean; isPositive?: boolean; }> = ({ label, value, isSub = false, isTotal = false, isPositive = false }) => (
        <tr className={`border-b border-border-color ${isTotal ? 'bg-surface-subtle' : ''}`}>
            <td className={`py-2.5 px-4 font-semibold ${isSub ? 'pl-8' : ''} ${isTotal ? 'text-text-primary' : 'text-text-muted'}`}>{label}</td>
            <td className={`py-2.5 px-4 text-right font-mono ${isTotal ? 'font-bold text-lg' : ''} ${value < 0 ? 'text-red-500' : isPositive ? 'text-green-500' : 'text-text-primary'}`}>
                {formatCurrency(value)}
            </td>
        </tr>
    );
    
    // FIX: Explicitly type component props with React.FC to correctly handle the 'key' prop and improve type safety.
    const DetailRow: React.FC<{ label: string; value: number; }> = ({ label, value }) => (
         <tr className="border-b border-border-color hover:bg-surface-subtle">
            <td className="py-1.5 px-4 pl-10 text-text-muted">{label}</td>
            <td className="py-1.5 px-4 text-right font-mono text-text-primary">{formatCurrency(value)}</td>
        </tr>
    );

    return (
         <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text-primary">손익계산서{periodBadge}</h3>
                <div className="flex items-center p-1 bg-surface-subtle rounded-lg">
                    <button onClick={() => setViewMode('summary')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewMode === 'summary' ? 'bg-brand-primary text-text-on-light shadow' : 'text-text-muted'}`}>요약 보기</button>
                    <button onClick={() => setViewMode('detailed')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewMode === 'detailed' ? 'bg-brand-primary text-text-on-light shadow' : 'text-text-muted'}`}>전체 보기</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <tbody>
                        {viewMode === 'summary' ? (
                            <>
                                <MetricRow label="I. 총 매출 (영업 수익)" value={metrics.operatingRevenue} isPositive={true} />
                                <MetricRow label="(-) 영업 비용" value={metrics.operatingExpense} />
                                <MetricRow label="= 영업이익" value={metrics.operatingProfit} isTotal={true} />
                                <MetricRow label="II. 영업외 수익" value={metrics.nonOperatingIncome} isSub={true} isPositive={true} />
                                <MetricRow label="(-) 사업외 지출" value={metrics.nonOperatingExpense} isSub={true} />
                                <MetricRow label="= 영업외손익" value={metrics.nonOperatingProfit} isTotal={true} />
                                <MetricRow label="=> 당기순이익" value={metrics.netProfit} isTotal={true} />
                            </>
                        ) : (
                             <>
                                <MetricRow label="I. 총 매출 (영업 수익)" value={metrics.operatingRevenue} isPositive={true} />
                                {metrics.operatingRevenueDetailsSorted.map(([name, value]) => <DetailRow key={name} label={name} value={value} />)}
                                
                                <MetricRow label="(-) 영업 비용" value={metrics.operatingExpense} />
                                {metrics.operatingExpenseDetailsSorted.map(([name, value]) => <DetailRow key={name} label={name} value={value} />)}

                                <MetricRow label="= 영업이익" value={metrics.operatingProfit} isTotal={true} />

                                <MetricRow label="II. 영업외 수익" value={metrics.nonOperatingIncome} isPositive={true} />
                                {metrics.nonOperatingIncomeDetailsSorted.map(([name, value]) => <DetailRow key={name} label={name} value={value} />)}
                                
                                <MetricRow label="(-) 사업외 지출" value={metrics.nonOperatingExpense} />
                                {metrics.nonOperatingExpenseDetailsSorted.map(([name, value]) => <DetailRow key={name} label={name} value={value} />)}

                                <MetricRow label="= 영업외손익" value={metrics.nonOperatingProfit} isTotal={true} />
                                <MetricRow label="=> 당기순이익" value={metrics.netProfit} isTotal={true} />
                             </>
                        )}
                    </tbody>
                </table>
                 {transactions.length === 0 && <div className="text-center py-8 text-text-muted">선택된 기간에 데이터가 없습니다.</div>}
            </div>
        </div>
    )
};


const FixedVariableCostAnalysis: React.FC<{ transactions: Transaction[], categories: Category[], businessInfo: BusinessInfo, periodBadge?: React.ReactNode }> = ({ transactions, categories, businessInfo, periodBadge }) => {
    const [fixedCategories, setFixedCategories] = useState<Set<string>>(new Set());
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const expenseCategories = useMemo(() => 
        categories.filter(c => c.type === 'operating_expense'), 
    [categories]);

    useEffect(() => {
        const fetchSuggestedCategories = async () => {
            setIsLoading(true);
            const suggested = await suggestFixedCostCategories(categories, businessInfo);
            setFixedCategories(new Set(suggested));
            setIsLoading(false);
        };
        fetchSuggestedCategories();
    }, [categories, businessInfo]);
    
    const { pieData, total, fixedDetails, variableDetails } = useMemo(() => {
        let totalFixed = 0;
        let totalVariable = 0;
        const fixedCostDetails: Record<string, number> = {};
        const variableCostDetails: Record<string, number> = {};

        transactions.forEach(tx => {
            if (fixedCategories.has(tx.category)) {
                totalFixed += tx.debit;
                fixedCostDetails[tx.category] = (fixedCostDetails[tx.category] || 0) + tx.debit;
            } else {
                totalVariable += tx.debit;
                variableCostDetails[tx.category] = (variableCostDetails[tx.category] || 0) + tx.debit;
            }
        });
        
        const totalCost = totalFixed + totalVariable;
        return {
            pieData: totalCost > 0 ? [
                { name: '고정비', value: totalFixed },
                { name: '변동비', value: totalVariable },
            ] : [],
            total: totalCost,
            fixedDetails: Object.entries(fixedCostDetails).sort(([, a], [, b]) => b - a),
            variableDetails: Object.entries(variableCostDetails).sort(([, a], [, b]) => b - a),
        };
    }, [transactions, fixedCategories]);
    
    const handleCheckboxChange = (categoryName: string, isChecked: boolean) => {
        setFixedCategories(prev => {
            const newSet = new Set(prev);
            if (isChecked) newSet.add(categoryName);
            else newSet.delete(categoryName);
            return newSet;
        });
    };

    const renderCustomizedLabel = ({ percent }: any) => {
        if (percent < 0.05) return null;
        return `${(percent * 100).toFixed(0)}%`;
    };

    if (isLoading) {
        return (
            <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color flex items-center justify-center min-h-[200px]">
                <div className="text-center text-text-muted">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    AI가 고정비 항목을 분석 중입니다...
                </div>
            </div>
        );
    }

    const DetailList: React.FC<{title: string, details: [string, number][], total: number, colorClass: string, bgColorClass: string}> = ({title, details, total, colorClass, bgColorClass}) => (
        <div className={`p-3 rounded-lg ${bgColorClass}`}>
            <div className={`flex justify-between font-bold text-sm ${colorClass}`}>
                <span>{title}</span>
                <span>{formatCurrency(total, true)} ({total > 0 ? (total/pieData.reduce((s,d)=>s+d.value,0)*100).toFixed(1) : 0}%)</span>
            </div>
            {details.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-text-muted max-h-24 overflow-y-auto pr-1">
                    {details.map(([name, value]) => (
                        <li key={name} className="flex justify-between">
                            <span>- {name}</span>
                            <span>{formatCurrency(value, true)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
            <div className="flex justify-between items-start mb-1">
                <h3 className="text-xl font-bold text-text-primary">고정비 vs 변동비 분석 (영업비용 기준){periodBadge}</h3>
                <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-semibold text-brand-primary hover:text-brand-secondary px-3 py-1 rounded-md bg-surface-subtle hover:bg-border-color">
                    {isEditing ? '완료' : '고정비 카테고리 수정'}
                </button>
            </div>
             <p className="text-xs text-text-muted mb-4">* AI가 추천한 고정비 기준이며, 직접 수정할 수 있습니다.</p>

            {isEditing && (
                <div className="bg-surface-subtle p-4 rounded-lg mb-4 border border-border-color">
                    <h4 className="font-semibold mb-2 text-text-primary">고정비로 처리할 카테고리를 선택하세요:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        {expenseCategories.map(cat => (
                            <label key={cat.name} className="flex items-center space-x-2 text-sm p-2 rounded-md hover:bg-border-color">
                                <input type="checkbox" className="form-checkbox h-4 w-4 rounded bg-slate-200 border-slate-300 text-brand-primary focus:ring-brand-primary" checked={fixedCategories.has(cat.name)} onChange={(e) => handleCheckboxChange(cat.name, e.target.checked)} />
                                <span className="text-text-muted">{cat.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {total > 0 ? (
                    <>
                        <div style={{width: '100%', height: 250}}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} labelLine={false} label={renderCustomizedLabel}>
                                        <Cell key="cell-0" fill="#3B82F6" />
                                        <Cell key="cell-1" fill="#F59E0B" />
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}/>
                                    <Legend wrapperStyle={{ color: '#ccd6f6' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-text-primary text-center">총 영업비용: {formatCurrency(total, true)}</h4>
                            <DetailList title="고정비" details={fixedDetails} total={pieData[0]?.value || 0} colorClass="text-blue-300" bgColorClass="bg-blue-500/10" />
                            <DetailList title="변동비" details={variableDetails} total={pieData[1]?.value || 0} colorClass="text-amber-300" bgColorClass="bg-amber-500/10" />
                        </div>
                    </>
                ) : (
                    <div className="col-span-2 text-center py-10 text-text-muted">
                        분석할 영업 비용 데이터가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};


const CashFlowAnalysis: React.FC<{ transactions: Transaction[], periodBadge?: React.ReactNode }> = ({ transactions, periodBadge }) => {
    const cashFlowData = useMemo(() => {
        if (transactions.length < 1) return [];

        const firstTx = transactions[0];
        // Start from a calculated balance before the very first transaction
        let runningBalance = (firstTx.balance || 0) - firstTx.credit + firstTx.debit;

        const monthlyData: { [key: string]: { 
            inflow: number; 
            outflow: number; 
            openingBalance?: number; 
            closingBalance?: number 
        } } = {};
        
        transactions.forEach(tx => {
            const month = tx.date.toISOString().slice(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = { 
                    inflow: 0, 
                    outflow: 0, 
                    openingBalance: runningBalance // Set opening balance for the first tx of the month
                };
            }
            monthlyData[month].inflow += tx.credit;
            monthlyData[month].outflow += tx.debit;
            runningBalance += tx.credit - tx.debit;
            monthlyData[month].closingBalance = runningBalance; // Continuously update closing balance
        });

        return Object.entries(monthlyData)
            .map(([month, data]) => ({
                month,
                inflow: data.inflow,
                outflow: data.outflow,
                netFlow: data.inflow - data.outflow,
                openingBalance: data.openingBalance!,
                closingBalance: data.closingBalance!,
            }))
            .sort((a,b) => a.month.localeCompare(b.month));

    }, [transactions]);
    
    if (cashFlowData.length === 0) return null;

    return (
        <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
            <h3 className="text-xl font-bold text-text-primary mb-1">월별 현금 흐름 분석{periodBadge}</h3>
            <p className="text-xs text-text-muted mb-4">* 이 분석은 선택된 기간의 영업 및 영업외 활동을 포함한 모든 실제 입출금 내역을 기반으로 합니다.</p>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-surface-subtle text-text-muted">
                        <tr>
                            <th className="py-2 px-3 text-left">월</th>
                            <th className="py-2 px-3 text-right">기초잔액</th>
                            <th className="py-2 px-3 text-right">총수입</th>
                            <th className="py-2 px-3 text-right">총지출</th>
                            <th className="py-2 px-3 text-right">순현금흐름</th>
                            <th className="py-2 px-3 text-right">기말잔액</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cashFlowData.map(d => (
                            <tr key={d.month} className="border-b border-border-color">
                                <td className="py-2 px-3">{d.month}</td>
                                <td className="py-2 px-3 text-right text-text-muted">{formatCurrency(d.openingBalance)}</td>
                                <td className="py-2 px-3 text-right text-green-500">{formatCurrency(d.inflow)}</td>
                                <td className="py-2 px-3 text-right text-red-500">{formatCurrency(d.outflow)}</td>
                                <td className={`py-2 px-3 text-right font-semibold ${d.netFlow >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{formatCurrency(d.netFlow)}</td>
                                <td className="py-2 px-3 text-right font-bold text-text-primary">{formatCurrency(d.closingBalance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {transactions.length === 0 && <div className="text-center py-8 text-text-muted">선택된 기간에 데이터가 없습니다.</div>}
            </div>
        </div>
    );
};

const VendorCustomerAnalysis: React.FC<{ transactions: Transaction[], periodBadge?: React.ReactNode }> = ({ transactions, periodBadge }) => {
    const { 
        topExpenses, 
        allExpenses, 
        topIncomes, 
        allIncomes, 
        totalExpense, 
        totalIncome 
    } = useMemo(() => {
        const expenseSources: Record<string, number> = {};
        const incomeSources: Record<string, number> = {};
        let totalExpense = 0;
        let totalIncome = 0;

        transactions.forEach(tx => {
            const source = tx.description.trim();
            if (tx.debit > 0) {
                totalExpense += tx.debit;
                expenseSources[source] = (expenseSources[source] || 0) + tx.debit;
            }
            if (tx.credit > 0) {
                 totalIncome += tx.credit;
                 incomeSources[source] = (incomeSources[source] || 0) + tx.credit;
            }
        });
        
        const sortedExpenses = Object.entries(expenseSources).sort(([,a], [,b]) => b - a).map(([name, value]) => ({ name, value }));
        const sortedIncomes = Object.entries(incomeSources).sort(([,a], [,b]) => b - a).map(([name, value]) => ({ name, value }));
        
        return { 
            topExpenses: sortedExpenses.slice(0, 10), 
            allExpenses: sortedExpenses,
            topIncomes: sortedIncomes.slice(0, 10),
            allIncomes: sortedIncomes,
            totalExpense, 
            totalIncome 
        };
    }, [transactions]);
    
    const renderAnalysisSection = (title: string, chartData: {name: string, value: number}[], tableData: {name: string, value: number}[], total: number, color: string) => (
        <div>
            <h4 className="font-semibold text-text-primary mb-2">{title}</h4>
            {chartData.length > 0 && total > 0 ? (
                <>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#233554" />
                            <XAxis type="number" tickFormatter={(v) => formatCurrency(v, true)} tick={{ fontSize: 12, fill: '#8892b0' }}/>
                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: '#8892b0' }} interval={0} />
                            <Tooltip formatter={(value: number) => [formatCurrency(value), `(${(value/total*100).toFixed(1)}%)`]} contentStyle={{ backgroundColor: '#172a45', border: '1px solid #233554', borderRadius: '0.5rem' }}/>
                            <Bar dataKey="value" fill={color} barSize={15} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="overflow-y-auto mt-4 border-t border-border-color pt-4 max-h-[480px]">
                  <table className="min-w-full text-sm">
                      <thead className="bg-surface-subtle text-text-muted sticky top-0">
                          <tr>
                              <th className="py-2 px-3 text-left">거래처(적요)</th>
                              <th className="py-2 px-3 text-right">금액</th>
                              <th className="py-2 px-3 text-right">비중</th>
                          </tr>
                      </thead>
                      <tbody>
                          {tableData.map(d => (
                              <tr key={d.name} className="border-b border-border-color">
                                  <td className="py-1.5 px-3 truncate max-w-xs" title={d.name}>{d.name}</td>
                                  <td className="py-1.5 px-3 text-right">{formatCurrency(d.value)}</td>
                                  <td className="py-1.5 px-3 text-right font-medium">{((d.value/total)*100).toFixed(1)}%</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                </div>
                </>
            ) : <p className="text-sm text-text-muted h-[400px] flex items-center justify-center">분석할 데이터가 부족합니다.</p>}
        </div>
    );

    return (
        <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
            <h3 className="text-xl font-bold text-text-primary mb-4">주요 영업 수입/지출처 분석{periodBadge}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {renderAnalysisSection('Top 10 영업 수입처 (적요 기준)', topIncomes, allIncomes, totalIncome, '#22c55e')}
                {renderAnalysisSection('Top 10 영업 지출처 (적요 기준)', topExpenses, allExpenses, totalExpense, '#ef4444')}
            </div>
        </div>
    );
};

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  categories: Category[];
}

const DeepDiveView: React.FC<Props> = ({ transactions, businessInfo, categories }) => {
    const [periodType, setPeriodType] = useState<'all' | 'year' | 'half' | 'quarter' | 'month'>('all');
    const [selectedValue, setSelectedValue] = useState<string>('all');

    const availablePeriods = useMemo(() => getAvailablePeriods(transactions), [transactions]);
    const categoryTypeMap = useMemo(() => new Map(categories.map(c => [c.name, c.type])), [categories]);

    useEffect(() => {
        setSelectedValue('all');
    }, [periodType]);

    const filteredTransactions = useMemo(() => {
        if (periodType === 'all' || selectedValue === 'all') {
            return transactions;
        }
        return transactions.filter(tx => {
            const year = tx.date.getFullYear();
            const month = tx.date.getMonth();
            switch (periodType) {
                case 'year': return String(year) === selectedValue;
                case 'month': return `${year}-${String(month + 1).padStart(2, '0')}` === selectedValue;
                case 'quarter': return `${year}-Q${Math.floor(month / 3) + 1}` === selectedValue;
                case 'half': return `${year}-H${month < 6 ? 1 : 2}` === selectedValue;
                default: return true;
            }
        });
    }, [transactions, periodType, selectedValue]);

    const operatingExpenseTransactions = useMemo(() => 
        filteredTransactions.filter(tx => categoryTypeMap.get(tx.category) === 'operating_expense'), 
    [filteredTransactions, categoryTypeMap]);

    const operatingTransactions = useMemo(() => 
        filteredTransactions.filter(tx => {
            const type = categoryTypeMap.get(tx.category);
            return type === 'operating_income' || type === 'operating_expense';
        }),
    [filteredTransactions, categoryTypeMap]);

    const periodOptions = useMemo(() => {
        if (periodType === 'all') return [];
        const keyMap = {
            year: 'years',
            half: 'halves',
            quarter: 'quarters',
            month: 'months',
        };
        return availablePeriods[keyMap[periodType as keyof typeof keyMap]];
    }, [periodType, availablePeriods]);

    const PeriodButton: React.FC<{type: typeof periodType, label:string}> = ({type, label}) => (
        <button onClick={() => setPeriodType(type)} className={`px-3 py-1 text-sm font-semibold rounded-md ${periodType === type ? 'bg-brand-primary text-text-on-light shadow' : 'text-text-muted'}`}>{label}</button>
    );

    // 기간 라벨 생성
    const periodLabel = useMemo(() => {
        if (periodType === 'all' || selectedValue === 'all') return '전체 기간';
        return selectedValue;
    }, [periodType, selectedValue]);

    // 섹션 제목에 기간 표시하는 배지
    const PeriodBadge = () => (
        <span className="ml-2 text-sm font-normal text-brand-accent bg-brand-primary/20 px-2 py-0.5 rounded-full">
            {periodLabel}
        </span>
    );

    return (
        <div className="space-y-8">
             <div>
                <h2 className="text-3xl font-bold text-text-inverted">심층 분석</h2>
                <p className="mt-1 text-text-inverted-muted">손익계산서, 고정비/변동비 분석 등 전문적인 재무 분석 기법을 통해 비즈니스의 수익 구조를 다각도로 분석합니다.</p>
            </div>
            <div className="bg-surface-card p-4 rounded-xl shadow-lg border border-border-color">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-lg font-semibold text-text-primary">분석 기간 설정</span>
                    <div className="flex items-center p-1 bg-surface-subtle rounded-lg">
                        <PeriodButton type="all" label="전체"/>
                        <PeriodButton type="year" label="연도별"/>
                        <PeriodButton type="half" label="반기별"/>
                        <PeriodButton type="quarter" label="분기별"/>
                        <PeriodButton type="month" label="월별"/>
                    </div>
                    {periodType !== 'all' && (
                        <select
                            value={selectedValue}
                            onChange={(e) => setSelectedValue(e.target.value)}
                            className="bg-background-main border border-border-color rounded-md px-3 py-2 text-sm text-text-primary"
                        >
                            <option value="all">전체</option>
                            {periodOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    )}
                </div>
            </div>

            <IncomeStatementAnalysis transactions={filteredTransactions} categories={categories} periodBadge={<PeriodBadge />} />
            <FixedVariableCostAnalysis transactions={operatingExpenseTransactions} categories={categories} businessInfo={businessInfo} periodBadge={<PeriodBadge />} />
            <CashFlowAnalysis transactions={filteredTransactions} periodBadge={<PeriodBadge />} />
            <VendorCustomerAnalysis transactions={operatingTransactions} periodBadge={<PeriodBadge />} />
        </div>
    );
};

export default DeepDiveView;