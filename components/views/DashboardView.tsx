import React, { useMemo, useState, useRef } from 'react';
import { Transaction, BusinessInfo, Category } from '../../types';
import { CATEGORY_MAP, DEFAULT_CATEGORY_INCOME, DEFAULT_CATEGORY_EXPENSE } from '../../constants';
import KPICard from '../KPICard';
import IncomeExpenseChart from '../IncomeExpenseChart';
import CategoryPieChart from '../CategoryPieChart';
import TopCategoriesChart from '../TopCategoriesChart';
import { exportViewToPdf } from '../../services/pdfExporter';

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  categories: Category[];
}

// 금액 포맷
const fmt = (n: number) => n.toLocaleString('ko-KR') + '원';
const pct = (part: number, total: number) => total === 0 ? '-' : (part / total * 100).toFixed(1) + '%';

// 기간 선택 옵션 생성
function getPeriodOptions(transactions: Transaction[]): { label: string; value: string }[] {
  const months = new Set<string>();
  const years = new Set<string>();
  transactions.forEach(tx => {
    const y = tx.date.getFullYear();
    const m = String(tx.date.getMonth() + 1).padStart(2, '0');
    months.add(`${y}-${m}`);
    years.add(String(y));
  });
  const sortedMonths = [...months].sort();
  const sortedYears = [...years].sort();
  
  const options: { label: string; value: string }[] = [
    { label: '전체 기간', value: 'all' },
  ];
  sortedYears.forEach(y => options.push({ label: `${y}년`, value: `year-${y}` }));
  sortedMonths.forEach(m => options.push({ label: m, value: `month-${m}` }));
  return options;
}

function filterByPeriod(transactions: Transaction[], period: string): Transaction[] {
  if (period === 'all') return transactions;
  if (period.startsWith('year-')) {
    const year = parseInt(period.replace('year-', ''));
    return transactions.filter(tx => tx.date.getFullYear() === year);
  }
  if (period.startsWith('month-')) {
    const [y, m] = period.replace('month-', '').split('-').map(Number);
    return transactions.filter(tx => tx.date.getFullYear() === y && tx.date.getMonth() + 1 === m);
  }
  return transactions;
}

function getPeriodLabel(period: string): string {
  if (period === 'all') return '전체 기간';
  if (period.startsWith('year-')) return period.replace('year-', '') + '년';
  if (period.startsWith('month-')) return period.replace('month-', '');
  return '';
}

// 카테고리 level2 안전하게 가져오기
function safeGetLevel2(categoryName: string, isIncome: boolean): string {
  const cat = CATEGORY_MAP[categoryName];
  if (cat) return cat.level2;
  // 매칭 안 되는 카테고리 → 기본 분류
  if (isIncome) return '영업외 수익';
  return '사업외 지출';
}

function safeGetCostGroup(categoryName: string): string | null {
  const cat = CATEGORY_MAP[categoryName];
  return cat?.costGroup || null;
}

