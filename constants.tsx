
import React from 'react';

export const COLORS = {
  primary: '#4F46E5', // Indigo-600
  secondary: '#1E293B', // Navy (from logo)
  success: '#10B981', // Emerald-500
  action: '#FBBF24', // Amber-400
  background: '#F8FAFC'
};

export const Icons = {
  Upload: () => <i className="fa-solid fa-cloud-arrow-up"></i>,
  Print: () => <i className="fa-solid fa-print"></i>,
  Check: () => <i className="fa-solid fa-circle-check"></i>,
  Clock: () => <i className="fa-solid fa-clock"></i>,
  Menu: () => <i className="fa-solid fa-bars"></i>,
  ChevronRight: () => <i className="fa-solid fa-chevron-right"></i>,
  Sparkle: () => <i className="fa-solid fa-wand-magic-sparkles"></i>,
  Settings: () => <i className="fa-solid fa-sliders"></i>,
  Shop: () => <i className="fa-solid fa-shop"></i>,
  Scanner: () => <i className="fa-solid fa-magnifying-glass-chart"></i>,
  Logo: ({ className }: { className?: string }) => (
    <svg className={className} width="140" height="40" viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="17" fill="#1E293B"/>
      <path d="M11 20L17 26L29 14" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="45" y="28" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="24" fill="#1E293B">Pick</text>
      <text x="96" y="28" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="24" fill="#10B981">IT</text>
    </svg>
  )
};
