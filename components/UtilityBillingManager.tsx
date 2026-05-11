import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Property, Tenant, Transaction, Owner } from '../types';
import { FileText, Download, Image as ImageIcon } from 'lucide-react';

interface UtilityBillingProps {
  property: Property;
  tenants: Tenant[];
  transactions: Transaction[];
  ownerDetails: Owner;
}

type AllocationKey = 'm2' | 'units' | 'persons';

export const UtilityBillingManager: React.FC<UtilityBillingProps> = ({ property, tenants, transactions, ownerDetails }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
  const [allocationKeys, setAllocationKeys] = useState<Record<string, AllocationKey>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setLogoUrl(event.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const calculateBilling = (tenant: Tenant) => {
    const propertyTransactions = transactions.filter(t => t.propertyId === property.id && t.date.startsWith(selectedYear.toString()));
    const utilityTransactions = propertyTransactions.filter(t => ['Wasser', 'Heizung', 'Müllabfuhr', 'Grundsteuer', 'Versicherung', 'Wasser/Abwasser', 'Heizung/Warmwasser'].includes(t.category));
      
    // Totals for allocation
    const totalArea = property.units.reduce((sum, u) => sum + u.size, 0);
    const totalUnits = property.units.length;
    const totalPersons = tenants.reduce((sum, t) => sum + (t.persons || 1), 0);

    const tenantUnit = property.units.find(u => u.id === tenant.unitId);
    
    if (!tenantUnit || totalArea === 0) return { totalCosts: 0, items: [], tenantShare: 0, prepayments: 0, balance: 0 };
    
    let tenantTotalShare = 0;
    const items = utilityTransactions.map(t => {
      const cost = t.amount < 0 ? Math.abs(t.amount) : t.amount;
      const keyType = allocationKeys[t.category] || 'm2';
      
      let share = 0;
      let basisString = '';
      if (keyType === 'm2') {
        share = (cost / totalArea) * tenantUnit.size;
        basisString = `${tenantUnit.size} m² von ${totalArea} m²`;
      } else if (keyType === 'units') {
        share = cost / totalUnits;
        basisString = `1 Wohneinheit von ${totalUnits}`;
      } else if (keyType === 'persons') {
        const persons = tenant.persons || 1;
        share = (cost / totalPersons) * persons;
        basisString = `${persons} Personen von ${totalPersons}`;
      }
      
      tenantTotalShare += share;
      return { category: t.category, total: cost, share, basisString };
    });
    
    // Geleistete Vorauszahlungen (z.B. monatlich * 12)
    const prepayments = tenantUnit.utilityPrepayment * 12; 
    const balance = tenantTotalShare - prepayments;
    
    return {
      totalCosts: items.reduce((s, i) => s + i.total, 0),
      items,
      tenantShare: tenantTotalShare,
      prepayments,
      balance
    };
  };

  const generatePDF = (tenant: Tenant, calc: ReturnType<typeof calculateBilling>) => {
    const doc = new jsPDF();
    
    // Header
    if (logoUrl) {
      // Trying to add the logo if available. Assuming standard sizing.
      try {
        doc.addImage(logoUrl, 'PNG', 140, 10, 40, 20, '', 'FAST');
      } catch (e) { console.error('Logo render error', e); }
    }

    doc.setFontSize(22);
    doc.text('Betriebskostenabrechnung', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Abrechnungsjahr: ${selectedYear}`, 14, 28);
    
    // Absender / Vermieter
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Vermieter: ${ownerDetails?.name || 'Vermieter GmbH'}`, 140, 35);
    doc.text(`${ownerDetails?.address || 'Musterstr. 1'}`, 140, 40);
    doc.text(`${ownerDetails?.zip || '12345'} ${ownerDetails?.city || 'Musterstadt'}`, 140, 45);
    
    // Mieter
    doc.text(`Mieter:`, 14, 45);
    doc.setFontSize(12);
    doc.text(`${tenant.firstName} ${tenant.lastName}`, 14, 52);
    const unit = property.units.find(u => u.id === tenant.unitId);
    doc.setFontSize(10);
    doc.text(`Objekt: ${property.address}, Einheit ${unit?.number}`, 14, 58);
    
    // Tabelle 1: Verteilungsschlüssel
    doc.text('Berechnungsgrundlage:', 14, 75);
    autoTable(doc, {
        startY: 80,
        head: [['Kostenart', 'Gesamtkosten', 'Umlageschlüssel', 'Ihr Anteil']],
        body: calc.items.map(item => [
            item.category, 
            `${item.total.toFixed(2)} EUR`, 
            item.basisString, 
            `${item.share.toFixed(2)} EUR`
        ]),
        foot: [['Summe', `${calc.totalCosts.toFixed(2)} EUR`, '', `${calc.tenantShare.toFixed(2)} EUR`]]
    });
    
    // Tabelle 2: Abrechnungsergebnis
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Abrechnungsergebnis:', 14, finalY);
    autoTable(doc, {
        startY: finalY + 5,
        head: [['Position', 'Betrag']],
        body: [
            ['Ihr Anteil an den Betriebskosten', `${calc.tenantShare.toFixed(2)} EUR`],
            ['Abzüglich geleistete Vorauszahlungen', `${calc.prepayments.toFixed(2)} EUR`]
        ],
        foot: [['Nachzahlung / (Guthaben)', `${calc.balance.toFixed(2)} EUR`]],
        theme: 'grid',
        footStyles: { fillColor: calc.balance > 0 ? [220, 53, 69] : [40, 167, 69], textColor: 255 }
    });
    
    // Footertext
    doc.setFontSize(10);
    doc.text(`Bitte überweisen Sie den Betrag von ${calc.balance.toFixed(2)} EUR bis zum 15.11.${selectedYear + 1}.`, 14, (doc as any).lastAutoTable.finalY + 20);
    
    doc.save(`Betriebskostenabrechnung_${selectedYear}_${tenant.lastName.replace(' ', '_')}.pdf`);
  };

  // Get distinct utility categories
  const propertyTransactions = transactions.filter(t => t.propertyId === property.id && t.date.startsWith(selectedYear.toString()));
  const utilityCategories = Array.from(new Set(propertyTransactions.filter(t => ['Wasser', 'Heizung', 'Müllabfuhr', 'Grundsteuer', 'Versicherung', 'Wasser/Abwasser', 'Heizung/Warmwasser'].includes(t.category)).map(t => t.category)));

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Nebenkosten & PDF-Export</h2>
        </div>
        <div className="flex gap-2">
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleLogoUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="flex justify-center items-center gap-2 border border-slate-200 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-semibold transition">
                <ImageIcon className="w-4 h-4"/> Vermieter-Logo
            </button>
        </div>
      </div>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-slate-600">Abrechnungsjahr:</label>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:ring-green-500 font-semibold text-slate-700"
            >
                <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            </select>
        </div>

        {utilityCategories.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
             <h4 className="text-xs font-bold uppercase text-slate-500">Umlageschlüssel anpassen</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {utilityCategories.map(cat => (
                 <div key={cat} className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded-xl">
                   <span className="text-xs font-semibold text-slate-700">{cat}</span>
                   <select 
                      className="text-xs border-none bg-slate-100 rounded-lg outline-none font-bold text-slate-600 focus:ring-0 cursor-pointer"
                      value={allocationKeys[cat] || 'm2'}
                      onChange={e => setAllocationKeys(prev => ({...prev, [cat]: e.target.value as AllocationKey}))}
                   >
                     <option value="m2">Fläche (m²)</option>
                     <option value="units">Einheiten</option>
                     <option value="persons">Personen</option>
                   </select>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-3xl border border-slate-100">
        <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50/50">
                <tr className="border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Mieter</th>
                    <th className="px-6 py-4">Einheit</th>
                    <th className="px-6 py-4">Personen</th>
                    <th className="px-6 py-4 text-right">Anteil</th>
                    <th className="px-6 py-4 text-right">Vorausz.</th>
                    <th className="px-6 py-4 text-right">Saldo</th>
                    <th className="px-6 py-4 text-right">Aktion</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {tenants.map(tenant => {
                    const unit = property.units.find(u => u.id === tenant.unitId);
                    const calc = calculateBilling(tenant);
                    return (
                        <tr key={tenant.id} className="hover:bg-slate-50/80 transition group">
                            <td className="px-6 py-4 font-bold text-slate-900">{tenant.firstName} {tenant.lastName}</td>
                            <td className="px-6 py-4 text-slate-600 font-medium">{unit?.number || '-'}</td>
                            <td className="px-6 py-4 text-slate-600 font-medium">{tenant.persons || 1}</td>
                            <td className="px-6 py-4 text-slate-600 font-bold text-right">{calc.tenantShare.toFixed(2)} €</td>
                            <td className="px-6 py-4 text-slate-600 font-bold text-right">{calc.prepayments.toFixed(2)} €</td>
                            <td className={`px-6 py-4 font-black text-right ${calc.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {calc.balance > 0 ? '+' : ''}{calc.balance.toFixed(2)} €
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => generatePDF(tenant, calc)}
                                  disabled={calc.totalCosts === 0}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl font-bold transition text-xs shadow-sm disabled:opacity-50"
                                >
                                  <Download className="w-4 h-4" /> PDF Export
                                </button>
                            </td>
                        </tr>
                    );
                })}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">Keine Mieter in diesem Objekt gefunden.</td>
                  </tr>
                )}
            </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-4">
        {tenants.map(tenant => {
          const unit = property.units.find(u => u.id === tenant.unitId);
          const calc = calculateBilling(tenant);
          return (
            <div key={tenant.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="font-bold text-slate-900">{tenant.firstName} {tenant.lastName}</span>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Einheit {unit?.number || '-'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px]">Anteil</span>
                  <span className="font-semibold text-slate-700">{calc.tenantShare.toFixed(2)} €</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px]">Vorausz.</span>
                  <span className="font-semibold text-slate-700">{calc.prepayments.toFixed(2)} €</span>
                </div>
                <div className="col-span-2 flex justify-between items-center bg-slate-50 p-2 rounded-lg mt-1">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Saldo</span>
                  <span className={`font-black text-sm ${calc.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {calc.balance > 0 ? 'Nachzahlung: +' : 'Guthaben: '}{calc.balance.toFixed(2)} €
                  </span>
                </div>
              </div>
              <button 
                onClick={() => generatePDF(tenant, calc)}
                disabled={calc.totalCosts === 0}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl font-bold transition text-xs shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> PDF Export
              </button>
            </div>
          );
        })}
        {tenants.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-medium bg-white rounded-2xl border border-slate-100">
            Keine Mieter in diesem Objekt gefunden.
          </div>
        )}
      </div>
    </div>
  );
};
