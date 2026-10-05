import React, { useState } from 'react';
import { Smartphone, Download, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'floating' | 'banner' | 'footer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstalled, isInstallable, isIOS } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running in standalone mode (installed app), suppress button
  if (isInstalled) {
    return null;
  }

  if (variant === 'header') {
    return (
      <>
        <button
          id="pwa-install-header-btn"
          type="button"
          onClick={() => setShowModal(true)}
          className={`relative inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/80 hover:border-amber-400/50 rounded-lg text-xs font-bold transition shadow-sm active:scale-95 group ${className}`}
          title="Instalar App no iPhone ou Android"
          aria-label="Instalar App no iPhone ou Android"
        >
          <Smartphone className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Baixar App</span>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-amber-400/20 text-amber-300 font-extrabold uppercase border border-amber-400/30">
            {isIOS ? 'iPhone' : 'App'}
          </span>
        </button>

        <PWAInstallModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  if (variant === 'floating') {
    return (
      <>
        <button
          id="pwa-install-floating-btn"
          type="button"
          onClick={() => setShowModal(true)}
          className={`fixed bottom-6 left-4 sm:left-6 z-40 p-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold shadow-xl shadow-amber-400/25 flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all group border border-amber-300/40 ${className}`}
          title="Instalar App no Telemóvel"
          aria-label="Instalar App no Telemóvel"
        >
          <Smartphone className="w-5 h-5 text-neutral-950" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-black pl-0 group-hover:pl-2">
            Instalar App
          </span>
        </button>

        <PWAInstallModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={className}
      >
        <Smartphone className="w-4 h-4 text-amber-400" />
        <span>Instalar App no Telemóvel</span>
      </button>

      <PWAInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
