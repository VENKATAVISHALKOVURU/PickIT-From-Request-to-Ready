
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PrintJob, JobStatus, Shop } from '../types';
import { Icons } from '../constants';
import { Html5Qrcode } from 'html5-qrcode';
import { GoogleGenAI } from "@google/genai";

interface Props {
  activeJob: PrintJob | null;
  setActiveJob: (job: PrintJob | null) => void;
  shop: Shop;
  isStudentConnected: boolean;
  onConnectShop: (id: string) => void;
}

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: 'fa-brands fa-google-pay', color: 'text-blue-600' },
  { id: 'phonepe', name: 'PhonePe', icon: 'fa-solid fa-mobile-screen', color: 'text-purple-600' },
  { id: 'paytm', name: 'Paytm', icon: 'fa-solid fa-wallet', color: 'text-sky-500' },
  { id: 'bhim', name: 'BHIM UPI', icon: 'fa-solid fa-building-columns', color: 'text-orange-600' },
];

type ScanState = 'IDLE' | 'EXPLAINING' | 'SCANNING' | 'SUCCESS' | 'DENIED';

const StudentDashboard: React.FC<Props> = ({ activeJob, setActiveJob, shop, isStudentConnected, onConnectShop }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isDoubleSided, setIsDoubleSided] = useState(true);
  const [isColor, setIsColor] = useState(false);
  
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [paymentState, setPaymentState] = useState<'IDLE' | 'PROCESSING' | 'VERIFYING' | 'SUCCESS' | 'FAILED'>('IDLE');
  
  // AI Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analyzedImage, setAnalyzedImage] = useState<string | null>(null);

  // New Scan Logic States
  const [scanState, setScanState] = useState<ScanState>('IDLE');
  const [detectedShopName, setDetectedShopName] = useState<string>('');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // QR Scanning Lifecycle
  useEffect(() => {
    if (scanState === 'SCANNING') {
      const html5QrCode = new Html5Qrcode("qr-video-container");
      qrScannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
          const match = decodedText.match(/SHOP-[A-Z0-9]{6}/);
          if (match) {
            handleScanSuccess(match[0]);
          } else if (decodedText.includes('SHOP-')) {
             const idMatch = decodedText.match(/SHOP-[A-Z0-9]{6}/);
             if (idMatch) handleScanSuccess(idMatch[0]);
          }
        },
        () => {} 
      ).catch(err => {
        console.error("Camera start error", err);
        setScanState('DENIED');
      });

      return () => {
        if (qrScannerRef.current?.isScanning) {
          qrScannerRef.current.stop().catch(console.error);
        }
      };
    }
  }, [scanState]);

  const handleScanSuccess = async (shopId: string) => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      await qrScannerRef.current.stop();
    }
    setDetectedShopName("Campus Fast-Print Hub");
    setScanState('SUCCESS');
    setTimeout(() => {
      onConnectShop(shopId);
      setScanState('IDLE');
    }, 2000);
  };

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setScanState('SCANNING');
    } catch (err) {
      setScanState('DENIED');
    }
  };

  const handleImageAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      setIsAnalyzing(true);
      setAnalysisResult(null);

      reader.onload = async (ev) => {
        const base64Data = (ev.target?.result as string).split(',')[1];
        setAnalyzedImage(ev.target?.result as string);

        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64Data,
                  },
                },
                {
                  text: "You are a professional print quality assistant. Analyze this image for print quality. Check for resolution, legibility, and contrast for a campus shop. Provide specific advice to the student to ensure they get the best possible physical print. Keep it concise, professional, and helpful.",
                },
              ],
            },
          });

          setAnalysisResult(response.text || "No analysis available.");
        } catch (error) {
          console.error("AI Analysis failed", error);
          setAnalysisResult("Sorry, I couldn't analyze the image. Please check your connection and try again.");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentCost = useMemo(() => {
    let rate = 0;
    if (isColor) {
      rate = isDoubleSided ? shop.pricing.color_ds : shop.pricing.color_ss;
    } else {
      rate = isDoubleSided ? shop.pricing.bw_ds : shop.pricing.bw_ss;
    }
    return Math.max(0, rate * 15);
  }, [isColor, isDoubleSided, shop]);

  const etaTime = useMemo(() => {
    const baseTime = activeJob ? activeJob.timestamp : Date.now();
    const waitTime = activeJob ? activeJob.expectedTimeMinutes : 8;
    const date = new Date(baseTime + waitTime * 60000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [activeJob]);

  const openInMaps = () => {
    if (!shop.location) return;
    const query = encodeURIComponent(`${shop.name}, ${shop.location}`);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const mapsUri = shop.mapsUrl || (isIOS 
      ? `http://maps.apple.com/?daddr=${query}`
      : `https://www.google.com/maps/dir/?api=1&destination=${query}`);
    window.open(mapsUri, '_blank');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (shop.isPaused) return;
    if (e.target.files && e.target.files[0]) {
      const fileName = e.target.files[0].name;
      setIsUploading(true);
      setUploadProgress(10); 
      
      let progress = 10;
      const interval = setInterval(() => {
        const increment = 10 + Math.floor(Math.random() * 20);
        progress = Math.min(progress + increment, 95); 
        setUploadProgress(progress);
        
        if (progress >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(100);
            setTimeout(() => {
              const newJob: PrintJob = {
                id: 'JOB-' + Math.floor(Math.random() * 10000),
                fileName: fileName,
                pageCount: 15,
                isColor,
                isDoubleSided,
                status: JobStatus.PENDING_PAYMENT,
                timestamp: Date.now(),
                expectedTimeMinutes: 8,
                cost: currentCost,
                shopId: shop.id
              };
              setActiveJob(newJob);
              setIsUploading(false);
              setUploadProgress(0);
            }, 400);
          }, 400);
        }
      }, 300);
    }
  };

  const triggerUpiRedirect = (appId: string) => {
    if (!activeJob) return;
    setPaymentState('PROCESSING');
    setTimeout(() => {
      setPaymentState('VERIFYING');
      setTimeout(() => {
        handlePaymentSuccess();
      }, 2000);
    }, 1500);
  };

  const handlePaymentSuccess = () => {
    setPaymentState('SUCCESS');
    setTimeout(() => {
      if (activeJob) {
        setActiveJob({ 
          ...activeJob, 
          status: JobStatus.IN_QUEUE, 
          timestamp: Date.now() 
        });
      }
      setPaymentState('IDLE');
      setShowUpiModal(false);
    }, 2500);
  };

  const handleToggleSide = (val: boolean) => {
    setIsDoubleSided(val);
    if (val === false) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  const renderETADisplay = (minutes: number, status: JobStatus) => {
    const isReady = status === JobStatus.READY;
    const isPrinting = status === JobStatus.PRINTING;
    const radius = 90;
    const strokeWidth = 3;
    const circumference = 2 * Math.PI * radius;
    const arcLength = (240 / 360) * circumference;
    const progress = isReady ? 1 : isPrinting ? 0.6 : 0.2;
    const offset = arcLength * (1 - progress);

    return (
      <div className="relative w-64 h-64 mx-auto flex items-center justify-center animate-in fade-in duration-700">
        <svg className="w-full h-full rotate-[150deg]" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={`${arcLength} ${circumference}`} className="text-slate-100" />
          <circle cx="100" cy="100" r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={`${arcLength} ${circumference}`} strokeDashoffset={offset} strokeLinecap="round" className={`${isReady ? 'text-emerald-500' : 'text-indigo-600'} transition-all duration-1000 ease-out`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pt-2">
          {isReady ? (
            <div className="flex flex-col items-center animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl shadow-xl shadow-emerald-100 mb-4">
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Ready to Collect</h3>
              <p className="text-sm text-slate-400 mt-1">Visit Counter A</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold uppercase tracking-wider mb-6 border border-emerald-100">
                <i className="fa-solid fa-check text-[10px]"></i>
                On Time
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Estimated Ready</p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{etaTime}</h2>
              <p className="text-sm font-medium text-slate-400 mt-1">~{minutes} minutes left</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isStudentConnected) {
    if (scanState === 'SUCCESS') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
           <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center text-5xl mb-8 shadow-2xl shadow-emerald-200 animate-in zoom-in duration-500">
             <i className="fa-solid fa-check"></i>
           </div>
           <h2 className="text-2xl font-bold text-slate-900 mb-2">Connected!</h2>
           <p className="text-slate-500 font-medium">{detectedShopName}</p>
        </div>
      );
    }

    if (scanState === 'SCANNING' || scanState === 'EXPLAINING' || scanState === 'DENIED') {
      return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
          <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
             <button onClick={() => setScanState('IDLE')} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center"><i className="fa-solid fa-chevron-left"></i></button>
             <h3 className="font-bold text-slate-900">Connect to Shop</h3>
             <div className="w-10 h-10"></div>
          </header>

          <main className="flex-1 flex flex-col p-8 overflow-hidden">
            {scanState === 'EXPLAINING' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                 <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl mb-10 shadow-sm border border-indigo-100/50">
                    <i className="fa-solid fa-camera"></i>
                 </div>
                 <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Camera Access</h2>
                 <p className="text-slate-500 font-medium px-4 leading-relaxed mb-12">
                   We need camera access to scan the shop QR code. Your video feed is never stored or transmitted.
                 </p>
                 <button 
                  onClick={requestCamera}
                  className="w-full py-5 bg-indigo-600 text-white font-bold rounded-[2rem] shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                 >
                   Enable Camera
                 </button>
              </div>
            )}

            {scanState === 'SCANNING' && (
              <div className="flex-1 flex flex-col animate-in fade-in duration-500">
                 <div className="flex-1 relative rounded-[3rem] overflow-hidden bg-slate-900 border-4 border-slate-100 shadow-2xl">
                    <div id="qr-video-container" className="w-full h-full object-cover"></div>
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                       <div className="w-64 h-64 border-2 border-white/50 rounded-[2.5rem] relative">
                          <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-indigo-500 rounded-tl-[1.5rem]"></div>
                          <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-indigo-500 rounded-tr-[1.5rem]"></div>
                          <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-indigo-500 rounded-bl-[1.5rem]"></div>
                          <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-indigo-500 rounded-br-[1.5rem]"></div>
                          <div className="absolute top-0 left-4 right-4 h-0.5 bg-indigo-400/50 blur-[2px] animate-bounce-slow"></div>
                       </div>
                    </div>
                 </div>
                 <p className="mt-10 text-center text-slate-400 font-bold uppercase tracking-[0.2em] text-[11px]">Align QR inside the frame</p>
              </div>
            )}

            {scanState === 'DENIED' && (
               <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center text-3xl mb-10 shadow-sm border border-rose-100/50">
                     <i className="fa-solid fa-lock"></i>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Access Denied</h2>
                  <p className="text-slate-500 font-medium px-4 leading-relaxed mb-12">
                    Camera access is required to scan the shop QR. Please enable it in your browser settings.
                  </p>
                  <button 
                    onClick={requestCamera}
                    className="w-full py-5 bg-rose-600 text-white font-bold rounded-[2rem] shadow-xl shadow-rose-100 active:scale-95 transition-all"
                  >
                    Try Again
                  </button>
               </div>
            )}
          </main>
          
          <footer className="p-10 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Privacy Guaranteed • PickIT SSL
          </footer>
        </div>
      );
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col items-center justify-center py-10">
        <Icons.Logo className="h-12 w-auto mb-12" />
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-center px-4">Ready to Print?</h1>
        <p className="text-slate-500 text-[15px] font-medium text-center mt-3 px-8 leading-relaxed mb-12">
          Connect to a local shop by scanning their digital counter QR code.
        </p>

        <button 
          onClick={() => setScanState('EXPLAINING')}
          className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[2rem] shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <i className="fa-solid fa-qrcode"></i>
          Scan Shop QR
        </button>
      </div>
    );
  }

  if (paymentState === 'SUCCESS') {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 text-center">
        <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center text-white text-5xl mb-10 shadow-2xl shadow-emerald-200 animate-in zoom-in duration-500">
          <i className="fa-solid fa-check"></i>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 px-6 py-2 rounded-full mb-6">
           <span className="text-emerald-700 font-bold uppercase tracking-[0.2em] text-[11px]">Payment Confirmed</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Processing Order</h2>
        <p className="text-slate-400 text-sm font-medium">Your documents are being sent to {shop.name}.</p>
      </div>
    );
  }

  if (!activeJob) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
        <div className="flex items-center justify-between mt-6 mb-8">
           <div>
             <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Request</h1>
             <p className="text-slate-500 text-sm font-medium">at {shop.name}</p>
           </div>
           {!shop.isPaused ? (
             <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">SHOP LIVE</span>
           ) : (
             <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full border border-rose-100">PAUSED</span>
           )}
        </div>
        
        {shop.isPaused ? (
          <div className="bg-rose-50/50 rounded-[2.5rem] p-10 border border-rose-100 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-rose-500 text-3xl mb-6 shadow-sm"><i className="fa-solid fa-store-slash"></i></div>
             <h3 className="text-xl font-bold text-rose-900 mb-2">Shop is currently paused</h3>
             <p className="text-sm text-rose-600 font-medium px-4">The shop is temporarily not accepting new digital requests.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-12 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group hover:border-indigo-300 transition-colors cursor-pointer">
            {isUploading ? (
              <div className="w-full py-4 text-center">
                <p className="text-indigo-600 font-bold mb-4 text-sm">Uploading {Math.floor(uploadProgress)}%</p>
                <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] shadow-[0_0_10px_rgba(79,70,229,0.4)]" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl mb-4 group-hover:scale-110 transition-transform"><Icons.Upload /></div>
                <p className="text-slate-900 font-bold">Upload document</p>
                <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-widest">PDF, DOCX up to 25MB</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
              </>
            )}
          </div>
        )}

        {/* AI Analysis Tool */}
        <div className="mt-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">
               <Icons.Sparkle />
             </div>
             <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
               AI Pre-Print Check
               <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Powered by Gemini</span>
             </h3>
             <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
               Unsure about image quality? Let our AI analyze legibility and resolution before you pay.
             </p>
             
             {!isAnalyzing && !analysisResult ? (
               <label className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-2xl font-bold text-sm cursor-pointer hover:bg-indigo-50 transition-colors shadow-lg active:scale-95">
                 <Icons.Scanner />
                 Check Image Quality
                 <input type="file" className="hidden" accept="image/*" onChange={handleImageAnalysis} />
               </label>
             ) : isAnalyzing ? (
               <div className="flex items-center gap-4 py-3">
                  <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <p className="text-sm font-bold animate-pulse">Analyzing pixels...</p>
               </div>
             ) : (
               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">AI Report</p>
                    <button onClick={() => {setAnalysisResult(null); setAnalyzedImage(null);}} className="text-white/60 hover:text-white transition-colors">
                      <i className="fa-solid fa-rotate-right"></i>
                    </button>
                  </div>
                  <div className="flex gap-4 mb-4">
                    {analyzedImage && <img src={analyzedImage} alt="Analyzed" className="w-16 h-16 rounded-lg object-cover border border-white/20" />}
                    <div className="text-[13px] font-medium leading-relaxed max-h-32 overflow-y-auto">
                      {analysisResult}
                    </div>
                  </div>
                  <p className="text-[10px] text-white/40 italic font-medium">* Analysis based on digital preview quality.</p>
               </div>
             )}
          </div>
        </div>

        {!shop.isPaused && (
          <div className="mt-8 space-y-6">
            <div className="bg-white rounded-[2rem] p-7 border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Icons.Settings /></div>
                  <h2 className="font-bold text-slate-800">Print Options</h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">TOTAL</p>
                  <span className="text-indigo-600 font-bold text-2xl">₹{currentCost}.00</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-medium text-slate-700 ml-1">Color Palette</label>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button onClick={() => setIsColor(true)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isColor ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Full Color</button>
                    <button onClick={() => setIsColor(false)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isColor ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Grayscale</button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-medium text-slate-700 ml-1">Print Layout</label>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button onClick={() => handleToggleSide(false)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isDoubleSided ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Single Sided</button>
                    <button onClick={() => handleToggleSide(true)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isDoubleSided ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Double Sided</button>
                  </div>
                </div>
              </div>
            </div>

            {showToast && (
              <div className="fixed bottom-24 left-4 right-4 z-50 bg-slate-900 text-white p-5 rounded-[1.5rem] premium-shadow flex items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-500">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0 text-lg"><Icons.Sparkle /></div>
                <div>
                  <p className="text-xs font-bold leading-tight">✨ AI Savings Tip</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Choosing double-sided saves you ₹20 on this job.</p>
                </div>
              </div>
            )}

            <button disabled={isUploading} className="w-full bg-indigo-600 disabled:bg-slate-300 text-white font-bold py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all">
              {isUploading ? 'Preparing Request...' : 'Review & Pay'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (activeJob.status === JobStatus.PENDING_PAYMENT) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500 py-6">
        <button onClick={() => setActiveJob(null)} className="flex items-center gap-2 mb-8 text-indigo-600 font-bold text-sm">
          <i className="fa-solid fa-arrow-left"></i><span>Modify Options</span>
        </button>
        <div className="text-center py-6">
          <p className="text-slate-400 text-sm font-medium mb-1">Estimated Ready Time</p>
          <h2 className="text-6xl font-bold text-slate-900 tracking-tighter">{etaTime}</h2>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[11px] font-bold">
             <i className="fa-solid fa-check text-[10px]"></i> ON-TIME GUARANTEE
          </div>
        </div>
        <div className="mt-8 bg-white rounded-[2.5rem] p-8 border border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-slate-900 text-lg">Bill Summary</h3>
            <span className="text-indigo-600 font-bold text-3xl">₹{activeJob.cost}.00</span>
          </div>
          <div className="p-5 bg-slate-50 rounded-[2rem] flex items-center gap-5 border border-slate-100/50">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-400 shadow-sm text-xl"><i className="fa-solid fa-file-pdf"></i></div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{activeJob.fileName}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">15 Pages • {activeJob.isDoubleSided ? 'Double' : 'Single'}</p>
            </div>
          </div>
        </div>
        
        <button onClick={() => setShowUpiModal(true)} className="w-full mt-10 bg-indigo-600 text-white font-bold py-5 rounded-[2rem] shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-3">
          <i className="fa-solid fa-bolt-lightning text-sm"></i> Pay with UPI
        </button>

        {showUpiModal && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => paymentState === 'IDLE' && setShowUpiModal(false)}></div>
            <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
              {paymentState === 'IDLE' ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Select UPI App</h3>
                    <button onClick={() => setShowUpiModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {UPI_APPS.map(app => (
                      <button key={app.id} onClick={() => triggerUpiRedirect(app.id)} className="flex flex-col items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-3xl hover:border-indigo-200 transition-all group">
                        <div className={`w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl ${app.color} group-hover:scale-110 transition-transform`}><i className={app.icon}></i></div>
                        <span className="text-xs font-bold text-slate-700">{app.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-10 text-center flex flex-col items-center">
                   <div className="w-20 h-20 mb-6 relative">
                      <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 mb-2">{paymentState === 'PROCESSING' ? 'Opening App...' : 'Verifying...'}</h3>
                   <p className="text-sm text-slate-400 font-medium">Please do not close this window.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 py-6 h-full">
       <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-white/50 relative overflow-hidden">
         <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-50/20 rounded-full blur-[100px]"></div>
         {renderETADisplay(activeJob.status === JobStatus.READY ? 0 : 8, activeJob.status)}
       </div>
       
       {activeJob.status === JobStatus.READY && (
          <div className="mt-10 bg-indigo-600 p-8 rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-10 duration-700">
             <div className="flex items-center gap-6 mb-8 text-white">
               <div className="w-18 h-18 bg-white/10 rounded-3xl flex items-center justify-center text-3xl backdrop-blur-xl border border-white/20"><i className="fa-solid fa-qrcode"></i></div>
               <div>
                 <p className="font-bold text-2xl tracking-tight">Ready for Pickup</p>
                 <p className="text-indigo-100 text-[11px] font-bold uppercase tracking-widest">ID: {activeJob.id.split('-')[1]}</p>
               </div>
             </div>
             <button className="w-full bg-white text-indigo-600 font-bold py-5 rounded-[1.5rem] active:scale-95 transition-all">Show QR to Shop</button>
          </div>
       )}
       
       <div className="mt-8 p-6 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg"><i className="fa-solid fa-store"></i></div>
            <div>
              <p className="text-sm font-bold text-slate-800">{shop.name}</p>
              <p className="text-xs text-slate-400 font-medium line-clamp-1">{shop.location}</p>
            </div>
          </div>
          <button 
            onClick={openInMaps}
            className="w-10 h-10 rounded-xl bg-slate-50 text-indigo-600 flex items-center justify-center border border-slate-100 hover:bg-white hover:shadow-sm transition-all"
            title="Directions"
          >
            <i className="fa-solid fa-map-location-dot"></i>
          </button>
       </div>
    </div>
  );
};

export default StudentDashboard;
