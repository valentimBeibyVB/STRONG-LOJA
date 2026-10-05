import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Zap,
  ShoppingBag,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  storeName = 'STRONG',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  // Default tab based on user agent
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>(isIOS ? 'ios' : 'android');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadApkSuccess, setDownloadApkSuccess] = useState(false);

  // Sync activeTab when modal opens based on user agent
  useEffect(() => {
    if (isOpen) {
      setActiveTab(isIOS ? 'ios' : 'android');
    }
  }, [isOpen, isIOS]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://strong-loja.com';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleDownloadAPK = () => {
    const link = document.createElement('a');
    link.href = './strong-app.apk';
    link.download = 'strong-app.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadApkSuccess(true);
    setTimeout(() => setDownloadApkSuccess(false), 5000);
  };

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    if (isInstallable) {
      const success = await install();
      setIsInstalling(false);
      if (success) {
        onClose();
        return;
      }
    }
    // If native prompt is not active, trigger the APK download
    setIsInstalling(false);
    handleDownloadAPK();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn py-4 sm:py-8">
      {/* Backdrop click to dismiss */}
      <div
        className="fixed inset-0 bg-black/75 transition-opacity"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] my-auto z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-neutral-800 to-neutral-900 border-b border-neutral-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-950/60 hover:bg-neutral-800 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl overflow-hidden bg-neutral-950 border border-amber-400/30 p-0.5 shadow-lg shadow-amber-400/10 shrink-0">
              <img
                src="./pwa-192x192.png"
                alt={storeName}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = './strong-logo.jpg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-amber-400 text-neutral-950">
                  App Oficial PWA
                </span>
                {isInstalled && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Instalado
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Instalar App no Telemóvel
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Acesse a loja em ecrã inteiro no iPhone ou Android como um app nativo
              </p>
            </div>
          </div>

          {/* Quick Platform Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                activeTab === 'android'
                  ? 'bg-amber-400 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android (Samsung, etc.)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                activeTab === 'ios'
                  ? 'bg-amber-400 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.84.94-2.91-.91.04-2.02.61-2.67 1.37-.58.67-1.09 1.76-.95 2.81 1.02.08 2.05-.5 2.68-1.27z" />
              </svg>
              <span>iPhone / iPad (iOS)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* ANDROID INSTRUCTIONS */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              {/* Direct 1-Click Install Button & Direct APK Download Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-400/20 via-neutral-900 to-neutral-900 border border-amber-400/50 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Instalação do Aplicativo Android</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                    APK & PWA
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Acede à loja oficial da <strong className="text-white">{storeName}</strong> em ecrã inteiro no teu smartphone Android com acesso instantâneo.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Primary 1-Click Install Button */}
                  <button
                    type="button"
                    onClick={handleDirectInstall}
                    disabled={isInstalling}
                    className="w-full py-3 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition transform active:scale-98 disabled:opacity-50"
                  >
                    <Smartphone className="w-4 h-4 stroke-[2.5]" />
                    <span>{isInstalling ? 'A Instalar...' : 'Instalar App no Android'}</span>
                  </button>

                  {/* Direct APK Download Button */}
                  <button
                    type="button"
                    onClick={handleDownloadAPK}
                    className="w-full py-3 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-neutral-700 hover:border-amber-400/60 shadow-md transition transform active:scale-98"
                  >
                    <Download className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                    <span>{downloadApkSuccess ? 'Download Iniciado!' : 'Descarregar APK (.apk)'}</span>
                  </button>
                </div>

                {downloadApkSuccess && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium pt-1">
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Download de <strong>strong-app.apk</strong> iniciado! Abre o ficheiro para instalar.</span>
                  </p>
                )}
              </div>

              {/* Step-by-Step Android Guide */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Como instalar pelo Google Chrome (Android):
                </h3>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="w-7 h-7 rounded-lg bg-neutral-800 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">Abra o site no Google Chrome</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Acesse a loja pelo navegador Chrome no seu telemóvel Android.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="w-7 h-7 rounded-lg bg-neutral-800 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">Toque no menu de 3 pontinhos (⋮)</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Fica localizado no canto superior direito do seu navegador.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-neutral-950 font-black text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">
                        Toque em &quot;Instalar aplicativo&quot; ou &quot;Adicionar ao ecrã inicial&quot;
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Confirme e em segundos o ícone da <strong className="text-white">STRONG</strong> aparecerá na tela do seu aparelho como um app normal!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IPHONE (iOS) INSTRUCTIONS */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span>
                  No iPhone (iOS), a Apple permite instalar qualquer site como App diretamente pelo navegador <strong>Safari</strong>, sem precisar de aprovação da App Store.
                </span>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Passo a Passo no Safari (iPhone):
                </h3>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                      Toque no botão de Partilhar
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 text-[10px]">
                        <Share2 className="w-3 h-3 inline mr-1" /> Partilhar
                      </span>
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Localizado na barra inferior do Safari (o quadrado com uma seta a apontar para cima).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                      Deslize para baixo e toque em
                    </p>
                    <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-800 text-white font-bold text-xs border border-neutral-700">
                      <PlusSquare className="w-3.5 h-3.5 text-amber-400" />
                      <span>Adicionar ao Ecrã Principal</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      (Em inglês: <em>&quot;Add to Home Screen&quot;</em>)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-neutral-950 font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">Toque em &quot;Adicionar&quot; no canto superior</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      O aplicativo <strong className="text-white">STRONG</strong> será colocado no seu ecrã de início com o ícone oficial da marca!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vantagens do App */}
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Vantagens do App Instalado:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Carregamento instantâneo</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Sem barra de navegador</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Carrinho sempre à mão</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Funciona em tela cheia</span>
              </div>
            </div>
          </div>

          {/* Link para Partilhar com Clientes ou Abrir no Telemóvel */}
          <div className="pt-2 border-t border-neutral-800">
            <label className="block text-xs font-bold text-neutral-400 mb-1.5">
              Link da Loja para abrir no telemóvel ou enviar aos clientes:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 text-xs font-bold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center gap-1.5 shrink-0 transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-3">
          <p className="text-[11px] text-neutral-500">
            Totalmente gratuito e seguro. Não ocupa espaço pesado.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
