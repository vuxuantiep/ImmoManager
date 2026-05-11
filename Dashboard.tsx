
import React, { useState } from 'react';
import { Property, Tenant, Transaction, TransactionType, Reminder, ReminderCategory, View } from './types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateReminderEmail } from './geminiService.ts';

interface DashboardProps {
  properties: Property[];
  tenants: Tenant[];
  transactions: Transaction[];
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  setView: (view: View, params?: any) => void;
  onEditProperty: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ properties, tenants, transactions, reminders, setReminders, setView, onEditProperty }) => {
  const [isGeneratingMail, setIsGeneratingMail] = useState<string | null>(null);
  const [mailDraft, setMailDraft] = useState<string | null>(null);

  const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + p.units.filter(u => u.tenantId).length, 0);
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);

  const chartData = [
    { name: 'In', value: income, color: '#10b981' },
    { name: 'Out', value: expenses, color: '#ef4444' },
    { name: 'Net', value: income - expenses, color: '#6366f1' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Objekte" 
          value={properties.length.toString()} 
          icon="fa-building" 
          color="text-blue-600" 
          bgColor="bg-blue-100" 
          onClick={() => setView('properties')}
        />
        <StatCard 
          title="Mieter" 
          value={tenants.length.toString()} 
          icon="fa-users" 
          color="text-purple-600" 
          bgColor="bg-purple-100" 
          onClick={() => setView('tenants')}
        />
        <StatCard 
          title="Belegung" 
          value={`${occupancyRate.toFixed(0)}%`} 
          icon="fa-door-open" 
          color="text-emerald-600" 
          bgColor="bg-emerald-100" 
          onClick={() => setView('properties')}
        />
        <StatCard 
          title="Cashflow" 
          value={`${(income - expenses).toFixed(0)}€`} 
          icon="fa-euro-sign" 
          color="text-indigo-600" 
          bgColor="bg-indigo-100" 
          onClick={() => setView('finances')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-around">
            <QuickActionButton onClick={() => setView('tools', { tab: 'meters' })} icon="fa-gauge-high" label="Scan" color="text-cyan-600" bgColor="bg-cyan-50" />
            <QuickActionButton onClick={() => setView('finances')} icon="fa-plus" label="Buchung" color="text-emerald-600" bgColor="bg-emerald-50" />
            <QuickActionButton onClick={() => setView('tools', { tab: 'letter' })} icon="fa-envelope" label="Brief" color="text-indigo-600" bgColor="bg-indigo-50" />
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Finanz-Trend</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 10, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} fontWeight="bold" />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} fontWeight="bold" />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={45}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Letzte Aktivitäten</h3>
          <div className="space-y-4">
            {transactions.slice(-6).reverse().map(t => (
              <div key={t.id} className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-2xl transition group">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  <i className={`fa-solid ${t.type === TransactionType.INCOME ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black truncate text-slate-700 uppercase tracking-tighter">{t.description}</p>
                  <p className="text-[9px] text-slate-400 font-bold">{t.date}</p>
                </div>
                <span className={`text-xs font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-600'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toFixed(0)}€
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickActionButton = ({ onClick, icon, label, color, bgColor }: any) => (
  <button onClick={onClick} className="flex flex-col items-center space-y-2 group">
    <div className={`w-12 h-12 rounded-[1.2rem] ${bgColor} ${color} flex items-center justify-center group-hover:scale-110 transition-all shadow-sm active:scale-95`}>
      <i className={`fa-solid ${icon} text-lg`}></i>
    </div>
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, color, bgColor, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all group active:scale-95"
  >
    <div className="min-w-0">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
      <h3 className="text-xl font-black text-slate-800 truncate">{value}</h3>
    </div>
    <div className={`${bgColor} ${color} w-10 h-10 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm`}>
      <i className={`fa-solid ${icon} text-sm`}></i>
    </div>
  </div>
);

export default Dashboard;
