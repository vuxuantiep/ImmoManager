
import React, { useState } from 'react';
import { Handyman, Owner, Stakeholder, Tenant } from '../types';

interface ContactManagerProps {
  handymen: Handyman[];
  setHandymen: React.Dispatch<React.SetStateAction<Handyman[]>>;
  owners: Owner[];
  setOwners: React.Dispatch<React.SetStateAction<Owner[]>>;
  stakeholders: Stakeholder[];
  setStakeholders: React.Dispatch<React.SetStateAction<Stakeholder[]>>;
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
}

type ContactTab = 'handymen' | 'owners' | 'stakeholders' | 'tenants';

const ContactManager: React.FC<ContactManagerProps> = ({ 
  handymen, setHandymen, 
  owners, setOwners, 
  stakeholders, setStakeholders,
  tenants, setTenants
}) => {
  const [activeTab, setActiveTab] = useState<ContactTab>('handymen');
  const [showAdd, setShowAdd] = useState(false);
  
  // Generic state for new contacts
  const [formData, setFormData] = useState<any>({});

  const handleAdd = () => {
    const id = Date.now().toString();
    if (activeTab === 'handymen') {
      if (!formData.name || !formData.trade) return;
      setHandymen([...handymen, { id, ...formData }]);
    } else if (activeTab === 'owners') {
      if (!formData.name || !formData.email) return;
      setOwners([...owners, { id, ...formData }]);
    } else if (activeTab === 'stakeholders') {
      if (!formData.name || !formData.role) return;
      setStakeholders([...stakeholders, { id, ...formData }]);
    } else if (activeTab === 'tenants') {
      if (!formData.firstName || !formData.lastName) return;
      setTenants([...tenants, { id: 't' + id, ...formData }]);
    }
    setShowAdd(false);
    setFormData({});
  };

  const removeContact = (id: string) => {
    if (activeTab === 'handymen') setHandymen(handymen.filter(h => h.id !== id));
    if (activeTab === 'owners') setOwners(owners.filter(o => o.id !== id));
    if (activeTab === 'stakeholders') setStakeholders(stakeholders.filter(s => s.id !== id));
    if (activeTab === 'tenants') setTenants(tenants.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 overflow-x-auto scrollbar-hide">
          <TabButton active={activeTab === 'handymen'} onClick={() => { setActiveTab('handymen'); setShowAdd(false); }}>
            <i className="fa-solid fa-screwdriver-wrench mr-2"></i> Handwerker
          </TabButton>
          <TabButton active={activeTab === 'tenants'} onClick={() => { setActiveTab('tenants'); setShowAdd(false); }}>
            <i className="fa-solid fa-people-roof mr-2"></i> Mieter
          </TabButton>
          <TabButton active={activeTab === 'owners'} onClick={() => { setActiveTab('owners'); setShowAdd(false); }}>
            <i className="fa-solid fa-user-tie mr-2"></i> Vermieter
          </TabButton>
          <TabButton active={activeTab === 'stakeholders'} onClick={() => { setActiveTab('stakeholders'); setShowAdd(false); }}>
            <i className="fa-solid fa-briefcase mr-2"></i> Stakeholder
          </TabButton>
        </div>
        <button 
          onClick={() => { setShowAdd(true); setFormData({}); }} 
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
        >
          <i className="fa-solid fa-plus mr-2"></i> Neu
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="font-bold text-lg mb-4 text-slate-800">
            {activeTab === 'handymen' ? 'Handwerker' : activeTab === 'owners' ? 'Vermieter' : activeTab === 'tenants' ? 'Mieter' : 'Stakeholder'} hinzufügen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTab === 'tenants' ? (
              <>
                <InputField label="Vorname" value={formData.firstName || ''} onChange={v => setFormData({...formData, firstName: v})} />
                <InputField label="Nachname" value={formData.lastName || ''} onChange={v => setFormData({...formData, lastName: v})} />
                <InputField label="Einzugsdatum" type="date" value={formData.startDate || ''} onChange={v => setFormData({...formData, startDate: v})} />
              </>
            ) : (
              <InputField label="Name / Firma" value={formData.name || ''} onChange={v => setFormData({...formData, name: v})} />
            )}
            
            {activeTab === 'handymen' && <InputField label="Gewerk" value={formData.trade || ''} onChange={v => setFormData({...formData, trade: v})} />}
            {activeTab === 'owners' && <InputField label="Steuernummer" value={formData.taxId || ''} onChange={v => setFormData({...formData, taxId: v})} />}
            {activeTab === 'stakeholders' && <InputField label="Rolle (z.B. Versicherung)" value={formData.role || ''} onChange={v => setFormData({...formData, role: v})} />}
            
            <InputField label="Telefon" value={formData.phone || ''} onChange={v => setFormData({...formData, phone: v})} />
            <InputField label="E-Mail" value={formData.email || ''} onChange={v => setFormData({...formData, email: v})} />
            
            {activeTab !== 'tenants' && <InputField label="Adresse" value={formData.address || ''} onChange={v => setFormData({...formData, address: v})} />}
            
            {activeTab === 'stakeholders' && (
              <div className="md:col-span-full">
                <InputField label="Notiz" value={formData.note || ''} onChange={v => setFormData({...formData, note: v})} />
              </div>
            )}
          </div>
          <div className="mt-6 flex space-x-3">
            <button onClick={handleAdd} className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">Speichern</button>
            <button onClick={() => setShowAdd(false)} className="px-4 text-slate-500 font-bold">Abbrechen</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'handymen' && handymen.map(h => (
          <ContactCard key={h.id} title={h.name} subtitle={h.trade} phone={h.phone} email={h.email} icon="fa-hammer" onRemove={() => removeContact(h.id)} />
        ))}
        {activeTab === 'tenants' && tenants.map(t => (
          <ContactCard 
            key={t.id} 
            title={`${t.firstName} ${t.lastName}`} 
            subtitle={`Mieter seit ${t.startDate}`} 
            phone={t.phone} 
            email={t.email} 
            icon="fa-person-shelter" 
            onRemove={() => removeContact(t.id)} 
          />
        ))}
        {activeTab === 'owners' && owners.map(o => (
          <ContactCard key={o.id} title={o.name} subtitle={o.taxId ? `Steuer: ${o.taxId}` : 'Vermieter'} phone={o.phone} email={o.email} icon="fa-user-tie" onRemove={() => removeContact(o.id)} />
        ))}
        {activeTab === 'stakeholders' && stakeholders.map(s => (
          <ContactCard key={s.id} title={s.name} subtitle={s.role} phone={s.phone} email={s.email} icon="fa-briefcase" onRemove={() => removeContact(s.id)} note={s.note} />
        ))}
        
        {((activeTab === 'handymen' && handymen.length === 0) ||
          (activeTab === 'tenants' && tenants.length === 0) ||
          (activeTab === 'owners' && owners.length === 0) ||
          (activeTab === 'stakeholders' && stakeholders.length === 0)) && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <i className={`fa-solid ${activeTab === 'handymen' ? 'fa-hammer' : activeTab === 'tenants' ? 'fa-people-roof' : activeTab === 'owners' ? 'fa-user-tie' : 'fa-briefcase'} text-4xl mb-3 opacity-20`}></i>
            <p className="text-sm">Keine Einträge in dieser Kategorie gefunden.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
  >
    {children}
  </button>
);

const InputField: React.FC<{ label: string, value: string, onChange: (v: string) => void, type?: string }> = ({ label, value, onChange, type = "text" }) => (
  <div className="flex flex-col space-y-1">
    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{label}</label>
    <input 
      type={type}
      className="border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
      value={value} 
      onChange={e => onChange(e.target.value)} 
    />
  </div>
);

const ContactCard: React.FC<{ title: string, subtitle: string, phone: string, email: string, icon: string, onRemove: () => void, note?: string }> = ({ title, subtitle, phone, email, icon, onRemove, note }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative group hover:shadow-md transition overflow-hidden">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="bg-slate-100 p-3 rounded-xl text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
          <i className={`fa-solid ${icon} text-lg`}></i>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 leading-tight">{title}</h3>
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{subtitle}</span>
        </div>
      </div>
      <button onClick={onRemove} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
        <i className="fa-solid fa-trash-can text-sm"></i>
      </button>
    </div>
    
    <div className="space-y-2 mb-4">
      <a href={`tel:${phone}`} className="flex items-center text-sm text-slate-600 hover:text-indigo-600 transition">
        <i className="fa-solid fa-phone w-6 text-slate-300"></i>
        <span>{phone || 'Keine Nummer'}</span>
      </a>
      <a href={`mailto:${email}`} className="flex items-center text-sm text-slate-600 hover:text-indigo-600 transition">
        <i className="fa-solid fa-envelope w-6 text-slate-300"></i>
        <span className="truncate">{email || 'Keine E-Mail'}</span>
      </a>
    </div>

    {note && (
      <div className="mt-4 p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500 italic">
        {note}
      </div>
    )}

    <div className="mt-4 pt-4 border-t border-slate-50 flex space-x-2">
      <a href={`tel:${phone}`} className="flex-1 bg-indigo-50 text-indigo-700 text-center py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition">Anrufen</a>
      <a href={`mailto:${email}`} className="flex-1 bg-slate-50 text-slate-700 text-center py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition">Email</a>
    </div>
  </div>
);

export default ContactManager;
