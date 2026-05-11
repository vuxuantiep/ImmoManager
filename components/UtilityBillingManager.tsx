import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Property, Tenant, Transaction } from '../types';
import { FileText, Download } from 'lucide-react';

interface UtilityBillingProps {
  property: Property;
  tenants: Tenant[];
  transactions: Transaction[];
  ownerDetails: any;
}

export const UtilityBillingManager: React.FC<UtilityBillingProps> = ({ property, tenants, transactions, ownerDetails }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
  const [billingCost, setBillingCost] = useState(0);

  // Einfache Nebenkostenberechnung nach m2
  const calculateBilling = (tenant: Tenant) => {
    const propertyTransactions = transactions.filter(t => t.propertyId === property.id && t.date.startsWith(selectedYear.toString()));
    
    // Sum operations like Wasser, Heizung, Müllabfuhr
    const totalUtilityCosts = propertyTransactions
      .filter(t => ['Wasser', 'Heizung', 'Müllabfuhr', 'Grundsteuer', 'Versicherung'].includes(t.category))
      .reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);
      
    // Gesamtwohnfläche
    const totalArea = property.units.reduce((sum, u) => sum + u.size, 0);
    const tenantUnit = property.units.find(u => u.id === tenant.unitId);
    
    if (!tenantUnit || totalArea === 0) return { totalCosts: 0, tenantShare: 0, prepayments: 0, balance: 0 };
    
    const tenantShare = (totalUtilityCosts / totalArea) * tenantUnit.size;
    
    // Geleistete Vorauszahlungen (z.B. monatlich * 12)
    const prepayments = tenantUnit.utilityPrepayment * 12; 
    
    const balance = tenantShare - prepayments;
    
    return {
      totalCosts: totalUtilityCosts,
      tenantShare,
      prepayments,
      balance
    };
  };

  const generatePDF = (tenant: Tenant, calc: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text('Betriebskostenabrechnung', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Abrechnungsjahr: ${selectedYear}`, 14, 28);
    
    // Absender / Vermieter
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Vermieter: ${ownerDetails?.name || 'Vermieter GmbH'}`, 140, 20);
    doc.text(`${ownerDetails?.address || 'Musterstr. 1'}`, 140, 25);
    doc.text(`${ownerDetails?.zip || '12345'} ${ownerDetails?.city || 'Musterstadt'}`, 140, 30);
    
    // Mieter
    doc.text(`Mieter:`, 14, 45);
    doc.setFontSize(12);
    doc.text(`${tenant.name}`, 14, 52);
    const unit = property.units.find(u => u.id === tenant.unitId);
    doc.setFontSize(10);
    doc.text(`Objekt: ${property.name}, Einheit ${unit?.number}`, 14, 58);
    
    // Tabelle 1: Verteilungsschlüssel
    doc.text('Berechnungsgrundlage:', 14, 75);
    autoTable(doc, {
        startY: 80,
        head: [['Kostenart', 'Gesamtkosten', 'Umlageschlüssel', 'Ihr Anteil']],
        body: [
            ['Heizung & Warmwasser', `${(calc.totalCosts * 0.6).toFixed(2)} EUR`, `${unit?.size} m2 von gesamt`, `${(calc.tenantShare * 0.6).toFixed(2)} EUR`],
            ['Kalte Betriebskosten', `${(calc.totalCosts * 0.4).toFixed(2)} EUR`, `${unit?.size} m2 von gesamt`, `${(calc.tenantShare * 0.4).toFixed(2)} EUR`],
        ],
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
    
    doc.save(`Betriebskostenabrechnung_${selectedYear}_${tenant.name.replace(' ', '_')}.pdf`);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Automatisierte Betriebskostenabrechnung</h2>
      </div>
      
      <div className="mb-6 flex gap-4 items-center">
          <label className="text-sm font-semibold text-slate-600">Abrechnungsjahr:</label>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="border-slate-200 rounded-xl bg-slate-50 focus:ring-green-500"
          >
              <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
          </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b-2 border-slate-100 text-sm font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4">Mieter</th>
                    <th className="py-4">Einheit</th>
                    <th className="py-4">Anteil</th>
                    <th className="py-4">Vorauszahlung</th>
                    <th className="py-4">Saldo</th>
                    <th className="py-4 text-right">Aktion</th>
                </tr>
            </thead>
            <tbody>
                {tenants.map(tenant => {
                    const unit = property.units.find(u => u.id === tenant.unitId);
                    const calc = calculateBilling(tenant);
                    return (
                        <tr key={tenant.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-4 font-semibold text-slate-800">{tenant.name}</td>
                            <td className="py-4 text-slate-600">{unit?.number}</td>
                            <td className="py-4 text-slate-600">{calc.tenantShare.toFixed(2)} €</td>
                            <td className="py-4 text-slate-600">{calc.prepayments.toFixed(2)} €</td>
                            <td className={`py-4 font-bold ${calc.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {calc.balance > 0 ? '+' : ''}{calc.balance.toFixed(2)} €
                            </td>
                            <td className="py-4 text-right">
                                <button 
                                  onClick={() => generatePDF(tenant, calc)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-green-600 hover:text-white text-slate-600 rounded-lg font-medium transition"
                                >
                                  <Download className="w-4 h-4" /> PDF Erstellen
                                </button>
                            </td>
                        </tr>
                    );
                })}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">Keine Mieter in diesem Objekt gefunden.</td>
                  </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};
