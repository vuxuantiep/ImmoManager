
import React, { useState } from 'react';
import { View, Property, Tenant, Transaction, Handyman, Owner, Stakeholder, HouseType, TransactionType, Reminder, ReminderCategory } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PropertiesList from './components/PropertiesList';
import TenantManager from './components/TenantManager';
import FinanceTracker from './components/FinanceTracker';
import ContactManager from './components/ContactManager';
import AITools from './components/AITools';
import InvestorDashboard from './components/InvestorDashboard';

const initialProperties: Property[] = [
  {
    id: 'p1',
    name: 'Sonnenresidenz',
    type: HouseType.APARTMENT_BLOCK,
    address: 'Sonnenallee 15, 12047 Berlin',
    purchasePrice: 245000,
    purchaseDate: '2021-05-15',
    units: [
      { id: 'u1', number: 'EG links', size: 65, baseRent: 850, utilityPrepayment: 150, tenantId: 't1' },
      { id: 'u2', number: '1. OG rechts', size: 45, baseRent: 600, utilityPrepayment: 110 }
    ],
    loans: [
      {
        id: 'l1',
        bankName: 'DKB Bank',
        totalAmount: 200000,
        currentBalance: 185000,
        interestRate: 1.25,
        repaymentRate: 2.5,
        fixedUntil: '2031-05-15',
        monthlyInstallment: 625
      }
    ],
    meterReadings: []
  }
];

const initialTenants: Tenant[] = [
  { id: 't1', firstName: 'Max', lastName: 'Mustermann', email: 'max@example.com', phone: '0170-1234567', startDate: '2022-01-01' }
];

const initialReminders: Reminder[] = [
  { id: 'r1', title: 'Zählerablesung Strom', date: '2024-06-30', category: ReminderCategory.METER, isDone: false, propertyId: 'p1' },
  { id: 'r2', title: 'Steuererklärung 2023', date: '2024-07-31', category: ReminderCategory.TAX, isDone: false },
  { id: 'r3', title: 'Zinsbindung DKB prüfen', date: '2031-01-01', category: ReminderCategory.LOAN_EXPIRY, isDone: false, propertyId: 'p1' }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [handymen, setHandymen] = useState<Handyman[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const setView = (v: View, params: any = null) => {
    setCurrentView(v);
    setViewParams(params);
    setIsSidebarOpen(false);
  };

  const addTransaction = (t: Transaction) => setTransactions(prev => [...prev, t]);

  const viewLabels: Record<View, string> = {
    dashboard: 'Übersicht',
    properties: 'Immobilien',
    tenants: 'Mieter',
    finances: 'Finanzen',
    contacts: 'Kontakte',
    tools: 'KI-Tools',
    investor: 'Investor-Performance'
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static z-50 transition-transform duration-300`}>
        <Sidebar currentView={currentView} setView={setView} />
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <main className="flex-1 lg:ml-0 p-4 md:p-8 pb-24 lg:pb-8">
        <header className="mb-6 flex justify-between items-center bg-white lg:bg-transparent p-4 lg:p-0 -mx-4 lg:mx-0 shadow-sm lg:shadow-none sticky top-0 lg:static z-30">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-slate-800">{viewLabels[currentView]}</h1>
              <p className="hidden md:block text-slate-500 mt-1">Ihr Portfolio auf einen Blick.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <button className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition">
              <i className="fa-solid fa-bell text-slate-500"></i>
            </button>
            <div className="h-8 w-8 md:h-10 md:w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">VM</div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {currentView === 'dashboard' && (
            <Dashboard 
              properties={properties} 
              tenants={tenants} 
              transactions={transactions} 
              reminders={reminders}
              setReminders={setReminders}
              setView={setView}
            />
          )}
          {currentView === 'properties' && (
            <PropertiesList 
              properties={properties} 
              setProperties={setProperties} 
              onGenerateExpose={(id) => setView('tools', { tab: 'expose', propertyId: id })}
              setView={setView}
            />
          )}
          {currentView === 'tenants' && (
            <TenantManager tenants={tenants} setTenants={setTenants} properties={properties} transactions={transactions} />
          )}
          {currentView === 'finances' && (
            <FinanceTracker transactions={transactions} addTransaction={addTransaction} properties={properties} />
          )}
          {currentView === 'investor' && (
            <InvestorDashboard properties={properties} transactions={transactions} setProperties={setProperties} />
          )}
          {currentView === 'contacts' && (
            <ContactManager 
              handymen={handymen} setHandymen={setHandymen} 
              owners={owners} setOwners={setOwners} 
              stakeholders={stakeholders} setStakeholders={setStakeholders}
              tenants={tenants} setTenants={setTenants}
            />
          )}
          {currentView === 'tools' && (
            <AITools 
              properties={properties} 
              setProperties={setProperties}
              tenants={tenants} 
              transactions={transactions} 
              initialPropertyId={viewParams?.propertyId}
              initialTab={viewParams?.tab}
            />
          )}
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center space-y-1 ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <i className="fa-solid fa-chart-pie text-lg"></i>
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>
        <button onClick={() => setView('properties')} className={`flex flex-col items-center space-y-1 ${currentView === 'properties' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <i className="fa-solid fa-building text-lg"></i>
          <span className="text-[10px] font-bold">Objekte</span>
        </button>
        <button onClick={() => setView('investor')} className={`flex flex-col items-center space-y-1 ${currentView === 'investor' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <i className="fa-solid fa-sack-dollar text-lg"></i>
          <span className="text-[10px] font-bold">Invest</span>
        </button>
        <button onClick={() => setView('finances')} className={`flex flex-col items-center space-y-1 ${currentView === 'finances' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <i className="fa-solid fa-euro-sign text-lg"></i>
          <span className="text-[10px] font-bold">Finanzen</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