const DashboardView: React.FC<Props> = ({ transactions, businessInfo, categories }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const periodOptions = useMemo(() => getPeriodOptions(transactions), [transactions]);
  const periodLabel = getPeriodLabel(selectedPeriod);
  
  const filteredTransactions = useMemo(
    () => filterByPeriod(transactions, selectedPeriod),
    [transactions, selectedPeriod]
  );

  const { operatingTransactions, kpiData, monthlyChartData, plData } = useMemo(() => {
    const txs = filteredTransactions;
    
    const operatingTxs = txs.filter(tx => {
        const cat = CATEGORY_MAP[tx.category];
        const type = cat?.type;
        return type === 'operating_income' || type === 'operating_expense';
    });

    // === 계정별 합계 ===
    const accountTotals: Record<string, number> = {};
    txs.forEach(t => {
      const amount = t.credit > 0 ? t.credit : t.debit;
      accountTotals[t.category] = (accountTotals[t.category] || 0) + amount;
    });

    // 그룹별 합계 계산 (CATEGORY_MAP 기반)
    const sumByLevel2 = (level2: string) => {
      let total = 0;
      txs.forEach(t => {
        const isIncome = t.credit > 0;
        const l2 = safeGetLevel2(t.category, isIncome);
        if (l2 === level2) {
          total += isIncome ? t.credit : t.debit;
        }
      });
      return total;
    };

    const sumByCostGroup = (group: string) => {
      let total = 0;
      txs.forEach(t => {
        if (t.debit > 0 && safeGetCostGroup(t.category) === group) {
          total += t.debit;
        }
      });
      return total;
    };

    const operatingRevenue = sumByLevel2('영업 수익');
    const operatingExpense = sumByLevel2('영업 비용');
    const nonOperatingIncome = sumByLevel2('영업외 수익');
    const nonOperatingExpense = sumByLevel2('사업외 지출');

    const laborCost = sumByCostGroup('인건비');
    const materialCost = sumByCostGroup('재료비');
    const fixedCost = sumByCostGroup('고정비');
    const variableCost = sumByCostGroup('변동비');

    const operatingProfit = operatingRevenue - operatingExpense;
    const nonOperatingBalance = nonOperatingIncome - nonOperatingExpense;
    const profitRate = operatingRevenue > 0 ? (operatingProfit / operatingRevenue * 100) : 0;

    // 계정별 상세 (P&L 테이블)
    const getAccountDetail = (level2: string, costGroup?: string) => {
      const result: Record<string, number> = {};
      txs.forEach(t => {
        const isIncome = t.credit > 0;
        const l2 = safeGetLevel2(t.category, isIncome);
        const cg = safeGetCostGroup(t.category);
        if (l2 === level2 && (!costGroup || cg === costGroup)) {
          const amount = isIncome ? t.credit : t.debit;
          result[t.category] = (result[t.category] || 0) + amount;
        }
      });
      return Object.entries(result)
        .map(([name, amount]) => ({ name, amount }))
        .filter(a => a.amount > 0)
        .sort((a, b) => b.amount - a.amount);
    };

    // === 월별 차트 데이터 ===
    const monthlyData: Record<string, { operatingRevenue: number; operatingExpense: number; nonOperatingIncome: number; nonOperatingExpense: number }> = {};
    txs.forEach(tx => {
      const month = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[month]) {
        monthlyData[month] = { operatingRevenue: 0, operatingExpense: 0, nonOperatingIncome: 0, nonOperatingExpense: 0 };
      }
      const isIncome = tx.credit > 0;
      const l2 = safeGetLevel2(tx.category, isIncome);
      if (l2 === '영업 수익') monthlyData[month].operatingRevenue += tx.credit;
      else if (l2 === '영업 비용') monthlyData[month].operatingExpense += tx.debit;
      else if (l2 === '영업외 수익') monthlyData[month].nonOperatingIncome += tx.credit;
      else if (l2 === '사업외 지출') monthlyData[month].nonOperatingExpense += tx.debit;
    });

    const monthlyChartDataResult = Object.keys(monthlyData)
      .map(month => {
        const d = monthlyData[month];
        return {
          name: month,
          "사업매출": d.operatingRevenue,
          "사업비용": d.operatingExpense,
          "사업순손익": d.operatingRevenue - d.operatingExpense,
          "영업외수지": d.nonOperatingIncome - d.nonOperatingExpense,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      operatingTransactions: operatingTxs,
      kpiData: { operatingRevenue, operatingExpense, operatingProfit, nonOperatingBalance, profitRate },
      monthlyChartData: monthlyChartDataResult,
      plData: {
        incomeDetail: getAccountDetail('영업 수익'),
        operatingRevenue,
        laborDetail: getAccountDetail('영업 비용', '인건비'),
        laborCost,
        materialDetail: getAccountDetail('영업 비용', '재료비'),
        materialCost,
        fixedDetail: getAccountDetail('영업 비용', '고정비'),
        fixedCost,
        variableDetail: getAccountDetail('영업 비용', '변동비'),
        variableCost,
        operatingExpense,
        operatingProfit,
        nonOpIncomeDetail: getAccountDetail('영업외 수익'),
        nonOperatingIncome,
        nonOpExpenseDetail: getAccountDetail('사업외 지출'),
        nonOperatingExpense,
        nonOperatingBalance,
      }
    }
  }, [filteredTransactions, categories]);

  const handleExport = async () => {
    if (!contentRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportViewToPdf(
        contentRef.current,
        '종합 대시보드',
        businessInfo.name,
        `${businessInfo.name}_dashboard_${new Date().toISOString().slice(0,10)}`
      );
    } catch (err) {
      console.error('PDF 내보내기 오류:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // P&L 테이블 컴포넌트들
  const PlRow = ({ label, amount, total, indent = false }: {
    label: string; amount: number; total: number; indent?: boolean;
  }) => (
    <tr className="hover:bg-surface-subtle/30">
      <td className={`py-1.5 px-3 ${indent ? 'pl-8' : ''} text-text-muted`}>{label}</td>
      <td className={`py-1.5 px-3 text-right ${amount < 0 ? 'text-red-600' : 'text-text-primary'}`}>{fmt(amount)}</td>
      <td className="py-1.5 px-3 text-right text-text-muted">{pct(amount, total)}</td>
    </tr>
  );

  const PlSubtotal = ({ label, amount, total }: { label: string; amount: number; total: number }) => (
    <tr className="border-t border-border-color bg-surface-subtle/50">
      <td className="py-2 px-3 pl-6 font-semibold text-brand-accent">{label}</td>
      <td className={`py-2 px-3 text-right font-semibold ${amount < 0 ? 'text-red-600' : 'text-brand-accent'}`}>{fmt(amount)}</td>
      <td className="py-2 px-3 text-right font-semibold text-brand-accent">{pct(amount, total)}</td>
    </tr>
  );

  const PlSectionHeader = ({ label }: { label: string }) => (
    <tr className="bg-background-main">
      <td colSpan={3} className="py-2 px-3 font-bold text-brand-primary text-sm">{label}</td>
    </tr>
  );

  const PlTotalRow = ({ label, amount, total, star = false }: { label: string; amount: number; total: number; star?: boolean }) => (
    <tr className="border-t-2 border-brand-primary bg-surface-subtle">
      <td className="py-3 px-3 font-bold text-text-inverted">{star ? '★ ' : ''}{label}</td>
      <td className={`py-3 px-3 text-right font-bold text-lg ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(amount)}</td>
      <td className="py-3 px-3 text-right font-bold text-text-inverted">{pct(amount, total)}</td>
    </tr>
  );

  // 섹션 제목에 기간 표시하는 헬퍼
  const SectionTitle = ({ title, icon, desc }: { title: string; icon?: string; desc?: string }) => (
    <div className="mb-4">
      <h3 className="text-xl font-semibold text-text-primary">
        {icon && <span className="mr-1">{icon}</span>}
        {title}
        <span className="ml-2 text-sm font-normal text-brand-accent bg-brand-primary/20 px-2 py-0.5 rounded-full">
          {periodLabel}
        </span>
      </h3>
      {desc && <p className="text-sm text-text-muted mt-1">{desc}</p>}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* 헤더 + 기간 선택 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-inverted">종합 대시보드</h2>
          <p className="mt-1 text-text-inverted-muted">통장 거래 내역을 바탕으로 수입과 지출을 한눈에 정리한 요약 화면입니다. 기간을 선택하면 해당 기간의 재무 현황만 볼 수 있습니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 기간 선택 드롭다운 */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 bg-surface-card text-text-primary border border-border-color rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent cursor-pointer"
          >
            {periodOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-brand-accent text-white font-semibold rounded-lg shadow-sm hover:bg-sky-400 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-wait"
          >{isExporting ? 'PDF 생성 중...' : 'PDF 다운로드'}</button>
        </div>
      </div>
      
      {/* PDF 캡처 영역 시작 */}
      <div ref={contentRef} className="space-y-8">
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="사업 매출" value={kpiData.operatingRevenue} formatAsCurrency={true} />
        <KPICard title="사업 비용" value={kpiData.operatingExpense} formatAsCurrency={true} />
        <KPICard title="★ 사업 순손익" value={kpiData.operatingProfit} formatAsCurrency={true} trend={kpiData.operatingProfit} />
        <KPICard title="순이익률" value={kpiData.profitRate} formatAsCurrency={false} />
        <KPICard title="영업외 수지" value={kpiData.nonOperatingBalance} formatAsCurrency={true} />
      </div>

      {/* 손익계산서 */}
      <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
        <SectionTitle title="경영 손익 분석표" icon="📊" desc="매출, 원가, 인건비 등 주요 항목별로 수입과 지출을 정리한 표입니다. 우리 사업의 이익 구조를 한눈에 파악할 수 있습니다." />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-brand-primary">
                <th className="py-2 px-3 text-left text-text-muted w-1/2">항목 / 계정명</th>
                <th className="py-2 px-3 text-right text-text-muted w-1/4">금액</th>
                <th className="py-2 px-3 text-right text-text-muted w-1/4">매출 대비 비중</th>
              </tr>
            </thead>
            <tbody>
              <PlSectionHeader label="[ 사 업 매 출 ]" />
              <tr><td colSpan={3} className="py-1 px-3 text-xs font-semibold text-text-muted">▶ 영업 수익 (사업 매출)</td></tr>
              {plData.incomeDetail.map(a => (
                <PlRow key={a.name} label={a.name} amount={a.amount} total={plData.operatingRevenue} indent />
              ))}
              <PlSubtotal label="합      계" amount={plData.operatingRevenue} total={plData.operatingRevenue} />

              <PlSectionHeader label="[ 사 업 비 용 ]" />
              
              {plData.laborDetail.length > 0 && (<>
                <tr><td colSpan={3} className="py-1 px-3 text-xs font-semibold text-text-muted">인건비</td></tr>
                {plData.laborDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} total={plData.operatingRevenue} indent />)}
                <PlSubtotal label="소  계" amount={plData.laborCost} total={plData.operatingRevenue} />
              </>)}

              {plData.materialDetail.length > 0 && (<>
                <tr><td colSpan={3} className="py-1 px-3 text-xs font-semibold text-text-muted">재료비</td></tr>
                {plData.materialDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} total={plData.operatingRevenue} indent />)}
                <PlSubtotal label="소  계" amount={plData.materialCost} total={plData.operatingRevenue} />
              </>)}

              {plData.fixedDetail.length > 0 && (<>
                <tr><td colSpan={3} className="py-1 px-3 text-xs font-semibold text-text-muted">고정비</td></tr>
                {plData.fixedDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} total={plData.operatingRevenue} indent />)}
                <PlSubtotal label="소  계" amount={plData.fixedCost} total={plData.operatingRevenue} />
              </>)}

              {plData.variableDetail.length > 0 && (<>
                <tr><td colSpan={3} className="py-1 px-3 text-xs font-semibold text-text-muted">변동비</td></tr>
                {plData.variableDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} total={plData.operatingRevenue} indent />)}
                <PlSubtotal label="소  계" amount={plData.variableCost} total={plData.operatingRevenue} />
              </>)}

              <PlSubtotal label="합      계" amount={plData.operatingExpense} total={plData.operatingRevenue} />
              <PlTotalRow label="사업 순손익 (매출 - 비용)" amount={plData.operatingProfit} total={plData.operatingRevenue} star />

              <PlSectionHeader label="[ 영업외 수익 ]" />
              {plData.nonOpIncomeDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} total={plData.operatingRevenue} indent />)}
              <PlSubtotal label="합   계" amount={plData.nonOperatingIncome} total={plData.operatingRevenue} />

              <PlSectionHeader label="[ 사업외 지출 ]" />
              {plData.nonOpExpenseDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} total={plData.operatingRevenue} indent />)}
              <PlSubtotal label="합   계" amount={plData.nonOperatingExpense} total={plData.operatingRevenue} />

              <PlTotalRow label="영업외 수지" amount={plData.nonOperatingBalance} total={plData.operatingRevenue} star />
            </tbody>
          </table>
        </div>
      </div>

      {/* 월별 차트 */}
      <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
        <SectionTitle title="월별 재무 성과 분석" desc="월별 수입(파란색)과 지출(빨간색) 추이를 막대 그래프로 보여줍니다. 어느 달에 돈이 많이 들어오고 나갔는지 비교해 보세요." />
        <IncomeExpenseChart data={monthlyChartData} />
      </div>
    
      {/* 카테고리 파이차트 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
          <SectionTitle title="영업 수익 구성" desc="어디서 돈이 들어왔는지 비율로 보여줍니다." />
          <CategoryPieChart data={operatingTransactions} type="operating_income" categories={categories} />
        </div>
        <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
          <SectionTitle title="영업 비용 구성" desc="돈이 어디에 가장 많이 나갔는지 비율로 보여줍니다." />
          <CategoryPieChart data={operatingTransactions} type="operating_expense" categories={categories} />
        </div>
      </div>
    
      {/* Top 5 추이 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
          <SectionTitle title="상위 5개 수입 항목 추이" desc="가장 큰 수입원 5개의 월별 변화를 보여줍니다." />
          <TopCategoriesChart data={operatingTransactions} type="operating_income" />
        </div>
        <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
          <SectionTitle title="상위 5개 비용 항목 추이" desc="가장 큰 지출 항목 5개의 월별 변화를 보여줍니다." />
          <TopCategoriesChart data={operatingTransactions} type="operating_expense" />
        </div>
      </div>
      </div>{/* PDF 캡처 영역 끝 */}
    </div>
  );
};

export default DashboardView;
