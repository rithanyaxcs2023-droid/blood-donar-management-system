
import React, { useState } from 'react';
import { ViewState, BloodType } from '../types';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const [showReqModal, setShowReqModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsRequesting(true);
    const formData = new FormData(e.currentTarget);
    
    await supabase.from('emergencies').insert([{
      blood_type: formData.get('bloodType'),
      hospital: formData.get('hospital'),
      units_needed: parseInt(formData.get('units') as string),
      urgency: 'critical'
    }]);

    setIsRequesting(false);
    setShowReqModal(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id: 'donors', label: 'Donors', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: 'editor', label: 'Database', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    { id: 'inventory', label: 'Inventory', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { id: 'assistant', label: 'Voice AI', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg> },
  ];

  return (
    <nav className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 md:h-screen z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-red-200">H</div>
        <span className="text-2xl font-black text-slate-800 tracking-tighter">HemoFlow</span>
      </div>

      <div className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewState)}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 ${
              currentView === item.id 
                ? 'bg-red-50 text-red-600 shadow-[0_0_20px_rgba(239,68,68,0.1)] font-bold ring-1 ring-red-100' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800 font-medium'
            }`}
          >
            {item.icon}
            <span className="text-sm uppercase tracking-widest text-[10px] font-black">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-6 mt-auto">
        <div className="bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/20 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-red-600/40 transition-all duration-500"></div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Critical Link</p>
          <p className="text-sm font-bold mb-4">Immediate Blood Support</p>
          <button 
            onClick={() => setShowReqModal(true)}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/40 active:scale-95 animate-pulse"
          >
            Broadcast Emergency
          </button>
        </div>
      </div>

      {showReqModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10">
            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter">System-Wide Alert</h2>
            <p className="text-slate-500 text-sm mb-8">This will notify all connected clinics and matching donors instantly.</p>
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Blood Type</label>
                  <select name="bloodType" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold">
                    {Object.values(BloodType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Units Required</label>
                  <input name="units" type="number" defaultValue="1" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Facility / Hospital</label>
                <input required name="hospital" placeholder="e.g. Metro General ICU" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowReqModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Cancel</button>
                <button disabled={isRequesting} type="submit" className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-100 disabled:opacity-50">
                  {isRequesting ? 'Broadcasting...' : 'Confirm Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
