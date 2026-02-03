import React, { useState, useEffect } from 'react';
import { ViewState, Donor, BloodType, Emergency } from './types';
import Dashboard from './components/Dashboard';
import DonorList from './components/DonorList';
import Inventory from './components/Inventory';
import LiveAssistant from './components/LiveAssistant';
import TableEditor from './components/TableEditor';
import Navbar from './components/Navbar';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: donorData, error } = await supabase
          .from('donors')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (donorData) {
          setDonors(donorData.map(d => ({
            id: d.id,
            name: d.name,
            bloodType: d.blood_type as BloodType,
            lastDonationDate: d.last_donation_date,
            contact: d.contact,
            location: d.location,
            isAvailable: d.is_available,
            lastNotified: d.last_notified
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const donorChannel = supabase
      .channel('public:donors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donors' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newD = payload.new;
          setDonors(prev => {
            if (prev.find(d => d.id === newD.id)) return prev;
            return [{
              id: newD.id,
              name: newD.name,
              bloodType: newD.blood_type as BloodType,
              lastDonationDate: newD.last_donation_date,
              contact: newD.contact,
              location: newD.location,
              isAvailable: newD.is_available,
              lastNotified: newD.last_notified
            }, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setDonors(prev => prev.map(d => d.id === payload.new.id ? {
            ...d,
            name: payload.new.name,
            bloodType: payload.new.blood_type as BloodType,
            contact: payload.new.contact,
            location: payload.new.location,
            isAvailable: payload.new.is_available,
            lastNotified: payload.new.last_notified
          } : d));
        } else if (payload.eventType === 'DELETE') {
          setDonors(prev => prev.filter(d => d.id !== payload.old.id));
        }
      })
      .subscribe();

    const emergencyChannel = supabase
      .channel('public:emergencies')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emergencies' }, (payload) => {
        const em = payload.new;
        setActiveEmergency({
          id: em.id,
          bloodType: em.blood_type as BloodType,
          hospital: em.hospital,
          unitsNeeded: em.units_needed,
          urgency: em.urgency,
          createdAt: em.created_at
        });
        setTimeout(() => setActiveEmergency(null), 15000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(donorChannel);
      supabase.removeChannel(emergencyChannel);
    };
  }, []);

  const addDonor = async (newDonor: Omit<Donor, 'id'>) => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('donors').insert([{
        name: newDonor.name,
        blood_type: newDonor.bloodType,
        last_donation_date: newDonor.lastDonationDate,
        contact: newDonor.contact,
        location: newDonor.location,
        is_available: newDonor.isAvailable
      }]);
      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to add donor:', err);
      alert(`Database Error: ${err.message || 'Missing Credentials'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateDonor = async (id: string, updates: Partial<Donor>) => {
    setIsSyncing(true);
    try {
      const supabaseUpdates: any = {};
      if (updates.name !== undefined) supabaseUpdates.name = updates.name;
      if (updates.bloodType !== undefined) supabaseUpdates.blood_type = updates.bloodType;
      if (updates.contact !== undefined) supabaseUpdates.contact = updates.contact;
      if (updates.location !== undefined) supabaseUpdates.location = updates.location;
      if (updates.isAvailable !== undefined) supabaseUpdates.is_available = updates.isAvailable;

      const { error } = await supabase.from('donors').update(supabaseUpdates).eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to update donor:', err);
      alert(`Database Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteDonor = async (id: string) => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('donors').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to delete donor:', err);
      alert(`Database Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNotifyDonor = async (id: string) => {
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('donors')
        .update({ last_notified: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to notify donor:', err);
      alert(`Database Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      <Navbar currentView={currentView} setView={setCurrentView} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {activeEmergency && (
          <div className="fixed top-6 right-6 left-6 md:left-auto md:w-96 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-red-600 text-white p-6 rounded-3xl shadow-2xl shadow-red-200 border-4 border-white flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="bg-white text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">CRITICAL ALERT</span>
                <button onClick={() => setActiveEmergency(null)} className="text-white/80 hover:text-white">✕</button>
              </div>
              <h3 className="text-xl font-black">Emergency: {activeEmergency.bloodType} Required</h3>
              <p className="text-sm opacity-90">{activeEmergency.hospital} requires {activeEmergency.unitsNeeded} units immediately.</p>
              <button 
                onClick={() => { setCurrentView('donors'); setActiveEmergency(null); }}
                className="mt-2 w-full py-3 bg-white text-red-600 font-black rounded-xl text-sm hover:bg-slate-50 transition-colors"
              >
                Find Matching Donors
              </button>
            </div>
          </div>
        )}

        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter capitalize">
              {currentView === 'editor' ? 'Database Editor' : currentView}
            </h1>
            <p className="text-slate-500 font-medium">Real-time repository management</p>
          </div>
          <div className="flex flex-col items-end">
            <div className={`p-2 px-4 rounded-full shadow-sm border flex items-center gap-2 ${isSupabaseConfigured ? 'bg-white border-slate-200' : 'bg-red-50 border-red-100'}`}>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className={`text-xs font-black uppercase tracking-widest ${isSupabaseConfigured ? 'text-slate-600' : 'text-red-600'}`}>
                {isSupabaseConfigured ? 'Live Network' : 'Connection Error'}
              </span>
            </div>
            {!isSupabaseConfigured && (
              <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-tighter text-right">
                Missing EXPO_PUBLIC_SUPABASE_URL<br/>or EXPO_PUBLIC_SUPABASE_KEY
              </p>
            )}
            {isSyncing && (
              <div className="mt-1 flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase animate-pulse">
                Syncing changes...
              </div>
            )}
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-64 gap-4">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
             </div>
          ) : (
            <>
              {currentView === 'dashboard' && <Dashboard donors={donors} />}
              {currentView === 'donors' && <DonorList donors={donors} onAddDonor={addDonor} onNotify={handleNotifyDonor} />}
              {currentView === 'inventory' && <Inventory donors={donors} />}
              {currentView === 'assistant' && <LiveAssistant />}
              {currentView === 'editor' && <TableEditor donors={donors} onUpdate={updateDonor} onDelete={deleteDonor} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;