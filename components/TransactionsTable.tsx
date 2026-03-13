import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category } from '../types';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onUpdateTransaction: (transaction: Transaction) => void;
}

const TransactionsTable: React.FC<Props> = ({ transactions, categories, onUpdateTransaction }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);

  useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return transactions.slice(startIndex, startIndex + rowsPerPage);
  }, [transactions, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(transactions.length / rowsPerPage);

  const handleCategoryChange = (txId: string, newCategory: string) => {
    const txToUpdate = transactions.find(tx => tx.id === txId);
    if (txToUpdate) {
      onUpdateTransaction({ ...txToUpdate, category: newCategory });
    }
  };
  
  const formatDate = (date: Date) => date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // Memoize category lists to prevent re-filtering on every render
  const incomeCategories = useMemo(() => categories.filter(c => c.type.includes('income')), [categories]);
  const expenseCategories = useMemo(() => categories.filter(c => c.type.includes('expense')), [categories]);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-color">
          <thead className="bg-surface-subtle">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">거래일시</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">적요</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">출금액</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">입금액</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">카테고리</th>
            </tr>
          </thead>
          <tbody className="bg-surface-card divide-y divide-border-color">
            {paginatedTransactions.map((tx) => {
              const availableCategories = tx.credit > 0 ? incomeCategories : expenseCategories;

              return (
                <tr key={tx.id} className="hover:bg-surface-subtle even:bg-surface-subtle">
                  <td className="px-6 py-1 whitespace-nowrap text-sm text-text-primary">{formatDate(tx.date)}</td>
                  <td className="px-6 py-1 whitespace-nowrap text-sm text-text-muted max-w-xs truncate" title={tx.description}>{tx.description}</td>
                  <td className="px-6 py-1 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                    {tx.debit > 0 ? tx.debit.toLocaleString('ko-KR') : '-'}
                  </td>
                  <td className="px-6 py-1 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                    {tx.credit > 0 ? tx.credit.toLocaleString('ko-KR') : '-'}
                  </td>
                  <td className="px-6 py-1 whitespace-nowrap text-sm">
                    <select
                      value={tx.category}
                      onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                      className="bg-background-main border border-border-color rounded-md px-2 py-1 focus:ring-brand-primary focus:border-brand-primary text-text-primary text-sm"
                    >
                      {!availableCategories.some(c => c.name === tx.category) && (
                        <option value={tx.category} className="text-red-500 font-semibold">
                          {tx.category} (⚠️ 맵핑 오류)
                        </option>
                      )}
                      {availableCategories.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {paginatedTransactions.length === 0 && (
            <div className="text-center py-10 text-text-muted">
                표시할 거래 내역이 없습니다.
            </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between border-t border-border-color px-4 py-3 sm:px-6 mt-4">
           <div>
            <label htmlFor="rowsPerPage" className="text-sm text-text-muted mr-2">페이지당 행 수:</label>
            <select
              id="rowsPerPage"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page
              }}
              className="bg-background-main border border-border-color rounded-md px-2 py-1 text-sm"
            >
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex-1 flex justify-between sm:justify-end">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-border-color text-sm font-medium rounded-md text-text-muted bg-surface-card hover:bg-surface-subtle disabled:opacity-50"
            >
              이전
            </button>
            <span className="text-sm text-text-muted mx-4 self-center">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-border-color text-sm font-medium rounded-md text-text-muted bg-surface-card hover:bg-surface-subtle disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default TransactionsTable;