
import React, { useState } from 'react';
import { Donor, BloodType } from '../types';

interface DonorListProps {
  donors: Donor[];
  onAddDonor: (donor: Omit<Donor, 'id'>) => void;
  onNotify: (id: string) => void;
}

const DonorList: React.FC<DonorListProps> = ({ donors, onAddDonor, onNotify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          donor.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || donor.bloodType === filterType;
    return matchesSearch && matchesType;
  });

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onAddDonor({
      name: formData.get('name') as string,
      bloodType: formData.get('bloodType') as BloodType,
      lastDonationDate: new Date().toISOString().split('T')[0],
      contact: formData.get('contact') as string,
      location: formData.get('location') as string,
      isAvailable: true,
    });
    setShowModal(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <input 
            type="text" 
            placeholder="Search name or location..." 
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Blood Types</option>
            {Object.values(BloodType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl text-sm font-black shadow-lg shadow-red-100 transition-all"
        >
          Add New Donor
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">Donor Profile</th>
              <th className="px-6 py-4">Blood Group</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Last Piped</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDonors.map((donor) => (
              <tr key={donor.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 font-black">
                      {donor.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{donor.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{donor.location}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded-xl text-xs font-black shadow-sm">
                    {donor.bloodType}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                    donor.isAvailable ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {donor.isAvailable ? 'Ready' : 'Resting'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {donor.lastNotified ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-blue-600 font-bold">Alerted</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {new Date(donor.lastNotified).toLocaleTimeString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No Alerts</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onNotify(donor.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      donor.lastNotified 
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                        : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                    }`}
                  >
                    {donor.lastNotified ? 'Ping Again' : 'Notify'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-800 mb-6 tracking-tighter">Register New Donor</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <input required name="name" placeholder="Full Name" className="w-full px-4 py-3 border border-slate-200 rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <select name="bloodType" className="px-4 py-3 border border-slate-200 rounded-xl font-bold">
                  {Object.values(BloodType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input required name="contact" placeholder="Phone" className="px-4 py-3 border border-slate-200 rounded-xl" />
              </div>
              <input required name="location" placeholder="Location" className="w-full px-4 py-3 border border-slate-200 rounded-xl" />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-red-100">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorList;
