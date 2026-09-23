import { CartItem, CheckoutCustomerInfo, StoreConfig } from '../types';

export function formatPrice(amount: number, config: StoreConfig): string {
  const formatted = amount.toLocaleString('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (config.currencyPosition === 'prefix') {
    return `${config.currencySymbol} ${formatted}`;
  }
  return `${formatted} ${config.currencySymbol}`;
}

export function generateWhatsAppOrderUrl(
  items: CartItem[],
  totalAmount: number,
  config: StoreConfig,
  customer?: CheckoutCustomerInfo
): string {
  const cleanedPhone = config.whatsappNumber.replace(/\D/g, '');
  const orderId = `STR-${Math.floor(1000 + Math.random() * 9000)}`;

  let text = `🔥 *NOVA ENCOMENDA STRONG — #${orderId}*\n\n`;
  text += `${config.welcomeMessage}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🛒 *PRODUTOS ESCOLHIDOS:*\n\n`;

  items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    text += `*${index + 1}. ${item.name}*\n`;
    text += `   • *Cor:* ${item.selectedColor.name}\n`;
    text += `   • *Tamanho:* ${item.selectedSize}\n`;
    text += `   • *Qtd:* ${item.quantity}x (${formatPrice(item.price, config)} cada)\n`;
    text += `   • *Subtotal:* ${formatPrice(itemTotal, config)}\n\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 *TOTAL A PAGAR:* *${formatPrice(totalAmount, config)}*\n\n`;

  if (customer && customer.name.trim()) {
    text += `👤 *DADOS DO CLIENTE:*\n`;
    text += `• *Nome:* ${customer.name.trim()}\n`;
    if (customer.phone.trim()) {
      text += `• *Contacto:* ${customer.phone.trim()}\n`;
    }
    if (customer.city.trim()) {
      text += `• *Localidade / Entrega:* ${customer.city.trim()}\n`;
    }
    if (customer.paymentMethod) {
      text += `• *Forma de Pagamento:* ${customer.paymentMethod}\n`;
      if (customer.paymentMethod.includes('Multicaixa Express')) {
        if (customer.expressSenderPhone?.trim()) {
          text += `• *Telemóvel do Envio (Express):* ${customer.expressSenderPhone.trim()}\n`;
        }
        if (customer.expressSenderName?.trim()) {
          text += `• *Nome do Titular que Enviou:* ${customer.expressSenderName.trim()}\n`;
        }
        if (customer.expressReceiptUrl?.trim()) {
          text += `📸 *Comprovativo (Ver Online):* ${customer.expressReceiptUrl.trim()}\n`;
        } else if (customer.expressReceiptPreview) {
          text += `📸 *Comprovativo de Pagamento:* Anexado a esta conversa\n`;
        }
      }
    }
    if (customer.notes.trim()) {
      text += `• *Observações:* ${customer.notes.trim()}\n`;
    }
    text += `\n`;
  }

  if (customer?.paymentMethod?.includes('Multicaixa Express')) {
    text += `⚡ *Pagamento feito via Multicaixa Express (Enviar Dinheiro) para ${config.expressAccountHolder || 'Strong Africa'}. Comprovativo disponível para conferência imediata!*`;
  } else if (customer?.paymentMethod === 'Pagar no Local') {
    text += `📍 *Pagamento no Local escolhido (Dinheiro na entrega). Aguardo confirmação e despacho da encomenda!*`;
  } else {
    text += `📍 *Aguardo confirmação de disponibilidade e dados para finalização da encomenda.*`;
  }

  const encodedMessage = encodeURIComponent(text);
  return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedMessage}`;
}

export function generateDirectProductWhatsAppUrl(
  productName: string,
  colorName: string,
  size: string,
  price: number,
  config: StoreConfig
): string {
  const cleanedPhone = config.whatsappNumber.replace(/\D/g, '');
  let text = `Olá Strong! Tenho interesse imediato no seguinte produto:\n\n`;
  text += `👕 *${productName}*\n`;
  text += `• *Cor:* ${colorName}\n`;
  text += `• *Tamanho:* ${size}\n`;
  text += `• *Preço:* ${formatPrice(price, config)}\n\n`;
  text += `Ainda têm este item disponível para envio?`;

  return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(text)}`;
}

export function openWhatsAppUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = url;
    }
  } catch {
    window.location.href = url;
  }
}
