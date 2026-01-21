
import React, { useState, useMemo } from 'react';
import { Property, Transaction, Loan, TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { generateInvestmentStrategy, generateExitStrategy } from '../services/geminiService';

interface InvestorDashboardProps {
  properties: Property[];
  transactions: Transaction[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
}

const InvestorDashboard: React.FC<InvestorDashboardProps> = ({ properties, transactions, setProperties }) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'yield' | 'exit' | 'loans'>('yield');
  
  // Strategy States
  const [targetMarketValue, setTargetMarketValue] = useState<number>(300000);
  const [targetInterest, setTargetInterest] = useState<number>(3.5);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Holding period calculation
  const holdingPeriodInfo = useMemo(() => {
    if (!selectedProperty?.purchaseDate) return null;
    const start = new Date(selectedProperty.purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    const progress = Math.min(100, (diffYears / 10) * 100);
    return { years: diffYears.toFixed(1), progress, isTaxFree: diffYears >= 10 };
  }, [selectedProperty]);

  const calcMetrics = (prop: Property) => {
    const annualRent = prop.units.reduce((sum, u) => sum + (u.baseRent * 12), 0);
    const price = prop.purchasePrice || 0;
    const grossYield = price > 0 ? (annualRent / price) * 100 : 0;
    
    const propTransactions = transactions.filter(t => t.propertyId === prop.id);
    const annualExpenses = propTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyLoanService = prop.loans?.reduce((sum, l) => sum + l.monthlyInstallment, 0) || 0;
    const annualLoanService = monthlyLoanService * 12;
    
    const cashflow = (annualRent - annualExpenses - annualLoanService) / 12;
    const netYield = price > 0 ? ((annualRent - annualExpenses) / price) * 100 : 0;

    return { grossYield, netYield, cashflow, annualRent, annualExpenses, annualLoanService };
  };

  const metrics = selectedProperty ? calcMetrics(selectedProperty) : null;

  const handleAiAnalysis = async (type: 'performance' | 'exit') => {
    if (!selectedProperty || !metrics) return;
    setIsAnalyzing(true);
    let analysis = "";
    if (type === 'performance') {
      analysis = await generateInvestmentStrategy(selectedProperty, metrics);
    } else {
      analysis = await generateExitStrategy(selectedProperty, targetMarketValue, targetInterest);
    }
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const pieData = metrics ? [
    { name: 'Kosten', value: metrics.annualExpenses },
    { name: 'Bank', value: metrics.annualLoanService },
    { name: 'Gewinn', value: Math.max(0, metrics.annualRent - metrics.annualExpenses - metrics.annualLoanService) }
  ] : [];

  const COLORS = ['#94a3b8', '#6366f1', '#10b981'];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
           <div className="bg-indigo-600 p-3 rounded-xl text-white">
              <i className="fa-solid fa-sack-dollar text-xl"></i>
           </div>
           <div>
              <h2 className="text-xl font-bold text-slate-800">Investoren-Zentrale</h2>
              <p className="text-xs text-slate-500 font-medium">Strategische Analyse & Vermögensaufbau</p>
           </div>
        </div>
        <select 
          className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
          value={selectedPropertyId}
          onChange={e => { setSelectedPropertyId(e.target.value); setAiAnalysis(null); }}
        >
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {!selectedProperty && (
        <div className="py-20 text-center text-slate-400 italic">Bitte legen Sie zuerst ein Objekt an.</div>
      )}

      {selectedProperty && metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {/* Sub-Navigation */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              <SubTabButton active={activeSubTab === 'yield'} onClick={() => setActiveSubTab('yield')} label="Performance" icon="fa-chart-pie" />
              <SubTabButton active={activeSubTab === 'exit'} onClick={() => setActiveSubTab('exit')} label="Exit-Strategie" icon="fa-door-open" />
              <SubTabButton active={activeSubTab === 'loans'} onClick={() => setActiveSubTab('loans')} label="Finanzierung" icon="fa-landmark" />
            </div>

            {activeSubTab === 'yield' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard title="Bruttorendite" value={`${metrics.grossYield.toFixed(2)}%`} icon="fa-chart-line" color="text-indigo-600" />
                  <StatCard title="Nettorendite" value={`${metrics.netYield.toFixed(2)}%`} icon="fa-chart-area" color="text-emerald-600" />
                  <StatCard title="Cashflow/Mo" value={`${metrics.cashflow.toFixed(2)}€`} icon="fa-money-bill-trend-up" color={metrics.cashflow >= 0 ? 'text-emerald-600' : 'text-red-600'} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6">Ertragsverteilung (p.a.)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6 text-sm">Portfolio-Ziele</h3>
                    <div className="space-y-6">
                      <GoalProgress label="Renditeziel (5%)" current={metrics.netYield} target={5} color="bg-indigo-500" />
                      <GoalProgress label="Kostendeckung" current={metrics.annualRent} target={metrics.annualExpenses + metrics.annualLoanService} color="bg-emerald-500" />
                      <div className="pt-4 border-t">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Objekt-Status</p>
                         <p className="text-sm font-bold text-slate-700">{metrics.cashflow > 0 ? '✅ Positiver Cashflow (Selbstläufer)' : '⚠️ Zuzahlungsgeschäft (Optimierung nötig)'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'exit' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-6">Exit- & Verkaufsanalyse</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-sm text-slate-500 leading-relaxed">Analysieren Sie den idealen Zeitpunkt für einen steuerfreien Verkauf oder eine gewinnbringende Umschuldung.</p>
                      
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">10-Jahres Spekulationsfrist</p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">{holdingPeriodInfo?.years} Jahre gehalten</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${holdingPeriodInfo?.isTaxFree ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {holdingPeriodInfo?.isTaxFree ? 'Steuerfrei' : 'Steuerpflichtig'}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${holdingPeriodInfo?.isTaxFree ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${holdingPeriodInfo?.progress}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Geschätzter Marktwert (€)</label>
                        <input type="number" className="w-full border p-2 rounded-lg font-bold" value={targetMarketValue} onChange={e => setTargetMarketValue(Number(e.target.value))} />
                      </div>
                      
                      <button 
                        onClick={() => handleAiAnalysis('exit')}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition"
                      >
                        KI Exit-Analyse generieren
                      </button>
                    </div>

                    <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                      <h4 className="font-bold text-indigo-900 text-sm mb-4">Steuer-Optimierungs-Tipps</h4>
                      <ul className="space-y-3">
                         <TaxTip icon="fa-house-medical" text="Erhaltungsaufwand vs. Herstellungskosten (15%-Grenze)" />
                         <TaxTip icon="fa-percent" text="Zinsen sind voll als Werbungskosten abzugsfähig" />
                         <TaxTip icon="fa-shield-halved" text="Sonder-AfA (§ 7b EStG) für Neubau prüfen" />
                         <TaxTip icon="fa-arrows-split-up-and-left" text="Umschichtung des Kapitals via Share Deal prüfen" />
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'loans' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800">Umschuldungs-Check</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400">Marktzins aktuell:</span>
                    <input type="number" step="0.1" className="w-16 border rounded p-1 text-xs font-bold" value={targetInterest} onChange={e => setTargetInterest(Number(e.target.value))} />
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedProperty.loans?.map(loan => {
                    const diff = loan.interestRate - targetInterest;
                    const potentialSaving = (loan.currentBalance * (diff/100)) / 12;
                    
                    return (
                      <div key={loan.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center space-x-4">
                           <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600">
                              <i className="fa-solid fa-building-columns"></i>
                           </div>
                           <div>
                              <p className="font-bold text-slate-800">{loan.bankName}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase">Zinsbindung bis {loan.fixedUntil}</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1">
                           <LoanDetail label="Ist-Zins" value={`${loan.interestRate}%`} />
                           <LoanDetail label="Potential" value={diff > 0 ? `${diff.toFixed(2)}%` : '0%'} />
                           <LoanDetail label="Ersparnis/Mo" value={diff > 0 ? `~${potentialSaving.toFixed(0)}€` : '0€'} />
                           <div className="text-right">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Aktion</p>
                              <button className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${diff > 0.5 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                {diff > 0.5 ? 'Umschulden' : 'Halten'}
                              </button>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: AI Strategy Output */}
          <div className="space-y-6">
            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl overflow-hidden relative min-h-[400px]">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <i className="fa-solid fa-wand-magic-sparkles mr-2 text-indigo-300"></i> KI-Strategie-Bericht
                </h3>
                
                {isAnalyzing ? (
                  <div className="py-20 flex flex-col items-center justify-center text-indigo-200">
                    <i className="fa-solid fa-microchip fa-spin text-4xl mb-4"></i>
                    <p className="text-xs font-black uppercase tracking-widest animate-pulse">Analysiere Finanzmarkt...</p>
                  </div>
                ) : aiAnalysis ? (
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap border border-white/10 animate-in zoom-in-95 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {aiAnalysis}
                    <button onClick={() => setAiAnalysis(null)} className="mt-4 block text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:text-white underline decoration-indigo-500">Bericht schließen</button>
                  </div>
                ) : (
                  <div className="text-center py-20 opacity-50">
                     <i className="fa-solid fa-file-invoice-dollar text-5xl mb-4 text-indigo-400"></i>
                     <p className="text-xs font-medium">Klicken Sie links auf "KI Analyse generieren" für detaillierte Insights.</p>
                  </div>
                )}
              </div>
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-10"></div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                 <i className="fa-solid fa-landmark-flag mr-2"></i> Förder-Finder
               </h4>
               <div className="space-y-3">
                  <SubsidyBadge label="KfW 261" desc="Kredit für Effizienzhaus" />
                  <SubsidyBadge label="KfW 461" desc="Zuschuss Wohngebäude" />
                  <SubsidyBadge label="BAFA BEG" desc="Einzelmaßnahmen" />
                  <button className="w-full text-[10px] font-black uppercase bg-slate-50 py-2 rounded-lg text-slate-500 hover:bg-slate-100 transition">Alle Programme anzeigen</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
    <div className={`h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center ${color} opacity-80`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
  </div>
);

const SubTabButton = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: string }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
  >
    <i className={`fa-solid ${icon}`}></i>
    <span>{label}</span>
  </button>
);

const GoalProgress = ({ label, current, target, color }: { label: string, current: number, target: number, color: string }) => {
  const progress = Math.min(100, (current / target) * 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
        <span className="text-xs font-black text-slate-700">{progress.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

const TaxTip = ({ icon, text }: { icon: string, text: string }) => (
  <li className="flex items-start space-x-3 text-xs text-indigo-900/80">
    <i className={`fa-solid ${icon} mt-0.5 shrink-0`}></i>
    <span className="font-medium">{text}</span>
  </li>
);

const SubsidyBadge = ({ label, desc }: { label: string, desc: string }) => (
  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition group">
    <div className="flex justify-between items-center mb-0.5">
      <span className="text-xs font-black text-indigo-600 uppercase">{label}</span>
      <i className="fa-solid fa-circle-info text-[10px] text-slate-300 group-hover:text-indigo-400"></i>
    </div>
    <p className="text-[10px] text-slate-500 font-medium">{desc}</p>
  </div>
);

const LoanDetail = ({ label, value }: { label: string, value: string }) => (
  <div>
    <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
    <p className="text-xs font-bold text-slate-800">{value}</p>
  </div>
);

export default InvestorDashboard;
