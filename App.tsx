
import React, { useState } from 'react';
import { View, Property, Tenant, Transaction, HouseType, Reminder, Owner, UnitType, TransactionType, SubscriptionTier, User } from './types.ts';
import Sidebar from './Sidebar.tsx';
import Dashboard from './Dashboard.tsx';
import PropertiesList from './PropertiesList.tsx';
import TenantManager from './TenantManager.tsx';
import FinanceTracker from './FinanceTracker.tsx';
import ContactManager from './ContactManager.tsx';
import AITools from './AITools.tsx';
import InvestorDashboard from './InvestorDashboard.tsx';
import PropertyEditor from './PropertyEditor.tsx';
import AIFeedbackAssistant from './AIFeedbackAssistant.tsx';

const initialOwners: Owner[] = [
  { id: 'o1', name: 'Vu Xuan Tiep', email: 'vuxuantiep@gmail.com', phone: '0123', address: 'Heimweg 1', zip: '10115', city: 'Berlin' }
];

const initialProperties: Property[] = [
  {
    id: 'p1',
    name: 'Mein Erstobjekt',
    type: HouseType.CONDO,
    address: 'Kurfürstendamm 100, 10709 Berlin',
    ownerId: 'o1',
    units: [{ id: 'u1', number: '1A', type: UnitType.RESIDENTIAL, size: 45, baseRent: 500, utilityPrepayment: 120 }]
  }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [owners, setOwners] = useState<Owner[]>(initialOwners);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [showImpressum, setShowImpressum] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const setView = (v: View, params: any = null) => {
    setCurrentView(v);
    setViewParams(params);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateProperty = (updated: Property, updatedTransactions?: Transaction[]) => {
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (updatedTransactions) {
      setTransactions(prev => {
        const otherTransactions = prev.filter(t => t.propertyId !== updated.id);
        return [...otherTransactions, ...updatedTransactions.filter(t => t.propertyId === updated.id)];
      });
    }
    setEditingPropertyId(null);
  };

  const checkLimit = (type: 'property' | 'owner') => {
    if (!currentUser) {
      setShowAuthModal(true);
      return false;
    }
    if (currentUser.tier === SubscriptionTier.FREE) {
      if (type === 'property' && properties.length >= 1) {
        setShowPricing(true);
        return false;
      }
    }
    return true;
  };

  const upgradeTier = (tier: SubscriptionTier) => {
    if (!currentUser) return setShowAuthModal(true);
    setCurrentUser(prev => prev ? { ...prev, tier } : null);
    setShowPricing(false);
  };

  const currentEditingProperty = properties.find(p => p.id === editingPropertyId);

  return (
    <div className="flex min-h-screen bg-[#fcfdfe] overflow-hidden font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 z-50 transition-transform duration-500 ease-in-out h-full`}>
        <Sidebar currentView={currentView} setView={setView} userTier={currentUser?.tier || SubscriptionTier.FREE} onUpgrade={() => setShowPricing(true)} onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full relative">
        <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center z-30 shrink-0">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition">
              <i className="fa-solid fa-bars-staggered text-xl"></i>
            </button>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">ImmoTiep <span className="text-indigo-600">.</span></h1>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => currentUser ? setShowUserMenu(!showUserMenu) : setShowAuthModal(true)} 
              className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
            >
               <i className="fa-solid fa-user"></i>
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-10 w-full max-w-7xl mx-auto">
          {currentView === 'dashboard' && (
            <Dashboard 
              properties={properties} tenants={tenants} transactions={transactions} 
              reminders={reminders} setReminders={setReminders} setView={setView} 
              onEditProperty={setEditingPropertyId}
            />
          )}
          {currentView === 'properties' && (
            <PropertiesList properties={properties} setProperties={setProperties} setView={setView} onEditProperty={setEditingPropertyId} onCheckLimit={() => checkLimit('property')} />
          )}
          {currentView === 'tenants' && (
            <TenantManager tenants={tenants} setTenants={setTenants} properties={properties} transactions={transactions} />
          )}
          {currentView === 'finances' && (
            <FinanceTracker transactions={transactions} addTransaction={(t) => setTransactions(prev => [...prev, t])} properties={properties} tenants={tenants} owners={owners} />
          )}
          {currentView === 'contacts' && (
            <ContactManager handymen={[]} setHandymen={() => {}} owners={owners} setOwners={setOwners} stakeholders={[]} setStakeholders={() => {}} tenants={tenants} setTenants={setTenants} onCheckLimit={() => checkLimit('owner')} />
          )}
          {currentView === 'tools' && (
            <AITools properties={properties} setProperties={setProperties} tenants={tenants} transactions={transactions} initialPropertyId={viewParams?.propertyId} initialTab={viewParams?.tab} />
          )}
          {currentView === 'investor' && (
            <InvestorDashboard properties={properties} transactions={transactions} setProperties={setProperties} />
          )}

          <footer className="mt-20 pt-10 pb-10 border-t border-slate-100 text-slate-400">
            <div className="flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] gap-6">
              <p>© {new Date().getFullYear()} Vu Xuan Tiep</p>
              <div className="flex gap-8">
                <button onClick={() => setShowImpressum(true)} className="hover:text-indigo-600 transition">Impressum</button>
                <a href="https://itiep.de" target="_blank" className="hover:text-indigo-600 transition">Portfolio</a>
                <a href="mailto:vuxuantiep@gmail.com" className="hover:text-indigo-600 transition">Support</a>
              </div>
            </div>
          </footer>
        </div>
      </main>

      <AIFeedbackAssistant />

      {/* Pricing / Upgrade Modal */}
      {showPricing && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="bg-indigo-600 p-10 text-white text-center">
               <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Upgrade dein Business</h3>
               <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs">Wähle dein ImmoTiep Paket</p>
            </div>
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="p-8 rounded-[2.5rem] border-2 border-slate-100 flex flex-col items-center text-center">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Free</h4>
                  <p className="text-4xl font-black mt-4 text-slate-900">0 €</p>
                  <ul className="mt-8 space-y-3 text-xs font-bold text-slate-500 flex-1">
                    <li>1 Immobilie</li>
                    <li>Basis KI-Briefe</li>
                  </ul>
                  <button disabled className="w-full mt-10 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase">Aktueller Plan</button>
               </div>
               <div className="p-8 rounded-[2.5rem] border-2 border-indigo-600 bg-indigo-50/30 flex flex-col items-center text-center shadow-xl">
                  <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Enterprise</h4>
                  <p className="text-4xl font-black mt-4 text-slate-900">99 € <span className="text-sm text-slate-400">/ Jahr</span></p>
                  <ul className="mt-8 space-y-3 text-xs font-bold text-slate-700 flex-1">
                    <li>Unlimitierte Objekte</li>
                    <li>Pro KI Analyse & Suche</li>
                    <li>Hosting auf itpiep.de</li>
                  </ul>
                  <button onClick={() => upgradeTier(SubscriptionTier.ENTERPRISE)} className="w-full mt-10 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-indigo-200">Jetzt Upgrade</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {currentEditingProperty && (
        <PropertyEditor property={currentEditingProperty} tenants={tenants} owners={owners} templates={[]} transactions={transactions} onSave={handleUpdateProperty} onCancel={() => setEditingPropertyId(null)} />
      )}
    </div>
  );
};

export default App;
