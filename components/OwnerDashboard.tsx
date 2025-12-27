
import React, { useState } from 'react';
import { PrintJob, JobStatus, Shop } from '../types';
import { Icons } from '../constants';
import { GoogleGenAI } from "@google/genai";

interface Props {
  activeJob: PrintJob | null;
  updateJobStatus: (id: string, status: JobStatus) => void;
  shop: Shop;
  setShop: (shop: Shop) => void;
  jobHistory: PrintJob[];
}

const OwnerDashboard: React.FC<Props> = ({ activeJob, updateJobStatus, shop, setShop, jobHistory }) => {
  const [setupStep, setSetupStep] = useState(shop.isConfigured ? 0 : 1);
  const [formData, setFormData] = useState<Shop>(shop);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);

  const nextStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSetupStep(s => s + 1);
      setIsTransitioning(false);
    }, 300);
  };
  
  const prevStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSetupStep(s => s - 1);
      setIsTransitioning(false);
    }, 300);
  };
  
  const finishSetup = () => {
    setShop({ ...formData, isConfigured: true });
    setSetupStep(0);
  };

  const verifyLocationWithAI = async () => {
    if (!formData.name || !formData.location) return;
    setIsVerifyingLocation(true);
    
    try {
      let userCoords: { latitude: number; longitude: number } | undefined;
      
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => 
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        userCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch (err) {
        console.warn("Could not get geolocation, proceeding with name/location only.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Find the official Google Maps information for a print shop called "${formData.name}" located at "${formData.location}". Return the official address and the Google Maps URI.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-latest",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: userCoords
            }
          }
        }
      });

      const mapsChunk = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.find(c => c.maps?.uri);
      const mapsUrl = mapsChunk?.maps?.uri;
      const officialAddress = mapsChunk?.maps?.title || formData.location;

      setFormData(prev => ({
        ...prev,
        location: officialAddress,
        mapsUrl: mapsUrl || prev.mapsUrl
      }));

    } catch (error) {
      console.error("Location verification failed:", error);
    } finally {
      setIsVerifyingLocation(false);
    }
  };

  if (setupStep > 0) {
    return (
      <div className={`animate-in fade-in slide-in-from-bottom-6 duration-500 py-6 h-full flex flex-col ${isTransitioning ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <p className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Step {setupStep} of 4</p>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              {setupStep === 1 && 'Basic Setup'}
              {setupStep === 2 && 'Pricing Strategy'}
              {setupStep === 3 && 'Shop Identity'}
              {setupStep === 4 && 'Ready to Print'}
            </h1>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`w-8 h-2 rounded-full transition-all duration-500 ${setupStep >= i ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-10">
          {setupStep === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 mb-6">
                  <div className="flex gap-3">
                    <i className="fa-solid fa-circle-info text-indigo-600 mt-1"></i>
                    <p className="text-[15px] text-indigo-900 leading-snug font-medium">
                      Tag your shop's official location so students can navigate to you using Google or Apple Maps.
                    </p>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <label htmlFor="shop-name" className="text-[15px] font-medium text-slate-700 ml-1">Shop display name</label>
                  <input 
                    id="shop-name"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-[52px] px-4 bg-white border-2 border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-slate-900 font-medium placeholder:text-slate-500" 
                    placeholder="e.g. Central Library Print Lab"
                  />
               </div>
               
               <div className="space-y-2">
                  <label htmlFor="shop-location" className="text-[15px] font-medium text-slate-700 ml-1">Physical location / Address</label>
                  <div className="relative">
                    <input 
                      id="shop-location"
                      value={formData.location} 
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      className="w-full h-[52px] px-4 bg-white border-2 border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-slate-900 font-medium placeholder:text-slate-500" 
                      placeholder="e.g. Main Block, Ground Floor"
                    />
                    <button 
                      onClick={verifyLocationWithAI}
                      disabled={!formData.name || !formData.location || isVerifyingLocation}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-3 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                    >
                      {isVerifyingLocation ? (
                        <i className="fa-solid fa-spinner animate-spin"></i>
                      ) : (
                        <i className="fa-solid fa-location-crosshairs"></i>
                      )}
                      {formData.mapsUrl ? 'Verified' : 'Verify'}
                    </button>
                  </div>
                  {formData.mapsUrl && (
                    <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5 mt-1 ml-1">
                      <i className="fa-solid fa-circle-check"></i>
                      Location linked to Google Maps
                    </p>
                  )}
               </div>
               
               <div className="space-y-3">
                  <label className="text-[15px] font-medium text-slate-700 ml-1">Number of active printers</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border-2 border-slate-200">
                    <button 
                      onClick={() => setFormData({...formData, printerCount: Math.max(1, formData.printerCount - 1)})} 
                      className="w-12 h-12 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:border-indigo-600 active:scale-95 transition-all shadow-sm"
                    >
                      <i className="fa-solid fa-minus"></i>
                    </button>
                    <span className="flex-1 text-center font-bold text-xl text-slate-900">
                      {formData.printerCount}
                    </span>
                    <button 
                      onClick={() => setFormData({...formData, printerCount: formData.printerCount + 1})} 
                      className="w-12 h-12 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:border-indigo-600 active:scale-95 transition-all shadow-sm"
                    >
                      <i className="fa-solid fa-plus"></i>
                    </button>
                  </div>
               </div>
            </div>
          )}

          {setupStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
               <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 mb-8">
                  <p className="text-[15px] text-amber-900 leading-relaxed font-medium">
                    Set your printing rates per page. PickIT uses these to calculate costs for students instantly.
                  </p>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'B/W (Single-sided)', key: 'bw_ss', icon: 'fa-file' },
                    { label: 'B/W (Double-sided)', key: 'bw_ds', icon: 'fa-copy' },
                    { label: 'Color (Single-sided)', key: 'color_ss', icon: 'fa-palette' },
                    { label: 'Color (Double-sided)', key: 'color_ds', icon: 'fa-layer-group' }
                  ].map(item => (
                    <div key={item.key} className="bg-white p-4 rounded-2xl border-2 border-slate-200 flex items-center justify-between shadow-sm focus-within:border-indigo-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                          <i className={`fa-solid ${item.icon}`}></i>
                        </div>
                        <span className="text-[15px] font-semibold text-slate-800">{item.label}</span>
                      </div>
                      <div className="relative w-24">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                        <input 
                          type="number"
                          value={formData.pricing[item.key as keyof typeof formData.pricing]}
                          onChange={e => setFormData({
                            ...formData, 
                            pricing: {...formData.pricing, [item.key]: parseFloat(e.target.value) || 0}
                          })}
                          className="w-full h-11 pl-8 pr-3 bg-slate-50 border-none rounded-lg font-bold text-right text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {setupStep === 3 && (
            <div className="text-center space-y-8 animate-in slide-in-from-right-4 duration-500">
               <div className="bg-white p-10 rounded-[3rem] premium-shadow border border-slate-200 relative overflow-hidden group">
                 <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl"></div>
                 <div className="w-48 h-48 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center mb-8 border-4 border-dashed border-indigo-200 group-hover:border-indigo-400 transition-colors duration-500 relative overflow-hidden">
                    <i className="fa-solid fa-qrcode text-6xl text-slate-300 absolute z-10"></i>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.1em]">Your unique shop ID</p>
                    <p className="text-3xl font-mono font-bold text-indigo-700 tracking-wider">{formData.id}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-3 mt-10">
                    <button className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all font-semibold">
                      <i className="fa-solid fa-download"></i>
                      <span className="text-[11px] uppercase tracking-wide">Download QR</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all font-semibold">
                      <i className="fa-solid fa-print"></i>
                      <span className="text-[11px] uppercase tracking-wide">Print sticker</span>
                    </button>
                 </div>
               </div>
               <p className="text-[15px] text-slate-600 px-6 leading-relaxed font-medium">
                 Students scan this QR to connect to your shop. We recommend printing a sticker for your shop counter.
               </p>
            </div>
          )}

          {setupStep === 4 && (
            <div className="text-center py-10 animate-in zoom-in duration-700 flex flex-col items-center justify-center">
               <div className="w-28 h-28 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center text-5xl mb-10 shadow-2xl shadow-emerald-200 rotate-6 hover:rotate-0 transition-transform duration-500">
                  <i className="fa-solid fa-rocket"></i>
               </div>
               <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">You're All Set!</h2>
               <p className="text-[16px] text-slate-600 px-8 leading-relaxed mb-8">
                 Your shop is now live and ready to accept digital print requests. Welcome to the future of campus printing.
               </p>
               <div className="w-full bg-white p-6 rounded-3xl border-2 border-slate-100 flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-700">
                    <i className="fa-solid fa-lightbulb"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Pro Tip</p>
                    <p className="text-[13px] text-slate-500 font-medium">You can update your pricing anytime from the Shop Menu.</p>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="pt-6 flex gap-4">
           {setupStep > 1 && setupStep < 4 && (
             <button 
                onClick={prevStep} 
                className="flex-1 h-[52px] border-2 border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all"
             >
                Back
             </button>
           )}
           <button 
             onClick={setupStep === 4 ? finishSetup : nextStep} 
             disabled={setupStep === 1 && (!formData.name || !formData.location)}
             className="flex-[2] h-[52px] bg-indigo-600 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all text-[16px]"
           >
             {setupStep === 3 ? 'Review & Finish' : setupStep === 4 ? 'Launch Job Board' : 'Continue'}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between mt-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job Board</h1>
          <div className="flex items-center gap-2 mt-1">
             <div className={`w-2.5 h-2.5 rounded-full ${shop.isPaused ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
             <p className="text-[12px] text-slate-600 font-bold uppercase tracking-wider">{shop.isPaused ? 'Requests Paused' : 'Accepting Jobs'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShop({...shop, isPaused: !shop.isPaused})}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm border-2 ${shop.isPaused ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
          >
            <i className={`fa-solid ${shop.isPaused ? 'fa-play' : 'fa-pause'}`}></i>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pb-24">
        {activeJob && activeJob.status !== JobStatus.PENDING_PAYMENT ? (
          <div className="bg-white rounded-[2rem] p-8 shadow-md border-2 border-slate-100 animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-700 text-xl shadow-sm">
                   <Icons.Print />
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-900 truncate max-w-[150px]">{activeJob.fileName}</h3>
                   <p className="text-[13px] text-slate-500 font-bold uppercase tracking-tight">{activeJob.pageCount} Pages • ₹{activeJob.cost}</p>
                 </div>
               </div>
               <div className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                 activeJob.status === JobStatus.READY ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                 activeJob.status === JobStatus.PRINTING ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                 'bg-indigo-100 text-indigo-800 border border-indigo-200'
               }`}>
                 {activeJob.status.replace('_', ' ')}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => updateJobStatus(activeJob.id, JobStatus.PRINTING)}
                disabled={activeJob.status === JobStatus.PRINTING || activeJob.status === JobStatus.READY}
                className="bg-amber-400 hover:bg-amber-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all text-[12px] uppercase tracking-wider"
              >
                Start Printing
              </button>
              <button 
                onClick={() => updateJobStatus(activeJob.id, JobStatus.READY)}
                disabled={activeJob.status === JobStatus.READY}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all text-[12px] uppercase tracking-wider"
              >
                Mark Ready
              </button>
            </div>
            {activeJob.status === JobStatus.READY && (
              <button 
                onClick={() => updateJobStatus(activeJob.id, JobStatus.COLLECTED)}
                className="w-full mt-4 bg-slate-900 text-white font-bold py-4 rounded-xl text-[12px] uppercase tracking-wider active:scale-95 transition-all shadow-xl"
              >
                Complete Collection
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border-4 border-dashed border-slate-100 rounded-[2.5rem]">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-3xl mb-6">
               <i className="fa-solid fa-inbox"></i>
             </div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[13px]">Queue is empty</p>
             <p className="text-slate-300 text-[12px] mt-1">New requests will appear here</p>
          </div>
        )}

        <div className="pt-8">
           <div className="flex items-center justify-between mb-5">
              <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">Closed Requests</p>
              <span className="text-[12px] font-bold text-slate-400">Today</span>
           </div>
           <div className="space-y-3">
              {jobHistory.length > 0 ? (
                jobHistory.map(job => (
                  <div key={job.id} className="bg-white p-4.5 rounded-2xl flex items-center justify-between border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <i className="fa-solid fa-check-double"></i>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-700 truncate">{job.fileName}</p>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                          ₹{job.cost.toFixed(2)} • Completed at {new Date(job.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] flex-shrink-0">
                      <i className="fa-solid fa-check"></i>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-medium italic">No requests completed yet today.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
