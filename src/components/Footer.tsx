import React from 'react';
import { MessageCircle, Instagram, Github, Heart, Lock } from 'lucide-react';
import { StoreConfig } from '../types';

interface FooterProps {
  config: StoreConfig;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ config, onOpenAdmin }) => {
  return (
    <footer id="main-footer" className="bg-neutral-950 border-t border-neutral-800 text-neutral-400 text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-400 text-neutral-950 flex items-center justify-center font-black text-sm rounded">
                ST
              </div>
              <span className="text-xl font-black text-white tracking-widest font-['Cabinet_Grotesk',sans-serif]">
                {config.storeName}
              </span>
            </div>
            <p className="text-neutral-400 max-w-sm leading-relaxed">
              Marca de roupa focada em streetwear, T-shirts oversized de alta gramatura e chapéus/bonés autênticos.
              Design autêntico, corte contemporâneo e encomenda direta pelo WhatsApp.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={`https://api.whatsapp.com/send?phone=${config.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-neutral-900 hover:bg-emerald-950 text-emerald-400 border border-neutral-800 transition"
                title="Conversar no WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              {config.instagramHandle && (
                <a
                  href={`https://instagram.com/${config.instagramHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-pink-950 text-pink-400 border border-neutral-800 transition"
                  title="Instagram da Marca"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Produtos Strong</h4>
            <ul className="space-y-1.5 text-neutral-400">
              <li>
                <a href="#catalog-grid" className="hover:text-amber-400 transition">T-shirts Oversized</a>
              </li>
              <li>
                <a href="#catalog-grid" className="hover:text-amber-400 transition">Bucket Hats & Chapéus</a>
              </li>
              <li>
                <a href="#catalog-grid" className="hover:text-amber-400 transition">Bonés Trucker & 5-Panel</a>
              </li>
              <li>
                <a href="#catalog-grid" className="hover:text-amber-400 transition">Moletom Heavyweight</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Support & Orders */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Apoio & Encomendas</h4>
            <ul className="space-y-1.5 text-neutral-400 text-xs">
              <li className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Pedidos Diretos no WhatsApp</span>
              </li>
              <li>Entregas rápidas em Luanda</li>
              <li>Envios para todas as províncias</li>
              <li>Multicaixa Express & Transferência</li>
              <li className="text-[11px] text-neutral-500 pt-1">Atendimento: Seg. a Sáb. 09h – 19h</li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
          <div className="flex items-center gap-2">
            <p>© {new Date().getFullYear()} {config.storeName} Apparel. Todos os direitos reservados.</p>
            {/* Discreet admin lock for store owner — unobtrusive to regular buyers */}
            <button
              id="discreet-admin-lock-btn"
              onClick={onOpenAdmin}
              className="text-neutral-700 hover:text-amber-400 transition-colors p-1 rounded focus:outline-none"
              title="Acesso Restrito"
              aria-label="Acesso Restrito"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Github className="w-3.5 h-3.5" />
            <span>Pronto para GitHub Pages / Hosting Estático</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
