
import React, { useState } from 'react';
import { Donor, BloodType } from '../types';

interface TableEditorProps {
  donors: Donor[];
  onUpdate: (id: string, updates: Partial<Donor>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TableEditor: React.FC<TableEditorProps> = ({ donors, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Donor>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const startEdit = (donor: Donor) => {
    setEditingId(donor.id);
    setEditForm(donor);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (id: string) => {
    setSavingId(id);
    await onUpdate(id, editForm);
    setSavingId(null);
    setEditingId(null);
  };

  const toggleAvailability = async (donor: Donor) => {
    setSavingId(donor.id);
    await onUpdate(donor.id, { isAvailable: !donor.isAvailable });
    setSavingId(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Bulk Repository Manager</h2>
          <p className="text-xs text-slate-500 font-medium">Direct database access for system administrators</p>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
          {donors.length} Records Loaded
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th className="px-6 py-4 border-b border-slate-100">Full Name</th>
              <th className="px-6 py-4 border-b border-slate-100">Blood Type</th>
              <th className="px-6 py-4 border-b border-slate-100">Contact Info</th>
              <th className="px-6 py-4 border-b border-slate-100">Location</th>
              <th className="px-6 py-4 border-b border-slate-100">Status</th>
              <th className="px-6 py-4 border-b border-slate-100 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {donors.map((donor) => (
              <tr key={donor.id} className={`group transition-colors ${editingId === donor.id ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                <td className="px-6 py-4">
                  {editingId === donor.id ? (
                    <input 
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-bold"
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">{donor.name}</span>
                      {savingId === donor.id && <span className="animate-spin h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full"></span>}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === donor.id ? (
                    <select 
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-bold"
                      value={editForm.bloodType}
                      onChange={e => setEditForm({...editForm, bloodType: e.target.value as BloodType})}
                    >
                      {Object.values(BloodType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black">{donor.bloodType}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                   {editingId === donor.id ? (
                    <input 
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-bold"
                      value={editForm.contact}
                      onChange={e => setEditForm({...editForm, contact: e.target.value})}
                    />
                  ) : (
                    <span className="text-xs font-medium text-slate-500">{donor.contact}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                   {editingId === donor.id ? (
                    <input 
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-bold"
                      value={editForm.location}
                      onChange={e => setEditForm({...editForm, location: e.target.value})}
                    />
                  ) : (
                    <span className="text-xs font-medium text-slate-500">{donor.location}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleAvailability(donor)}
                    disabled={savingId === donor.id}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      donor.isAvailable ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      donor.isAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {editingId === donor.id ? (
                      <>
                        <button 
                          onClick={() => handleSave(donor.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Save"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEdit(donor)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Row"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button 
                          onClick={() => { if(confirm('Delete record for '+donor.name+'?')) onDelete(donor.id); }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {donors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                  No records found in database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableEditor;
