import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { membresiasApi } from '../../api/membresiasApi';
import type { Membresia, MembresiaEstado } from '../../types/membresia';
import { MEMBRESIA_ESTADO_LABELS, MEMBRESIA_ESTADO_COLORS } from '../../types/membresia';
import { buildWaUrl, mensajeCobroMembresia } from '../../utils/whatsappTemplates';

type Tab = 'todas' | MembresiaEstado;

interface PrestadorLite {
  id: string;
  nombre: string;
  apellido: string;
  categoria: string;
  telefono?: string;
  total_leads: number;
  discount_rate: number;
  monthly_price?: number | null;
}

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{text}</span>;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    await navigator.clipboard.writeText(text);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };
  return (
    <button
      onClick={copiar}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#e2b040]/10 hover:bg-[#e2b040]/20 text-[#e2b040] rounded-lg text-xs transition-colors cursor-pointer"
    >
      <i className={copiado ? 'ri-check-line' : 'ri-file-copy-line'} />
      {copiado ? 'Copiado' : label}
    </button>
  );
}

function FormularioNueva({ prestadores, onCreada }: { prestadores: PrestadorLite[]; onCreada: () => void }) {
  const [prestadorId, setPrestadorId] = useState('');
  const [planName, setPlanName] = useState('Mensual');
  const [amount, setAmount] = useState('10000');
  const [descuento, setDescuento] = useState('0');
  const [inicio, setInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [fin, setFin] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [paymentLink, setPaymentLink] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function crear() {
    if (!prestadorId || !amount) return;
    setEnviando(true);
    try {
      await membresiasApi.crear({
        prestador_id: prestadorId,
        plan_name: planName,
        amount: Number(amount),
        discount_applied: Number(descuento) || 0,
        period_start: inicio,
        period_end: fin,
        payment_link: paymentLink || undefined,
      });
      setPrestadorId('');
      setPaymentLink('');
      onCreada();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al crear membresía');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-3">
      <h3 className="text-white font-semibold text-sm">Generar nueva membresía</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <select
          value={prestadorId}
          onChange={(e) => setPrestadorId(e.target.value)}
          className="bg-[#16213e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#e2b040]/50"
        >
          <option value="">Elegí un prestador...</option>
          {prestadores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.apellido} · {p.categoria} · {p.total_leads} leads
            </option>
          ))}
        </select>
        <input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Nombre del plan"
          className="bg-[#16213e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Monto"
          className="bg-[#16213e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50" />
        <input value={descuento} onChange={(e) => setDescuento(e.target.value)} type="number" placeholder="Descuento aplicado"
          className="bg-[#16213e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50" />
        <input value={inicio} onChange={(e) => setInicio(e.target.value)} type="date"
          className="bg-[#16213e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#e2b040]/50" />
        <input value={fin} onChange={(e) => setFin(e.target.value)} type="date"
          className="bg-[#16213e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#e2b040]/50" />
        <input value={paymentLink} onChange={(e) => setPaymentLink(e.target.value)} placeholder="Link de MercadoPago (opcional)"
          className="sm:col-span-2 bg-[#16213e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50" />
      </div>
      <button
        onClick={crear}
        disabled={enviando || !prestadorId}
        className="px-4 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-lg text-sm font-bold hover:bg-[#f0d080] transition-colors cursor-pointer disabled:opacity-50"
      >
        {enviando ? 'Generando...' : 'Generar membresía'}
      </button>
    </div>
  );
}

