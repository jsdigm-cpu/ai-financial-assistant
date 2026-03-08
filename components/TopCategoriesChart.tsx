import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { DEFAULT_CATEGORY_INCOME, DEFAULT_CATEGORY_EXPENSE } from '../constants';

interface Props {
  data: Transaction[];
  type: 'operating_income' | 'operating_expense';
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];

const TopCategoriesChart: React.FC<Props> = ({ data, type }) => {
  const { chartData, topCategories } = useMemo(() => {
    const isIncome = type === 'operating_income';
    
    // 1. Find top 5 categories
    const categoryTotals: { [key: string]: number } = {};
    data.forEach(tx => {
      const amount = isIncome ? tx.credit : tx.debit;
      if (amount > 0) {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amount;
      }
    });

    const top5Categories = Object.keys(categoryTotals)
      .sort((a, b) => categoryTotals[b] - categoryTotals[a])
      .slice(0, 5);

    if (top5Categories.length === 0) return { chartData: [], topCategories: [] };
    
    // 2. Aggregate monthly data for top 5 categories
    const monthlyData: { [month: string]: { [category: string]: number } } = {};
    data.forEach(tx => {
      if (top5Categories.includes(tx.category)) {
        const year = tx.date.getFullYear();
        const monthNum = tx.date.getMonth() + 1;
        const month = `${year}-${String(monthNum).padStart(2, '0')}`; // YYYY-MM
        
        const amount = isIncome ? tx.credit : tx.debit;
        if (!monthlyData[month]) monthlyData[month] = {};
        monthlyData[month][tx.category] = (monthlyData[month][tx.category] || 0) + amount;
      }
    });

    // 3. Format for chart
    const formattedChartData = Object.keys(monthlyData)
      .map(month => ({
        name: month,
        ...top5Categories.reduce((acc, cat) => ({...acc, [cat]: monthlyData[month][cat] || 0}), {})
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { chartData: formattedChartData, topCategories: top5Categories };

  }, [data, type]);

  const formatCurrencyCompact = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) return '0원';
    if (Math.abs(value) >= 10000) {
        return `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만원`;
    }
    return `${value.toLocaleString('ko-KR')}원`;
  };

  if (chartData.length === 0) {
      return <div className="flex items-center justify-center h-full text-text-muted">분석할 데이터가 부족합니다.</div>;
  }

  return (
    <div className="w-full">
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#233554" />
            <XAxis dataKey="name" stroke="#8892b0" fontSize={12} />
            <YAxis tickFormatter={formatCurrencyCompact} stroke="#8892b0" fontSize={12} />
            <Tooltip 
              formatter={(value: number, name: string) => [`${value.toLocaleString('ko-KR')}원`, name]}
              contentStyle={{ backgroundColor: '#172a45', border: '1px solid #233554', borderRadius: '0.5rem' }}
              labelStyle={{ color: '#ccd6f6', fontWeight: 'bold' }}
              itemStyle={{ color: '#ccd6f6' }}
            />
            <Legend wrapperStyle={{ color: '#ccd6f6', fontSize: '12px' }} />
            {topCategories.map((cat, index) => (
              <Line key={cat} type="monotone" dataKey={cat} stroke={COLORS[index % COLORS.length]} strokeWidth={2} activeDot={{ r: 6 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-sm text-center">
              <thead className="bg-surface-subtle text-text-muted">
                  <tr>
                      <th className="py-2 px-3 font-medium">월</th>
                      {topCategories.map(cat => <th key={cat} className="py-2 px-3 font-medium">{cat}</th>)}
                  </tr>
              </thead>
              <tbody>
                  {chartData.map(d => (
                      <tr key={d.name} className="border-b border-border-color">
                          <td className="py-2 px-3">{d.name}</td>
                          {topCategories.map(cat => <td key={cat} className="py-2 px-3">{d[cat] > 0 ? formatCurrencyCompact(d[cat] as number) : '-'}</td>)}
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default TopCategoriesChart;