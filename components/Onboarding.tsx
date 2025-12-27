
import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { Icons } from '../constants';

interface Props {
  onFinish: (role: UserRole, profile: UserProfile) => void;
}

type OnboardingStep = 'WELCOME' | 'ROLE' | 'DETAILS' | 'PHOTO';

const Onboarding: React.FC<Props> = ({ onFinish }) => {
  const [step, setStep] = useState<OnboardingStep>('WELCOME');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ name: '', contact: '' });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('DETAILS');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setPhotoPreview(url);
        setProfile({ ...profile, photoUrl: url });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'PK';
  };

  const isDetailsValid = profile.name.trim().length > 0 && profile.contact.trim().length > 0;

  // Progress Bar Helper
  const renderProgress = (current: number) => (
    <div className="flex gap-2 mb-8">
      {[1, 2, 3].map(i => (
        <div key={i} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${current >= i ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
      ))}
    </div>
  );

  if (step === 'WELCOME') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
        <Icons.Logo className="h-16 w-auto mb-12" />
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">Welcome to PickIT</h1>
        <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12 px-6">
          The professional digital queue <br /> for campus printing.
        </p>
        <button 
          onClick={() => setStep('ROLE')}
          className="w-full max-w-xs py-5 bg-indigo-600 text-white font-bold rounded-[2rem] shadow-xl active:scale-95 transition-all text-lg"
        >
          Get Started
        </button>
      </div>
    );
  }

  if (step === 'ROLE') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col p-8 animate-in slide-in-from-right duration-500">
        <div className="mt-12 mb-8">
          <Icons.Logo className="h-8 w-auto mb-8" />
          {renderProgress(1)}
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">How will you use PickIT?</h2>
          <p className="text-slate-500 font-medium">This selection is mandatory to proceed.</p>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={() => handleRoleSelect(UserRole.STUDENT)}
            className="w-full p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] text-left hover:border-indigo-600 transition-all group flex items-center justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-xl mb-4 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Continue as Student</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Upload files, track, and pay.</p>
            </div>
            <div className="text-slate-200 group-hover:text-indigo-600 transition-colors"><Icons.ChevronRight /></div>
          </button>
          
          <button 
            onClick={() => handleRoleSelect(UserRole.OWNER)}
            className="w-full p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] text-left hover:border-indigo-600 transition-all group flex items-center justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 text-xl mb-4 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-store"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Continue as Owner</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Manage jobs and earnings.</p>
            </div>
            <div className="text-slate-200 group-hover:text-indigo-600 transition-colors"><Icons.ChevronRight /></div>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'DETAILS') {
    return (
      <div className="min-h-screen bg-white flex flex-col p-8 animate-in slide-in-from-right duration-500">
        <div className="mt-12 mb-8">
          <button onClick={() => setStep('ROLE')} className="text-slate-400 hover:text-indigo-600 transition-colors mb-6 flex items-center gap-2 font-bold text-sm">
            <i className="fa-solid fa-arrow-left"></i> Back
          </button>
          {renderProgress(2)}
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Registration</h2>
          <p className="text-slate-500 font-medium">Used for identification and communication.</p>
        </div>
        
        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input 
              type="text" 
              autoFocus
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              placeholder="e.g. Varun Reddy"
              className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email or Phone Number</label>
            <input 
              type="text" 
              value={profile.contact}
              onChange={e => setProfile({ ...profile, contact: e.target.value })}
              placeholder="e.g. varun@college.edu"
              className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all"
            />
          </div>
        </div>

        <div className="pt-10">
          <button 
            onClick={() => setStep('PHOTO')}
            disabled={!isDetailsValid}
            className="w-full py-5 bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold rounded-[2rem] shadow-xl active:scale-95 transition-all"
          >
            Next Step
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col p-8 animate-in slide-in-from-right duration-500">
      <div className="mt-12 mb-8">
        <button onClick={() => setStep('DETAILS')} className="text-slate-400 hover:text-indigo-600 transition-colors mb-6 flex items-center gap-2 font-bold text-sm">
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>
        {renderProgress(3)}
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Profile Photo</h2>
        <p className="text-slate-500 font-medium">Would you like to add a profile photo?</p>
      </div>
      
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="relative group mb-8">
          <div className="w-40 h-40 rounded-[3rem] border-4 border-slate-50 shadow-xl overflow-hidden bg-slate-50 flex items-center justify-center text-indigo-300">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-5xl font-bold opacity-30">{getInitials(profile.name)}</span>
                <i className="fa-solid fa-image-portrait absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5 pointer-events-none"></i>
              </div>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-2xl hover:bg-indigo-700 transition-colors border-4 border-white">
            <i className="fa-solid fa-camera text-xl"></i>
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </label>
        </div>
        
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center">
          {photoPreview ? 'Looking good!' : 'Add a photo to build trust'}
        </p>
      </div>

      <div className="pt-10 space-y-3">
        <button 
          onClick={() => onFinish(selectedRole!, profile)}
          className="w-full py-5 bg-indigo-600 text-white font-bold rounded-[2rem] shadow-xl active:scale-95 transition-all"
        >
          {photoPreview ? 'Finish & Continue' : 'Finish Without Photo'}
        </button>
        {!photoPreview && (
          <button 
            onClick={() => onFinish(selectedRole!, profile)}
            className="w-full py-4 text-slate-400 font-bold hover:text-indigo-600 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
