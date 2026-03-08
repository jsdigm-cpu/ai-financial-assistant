import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';

interface ChartData {
    name: string;
    "사업매출": number;
    "사업비용": number;
    "사업순손익": number;
    "영업외수지": number;
}

interface Props {
  data: ChartData[];
}

const IncomeExpenseChart: React.FC<Props> = ({ data }) => {

  const formatCurrencyCompact = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) return '0원';
    if (Math.abs(value) >= 100000000) {
        return `${(value / 100000000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억원`;
    }
    if (Math.abs(value) >= 10000) {
        return `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만원`;
    }
    return `${value.toLocaleString('ko-KR')}원`;
  };

  if (data.length === 0) {
      return <div className="flex items-center justify-center h-[350px] text-text-muted">데이터가 부족하여 차트를 표시할 수 없습니다.</div>
  }

  return (
    <div className="w-full h-[350px]">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#233554" />
            <XAxis dataKey="name" stroke="#8892b0" fontSize={12} />
            <YAxis tickFormatter={formatCurrencyCompact} stroke="#8892b0" fontSize={12} />
            <Tooltip 
              formatter={(value: number) => [`${value.toLocaleString('ko-KR')}원`, '']}
              contentStyle={{ backgroundColor: '#172a45', border: '1px solid #233554', borderRadius: '0.5rem' }}
              labelStyle={{ color: '#ccd6f6', fontWeight: 'bold' }}
              itemStyle={{ color: '#ccd6f6' }}
            />
            <Legend wrapperStyle={{ color: '#ccd6f6' }} />
            <Bar dataKey="사업매출" fill="#10B981" barSize={20} />
            <Bar dataKey="사업비용" fill="#EF4444" barSize={20} />
            <Line type="monotone" dataKey="사업순손익" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="영업외수지" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
    </div>
  );
};

export default IncomeExpenseChart;
