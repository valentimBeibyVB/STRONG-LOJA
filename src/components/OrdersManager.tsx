import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  MessageCircle,
  Download,
  Eye,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Smartphone,
  ChevronDown,
  ShoppingBag,
  DollarSign,
  X,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { Order, OrderStatus, StoreConfig } from '../types';
import { formatPrice } from '../utils/whatsapp';

interface OrdersManagerProps {
  orders: Order[];
  config: StoreConfig;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (orderId: string) => void;
  onDeleteCancelledOrders: () => void;
  onClearAllUnpaidOrders?: () => void;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  config,
  onUpdateStatus,
  onDeleteOrder,
  onDeleteCancelledOrders,
  onClearAllUnpaidOrders,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | OrderStatus>('todos');
  const [selectedOrderForView, setSelectedOrderForView] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = orders.length;
    const paidOrders = orders.filter((o) => o.status === 'pago');
    const unpaidOrders = orders.filter((o) => o.status === 'nao_pago');
    const cancelledOrders = orders.filter((o) => o.status === 'cancelado');

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingRevenue = unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      totalCount,
      paidCount: paidOrders.length,
      unpaidCount: unpaidOrders.length,
      cancelledCount: cancelledOrders.length,
      totalRevenue,
      pendingRevenue,
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== 'todos' && order.status !== statusFilter) {
        return false;
      }

      // Search filter (reference, customer name, phone, city)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = order.reference.toLowerCase().includes(q);
        const matchName = (order.customer.name || '').toLowerCase().includes(q);
        const matchPhone = (order.customer.phone || '').includes(q);
        const matchSenderPhone = (order.customer.expressSenderPhone || '').includes(q);
        const matchCity = (order.customer.city || '').toLowerCase().includes(q);
        const matchItems = order.items.some((i) => i.name.toLowerCase().includes(q));

        if (!matchRef && !matchName && !matchPhone && !matchSenderPhone && !matchCity && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Handle status change
  const handleStatusSelect = (orderId: string, newStatus: OrderStatus) => {
    onUpdateStatus(orderId, newStatus);
    const label = newStatus === 'pago' ? 'Pago' : newStatus === 'cancelado' ? 'Cancelado' : 'Não Pago';
    showToast(`Estado da encomenda alterado para: ${label}`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('Não existem encomendas para exportar.');
      return;
    }

    const headers = [
      'Referencia',
      'Data/Hora',
      'Cliente',
      'Contacto',
      'Cidade/Localidade',
      'Metodo de Pagamento',
      'Telemovel Envio Express',
      'Itens',
      'Total',
      'Estado',
      'Notas',
    ];

    const rows = orders.map((o) => {
      const itemsText = o.items
        .map((i) => `${i.quantity}x ${i.name} (${i.colorName || 'Cor Padrão'} - Tam: ${i.size})`)
        .join(' | ');

      const statusText =
        o.status === 'pago' ? 'Pago' : o.status === 'cancelado' ? 'Cancelado' : 'Não Pago';

      return [
        o.reference,
        o.createdAtFormatted || new Date(o.timestamp).toLocaleString('pt-PT'),
        `"${(o.customer.name || '').replace(/"/g, '""')}"`,
        `"${o.customer.phone || ''}"`,
        `"${(o.customer.city || '').replace(/"/g, '""')}"`,
        `"${o.paymentMethod || ''}"`,
        `"${o.customer.expressSenderPhone || ''}"`,
        `"${itemsText.replace(/"/g, '""')}"`,
        o.totalAmount,
        statusText,
        `"${(o.notes || o.customer.notes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `encomendas_strong_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open direct WhatsApp chat with client
  const handleOpenWhatsAppCustomer = (order: Order) => {
    const rawPhone = (order.customer.phone || order.customer.expressSenderPhone || '').replace(/\D/g, '');
    if (!rawPhone) {
      alert('Esta encomenda não possui número de telemóvel do cliente.');
      return;
    }

    let phone = rawPhone;
    if (phone.length === 9) {
      phone = '244' + phone; // Angola country code default
    }

    const message = encodeURIComponent(
      `Olá ${order.customer.name || 'Cliente'}! Estamos a contactar da loja Strong sobre a sua encomenda *#${order.reference}* no valor de ${formatPrice(order.totalAmount, config)}.`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[70] p-3.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white font-['Cabinet_Grotesk',sans-serif]">
              Planilha de Controlo de Encomendas
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Gestão completa de todos os pedidos feitos pelos clientes na loja com controlo de pagamento e referência.
          </p>
        </div>

        {/* Global actions: Export & Clean */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition flex items-center gap-1.5 border border-neutral-700"
            title="Descarregar tabela em formato Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Exportar Planilha (CSV)</span>
          </button>

          {metrics.cancelledCount > 0 && (
            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-900/50 text-xs font-bold transition flex items-center gap-1.5"
              title="Eliminar todos os pedidos cancelados ou não realizados"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Cancelados ({metrics.cancelledCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Encomendas */}
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total de Pedidos</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.totalCount}</div>
          <div className="text-[10px] text-neutral-500">Registados na plataforma</div>
        </div>

        {/* Card 2: Total Faturado / Pagos */}
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faturado (Pago)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatPrice(metrics.totalRevenue, config)}
          </div>
          <div className="text-[10px] text-emerald-500/80 font-medium">
            {metrics.paidCount} {metrics.paidCount === 1 ? 'pedido confirmado' : 'pedidos confirmados'}
          </div>
        </div>

        {/* Card 3: Não Pagos / Pendentes */}
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Não Pagos (Pendentes)</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {metrics.unpaidCount}
          </div>
          <div className="text-[10px] text-amber-400/80 font-medium">
            Valor a receber: {formatPrice(metrics.pendingRevenue, config)}
          </div>
        </div>

        {/* Card 4: Cancelados / Não Realizados */}
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-red-500/30 space-y-1">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cancelados</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-red-400">
            {metrics.cancelledCount}
          </div>
          <div className="text-[10px] text-neutral-500">Pedidos descontinuados</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por referência (#STR-...), cliente, telemóvel ou localidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                statusFilter === 'todos'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <span>Todos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-950/20">
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('nao_pago')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                statusFilter === 'nao_pago'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Não Pagos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-950/20">
                {metrics.unpaidCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pago')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                statusFilter === 'pago'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Pagos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-950/20">
                {metrics.paidCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('cancelado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                statusFilter === 'cancelado'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <XCircle className="w-3 h-3 text-red-400" />
              <span>Cancelados</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-950/20">
                {metrics.cancelledCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Spreadsheet / Table View */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">Nenhuma encomenda encontrada</h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'todos'
              ? 'Tenta ajustar o filtro ou pesquisa para encontrar o pedido desejado.'
              : 'Assim que um cliente finalizar uma encomenda através do carrinho ou WhatsApp, o pedido aparecerá aqui automaticamente nesta planilha.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile View: Responsive Order Cards */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => {
              const isPaid = order.status === 'pago';
              const isCancelled = order.status === 'cancelado';
              const isUnpaid = order.status === 'nao_pago';

              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3 shadow-md ${
                    isCancelled ? 'opacity-70 bg-red-950/10' : ''
                  }`}
                >
                  {/* Top: Reference, Date & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-amber-400 text-sm">
                          #{order.reference}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        {order.createdAtFormatted ||
                          new Date(order.timestamp).toLocaleString('pt-PT', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                      </span>
                    </div>

                    {/* Status Changer Dropdown */}
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusSelect(order.id, e.target.value as OrderStatus)
                        }
                        className={`text-xs font-bold py-1 px-2.5 rounded-lg border focus:outline-none cursor-pointer ${
                          isPaid
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50'
                            : isCancelled
                            ? 'bg-red-950/80 text-red-400 border-red-500/50'
                            : 'bg-amber-950/80 text-amber-400 border-amber-500/50'
                        }`}
                      >
                        <option value="nao_pago">Não Pago</option>
                        <option value="pago">Pago</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {order.customer.name || 'Cliente Sem Nome'}
                      </span>
                      <span className="font-black text-amber-400 text-sm">
                        {formatPrice(order.totalAmount, config)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                      <Phone className="w-3 h-3 text-neutral-500 shrink-0" />
                      <span>{order.customer.phone || 'Sem contacto'}</span>
                      {order.customer.city && (
                        <>
                          <span className="text-neutral-600">•</span>
                          <span className="truncate">{order.customer.city}</span>
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-500 pt-0.5">
                      Pagamento: <strong className="text-neutral-300">{order.paymentMethod}</strong>
                      {order.customer.expressSenderPhone && (
                        <span className="text-emerald-400 ml-1">
                          (Envio: {order.customer.expressSenderPhone})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="text-xs text-neutral-300">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 mb-1">
                      <ShoppingBag className="w-3 h-3 text-amber-400" />
                      <span>
                        {order.totalQuantity || order.items.reduce((s, i) => s + i.quantity, 0)}{' '}
                        {order.totalQuantity === 1 ? 'artigo' : 'artigos'}:
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">
                      {order.items
                        .map((i) => `${i.quantity}x ${i.name} (${i.colorName || 'Cor'}, Tam: ${i.size})`)
                        .join(' • ')}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-800/80">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForView(order)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ver Detalhes</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppCustomer(order)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/60 text-xs font-bold transition flex items-center gap-1"
                        title="Conversar no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="text-[11px]">WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderToDelete(order)}
                        className="p-1.5 rounded-lg bg-neutral-950 text-neutral-500 hover:text-red-400 border border-neutral-800 transition"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View: Full Spreadsheet Table */}
          <div className="hidden md:block border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/90 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Ref. / Data</th>
                  <th className="py-3 px-4">Cliente & Contacto</th>
                  <th className="py-3 px-4">Artigos / Peças</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4">Estado (Mudar)</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredOrders.map((order) => {
                  const isPaid = order.status === 'pago';
                  const isCancelled = order.status === 'cancelado';
                  const isUnpaid = order.status === 'nao_pago';

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-neutral-800/40 transition group ${
                        isCancelled ? 'opacity-60 bg-red-950/10' : ''
                      }`}
                    >
                      {/* 1. Referência & Data */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-amber-400 text-xs">
                            #{order.reference}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 block mt-0.5">
                          {order.createdAtFormatted ||
                            new Date(order.timestamp).toLocaleString('pt-PT', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                        </span>
                      </td>

                      {/* 2. Cliente & Contacto */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white truncate max-w-[150px]">
                          {order.customer.name || 'Cliente Sem Nome'}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-0.5">
                          <Phone className="w-3 h-3 text-neutral-500 shrink-0" />
                          <span>{order.customer.phone || 'Sem contacto'}</span>
                        </div>
                        {order.customer.city && (
                          <div className="flex items-center gap-1 text-[10px] text-neutral-500 mt-0.5 truncate max-w-[140px]">
                            <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span className="truncate">{order.customer.city}</span>
                          </div>
                        )}
                      </td>

                      {/* 3. Artigos / Peças */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[200px]">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-neutral-200">
                              {order.totalQuantity || order.items.reduce((s, i) => s + i.quantity, 0)}{' '}
                              {order.totalQuantity === 1 ? 'artigo' : 'artigos'}:
                            </span>
                          </div>
                          <div className="space-y-0.5 text-[11px] text-neutral-400 truncate">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="truncate flex items-center gap-1.5">
                                <span className="font-semibold text-white">{item.quantity}x</span>
                                <span className="truncate">{item.name}</span>
                                <span className="text-neutral-500 text-[10px]">
                                  ({item.colorName || 'Cor'} • {item.size})
                                </span>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <span className="text-[10px] text-amber-400 font-bold block">
                                +{order.items.length - 2} outros artigos...
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. Total */}
                      <td className="py-3.5 px-4 font-mono font-black text-xs text-white">
                        <span className="text-amber-400">
                          {formatPrice(order.totalAmount, config)}
                        </span>
                      </td>

                      {/* 5. Pagamento */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.paymentMethod.includes('Express')
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                            }`}
                          >
                            <Smartphone className="w-3 h-3" />
                            {order.paymentMethod.includes('Express') ? 'MCX Express' : 'No Local'}
                          </span>
                          {order.customer.expressSenderPhone && (
                            <span className="text-[10px] font-mono text-neutral-400 block truncate">
                              De: {order.customer.expressSenderPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Estado (Status Selector) */}
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusSelect(order.id, e.target.value as OrderStatus)
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border cursor-pointer focus:outline-none transition ${
                              isPaid
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50 hover:bg-emerald-900/60'
                                : isCancelled
                                ? 'bg-red-950 text-red-400 border-red-500/50 hover:bg-red-900/60'
                                : 'bg-amber-950 text-amber-400 border-amber-500/50 hover:bg-amber-900/60'
                            }`}
                          >
                            <option value="nao_pago" className="bg-neutral-900 text-amber-400">
                              Não Pago
                            </option>
                            <option value="pago" className="bg-neutral-900 text-emerald-400">
                              Pago
                            </option>
                            <option value="cancelado" className="bg-neutral-900 text-red-400">
                              Cancelado
                            </option>
                          </select>
                        </div>
                      </td>

                      {/* 7. Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Ver Detalhes */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForView(order)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                            title="Ver detalhes completos da encomenda"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Contactar no WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsAppCustomer(order)}
                            className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 transition"
                            title="Abrir WhatsApp do cliente com a referência do pedido"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar Pedido */}
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(order)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-900/80 text-neutral-400 hover:text-red-300 transition"
                            title="Eliminar pedido não realizado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
            <span>
              Exibindo <strong>{filteredOrders.length}</strong> de <strong>{orders.length}</strong>{' '}
              encomendas
            </span>
            <span className="text-[11px] text-neutral-400">
              * Clica na caixa de estado para alternar entre <strong>Não Pago</strong>,{' '}
              <strong>Pago</strong> ou <strong>Cancelado</strong>
            </span>
          </div>
        </div>
      </div>
      )}

      {/* MODAL: Detalhes Completos da Encomenda */}
      {selectedOrderForView && (
        <div className="fixed inset-0 z-[70] overflow-y-auto flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn py-4 sm:py-8">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] my-auto">
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black text-white font-mono">
                    Encomenda #{selectedOrderForView.reference}
                  </h3>
                  <span className="text-[10px] text-neutral-400">
                    Realizada em:{' '}
                    {selectedOrderForView.createdAtFormatted ||
                      new Date(selectedOrderForView.timestamp).toLocaleString('pt-PT')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForView(null)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Status and Action banner */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                    Estado do Pagamento:
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-1 rounded-md mt-1 ${
                      selectedOrderForView.status === 'pago'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                        : selectedOrderForView.status === 'cancelado'
                        ? 'bg-red-950 text-red-400 border border-red-500/50'
                        : 'bg-amber-950 text-amber-400 border border-amber-500/50'
                    }`}
                  >
                    {selectedOrderForView.status === 'pago' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pago / Confirmado
                      </>
                    ) : selectedOrderForView.status === 'cancelado' ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Cancelado / Não Realizado
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" /> Não Pago / Pendente
                      </>
                    )}
                  </span>
                </div>

                {/* Quick Status Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleStatusSelect(selectedOrderForView.id, 'pago');
                      setSelectedOrderForView({ ...selectedOrderForView, status: 'pago' });
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-neutral-950 text-[11px] font-bold transition border border-emerald-500/30"
                  >
                    Marcar Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleStatusSelect(selectedOrderForView.id, 'cancelado');
                      setSelectedOrderForView({ ...selectedOrderForView, status: 'cancelado' });
                    }}
                    className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white text-[11px] font-bold transition border border-red-500/30"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Dados do Cliente
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Nome:</span>
                    <span className="font-bold text-white">
                      {selectedOrderForView.customer.name || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Contacto Telefónico:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {selectedOrderForView.customer.phone || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Localidade / Cidade:</span>
                    <span className="text-white">
                      {selectedOrderForView.customer.city || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Método de Pagamento:</span>
                    <span className="text-white font-bold">
                      {selectedOrderForView.paymentMethod}
                    </span>
                  </div>
                  {selectedOrderForView.customer.expressSenderPhone && (
                    <div className="col-span-2 pt-1 border-t border-neutral-800">
                      <span className="text-[10px] text-emerald-400 font-bold block">
                        Telemóvel que Enviou o Pagamento (Express):
                      </span>
                      <span className="font-mono text-white text-xs font-bold">
                        {selectedOrderForView.customer.expressSenderPhone}
                      </span>
                      {selectedOrderForView.customer.expressSenderName && (
                        <span className="text-neutral-400 text-xs block">
                          Titular: {selectedOrderForView.customer.expressSenderName}
                        </span>
                      )}
                    </div>
                  )}
                  {selectedOrderForView.customer.notes && (
                    <div className="col-span-2 pt-1 border-t border-neutral-800">
                      <span className="text-neutral-500 text-[10px] block">Observações:</span>
                      <span className="text-neutral-300 italic">
                        "{selectedOrderForView.customer.notes}"
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  Artigos Encomendados ({selectedOrderForView.items.length})
                </h4>
                <div className="space-y-2">
                  {selectedOrderForView.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-neutral-800 flex items-center justify-center text-neutral-600 shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h5 className="font-bold text-white text-xs">{item.name}</h5>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                            <span>Cor: <strong>{item.colorName || 'Padrão'}</strong></span>
                            <span>•</span>
                            <span>Tamanho: <strong>{item.size}</strong></span>
                            <span>•</span>
                            <span>Qtd: <strong>{item.quantity}x</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono font-bold text-xs text-amber-400">
                        {formatPrice(item.price * item.quantity, config)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Subtotal das Peças:</span>
                  <span>{formatPrice(selectedOrderForView.totalAmount, config)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Entrega:</span>
                  <span className="text-emerald-400">A combinar no WhatsApp</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-neutral-800">
                  <span>Total da Encomenda:</span>
                  <span className="text-amber-400">
                    {formatPrice(selectedOrderForView.totalAmount, config)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setOrderToDelete(selectedOrderForView);
                  setSelectedOrderForView(null);
                }}
                className="px-3 py-2 rounded-lg bg-neutral-900 hover:bg-red-950 text-neutral-400 hover:text-red-400 text-xs font-bold transition flex items-center gap-1.5 border border-neutral-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Encomenda</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenWhatsAppCustomer(selectedOrderForView)}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-md shadow-emerald-500/20"
              >
                <MessageCircle className="w-4 h-4 fill-neutral-950" />
                <span>Conversar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: Eliminar Encomenda Individual */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[80] overflow-y-auto flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn py-6">
          <div className="w-full max-w-sm bg-neutral-900 border border-red-500/40 rounded-2xl p-5 sm:p-6 text-center space-y-4 shadow-2xl my-auto max-h-[92dvh] overflow-y-auto">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Eliminar Pedido #{orderToDelete.reference}?</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Tens a certeza que desejas eliminar este pedido não realizado da planilha? Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-left">
              <div><strong>Cliente:</strong> {orderToDelete.customer.name || 'Sem nome'}</div>
              <div><strong>Valor:</strong> {formatPrice(orderToDelete.totalAmount, config)}</div>
              <div><strong>Estado:</strong> {orderToDelete.status}</div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onDeleteOrder(orderToDelete.id);
                  setOrderToDelete(null);
                  showToast('Pedido eliminado da planilha!');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30"
              >
                Sim, Eliminar Encomenda
              </button>
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="w-full py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition"
              >
                Voltar / Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: Eliminar Todos os Cancelados em Massa */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-[80] overflow-y-auto flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn py-6">
          <div className="w-full max-w-sm bg-neutral-900 border border-red-500/40 rounded-2xl p-5 sm:p-6 text-center space-y-4 shadow-2xl my-auto max-h-[92dvh] overflow-y-auto">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Limpar Todos os Cancelados?</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Esta ação irá remover permanentemente todos os <strong>{metrics.cancelledCount} pedidos cancelados / não realizados</strong> da planilha.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onDeleteCancelledOrders();
                  setShowBulkDeleteModal(false);
                  showToast('Todos os pedidos cancelados foram eliminados!');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30"
              >
                Sim, Limpar {metrics.cancelledCount} Cancelados
              </button>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="w-full py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
