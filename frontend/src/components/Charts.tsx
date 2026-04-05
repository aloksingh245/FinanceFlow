import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

interface MonthlyEntry { month: string; type: string; total: number; }
interface CategoryEntry { category: string; total: number; }

interface LineChartProps { monthlyData?: MonthlyEntry[]; }
interface CategoryChartProps { categoryData?: CategoryEntry[]; }

export const LineChart: React.FC<LineChartProps> = ({ monthlyData = [] }) => {
  // Build labels and datasets from real monthly data
  const months = [...new Set(monthlyData.map(d => d.month))].sort();
  const incomeMap = Object.fromEntries(monthlyData.filter(d => d.type === 'income').map(d => [d.month, d.total]));
  const expenseMap = Object.fromEntries(monthlyData.filter(d => d.type === 'expense').map(d => [d.month, d.total]));

  const labels = months.length ? months : ['No data'];
  const incomeData  = months.map(m => incomeMap[m]  || 0);
  const expenseData = months.map(m => expenseMap[m] || 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointRadius: 4,
      },
      {
        label: 'Expense',
        data: expenseData,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f43f5e',
        pointRadius: 4,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
        borderRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ₹${ctx.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { color: '#94a3b8', callback: (v: any) => `₹${Number(v).toLocaleString()}` }
      },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  return <Line options={options} data={data} />;
};

export const CategoryChart: React.FC<CategoryChartProps> = ({ categoryData = [] }) => {
  const COLORS = ['#6366f1','#f43f5e','#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6','#14b8a6'];

  const data = {
    labels: categoryData.map(d => d.category),
    datasets: [{
      data: categoryData.map(d => d.total),
      backgroundColor: COLORS.slice(0, categoryData.length),
      borderWidth: 0,
      hoverOffset: 6,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { font: { size: 12 }, color: '#475569', padding: 16 } },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
        borderRadius: 8,
        callbacks: { label: (ctx: any) => ` ₹${ctx.parsed.toLocaleString()}` }
      }
    }
  };

  if (!categoryData.length) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
      No expense data for this period
    </div>
  );

  return <Doughnut options={options} data={data} />;
};