function TarjetaMembresia({ membresia, onCambio }: { membresia: Membresia; onCambio: () => void }) {
  const p = membresia.prestadores;
  const [procesando, setProcesando] = useState(false);

  async function accion(fn: () => Promise<void>) {
    setProcesando(true);
    try {
      await fn();
      onCambio();
    } finally {
      setProcesando(false);
    }
  }

  const mensajeWA = p ? mensajeCobroMembresia({
    nombre: p.nombre,
    n: 0,
    monto: `$${membresia.amount.toLocaleString('es-AR')}`,
    linkMercadoPago: membresia.payment_link || '(link pendiente)',
  }) : '';

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-white font-semibold text-sm">{p ? `${p.nombre} ${p.apellido}` : 'Prestador'}</p>
          <p className="text-gray-400 text-xs mt-0.5">{membresia.plan_name} · {membresia.period_start} — {membresia.period_end}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#e2b040] font-bold text-sm">${membresia.amount.toLocaleString('es-AR')}</span>
          <Badge text={MEMBRESIA_ESTADO_LABELS[membresia.estado]} colorClass={MEMBRESIA_ESTADO_COLORS[membresia.estado]} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
        {membresia.payment_link && (
          <a href={membresia.payment_link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 rounded-lg text-xs transition-colors">
            <i className="ri-links-line" />Abrir link MP
          </a>
        )}
        {mensajeWA && <CopyButton text={mensajeWA} label="Copiar msg cobro" />}
        {membresia.estado !== 'paid' && (
          <button
            disabled={procesando}
            onClick={() => accion(() => membresiasApi.marcarPagada(membresia.id, membresia.prestador_id))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-300 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <i className="ri-checkbox-circle-line" />Marcar pagada
          </button>
        )}
        {membresia.estado === 'pending' && (
          <button
            disabled={procesando}
            onClick={() => accion(() => membresiasApi.marcarVencida(membresia.id, membresia.prestador_id))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <i className="ri-error-warning-line" />Marcar vencida
          </button>
        )}
        {membresia.estado !== 'waived' && (
          <button
            disabled={procesando}
            onClick={() => accion(() => membresiasApi.condonar(membresia.id, membresia.prestador_id))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <i className="ri-gift-line" />Condonar
          </button>
        )}
      </div>
    </div>
  );
}

export default function MembresiasAdmin() {
  const [tab, setTab] = useState<Tab>('todas');
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [prestadoresElegibles, setPrestadoresElegibles] = useState<PrestadorLite[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [ms, { data: prestadoresData }] = await Promise.all([
        membresiasApi.listar(),
        supabase.from('prestadores')
          .select('id, nombre, apellido, categoria, telefono, total_leads, discount_rate, monthly_price')
          .eq('enabled', true)
          .order('total_leads', { ascending: false }),
      ]);
      setMembresias(ms);
      setPrestadoresElegibles((prestadoresData ?? []) as PrestadorLite[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar membresías');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'pending', label: MEMBRESIA_ESTADO_LABELS.pending },
    { id: 'paid', label: MEMBRESIA_ESTADO_LABELS.paid },
    { id: 'overdue', label: MEMBRESIA_ESTADO_LABELS.overdue },
    { id: 'waived', label: MEMBRESIA_ESTADO_LABELS.waived },
  ];

  const filtradas = tab === 'todas' ? membresias : membresias.filter((m) => m.estado === tab);
  const candidatosMembresia = prestadoresElegibles.filter((p) => p.total_leads >= 3);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Membresías / Pagos</h2>
          <p className="text-gray-400 text-sm mt-0.5">{membresias.length} membresía{membresias.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-xl text-sm font-bold hover:bg-[#f0d080] transition-colors cursor-pointer"
          >
            <i className="ri-add-line" />Nueva membresía
          </button>
          <button
            onClick={cargar}
            disabled={cargando}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <i className={`ri-refresh-line ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {mostrarForm && <FormularioNueva prestadores={prestadoresElegibles} onCreada={() => { setMostrarForm(false); cargar(); }} />}

      {candidatosMembresia.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-300 text-sm font-medium mb-2">
            {candidatosMembresia.length} prestador{candidatosMembresia.length !== 1 ? 'es' : ''} ya superó el umbral de leads gratis y podría pasar a membresía:
          </p>
          <div className="flex flex-wrap gap-2">
            {candidatosMembresia.map((p) => (
              <span key={p.id} className="px-2.5 py-1 bg-blue-500/15 text-blue-200 rounded-full text-xs">
                {p.nombre} {p.apellido} ({p.total_leads} leads)
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-[#1a1a2e] rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => {
          const count = t.id === 'todas' ? membresias.length : membresias.filter((m) => m.estado === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer flex-shrink-0 ${
                tab === t.id ? 'bg-[#e2b040] text-[#1a1a2e]' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-[#1a1a2e]/30 text-[#1a1a2e]' : 'bg-white/10 text-gray-300'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <i className="ri-loader-4-line animate-spin text-3xl text-[#e2b040]" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-14">
          <i className="ri-vip-crown-line text-4xl text-gray-600 mb-3 block" />
          <p className="text-gray-500 text-sm">No hay membresías para este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((m) => <TarjetaMembresia key={m.id} membresia={m} onCambio={cargar} />)}
        </div>
      )}
    </div>
  );
}
