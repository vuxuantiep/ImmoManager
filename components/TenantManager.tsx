
import React, { useState } from 'react';
import { Tenant, Property, Transaction } from '../types';
import { generateTenantFinancialEmail } from '../services/geminiService';

interface TenantManagerProps {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  properties: Property[];
  transactions: Transaction[];
}

const TenantManager: React.FC<TenantManagerProps> = ({ tenants, setTenants, properties, transactions }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newTenant, setNewTenant] = useState({ firstName: '', lastName: '', email: '', phone: '', startDate: '' });
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [mailDraft, setMailDraft] = useState<{ text: string, tenant: Tenant } | null>(null);

  const addTenant = () => {
    if (!newTenant.firstName || !newTenant.lastName) return;
    setTenants([...tenants, { id: 't' + Date.now(), ...newTenant }]);
    setShowAdd(false);
    setNewTenant({ firstName: '', lastName: '', email: '', phone: '', startDate: '' });
  };

  const handleGenerateFinancialEmail = async (tenant: Tenant, topic: 'rent_adjustment' | 'utility_payment') => {
    const property = properties.find(p => p.units.some(u => u.tenantId === tenant.id));
    if (!property) return alert("Dieser Mieter ist keinem Objekt zugewiesen.");

    setIsGenerating(tenant.id);
    const tenantTransactions = transactions.filter(t => 
      t.propertyId === property.id && 
      property.units.find(u => u.tenantId === tenant.id)?.id === t.unitId
    );

    const draft = await generateTenantFinancialEmail(tenant, property, tenantTransactions, topic);
    setMailDraft({ text: draft, tenant });
    setIsGenerating(null);
  };

  const openInMailClient = () => {
    if (!mailDraft) return;
    const lines = mailDraft.text.split('\n');
    const subject = lines.find(l => l.toLowerCase().startsWith('betreff:'))?.replace(/betreff:/i, '').trim() || 'Information zu Ihrem Mietverhältnis';
    const body = mailDraft.text;
    window.location.href = `mailto:${mailDraft.tenant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Mieterübersicht</h2>
        <button onClick={() => setShowAdd(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center text-sm md:text-base hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
          <i className="fa-solid fa-user-plus mr-2"></i> Neu
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Vorname" value={newTenant.firstName} onChange={e => setNewTenant({...newTenant, firstName: e.target.value})} />
            <input className="border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nachname" value={newTenant.lastName} onChange={e => setNewTenant({...newTenant, lastName: e.target.value})} />
            <input className="border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="E-Mail" value={newTenant.email} onChange={e => setNewTenant({...newTenant, email: e.target.value})} />
            <input className="border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Telefon" value={newTenant.phone} onChange={e => setNewTenant({...newTenant, phone: e.target.value})} />
            <input type="date" className="border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={newTenant.startDate} onChange={e => setNewTenant({...newTenant, startDate: e.target.value})} />
          </div>
          <div className="mt-4 flex space-x-3">
            <button onClick={addTenant} className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">Hinzufügen</button>
            <button onClick={() => setShowAdd(false)} className="px-4 text-slate-500 font-bold hover:text-slate-800 transition">Abbrechen</button>
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {tenants.map(t => {
          const assignedProperty = properties.find(p => p.units.some(u => u.tenantId === t.id));
          const assignedUnit = assignedProperty?.units.find(u => u.tenantId === t.id);

          return (
            <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-lg">
                  {t.firstName[0]}{t.lastName[0]}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">{t.firstName} {t.lastName}</h4>
                  <p className="text-xs text-slate-400 uppercase font-black tracking-widest">Einzug: {t.startDate}</p>
                </div>
                <div className="flex space-x-1">
                   <button 
                     onClick={() => handleGenerateFinancialEmail(t, 'utility_payment')}
                     disabled={isGenerating === t.id}
                     className="p-2 text-indigo-500 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                     title="Nebenkosten E-Mail"
                   >
                     {isGenerating === t.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-faucet-drip"></i>}
                   </button>
                   <button 
                     onClick={() => handleGenerateFinancialEmail(t, 'rent_adjustment')}
                     disabled={isGenerating === t.id}
                     className="p-2 text-emerald-500 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition"
                     title="Mietanpassung E-Mail"
                   >
                     {isGenerating === t.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-euro-sign"></i>}
                   </button>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                <div className="flex space-x-2">
                  <a href={`tel:${t.phone}`} className="p-2 bg-slate-50 rounded-lg text-slate-500 hover:bg-slate-100"><i className="fa-solid fa-phone"></i></a>
                  <a href={`mailto:${t.email}`} className="p-2 bg-slate-50 rounded-lg text-slate-500 hover:bg-slate-100"><i className="fa-solid fa-envelope"></i></a>
                </div>
                {assignedUnit ? (
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wohnung</p>
                    <p className="text-xs font-bold text-indigo-600">{assignedUnit.number}</p>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-widest">Keine Zuweisung</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-5">Name</th>
              <th className="px-6 py-5">Kontakt</th>
              <th className="px-6 py-5">Einzug</th>
              <th className="px-6 py-5">Wohnung</th>
              <th className="px-6 py-5 text-right">KI E-Mail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map(t => {
              const assignedProperty = properties.find(p => p.units.some(u => u.tenantId === t.id));
              const assignedUnit = assignedProperty?.units.find(u => u.tenantId === t.id);

              return (
                <tr key={t.id} className="hover:bg-slate-50 transition group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition">
                        {t.firstName[0]}{t.lastName[0]}
                      </div>
                      <span className="font-bold text-slate-800">{t.firstName} {t.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <p className="font-medium">{t.email}</p>
                    <p className="text-xs text-slate-400">{t.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                    {t.startDate}
                  </td>
                  <td className="px-6 py-4">
                    {assignedUnit ? (
                      <div>
                        <p className="text-sm font-bold text-slate-700">{assignedProperty?.name}</p>
                        <p className="text-xs text-slate-400 font-medium tracking-wide">{assignedUnit.number}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-black uppercase tracking-widest">Nicht zugewiesen</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                       <button 
                         onClick={() => handleGenerateFinancialEmail(t, 'utility_payment')}
                         disabled={isGenerating === t.id}
                         className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition disabled:opacity-50"
                       >
                         {isGenerating === t.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-faucet-drip"></i>}
                         <span>Nebenkosten</span>
                       </button>
                       <button 
                         onClick={() => handleGenerateFinancialEmail(t, 'rent_adjustment')}
                         disabled={isGenerating === t.id}
                         className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition disabled:opacity-50"
                       >
                         {isGenerating === t.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-euro-sign"></i>}
                         <span>Miete</span>
                       </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Email Draft Modal */}
      {mailDraft && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
              <div>
                <h3 className="font-bold text-xl">KI E-Mail Entwurf</h3>
                <p className="text-xs text-indigo-100 opacity-80 uppercase tracking-widest font-black mt-1">An Mieter: {mailDraft.tenant.firstName} {mailDraft.tenant.lastName}</p>
              </div>
              <button onClick={() => setMailDraft(null)} className="p-2 hover:bg-white/10 rounded-full transition">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="p-8">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-700 max-h-[400px] overflow-y-auto shadow-inner">
                {mailDraft.text}
              </div>
              <div className="mt-8 flex space-x-3">
                <button 
                  onClick={openInMailClient}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition active:scale-95"
                >
                  <i className="fa-solid fa-paper-plane mr-2"></i> In Mail-Client öffnen
                </button>
                <button 
                  onClick={() => setMailDraft(null)}
                  className="px-6 py-4 text-slate-500 font-bold hover:text-slate-800 transition"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManager;
