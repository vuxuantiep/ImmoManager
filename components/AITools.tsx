
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Property, Tenant, Transaction, TransactionType, MeterType, MarketData, MeterReading } from '../types';
import { generateTenantLetter, generateExpose, generateUtilityStatementLetter, extractMeterData, fetchMarketAnalysis, generateEnergyConsultation, generateSubsidyAdvice } from '../services/geminiService';

interface AIToolsProps {
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  tenants: Tenant[];
  transactions: Transaction[];
  initialPropertyId?: string;
  initialTab?: string;
}

const AITools: React.FC<AIToolsProps> = ({ properties, setProperties, tenants, transactions, initialPropertyId, initialTab }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState<'letter' | 'expose' | 'utility' | 'portals' | 'meters' | 'market' | 'energy'>('letter');
  const [marketAnalysis, setMarketAnalysis] = useState<MarketData | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  // Energy specific states
  const [energyInfo, setEnergyInfo] = useState({
    yearBuilt: '',
    heatingType: 'Gasheizung',
    insulation: 'Standard / Teilsaniert'
  });

  // Measures for subsidy advisor
  const [measures, setMeasures] = useState<string[]>([]);
  const toggleMeasure = (m: string) => setMeasures(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  useEffect(() => {
    if (initialPropertyId) setSelectedPropertyId(initialPropertyId);
    if (initialTab) setActiveTab(initialTab as any);
  }, [initialPropertyId, initialTab]);

  const handleEnergyConsult = async () => {
    const property = properties.find(p => p.id === selectedPropertyId);
    if (!property) return alert('Bitte Objekt wählen.');
    setLoading(true);
    const advice = await generateEnergyConsultation(property, energyInfo);
    setResult(advice);
    setLoading(false);
  };

  const handleSubsidyAdvisor = async () => {
    const property = properties.find(p => p.id === selectedPropertyId);
    if (!property || measures.length === 0) return alert('Wählen Sie ein Objekt und mindestens eine Maßnahme.');
    setLoading(true);
    const advice = await generateSubsidyAdvice(property, measures);
    setResult(advice);
    setLoading(false);
  };

  const handleMarketCheck = async () => {
    const property = properties.find(p => p.id === selectedPropertyId);
    if (!property) return alert('Bitte Objekt wählen.');
    setLoading(true);
    setMarketAnalysis(null);
    const data = await fetchMarketAnalysis(property);
    setMarketAnalysis(data);
    setLoading(false);
  };

  const tabs = [
    { id: 'letter', label: 'Brief', icon: 'fa-envelope' },
    { id: 'expose', label: 'Exposé', icon: 'fa-file-pdf' },
    { id: 'market', label: 'Markt', icon: 'fa-earth-europe' },
    { id: 'energy', label: 'Energie & Förder', icon: 'fa-leaf' },
    { id: 'meters', label: 'Zähler', icon: 'fa-gauge' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 mb-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setResult(''); setMarketAnalysis(null); }}
              className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-xs font-bold transition uppercase tracking-wider flex items-center justify-center space-x-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'energy' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                  <i className="fa-solid fa-solar-panel text-xl"></i>
                </div>
                <h3 className="text-lg font-bold">Energetische Analyse</h3>
              </div>
              <div className="space-y-4">
                <select 
                  className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  value={selectedPropertyId}
                  onChange={e => setSelectedPropertyId(e.target.value)}
                >
                  <option value="">Objekt wählen...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Baujahr (ca.)</label>
                    <input type="text" className="w-full border p-2.5 rounded-xl font-bold text-sm" placeholder="z.B. 1985" value={energyInfo.yearBuilt} onChange={e => setEnergyInfo({...energyInfo, yearBuilt: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Heizung</label>
                    <select className="w-full border p-2.5 rounded-xl font-bold text-sm" value={energyInfo.heatingType} onChange={e => setEnergyInfo({...energyInfo, heatingType: e.target.value})}>
                      <option>Gasheizung</option><option>Ölheizung</option><option>Fernwärme</option><option>Nachtspeicher</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleEnergyConsult} disabled={loading || !selectedPropertyId} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition">Energie-Strategie berechnen</button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <i className="fa-solid fa-landmark text-xl"></i>
                </div>
                <h3 className="text-lg font-bold">Förder-Berater</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Wählen Sie geplante Maßnahmen für KfW/BAFA Analyse:</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['Wärmepumpe', 'Solar / PV', 'Fenstertausch', 'Dachdämmung', 'Fassadendämmung', 'Lüftungsanlage'].map(m => (
                  <button 
                    key={m}
                    onClick={() => toggleMeasure(m)}
                    className={`text-[10px] font-bold p-2 rounded-lg border transition ${measures.includes(m) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button onClick={handleSubsidyAdvisor} disabled={loading || !selectedPropertyId || measures.length === 0} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">Fördermittel-Check starten</button>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-violet-100 text-violet-600 p-2 rounded-lg">
                <i className="fa-solid fa-magnifying-glass-chart text-xl"></i>
              </div>
              <h3 className="text-lg font-bold">Live Marktanalyse</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Analysieren Sie aktuelle Miet- und Verkaufspreise auf Basis von Echtdaten führender Portale.</p>
              <select className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 font-bold" value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}>
                <option value="">Objekt wählen...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={handleMarketCheck} disabled={loading || !selectedPropertyId} className="w-full bg-violet-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-violet-700 transition">
                {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-earth-europe mr-2"></i>} Analyse starten
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
        <h3 className="text-lg font-bold mb-4 border-b pb-2">Vorschau & Beratung</h3>
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <i className="fa-solid fa-wand-sparkles fa-spin text-4xl mb-2 text-indigo-400"></i>
            <p className="font-bold animate-pulse text-xs uppercase">KI erstellt Experten-Bericht...</p>
          </div>
        ) : marketAnalysis ? (
           <div className="flex-1 overflow-y-auto space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Ø Miete / m²</p>
                  <p className="text-2xl font-black text-emerald-600">{marketAnalysis.averageRentPerM2.toFixed(2)}€</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Ø Verkauf / m²</p>
                  <p className="text-2xl font-black text-blue-600">{marketAnalysis.averageSalePerM2.toLocaleString()}€</p>
                </div>
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm leading-relaxed text-slate-700 italic">
               {marketAnalysis.summary}
             </div>
           </div>
        ) : result ? (
          <div className="flex-1 overflow-y-auto prose prose-slate max-w-none text-sm leading-relaxed p-4 bg-slate-50 rounded-xl border">
            <div className="whitespace-pre-wrap">{result}</div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 italic">
            <i className="fa-solid fa-robot text-5xl mb-6 opacity-20"></i>
            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Warten auf Eingabe</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITools;
