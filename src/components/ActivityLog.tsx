import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  HardDrive,
  Cloud,
  FileCode,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
  Smartphone,
  Server,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { SyncLogEntry } from '../types';

interface ActivityLogProps {
  logs: SyncLogEntry[];
  onClearLogs: () => void;
  onRefreshSync: () => Promise<void>;
  isServerSyncActive: boolean;
  localVersion?: number;
  catalogCount: number;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  logs,
  onClearLogs,
  onRefreshSync,
  isServerSyncActive,
  localVersion,
  catalogCount,
}) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'warning' | 'error'>('all');
  const [copied, setCopied] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshSync();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyLogs = () => {
    const text = JSON.stringify(logs, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: SyncLogEntry['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3 h-3" />
            Sucesso
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <AlertTriangle className="w-3 h-3" />
            Atenção
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/80">
            <XCircle className="w-3 h-3" />
            Falha
          </span>
        );
    }
  };

  const getSourceIcon = (source: SyncLogEntry['source']) => {
    switch (source) {
      case 'server':
        return <Cloud className="w-3.5 h-3.5 text-sky-400" title="Servidor Cloud API" />;
      case 'local_storage':
        return <HardDrive className="w-3.5 h-3.5 text-amber-400" title="Navegador Local (LocalStorage)" />;
      case 'static_catalog':
        return <FileCode className="w-3.5 h-3.5 text-purple-400" title="Arquivo Estático catalog.json" />;
    }
  };

  const getTypeIcon = (type: SyncLogEntry['type']) => {
    switch (type) {
      case 'save_products':
      case 'save_config':
      case 'import_catalog':
        return <ArrowUpCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'delete_product':
        return <Trash2 className="w-4 h-4 text-red-400 shrink-0" />;
      case 'fetch_catalog':
      case 'manual_sync':
        return <ArrowDownCircle className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'reset_defaults':
        return <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Activity className="w-4 h-4 text-neutral-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Diagnostic Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Histórico de Atividades & Eventos de Sincronização
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300">
              {logs.length} eventos
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Diagnóstico em tempo real para monitorar a persistência de edições, exclusões e sincronização entre dispositivos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-1.5 border border-neutral-700 transition disabled:opacity-50"
            title="Verificar atualizações no servidor"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sincronizar Agora</span>
          </button>

          {logs.length > 0 && (
            <>
              <button
                onClick={handleCopyLogs}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-1.5 border border-neutral-700 transition"
                title="Copiar relatório em JSON"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Log'}</span>
              </button>

              <button
                onClick={onClearLogs}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/40 text-neutral-400 hover:text-red-300 font-bold text-xs flex items-center gap-1 border border-neutral-800 transition"
                title="Limpar histórico da sessão"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* System Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-900 text-amber-400 shrink-0">
            <Server className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Estado do Servidor</div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              {isServerSyncActive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  <span className="text-emerald-400">Ativo (/api/products)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                  <span className="text-amber-400">Estático / Local</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-900 text-sky-400 shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Catálogo Ativo</div>
            <div className="text-xs font-bold text-white truncate">
              {catalogCount} artigos cadastrados
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-900 text-emerald-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Versão do Catálogo</div>
            <div className="text-xs font-mono text-neutral-300 truncate" title={localVersion ? new Date(localVersion).toISOString() : 'Sem versão'}>
              {localVersion ? formatTime(localVersion) : 'Inicial'}
            </div>
          </div>
        </div>
      </div>

      {/* Persistence Diagnostics & Advice */}
      <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 text-xs text-neutral-300 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-neutral-200">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Como funciona a persistência de dados entre dispositivos?</span>
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          1. <strong className="text-neutral-300">Servidor Node.js:</strong> Quando você edita ou apaga um produto com o servidor online, as alterações são salvas imediatamente em disco (<code className="text-amber-300">public/catalog.json</code>) e transmitidas a todos os telemóveis e computadores conectados.
        </p>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          2. <strong className="text-neutral-300">Prevenção de Sobregravação:</strong> O sistema usa carimbos de versão (<code className="text-sky-300">timestamp versioning</code>). Leituras periódicas em segundo plano nunca apagam modificações locais não salvas.
        </p>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          3. <strong className="text-neutral-300">Hospedagem Estática (GitHub Pages):</strong> No GitHub Pages sem backend em tempo real, use a aba <strong className="text-amber-400">"Backup & GitHub"</strong> para baixar o <code className="text-amber-300">catalog.json</code> gerado e subir no seu repositório.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-amber-400 text-neutral-950'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Todos ({logs.length})
          </button>
          <button
            onClick={() => setFilter('success')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              filter === 'success'
                ? 'bg-emerald-500 text-neutral-950'
                : 'bg-neutral-800 text-neutral-400 hover:text-emerald-400'
            }`}
          >
            Sucessos ({logs.filter((l) => l.status === 'success').length})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              filter === 'warning'
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-800 text-neutral-400 hover:text-amber-400'
            }`}
          >
            Avisos ({logs.filter((l) => l.status === 'warning').length})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              filter === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-red-400'
            }`}
          >
            Falhas ({logs.filter((l) => l.status === 'error').length})
          </button>
        </div>

        <span className="text-[11px] text-neutral-500 hidden sm:inline">
          Ordenados do mais recente para o mais antigo
        </span>
      </div>

      {/* Log List */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="p-8 rounded-xl bg-neutral-950 border border-neutral-800 text-center space-y-2">
            <Activity className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-xs font-bold text-neutral-400">Nenhum evento registrado com este filtro.</p>
            <p className="text-[11px] text-neutral-600">
              Faça alterações em produtos ou clique em "Sincronizar Agora" para gerar eventos.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/90 hover:border-neutral-700 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5">{getTypeIcon(log.type)}</div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white tracking-wide">
                          {log.action}
                        </span>
                        {getStatusBadge(log.status)}
                        <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                          {getSourceIcon(log.source)}
                          <span className="capitalize">{log.source.replace('_', ' ')}</span>
                        </span>
                      </div>

                      {log.details && (
                        <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                          {log.details}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-neutral-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          {formatTime(log.timestamp)} — {formatDate(log.timestamp)}
                        </span>
                        {typeof log.itemCount === 'number' && (
                          <span>Itens: <strong className="text-neutral-400">{log.itemCount}</strong></span>
                        )}
                        {log.version && (
                          <span>Versão: <code className="text-neutral-400 font-mono">{log.version}</code></span>
                        )}
                        {log.device && (
                          <span className="text-neutral-400 flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            {log.device}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="text-neutral-500 hover:text-neutral-300 p-1 rounded transition shrink-0"
                    title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes técnicos'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-neutral-900">
                    <div className="text-[10px] uppercase font-bold text-neutral-500 mb-1">
                      Dados do Evento (JSON):
                    </div>
                    <pre className="text-[11px] font-mono bg-neutral-900/90 text-neutral-300 p-3 rounded-lg overflow-x-auto border border-neutral-800">
                      {JSON.stringify(log, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
