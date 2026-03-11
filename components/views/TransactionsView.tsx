import React, { useState, useMemo } from 'react';
import { Transaction, Category, BusinessInfo } from '../../types';
import TransactionsTable from '../TransactionsTable';

declare const XLSX: any;

interface Props {
  transactions: Transaction[];
  categories: Category[];
  businessInfo: BusinessInfo;
  onUpdateTransaction: (transaction: Transaction) => void;
}

const TypeButton = ({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
            isActive 
            ? 'bg-brand-primary text-text-on-light shadow' 
            : 'bg-surface-subtle text-text-muted hover:bg-border-color'
        }`}
        aria-pressed={isActive}
    >
        {icon}
        <span>{label}</span>
    </button>
);


const TransactionsView: React.FC<Props> = ({ transactions, categories, onUpdateTransaction }) => {
  const [filter, setFilter] = useState({ 
      term: '', 
      category: 'all', 
      type: 'all' as 'all' | 'income' | 'expense',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFilter(f => ({ ...f, [name]: value }));
  };

  const { filteredTransactions, summary } = useMemo(() => {
    const minAmount = filter.minAmount ? parseFloat(filter.minAmount) : null;
    const maxAmount = filter.maxAmount ? parseFloat(filter.maxAmount) : null;
    const startDate = filter.startDate ? new Date(filter.startDate) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);
    const endDate = filter.endDate ? new Date(filter.endDate) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const selectedCategoryInfo = filter.category !== 'all' 
            ? categories.find(c => c.name === filter.category) 
            : null;

    const filtered = transactions.filter(t => {
      const termMatch = filter.term === '' || t.description.toLowerCase().includes(filter.term.toLowerCase());
      const categoryMatch = filter.category === 'all' || t.category === filter.category;
      
      const typeMatch = filter.type === 'all' || 
          (filter.type === 'income' && t.credit > 0) || 
          (filter.type === 'expense' && t.debit > 0);
      
      // Stricter check if a specific category is selected
      if (selectedCategoryInfo) {
          if (selectedCategoryInfo.type.includes('income') && t.credit === 0) return false;
          if (selectedCategoryInfo.type.includes('expense') && t.debit === 0) return false;
      }

      const startDateMatch = !startDate || t.date >= startDate;
      const endDateMatch = !endDate || t.date <= endDate;

      const transactionAmount = t.credit > 0 ? t.credit : t.debit;
      const minAmountMatch = minAmount === null || transactionAmount >= minAmount;
      const maxAmountMatch = maxAmount === null || transactionAmount <= maxAmount;

      return termMatch && categoryMatch && typeMatch && startDateMatch && endDateMatch && minAmountMatch && maxAmountMatch;
    });

    const calculatedSummary = filtered.reduce((acc, tx) => {
        acc.totalCredit += tx.credit;
        acc.totalDebit += tx.debit;
        return acc;
    }, { totalCredit: 0, totalDebit: 0 });

    return { filteredTransactions: filtered, summary: calculatedSummary };
  }, [transactions, filter, categories]);
  
  const availableCategories = useMemo(() => {
    if (filter.type === 'all') return categories;
    return categories.filter(c => c.type.includes(filter.type));
  }, [categories, filter.type]);
  
  const handleTypeChange = (type: 'all' | 'income' | 'expense') => {
    setFilter(f => ({
        ...f,
        type,
        category: 'all' // Reset category filter when type changes
    }));
  };
  
  const netSum = summary.totalCredit - summary.totalDebit;

  const handleExport = () => {
    const dataToExport = filteredTransactions.map(tx => ({
        '거래일시': tx.date.toLocaleString('ko-KR'),
        '적요': tx.description,
        '출금액': tx.debit,
        '입금액': tx.credit,
        '카테고리': tx.category,
        '은행': tx.bank,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, `transactions_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
     <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">거래 내역 상세 조회</h3>
                <p className="mt-1 text-text-muted">통장에 찍힌 모든 입출금 내역을 하나씩 볼 수 있는 화면입니다. 날짜, 금액, 분류 항목별로 원하는 거래만 골라볼 수 있고, AI가 잘못 분류한 항목이 있으면 직접 클릭해서 바로잡을 수 있습니다. 엑셀 파일로도 내보낼 수 있습니다.</p>
              </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm transition-colors duration-200"
                >
                    Excel로 내보내기
                </button>
            </div>
            <div className="flex flex-col gap-3 p-4 bg-surface-subtle rounded-lg">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center p-1 bg-background-main rounded-lg w-fit">
                        <TypeButton label="전체" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>} isActive={filter.type === 'all'} onClick={() => handleTypeChange('all')} />
                        <TypeButton label="수입" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} isActive={filter.type === 'income'} onClick={() => handleTypeChange('income')} />
                        <TypeButton label="지출" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} isActive={filter.type === 'expense'} onClick={() => handleTypeChange('expense')} />
                    </div>
                    <input 
                        type="text" name="term" placeholder="적요 검색..." value={filter.term} onChange={handleFilterChange}
                        className="bg-background-main border border-border-color rounded-md px-3 py-2 text-sm w-40 text-text-primary placeholder-text-muted" aria-label="Search by description"
                    />
                     <select 
                        name="category" value={filter.category} onChange={handleFilterChange}
                        className="bg-background-main border border-border-color rounded-md px-3 py-2 text-sm text-text-primary" aria-label="Select category"
                     >
                         <option value="all">모든 카테고리</option>
                         {availableCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                     </select>
                </div>
                 <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor="startDate" className="text-sm text-text-muted">기간:</label>
                        <input type="date" name="startDate" id="startDate" value={filter.startDate} onChange={handleFilterChange} className="bg-background-main border border-border-color rounded-md px-3 py-1.5 text-sm text-text-primary"/>
                        <span>~</span>
                        <input type="date" name="endDate" value={filter.endDate} onChange={handleFilterChange} className="bg-background-main border border-border-color rounded-md px-3 py-1.5 text-sm text-text-primary"/>
                    </div>
                     <div className="flex items-center gap-2">
                        <label htmlFor="minAmount" className="text-sm text-text-muted">금액:</label>
                        <input type="number" name="minAmount" id="minAmount" placeholder="최소 금액" value={filter.minAmount} onChange={handleFilterChange} className="bg-background-main border border-border-color rounded-md px-3 py-1.5 text-sm w-28 text-text-primary placeholder-text-muted"/>
                        <span>~</span>
                        <input type="number" name="maxAmount" placeholder="최대 금액" value={filter.maxAmount} onChange={handleFilterChange} className="bg-background-main border border-border-color rounded-md px-3 py-1.5 text-sm w-28 text-text-primary placeholder-text-muted"/>
                    </div>
                 </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm font-semibold text-green-600">조회된 수입 합계</div>
                    <div className="text-lg font-bold text-green-600">{summary.totalCredit.toLocaleString()}원</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-sm font-semibold text-red-600">조회된 지출 합계</div>
                    <div className="text-lg font-bold text-red-600">{summary.totalDebit.toLocaleString()}원</div>
                </div>
                 <div className={`${netSum >= 0 ? 'bg-blue-50' : 'bg-orange-50'} p-3 rounded-lg`}>
                    <div className={`text-sm font-semibold ${netSum >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>합계</div>
                    <div className={`text-lg font-bold ${netSum >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{netSum.toLocaleString()}원</div>
                </div>
            </div>
        </div>
        <TransactionsTable 
            transactions={filteredTransactions} 
            categories={categories}
            onUpdateTransaction={onUpdateTransaction}
        />
      </div>
  )
};

export default TransactionsView;