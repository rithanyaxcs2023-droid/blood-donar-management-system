
import React, { useState, useEffect } from 'react';
import { Donor, BloodType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  donors: Donor[];
}

interface Event {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  message: string;
  time: string;
}

const Dashboard: React.FC<DashboardProps> = ({ donors }) => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donors' }, (payload) => {
        const time = new Date().toLocaleTimeString();
        let message = '';
        if (payload.eventType === 'INSERT') message = `New donor ${payload.new.name} registered.`;
        if (payload.eventType === 'UPDATE') message = `Updated status for ${payload.new.name}.`;
        if (payload.eventType === 'DELETE') message = `Donor removed from system.`;

        setEvents(prev => [{ id: Date.now().toString(), type: payload.eventType, message, time }, ...prev].slice(0, 5));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const bloodTypeCounts = donors.reduce((acc, donor) => {
    if (donor.isAvailable) acc[donor.bloodType] = (acc[donor.bloodType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.values(BloodType).map(type => ({
    name: type,
    units: bloodTypeCounts[type] || 0,
    color: (bloodTypeCounts[type] || 0) < 2 ? '#ef4444' : '#dc2626'
  }));

  const stats = [
    { label: 'Total Donors', value: donors.length, icon: '👥', color: 'bg-blue-50 text-blue-600' },
    { label: 'Critical Alerts', value: chartData.filter(d => d.units < 1).length, icon: '🚨', color: 'bg-red-50 text-red-600' },
    { label: 'Available Units', value: donors.filter(d => d.isAvailable).length, icon: '🩸', color: 'bg-green-50 text-green-600' },
    { label: 'Network Clinics', value: 8, icon: '🏥', color: 'bg-indigo-50 text-indigo-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800">Supply Distribution</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Inventory</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                />
                <Bar dataKey="units" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <h3 className="text-lg font-black mb-1 flex items-center gap-2">
            Live Feed
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">System Events</p>
          
          <div className="space-y-4 relative z-10">
            {events.length === 0 && (
              <div className="text-slate-600 text-sm py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                Awaiting activity...
              </div>
            )}
            {events.map((event) => (
              <div key={event.id} className="flex gap-4 items-start p-3 bg-white/5 rounded-2xl animate-in slide-in-from-right duration-300">
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                  event.type === 'INSERT' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 
                  event.type === 'UPDATE' ? 'bg-blue-400' : 'bg-red-400'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{event.message}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{event.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export System Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
