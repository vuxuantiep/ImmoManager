
import React, { useState } from 'react';
import { Handyman } from '../types';

interface HandymanContactsProps {
  handymen: Handyman[];
  setHandymen: React.Dispatch<React.SetStateAction<Handyman[]>>;
}

const HandymanContacts: React.FC<HandymanContactsProps> = ({ handymen, setHandymen }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newH, setNewH] = useState({ name: '', trade: '', phone: '', email: '' });

  const addHandyman = () => {
    if (!newH.name || !newH.trade) return;
    setHandymen([...handymen, { id: Date.now().toString(), ...newH }]);
    setShowAdd(false);
    setNewH({ name: '', trade: '', phone: '', email: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Handwerker & Partner</h2>
        <button onClick={() => setShowAdd(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center">
          <i className="fa-solid fa-plus mr-2"></i> Kontakt hinzufügen
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input className="border p-2 rounded-lg" placeholder="Name / Firma" value={newH.name} onChange={e => setNewH({...newH, name: e.target.value})} />
            <input className="border p-2 rounded-lg" placeholder="Gewerk (z.B. Elektriker)" value={newH.trade} onChange={e => setNewH({...newH, trade: e.target.value})} />
            <input className="border p-2 rounded-lg" placeholder="Telefon" value={newH.phone} onChange={e => setNewH({...newH, phone: e.target.value})} />
            <input className="border p-2 rounded-lg" placeholder="E-Mail" value={newH.email} onChange={e => setNewH({...newH, email: e.target.value})} />
          </div>
          <div className="mt-4 flex space-x-3">
            <button onClick={addHandyman} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">Speichern</button>
            <button onClick={() => setShowAdd(false)} className="text-slate-500">Abbrechen</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {handymen.map(h => (
          <div key={h.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-slate-100 p-3 rounded-xl text-slate-600">
                <i className="fa-solid fa-hammer text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{h.name}</h3>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{h.trade}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-slate-600">
                <i className="fa-solid fa-phone w-6 text-slate-400"></i>
                <span>{h.phone}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <i className="fa-solid fa-envelope w-6 text-slate-400"></i>
                <span className="truncate">{h.email}</span>
              </div>
            </div>
            <div className="mt-6 flex space-x-2">
              <a href={`tel:${h.phone}`} className="flex-1 bg-slate-50 text-center py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">Anrufen</a>
              <button className="p-2 text-slate-400 hover:text-red-500 transition">
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HandymanContacts;
