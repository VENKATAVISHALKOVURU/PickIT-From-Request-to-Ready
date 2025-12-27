
import React, { useState } from 'react';
import { UserRole, Shop, PrintJob, UserProfile } from '../types';
import { Icons } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  user: UserProfile;
  shop: Shop;
  setShop: (shop: Shop) => void;
  jobHistory: PrintJob[];
  activeSubPage: string | null;
  setActiveSubPage: (page: string | null) => void;
  onRoleSwitch: () => void;
  onChangeShop: () => void;
}

const pricingLabels: Record<string, string> = {
  bw_ss: 'B/W Single-sided',
  bw_ds: 'B/W Double-sided',
  color_ss: 'Color Single-sided',
  color_ds: 'Color Double-sided'
};

const MenuOverlay: React.FC<Props> = ({ 
  isOpen, onClose, role, user, shop, setShop, jobHistory, activeSubPage, setActiveSubPage, onRoleSwitch, onChangeShop 
}) => {
  
  const menuItems = role === UserRole.STUDENT ? [
    { id: 'shop', label: 'Connected Shop', icon: <Icons.Shop />, desc: shop.name || 'Not Linked' },
    { id: 'requests', label: 'Payment History', icon: <i className="fa-solid fa-wallet"></i>, desc: 'Past transactions' },
    { id: 'notifs', label: 'Notifications', icon: <i className="fa-solid fa-bell"></i>, desc: 'Alert settings' },
    { id: 'help', label: 'Help Center', icon: <i className="fa-solid fa-circle-info"></i>, desc: 'Contact support' },
    { id: 'about', label: 'About PickIT', icon: <i className="fa-solid fa-circle-nodes"></i>, desc: 'App info' },
  ] : [
    { id: 'config', label: 'Edit Shop Setup', icon: <Icons.Settings />, desc: 'Modify rates' },
    { id: 'id', label: 'Shop Identity', icon: <i className="fa-solid fa-qrcode"></i>, desc: 'QR & ID' },
    { id: 'stats', label: 'Today\'s Summary', icon: <i className="fa-solid fa-chart-simple"></i>, desc: 'Revenue & Volume' },
    { id: 'help', label: 'Support', icon: <i className="fa-solid fa-circle-question"></i>, desc: 'Owner FAQ' },
  ];

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  const renderSubPage = () => {
    switch (activeSubPage) {
      case 'config':
        return (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold mb-6 text-slate-900">Pricing Strategy</h3>
            <div className="space-y-4">
              {Object.entries(shop.pricing).map(([key, val]) => (
                <div key={key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <p className="text-[13px] font-medium text-slate-600">{pricingLabels[key] || key}</p>
                  <div className="relative flex items-center">
                    <span className="text-slate-400 font-bold mr-1">₹</span>
                    <input 
                      type="number" 
                      value={val}
                      onChange={(e) => setShop({ ...shop, pricing: { ...shop.pricing, [key]: parseFloat(e.target.value) || 0 }})}
                      className="w-16 bg-white px-2 py-1 rounded-lg border border-slate-200 font-bold text-indigo-600 text-right focus:outline-none"
                    />
                  </div>
                </div>
              ))}
              <button onClick={() => setActiveSubPage(null)} className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl">Save Changes</button>
            </div>
          </div>
        );
      case 'shop':
        return (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold mb-6">Connected Shop</h3>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 text-center shadow-sm">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 text-3xl mx-auto mb-6"><Icons.Shop /></div>
              <p className="font-bold text-xl text-slate-900">{shop.name || 'Find a Shop'}</p>
              <p className="text-sm text-slate-400 mt-2">{shop.location || 'Scan QR at the counter'}</p>
              
              {shop.isConfigured && (
                <div className="mt-8 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-xs font-bold uppercase tracking-widest mb-10">
                  <i className="fa-solid fa-circle-check"></i> Verified Destination
                </div>
              )}

              <button 
                onClick={onChangeShop}
                className="w-full mt-4 py-4 bg-indigo-600 text-white font-bold rounded-2xl text-sm active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
              >
                <i className="fa-solid fa-qrcode"></i> {shop.isConfigured ? 'Change Shop' : 'Connect via QR'}
              </button>
            </div>
          </div>
        );
      case 'requests':
        return (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold mb-6">Payment History</h3>
            <div className="space-y-4">
              {jobHistory.length > 0 ? jobHistory.map(job => (
                <div key={job.id} className="p-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                      <i className="fa-solid fa-check-to-slot"></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{job.fileName}</p>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                        {new Date(job.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-lg font-bold text-slate-900">₹{job.cost.toFixed(2)}</p>
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded uppercase tracking-wider mt-1">
                      Paid
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-16">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                     <i className="fa-solid fa-receipt text-3xl"></i>
                   </div>
                   <p className="text-[15px] text-slate-400 font-medium">No payment history yet.</p>
                   <p className="text-xs text-slate-300 mt-1">Transactions appear here after pickup.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'id':
        return (
          <div className="animate-in slide-in-from-right-4 duration-300 text-center">
            <h3 className="text-xl font-bold mb-6 text-left">Shop Identity</h3>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm inline-block w-full">
              <div className="w-44 h-44 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center mb-8 border-4 border-dashed border-indigo-100 relative overflow-hidden">
                <i className="fa-solid fa-qrcode text-6xl text-slate-200"></i>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Shop ID</p>
              <p className="text-xl font-mono font-bold text-indigo-600">{shop.id}</p>
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button className="py-3 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-indigo-100">Download</button>
                <button className="py-3 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-wider">Print</button>
              </div>
            </div>
          </div>
        );
      case 'stats':
        return (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold mb-6">Today's Performance</h3>
            <div className="space-y-4">
               <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl"><i className="fa-solid fa-indian-rupee-sign"></i></div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">Estimated Revenue</p>
                  <p className="text-4xl font-bold">₹{jobHistory.reduce((sum, j) => sum + j.cost, 0).toFixed(2)}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-white rounded-[2rem] border border-slate-100 text-center shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jobs Ready</p>
                    <p className="text-2xl font-bold text-slate-900">{jobHistory.length}</p>
                  </div>
                  <div className="p-6 bg-white rounded-[2rem] border border-slate-100 text-center shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PPM Rate</p>
                    <p className="text-2xl font-bold text-slate-900">{shop.ppm}</p>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold mb-8 text-slate-900">About PickIT</h3>
            <div className="flex flex-col items-center text-center">
              <Icons.Logo className="h-10 w-auto mb-8" />
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em] mb-6">Ver 1.0.0 (Hackathon MVP)</p>
              
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-left mb-8">
                <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                  PickIT is a professional digital queue system designed for campus print shops. 
                  We eliminate wait times by providing real-time tracking and time certainty for students.
                </p>
              </div>

              <div className="w-full space-y-3">
                <div className="flex justify-between items-center px-4 py-3 bg-white rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ONLINE</span>
                </div>
              </div>

              <p className="mt-12 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                © 2023 PickIT Team
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="animate-in slide-in-from-left-4 duration-300 pb-10">
            {/* Expanded Profile Section */}
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-4 mb-10">
               <div className="w-16 h-16 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white flex items-center justify-center text-indigo-600">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold">{getInitials(user.name)}</span>
                  )}
               </div>
               <div className="flex-1">
                 <p className="text-lg font-bold text-slate-900 leading-tight">{user.name}</p>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                   {role === UserRole.STUDENT ? 'Verified Student' : 'Shop Manager'}
                 </p>
               </div>
            </div>

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-4">Dashboard</h3>
            <div className="space-y-2">
              {menuItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => setActiveSubPage(item.id)}
                  className="w-full flex items-center gap-4 p-5 rounded-[1.5rem] hover:bg-slate-50 transition-all text-left border border-transparent hover:border-slate-100 group"
                >
                  <div className="w-12 h-12 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-bold text-slate-800">{item.label}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
                  </div>
                  <Icons.ChevronRight />
                </button>
              ))}
            </div>

            <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl"><i className="fa-solid fa-repeat"></i></div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-4">Switch Account</p>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed font-medium">Toggle between student tools and shop management features.</p>
              <button 
                onClick={onRoleSwitch}
                className="w-full py-4 bg-white text-slate-900 font-bold rounded-2xl text-sm active:scale-95 transition-transform shadow-xl"
              >
                Switch to {role === UserRole.STUDENT ? 'Shop Owner' : 'Student View'}
              </button>
            </div>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative h-full w-[85%] max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-500 ease-out border-l border-slate-100">
        <div className="h-full overflow-y-auto px-7 py-12">
          <div className="flex items-center justify-between mb-12">
            {activeSubPage ? (
              <button onClick={() => setActiveSubPage(null)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                <i className="fa-solid fa-arrow-left text-lg"></i>
              </button>
            ) : (
              <Icons.Logo className="h-6 w-auto" />
            )}
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-rose-500 transition-colors">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          {renderSubPage()}
        </div>
      </div>
    </div>
  );
};

export default MenuOverlay;
