import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, MessageCircle, ArrowRight, Check, Copy, User, MapPin, CreditCard, FileText } from 'lucide-react';
import { CartItem, CheckoutCustomerInfo, StoreConfig } from '../types';
import { formatPrice, generateWhatsAppOrderUrl } from '../utils/whatsapp';

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
  if (!isOpen) return null;

  const [customerInfo, setCustomerInfo] = useState<CheckoutCustomerInfo>({
    name: '',
    phone: '',
    city: '',
    notes: '',
    paymentMethod: 'Transferência / Multicaixa Express',
  });

  const [showCustomerForm, setShowCustomerForm] = useState(true);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutWhatsApp = () => {
    if (items.length === 0) return;
    const url = generateWhatsAppOrderUrl(items, totalAmount, config, customerInfo);
    window.open(url, '_blank');
  };

  const handleCopySummary = () => {
    const orderText = `*ENCOMENDA STRONG*\n` +
      items.map(i => `• ${i.name} | Cor: ${i.selectedColor.name} | Tam: ${i.selectedSize} | ${i.quantity}x = ${formatPrice(i.price * i.quantity, config)}`).join('\n') +
      `\nTotal: ${formatPrice(totalAmount, config)}`;
    navigator.clipboard.writeText(orderText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

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

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1 font-medium">
                          Forma de Pagamento:
                        </label>
                        <select
                          value={customerInfo.paymentMethod}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, paymentMethod: e.target.value })}
                          className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="Transferência / Multicaixa Express">Transferência / Multicaixa Express</option>
                          <option value="MBWay">MBWay</option>
                          <option value="Dinheiro no Ato da Entrega">Dinheiro no Ato da Entrega</option>
                          <option value="Cartão de Débito/Crédito">Cartão de Débito/Crédito</option>
                          <option value="A combinar no WhatsApp">A combinar no WhatsApp</option>
                        </select>
                      </div>

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

              {/* Primary WhatsApp Checkout Button */}
              <button
                id="cart-checkout-whatsapp-btn"
                onClick={handleCheckoutWhatsApp}
                className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition transform active:scale-98"
              >
                <MessageCircle className="w-5 h-5 fill-neutral-950" />
                <span>FINALIZAR COMPRA NO WHATSAPP</span>
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
    </div>
  );
};
