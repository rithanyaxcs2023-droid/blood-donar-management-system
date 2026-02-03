
import React from 'react';
import { Donor, BloodType, InventoryItem } from '../types';

interface InventoryProps {
  donors: Donor[];
}

const Inventory: React.FC<InventoryProps> = ({ donors }) => {
  const getInventory = (): InventoryItem[] => {
    return Object.values(BloodType).map(type => {
      const units = donors.filter(d => d.bloodType === type && d.isAvailable).length;
      let status: InventoryItem['status'] = 'stable';
      if (units < 1) status = 'critical';
      else if (units > 5) status = 'excess';

      return { type, units, status };
    });
  };

  const items = getInventory();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <div key={item.type} className={`bg-white p-6 rounded-3xl border transition-all ${
          item.status === 'critical' ? 'border-red-200 ring-4 ring-red-500/5 shadow-xl shadow-red-100' : 'border-slate-200'
        } relative overflow-hidden group hover:translate-y-[-4px]`}>
          <div className="flex justify-between items-start mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ${
               item.status === 'critical' ? 'bg-red-600 shadow-red-200' : 
               item.status === 'excess' ? 'bg-slate-900 shadow-slate-200' : 
               'bg-red-500 shadow-red-100'
            }`}>
              {item.type}
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
              item.status === 'critical' ? 'bg-red-100 text-red-600 animate-pulse' : 
              item.status === 'excess' ? 'bg-indigo-100 text-indigo-600' : 
              'bg-green-100 text-green-600'
            }`}>
              {item.status}
            </div>
          </div>
          
          <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-1">{item.units} Units</h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Live Repository Stock</p>

          <div className="mt-8 flex gap-2">
            <button className="flex-1 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95">
              Dispatch
            </button>
            <button className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all active:scale-95 ${
              item.status === 'critical' ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}>
              {item.status === 'critical' ? 'Alert Now' : 'Broadcast'}
            </button>
          </div>

          {item.status === 'critical' && (
            <div className="absolute top-0 right-0 p-3">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Inventory;
