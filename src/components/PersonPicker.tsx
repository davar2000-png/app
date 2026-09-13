import { useState, useEffect } from 'react';
import type { Person, PersonGroup } from '../types';
import { generateId, formatNumber, getTodayDate } from '../utils';

interface PersonPickerProps {
  people: Person[];
  personGroups: PersonGroup[];
  value: string;
  onChange: (personId: string) => void;
  onAddPerson: (person: Person) => void;
  type?: 'customer' | 'supplier';
  label?: string;
}

export default function PersonPicker({
  people,
  personGroups,
  value,
  onChange,
  onAddPerson,
  type = 'customer',
  label = 'شخص'
}: PersonPickerProps) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newPerson, setNewPerson] = useState<Partial<Person>>({
    type: type,
    creditor: 0,
    debtor: 0,
    documents: [],
    guarantor: { id: generateId(), name: '', mobile: '', phone: '', nationalId: '', address: '', job: '', documents: [] }
  });

  const selectedPerson = people.find(p => p.id === value);

  // محاسبه مانده حساب
  const calculateBalance = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (!person) return 0;
    return (person.debtor || 0) - (person.creditor || 0);
  };

  // جستجوی زنده
  const filteredPeople = search
    ? people.filter(p => 
        !p.isDeleted &&
        (p.type === type || type === 'customer') &&
        (p.name.includes(search) || 
         p.nationalId?.includes(search) || 
         p.mobile?.includes(search) ||
         p.phone?.includes(search))
      ).slice(0, 8)
    : [];

  const handleSelect = (personId: string) => {
    onChange(personId);
    setSearch('');
    setShowDropdown(false);
  };

  const handleAdd = () => {
    if (!newPerson.name || !newPerson.mobile) {
      alert('نام و موبایل الزامی است');
      return;
    }
    const person: Person = {
      ...newPerson,
      id: generateId(),
      type: type,
      creditor: 0,
      debtor: 0,
      documents: newPerson.documents || [],
      isDeleted: false,
      createdAt: new Date().toISOString()
    } as Person;
    onAddPerson(person);
    onChange(person.id);
    setShowAddModal(false);
    setNewPerson({ type: type, creditor: 0, debtor: 0, documents: [] });
  };

  const handleEdit = () => {
    if (!selectedPerson) return;
    setNewPerson(selectedPerson);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!newPerson.name || !newPerson.mobile) {
      alert('نام و موبایل الزامی است');
      return;
    }
    onAddPerson({ ...newPerson, id: selectedPerson!.id } as Person);
    setShowEditModal(false);
    setNewPerson({ type: type, creditor: 0, debtor: 0, documents: [] });
  };

  const balance = selectedPerson ? calculateBalance(selectedPerson.id) : 0;
  const group = selectedPerson?.groupId ? personGroups.find(g => g.id === selectedPerson.groupId) : null;

  return (
    <div className="space-y-2">
      <label className="text-slate-300 text-sm font-bold">{label} *</label>
      
      {/* کارت شخص انتخاب‌شده */}
      {selectedPerson && (
        <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedPerson.image ? (
                <img src={selectedPerson.image} alt={selectedPerson.name} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-xl">👤</div>
              )}
              <div>
                <p className="text-white font-bold">{selectedPerson.name} {selectedPerson.familyName || ''}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>📱 {selectedPerson.mobile}</span>
                  {group && (
                    <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: group.color + '30', color: group.color }}>
                      {group.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-left">
              {balance !== 0 && (
                <p className={`text-sm font-bold ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {balance > 0 ? 'بدهکار' : 'بستانکار'}: {formatNumber(Math.abs(balance))} تومان
                </p>
              )}
              <button onClick={handleEdit} className="text-blue-400 text-xs mt-1">✏️ ویرایش</button>
            </div>
          </div>
        </div>
      )}

      {/* اینپوت جستجو */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={`🔍 جستجوی ${label} (نام، کد ملی، تلفن)...`}
          className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        
        {/* دراپ‌داون نتایج */}
        {showDropdown && filteredPeople.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-lg max-h-64 overflow-y-auto">
            {filteredPeople.map(person => {
              const personGroup = person.groupId ? personGroups.find(g => g.id === person.groupId) : null;
              return (
                <div
                  key={person.id}
                  onClick={() => handleSelect(person.id)}
                  className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {person.image ? (
                      <img src={person.image} alt={person.name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-sm">👤</div>
                    )}
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{person.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>📱 {person.mobile}</span>
                        {personGroup && <span style={{ color: personGroup.color }}>{personGroup.name}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* دکمه افزودن شخص جدید */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-bold"
      >
        ＋ {label} جدید
      </button>

      {/* مودال افزودن شخص */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">➕ ثبت {label} جدید</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={newPerson.name || ''} onChange={e => setNewPerson({ ...newPerson, name: e.target.value })} placeholder="نام *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.familyName || ''} onChange={e => setNewPerson({ ...newPerson, familyName: e.target.value })} placeholder="نام خانوادگی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.mobile || ''} onChange={e => setNewPerson({ ...newPerson, mobile: e.target.value })} placeholder="موبایل *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.phone || ''} onChange={e => setNewPerson({ ...newPerson, phone: e.target.value })} placeholder="تلفن" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.nationalId || ''} onChange={e => setNewPerson({ ...newPerson, nationalId: e.target.value })} placeholder="کد ملی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.job || ''} onChange={e => setNewPerson({ ...newPerson, job: e.target.value })} placeholder="شغل" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.city || ''} onChange={e => setNewPerson({ ...newPerson, city: e.target.value })} placeholder="شهر" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.address || ''} onChange={e => setNewPerson({ ...newPerson, address: e.target.value })} placeholder="آدرس" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white md:col-span-2" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAdd} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">💾 ذخیره</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">انصراف</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال ویرایش شخص */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">✏️ ویرایش {label}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={newPerson.name || ''} onChange={e => setNewPerson({ ...newPerson, name: e.target.value })} placeholder="نام *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.familyName || ''} onChange={e => setNewPerson({ ...newPerson, familyName: e.target.value })} placeholder="نام خانوادگی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.mobile || ''} onChange={e => setNewPerson({ ...newPerson, mobile: e.target.value })} placeholder="موبایل *" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.phone || ''} onChange={e => setNewPerson({ ...newPerson, phone: e.target.value })} placeholder="تلفن" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.nationalId || ''} onChange={e => setNewPerson({ ...newPerson, nationalId: e.target.value })} placeholder="کد ملی" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.job || ''} onChange={e => setNewPerson({ ...newPerson, job: e.target.value })} placeholder="شغل" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.city || ''} onChange={e => setNewPerson({ ...newPerson, city: e.target.value })} placeholder="شهر" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white" />
              <input value={newPerson.address || ''} onChange={e => setNewPerson({ ...newPerson, address: e.target.value })} placeholder="آدرس" className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-white md:col-span-2" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSaveEdit} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">💾 ذخیره</button>
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
