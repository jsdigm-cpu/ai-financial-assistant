import React, { useMemo } from 'react';
import { Transaction, Category } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { DEFAULT_CATEGORY_INCOME, DEFAULT_CATEGORY_EXPENSE } from '../constants';

interface Props {
  data: Transaction[];
  type: 'operating_income' | 'operating_expense';
  categories: Category[];
}

const COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', 
  '#6366F1', '#D946EF', '#F97316', '#FBBF24', '#22C55E',
  '#0EA5E9', '#A78BFA', '#F472B6', '#FB923C', '#84CC16'
];

const CategoryPieChart: React.FC<Props> = ({ data, type, categories }) => {
  const validCategoryNames = useMemo(() => 
    new Set(categories.filter(c => c.type === type).map(c => c.name)),
  [categories, type]);

  const { chartData, total } = useMemo(() => {
    const categoryData: { [key: string]: number } = {};
    const isIncome = type === 'operating_income';
    
    data.forEach(tx => {
      const amount = isIncome ? tx.credit : tx.debit;
      
      // Only include transactions that are categorized correctly for this chart's type.
      if (amount > 0 && validCategoryNames.has(tx.category)) {
        categoryData[tx.category] = (categoryData[tx.category] || 0) + amount;
      }
    });

    const currentTotal = Object.values(categoryData).reduce((sum, val) => sum + val, 0);

    const sortedData = Object.keys(categoryData)
      .map(key => ({ name: key, value: categoryData[key] }))
      .sort((a,b) => b.value - a.value);

    return { chartData: sortedData, total: currentTotal };
  }, [data, type, validCategoryNames]);
  
  const formatCurrencyCompact = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) return '0원';
    if (Math.abs(value) >= 10000) {
        return `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만원`;
    }
    return `${value.toLocaleString('ko-KR')}원`;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    if (percent < 0.05) return null; // Hide label for small slices to prevent clutter
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
  };


  if (chartData.length === 0) {
      return <div className="flex items-center justify-center h-[350px] text-text-muted">{type === 'operating_income' ? '수입' : '지출'} 내역이 없어 비중을 표시할 수 없습니다.</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
      <div className="w-full h-[300px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={120}
              innerRadius={70}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [`${value.toLocaleString('ko-KR')}원 (${((value/total) * 100).toFixed(1)}%)`, name]}
              contentStyle={{ backgroundColor: '#172a45', border: '1px solid #233554', borderRadius: '0.5rem' }}
              labelStyle={{ color: '#ccd6f6', fontWeight: 'bold' }}
              itemStyle={{ color: '#ccd6f6' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full overflow-y-auto max-h-[300px] pr-2">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-muted uppercase bg-surface-subtle sticky top-0">
            <tr>
              <th className="py-2 px-3">카테고리</th>
              <th className="py-2 px-3 text-right">금액</th>
              <th className="py-2 px-3 text-right">비중</th>
            </tr>
          </thead>
          <tbody>
            {chartData.slice(0, 10).map((item, index) => (
              <tr key={item.name} className="border-b border-border-color">
                <td className="py-1.5 px-3 flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  {item.name}
                </td>
                <td className="py-1.5 px-3 text-right">{formatCurrencyCompact(item.value)}</td>
                <td className="py-1.5 px-3 text-right font-medium">{total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryPieChart;