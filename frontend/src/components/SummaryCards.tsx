import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface SummaryCardsProps {
  summary: {
    total_income: number;
    total_expense: number;
    net_balance: number;
  };
}

const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString()}`;

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const income  = summary?.total_income  ?? 0;
  const expense = summary?.total_expense ?? 0;
  const balance = summary?.net_balance   ?? 0;

  const cards = [
    {
      title: 'Net Balance',
      value: fmt(balance),
      icon: Wallet,
      color: balance >= 0 ? '#6366f1' : '#f43f5e',
      sub: balance >= 0 ? 'Positive cashflow' : 'Negative cashflow',
      trendUp: balance >= 0,
    },
    {
      title: 'Total Income',
      value: fmt(income),
      icon: TrendingUp,
      color: '#10b981',
      sub: income > 0 ? `${((income / (income + expense || 1)) * 100).toFixed(0)}% of total flow` : 'No income recorded',
      trendUp: true,
    },
    {
      title: 'Total Expenses',
      value: fmt(expense),
      icon: TrendingDown,
      color: '#f43f5e',
      sub: expense > 0 ? `${((expense / (income + expense || 1)) * 100).toFixed(0)}% of total flow` : 'No expenses recorded',
      trendUp: false,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
      {cards.map((card, idx) => (
        <div key={idx} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: `${card.color}15`, color: card.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <card.icon size={24} />
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              fontSize: '0.75rem', fontWeight: 600,
              color: card.trendUp ? '#10b981' : '#f43f5e'
            }}>
              {card.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {card.sub}
            </div>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{card.title}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{card.value}</div>
          
          {/* Decorative background circle */}
          <div style={{ 
            position: 'absolute', 
            right: '-20px', 
            bottom: '-20px', 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            background: `${card.color}05` 
          }}></div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;