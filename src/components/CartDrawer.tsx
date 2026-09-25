import React, { useState } from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  MessageCircle,
  ArrowRight,
  Check,
  Copy,
  User,
  MapPin,
  FileText,
  Smartphone,
  ShieldCheck,
  Info,
  AlertCircle,
} from 'lucide-react';
import { CartItem, CheckoutCustomerInfo, StoreConfig } from '../types';
import {
  formatPrice,
  generateWhatsAppOrderUrl,
  openWhatsAppUrl,
} from '../utils/whatsapp';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  config: StoreConfig;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  config,
}) => {
  const [customerInfo, setCustomerInfo] = useState<CheckoutCustomerInfo>({
    name: '',
    phone: '',
    city: '',
    notes: '',
    paymentMethod: 'Multicaixa Express',
    expressSenderPhone: '',
    expressSenderName: '',
  });

  const [showCustomerForm, setShowCustomerForm] = useState(true);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [copiedExpressPhone, setCopiedExpressPhone] = useState(false);
  const [copiedExpressIban, setCopiedExpressIban] = useState(false);
  const [showIbanDetails, setShowIbanDetails] = useState(false);
  const [expressPhoneError, setExpressPhoneError] = useState<string | null>(null);
  const [showPhoneConfirmModal, setShowPhoneConfirmModal] = useState(false);

  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const expressPhone = (config.expressPhoneNumber || '944986967').trim();
  const expressHolder = (config.expressAccountHolder || 'GILBERTO LOURENÇO GOLAMBOLE').trim();

  const handleCopyExpressPhone = () => {
    navigator.clipboard.writeText(expressPhone.replace(/\s+/g, ''));
    setCopiedExpressPhone(true);
    setTimeout(() => setCopiedExpressPhone(false), 2000);
  };

  const handleCopyExpressIban = () => {
    if (!config.expressIban) return;
    navigator.clipboard.writeText(config.expressIban.replace(/\s+/g, ''));
    setCopiedExpressIban(true);
    setTimeout(() => setCopiedExpressIban(false), 2000);
  };

  const handleInitiateCheckout = () => {
    if (items.length === 0) return;

    if (isExpressSelected) {
      const rawNumber = (customerInfo.expressSenderPhone || '').trim();
      const digitsOnly = rawNumber.replace(/\D/g, '');

      if (!digitsOnly || digitsOnly.length < 9) {
        setExpressPhoneError('O número de telemóvel do Express é obrigatório (mínimo 9 dígitos).');
        setShowCustomerForm(true);
        setTimeout(() => {
          const input = document.getElementById('express-sender-phone-input');
          if (input) {
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
        return;
      }

      setExpressPhoneError(null);
      setShowPhoneConfirmModal(true);
      return;
    }

    executeWhatsAppCheckout();
  };

  const executeWhatsAppCheckout = () => {
    const url = generateWhatsAppOrderUrl(items, totalAmount, config, customerInfo);
    setShowPhoneConfirmModal(false);
    openWhatsAppUrl(url);
  };

  const handleCopySummary = () => {
    const orderText = `*ENCOMENDA STRONG*\n` +
      items.map(i => `• ${i.name} | Cor: ${i.selectedColor.name} | Tam: ${i.selectedSize} | ${i.quantity}x = ${formatPrice(i.price * i.quantity, config)}`).join('\n') +
      `\nTotal: ${formatPrice(totalAmount, config)}` +
      (customerInfo.paymentMethod.includes('Multicaixa Express') ? `\nPagamento: Multicaixa Express (${expressHolder})` : `\nPagamento: ${customerInfo.paymentMethod}`);
    navigator.clipboard.writeText(orderText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const isExpressSelected = customerInfo.paymentMethod === 'Multicaixa Express';
  const isPagarNoLocal = customerInfo.paymentMethod === 'Pagar no Local';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          id="cart-drawer-panel"
          className="w-screen max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black text-white font-['Cabinet_Grotesk',sans-serif]">
                O Teu Carrinho
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-amber-400">
                {totalItemsCount} {totalItemsCount === 1 ? 'peça' : 'peças'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              aria-label="Fechar Carrinho"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">O teu carrinho está vazio</h3>
                <p className="text-xs text-neutral-400 max-w-xs">
                  Explora a nossa coleção de T-shirts oversized e chapéus da marca Strong e escolhe as tuas cores favoritas.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs shadow-md transition"
                >
                  Explorar Coleção
                </button>
              </div>
            ) : (
              <>
                {/* List of Cart Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Itens Escolhidos</span>
                    <button
                      onClick={onClearCart}
                      className="text-[11px] text-neutral-500 hover:text-red-400 transition"
                    >
                      Esvaziar tudo
                    </button>
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800/90 relative group"
                    >
                      {/* Thumbnail */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg bg-neutral-900 shrink-0"
                      />

                      {/* Item Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="text-neutral-500 hover:text-red-400 p-0.5 transition"
                              title="Remover item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Color & Size Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300">
                              <span
                                className="w-2 h-2 rounded-full border border-black/40"
                                style={{ backgroundColor: item.selectedColor.hex }}
                              />
                              {item.selectedColor.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-bold text-neutral-300">
                              Tam: {item.selectedSize}
                            </span>
                          </div>
                        </div>

                        {/* Price and Quantity Stepper */}
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-800/60">
                          <span className="text-xs font-bold text-amber-400">
                            {formatPrice(item.price * item.quantity, config)}
                          </span>

                          <div className="flex items-center border border-neutral-800 rounded bg-neutral-900">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-xs text-neutral-400 hover:text-white font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 py-0.5 text-xs font-bold text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-xs text-neutral-400 hover:text-white font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Details Form for WhatsApp Checkout */}
                <div className="pt-2 border-t border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      Dados para a Encomenda
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomerForm(!showCustomerForm)}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      {showCustomerForm ? 'Ocultar' : 'Editar dados'}
                    </button>
                  </div>

                  {showCustomerForm && (
                    <div className="space-y-2.5 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                          O teu Nome:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Gilberto Silva"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                            Contacto / WhatsApp:
                          </label>
                          <input
                            type="tel"
                            placeholder="Ex: 923 456 789"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                            className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                            Cidade / Província:
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Luanda, Talatona"
                            value={customerInfo.city}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                            className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Forma de Pagamento Selector */}
                      <div className="space-y-2 pt-1">
                        <label className="block text-[11px] text-neutral-300 font-bold uppercase tracking-wider">
                          Escolhe a Forma de Pagamento:
                        </label>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {/* Option 1: Multicaixa Express */}
                          <button
                            type="button"
                            onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'Multicaixa Express' })}
                            className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between relative overflow-hidden ${
                              isExpressSelected
                                ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <Smartphone className={`w-4 h-4 ${isExpressSelected ? 'text-emerald-400' : 'text-neutral-400'}`} />
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Recomendado
                              </span>
                            </div>
                            <div>
                              <div className="text-xs font-black text-white">Multicaixa Express</div>
                              <div className="text-[10px] text-neutral-400 mt-0.5">Enviar Dinheiro</div>
                            </div>
                          </button>

                          {/* Option 2: Pagar no Local (em vez de TPA) */}
                          <button
                            type="button"
                            onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'Pagar no Local' })}
                            className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between relative overflow-hidden ${
                              isPagarNoLocal
                                ? 'bg-amber-950/30 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/50'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <MapPin className={`w-4 h-4 ${isPagarNoLocal ? 'text-amber-400' : 'text-neutral-400'}`} />
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
                                Em Mãos
                              </span>
                            </div>
                            <div>
                              <div className="text-xs font-black text-white">Pagar no Local</div>
                              <div className="text-[10px] text-neutral-400 mt-0.5">Dinheiro na Entrega</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Informações para Pagar no Local */}
                      {isPagarNoLocal && (
                        <div className="p-3.5 rounded-xl bg-neutral-950 border border-amber-400/30 space-y-2">
                          <div className="flex items-center gap-2 text-amber-400">
                            <MapPin className="w-4 h-4" />
                            <h4 className="text-xs font-black uppercase tracking-wider">
                              Pagar no Local da Entrega
                            </h4>
                          </div>
                          <p className="text-[11px] text-neutral-300 leading-relaxed">
                            O pagamento é feito em <span className="text-white font-bold">dinheiro físico</span> diretamente ao estafeta no momento da entrega das tuas peças. Prepara a quantia exata de <span className="text-amber-400 font-bold">{formatPrice(totalAmount, config)}</span> para agilizar o processo.
                          </p>
                        </div>
                      )}

                      {/* Multicaixa Express Direct Station */}
                      {isExpressSelected && (
                        <div className="p-3.5 rounded-xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-emerald-500/40 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-emerald-500 text-neutral-950 flex items-center justify-center font-black text-xs shadow-sm">
                                MCX
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                                  Multicaixa Express
                                </h4>
                                <span className="text-[10px] text-emerald-400 font-medium">
                                  Envio de Dinheiro Direto por Telemóvel
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                              Sem taxas extra
                            </span>
                          </div>

                          {/* Valor e Titular */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between bg-neutral-950/90 p-2.5 rounded-lg border border-neutral-800">
                              <div>
                                <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                                  Valor a Enviar:
                                </span>
                                <span className="text-sm font-black text-amber-400">
                                  {formatPrice(totalAmount, config)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                                  Titular da Conta:
                                </span>
                                <span className="text-xs font-bold text-white">
                                  {expressHolder}
                                </span>
                              </div>
                            </div>

                            {/* Número para Copiar */}
                            <div className="bg-neutral-950 p-2.5 rounded-lg border border-emerald-500/30 flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
                                  Número de Telemóvel Express:
                                </span>
                                <span className="text-sm font-mono font-black text-white tracking-wider">
                                  {expressPhone}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={handleCopyExpressPhone}
                                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                                  copiedExpressPhone
                                    ? 'bg-emerald-500 text-neutral-950'
                                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
                                }`}
                              >
                                {copiedExpressPhone ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
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

                            {/* IBAN opcional se configurado */}
                            {config.expressIban && (
                              <div className="pt-1">
                                {!showIbanDetails ? (
                                  <button
                                    type="button"
                                    onClick={() => setShowIbanDetails(true)}
                                    className="text-[10px] text-neutral-400 hover:text-white underline"
                                  >
                                    Preferes Transferência Bancária? Ver IBAN
                                  </button>
                                ) : (
                                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-2 mt-1">
                                    <div className="truncate">
                                      <span className="text-[9px] text-neutral-400 block uppercase">IBAN:</span>
                                      <span className="text-[11px] font-mono text-white truncate block">
                                        {config.expressIban}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleCopyExpressIban}
                                      className="px-2 py-1 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300 hover:text-white shrink-0"
                                    >
                                      {copiedExpressIban ? 'Copiado!' : 'Copiar'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 3 Passos Rápidos */}
                          <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800 text-[11px] space-y-1 text-neutral-300">
                            <div className="font-bold text-neutral-200 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Info className="w-3 h-3 text-emerald-400" />
                              Como pagar em 3 passos:
                            </div>
                            <p className="flex items-start gap-1.5 text-neutral-400 text-[11px]">
                              <span className="font-bold text-emerald-400 shrink-0">1.</span>
                              Abre o teu app <strong>Multicaixa Express</strong> no telemóvel.
                            </p>
                            <p className="flex items-start gap-1.5 text-neutral-400 text-[11px]">
                              <span className="font-bold text-emerald-400 shrink-0">2.</span>
                              Vai a <strong>"Enviar Dinheiro"</strong> e cola o número copiado acima.
                            </p>
                            <p className="flex items-start gap-1.5 text-neutral-400 text-[11px]">
                              <span className="font-bold text-emerald-400 shrink-0">3.</span>
                              Insere o valor de <strong>{formatPrice(totalAmount, config)}</strong> e autoriza com o teu PIN.
                            </p>
                          </div>

                          {/* Dados de validação do cliente */}
                          <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label htmlFor="express-sender-phone-input" className="block text-[11px] text-neutral-300 font-bold">
                                    Telemóvel que Enviou (Express) <span className="text-red-400">*</span>
                                  </label>
                                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase">
                                    Obrigatório
                                  </span>
                                </div>
                                <input
                                  id="express-sender-phone-input"
                                  type="tel"
                                  placeholder="Ex: 923 xxx xxx"
                                  value={customerInfo.expressSenderPhone || ''}
                                  onChange={(e) => {
                                    setCustomerInfo({ ...customerInfo, expressSenderPhone: e.target.value });
                                    if (expressPhoneError) setExpressPhoneError(null);
                                  }}
                                  className={`w-full px-3 py-2 bg-neutral-900 border rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none transition ${
                                    expressPhoneError
                                      ? 'border-red-500 ring-2 ring-red-500/30 bg-red-950/20'
                                      : 'border-neutral-800 focus:border-emerald-400'
                                  }`}
                                />
                                {expressPhoneError ? (
                                  <div className="flex items-center gap-1.5 text-[11px] text-red-400 font-medium pt-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{expressPhoneError}</span>
                                  </div>
                                ) : customerInfo.phone && !customerInfo.expressSenderPhone ? (
                                  <button
                                    type="button"
                                    onClick={() => setCustomerInfo({ ...customerInfo, expressSenderPhone: customerInfo.phone })}
                                    className="text-[10px] text-emerald-400 hover:text-emerald-300 underline pt-1 block text-left"
                                  >
                                    Usar o meu número de contacto ({customerInfo.phone})
                                  </button>
                                ) : null}
                              </div>

                              <div>
                                <label className="block text-[11px] text-neutral-300 font-medium mb-1">
                                  Nome no Express (Opcional):
                                </label>
                                <input
                                  type="text"
                                  placeholder="Nome da tua conta"
                                  value={customerInfo.expressSenderName || ''}
                                  onChange={(e) => setCustomerInfo({ ...customerInfo, expressSenderName: e.target.value })}
                                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
                                />
                              </div>
                            </div>

                            {/* Informação sobre validação do número */}
                            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                                Insere o número de telemóvel que utilizaste no Multicaixa Express. Antes de concluir a encomenda, terás de confirmar este número para validação da compra.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                          Observações / Ponto de Referência:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Entregar à tarde / Próximo ao hotel..."
                          value={customerInfo.notes}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                          className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Cart Footer Checkout Bar */}
          {items.length > 0 && (
            <div className="p-5 border-t border-neutral-800 bg-neutral-950 space-y-3">
              {/* Financial Totals */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal das peças:</span>
                  <span>{formatPrice(totalAmount, config)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Entrega:</span>
                  <span className="text-emerald-400 font-medium">A combinar no WhatsApp</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-neutral-800">
                  <span>Total do Pedido:</span>
                  <span className="text-amber-400">{formatPrice(totalAmount, config)}</span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                id="cart-checkout-whatsapp-btn"
                onClick={handleInitiateCheckout}
                className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg transition transform active:scale-98 ${
                  isExpressSelected
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/25'
                    : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-amber-400/20'
                }`}
              >
                <MessageCircle className="w-5 h-5 fill-neutral-950 shrink-0" />
                <span className="truncate">
                  {isExpressSelected
                    ? 'Finalizar no WhatsApp (Multicaixa Express)'
                    : isPagarNoLocal
                    ? 'Confirmar Pedido (Pagar no Local)'
                    : 'Finalizar Compra no WhatsApp'}
                </span>
              </button>

              {/* Secondary actions: Copy summary */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1 transition"
                >
                  {copiedNotification ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Resumo copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar resumo do pedido</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Modal / Dialog de Confirmação do Número Express */}
      {showPhoneConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-neutral-900 border border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 text-center">
            {/* Header Icon */}
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
              <Smartphone className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                <ShieldCheck className="w-3.5 h-3.5" /> Confirmação Obrigatória
              </div>
              <h3 className="text-lg font-black text-white font-['Cabinet_Grotesk',sans-serif]">
                Confirma o teu Número Express
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Por favor, certifica-te de que realizaste o envio do dinheiro através deste número:
              </p>
            </div>

            {/* Número em grande destaque */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-emerald-500/40 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-medium">
                Telemóvel do Envio (Express)
              </span>
              <span className="text-xl font-mono font-black text-emerald-400 tracking-wider block">
                {customerInfo.expressSenderPhone}
              </span>
              {customerInfo.expressSenderName && (
                <span className="text-xs text-neutral-300 block">
                  Titular: <strong>{customerInfo.expressSenderName}</strong>
                </span>
              )}
              <div className="text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800 flex justify-between">
                <span>Total a validar:</span>
                <span className="font-bold text-amber-400">{formatPrice(totalAmount, config)}</span>
              </div>
            </div>

            {/* Aviso de segurança */}
            <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-left text-[11px] text-neutral-300 space-y-1">
              <span className="font-bold text-emerald-400 block flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Atenção para validação rápida:
              </span>
              <p className="text-neutral-400 text-[10px] leading-relaxed">
                O operador só poderá validar o pagamento e despachar a encomenda se o número de envio estiver correto. Só com este número confirmado a tua encomenda poderá ser concluída.
              </p>
            </div>

            {/* Botões de Decisão */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                id="confirm-express-phone-btn"
                onClick={executeWhatsAppCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition transform active:scale-98"
              >
                <MessageCircle className="w-4 h-4 fill-neutral-950" />
                <span>Sim, Confirmar e Fazer Encomenda</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPhoneConfirmModal(false);
                  setTimeout(() => {
                    document.getElementById('express-sender-phone-input')?.focus();
                  }, 100);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition"
              >
                Corrigir / Alterar Número
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
