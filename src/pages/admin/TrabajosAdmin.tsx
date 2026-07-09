import { useState, useEffect, useCallback } from 'react';
import { trabajosAdminApi } from '../../api/trabajosAdminApi';
import type { Trabajo, TrabajoEstado, AdminValidationStatus } from '../../types/trabajo';
import { TRABAJO_ESTADO_LABELS, TRABAJO_ESTADO_COLORS, ESTADOS_BOTONES, formatFechaTrabajo } from '../../types/trabajo';
import {
  buildWaUrl,
  mensajeNuevoContacto,
  mensajeLinkActualizarEstado,
  mensajeRecordatorioEstado,
  mensajePedidoResena,
  mensajeRecordatorioResena,
} from '../../utils/whatsappTemplates';

type Tab = 'todos' | TrabajoEstado;

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {text}
    </span>
  );
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

const VALIDATION_LABELS: Record<AdminValidationStatus, string> = {
  not_checked: 'Sin revisar',
  confirmed_by_review: 'Confirmado por reseña',
  manually_confirmed: 'Confirmado manual',
  disputed: 'Disputado',
  false_report: 'Reporte falso',
};

function TarjetaTrabajo({ trabajo, onRecargar }: { trabajo: Trabajo; onRecargar: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [notas, setNotas] = useState(trabajo.notes ?? '');

  const prestador = trabajo.prestadores;
  const jobLink = trabajo.job_token ? `${window.location.origin}/trabajo/${trabajo.job_token}` : '';
  const reviewLink = trabajo.review_token ? `${window.location.origin}/resena/${trabajo.review_token}` : '';

  async function cambiarEstado(estado: TrabajoEstado) {
    setGuardando(true);
    try {
      await trabajosAdminApi.actualizar(trabajo.id, { estado });
      onRecargar();
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarValidacion(estado: AdminValidationStatus) {
    setGuardando(true);
    try {
      await trabajosAdminApi.actualizar(trabajo.id, { admin_validation_status: estado });
      onRecargar();
    } finally {
      setGuardando(false);
    }
  }

  async function guardarNotas() {
    setGuardando(true);
    try {
      await trabajosAdminApi.actualizar(trabajo.id, { notes: notas });
      onRecargar();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-white font-semibold text-sm">{trabajo.vecino_nombre}</p>
          <p className="text-gray-400 text-xs mt-0.5"><i className="ri-phone-line mr-1" />{trabajo.vecino_telefono}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge text={TRABAJO_ESTADO_LABELS[trabajo.estado]} colorClass={TRABAJO_ESTADO_COLORS[trabajo.estado]} />
          {trabajo.admin_validation_status !== 'not_checked' && (
            <Badge
              text={VALIDATION_LABELS[trabajo.admin_validation_status]}
              colorClass={
                trabajo.admin_validation_status === 'disputed' || trabajo.admin_validation_status === 'false_report'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-green-500/20 text-green-300'
              }
            />
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-400">
        {prestador && (
          <span className="flex items-center gap-1">
            <i className="ri-user-star-line text-[#e2b040]" />
            {prestador.nombre} {prestador.apellido} · {prestador.categoria}
          </span>
        )}
        <span className="flex items-center gap-1">
          <i className="ri-calendar-line text-[#e2b040]" />
          {formatFechaTrabajo(trabajo.created_at)} · {trabajo.source}
        </span>
        {trabajo.servicio_descripcion && (
          <span className="flex items-center gap-1 sm:col-span-2">
            <i className="ri-file-text-line text-[#e2b040]" />
            {trabajo.servicio_descripcion}
          </span>
        )}
      </div>

      <button
        onClick={() => setAbierto((v) => !v)}
        className="text-[#e2b040] text-xs hover:text-[#f0d080] transition-colors cursor-pointer flex items-center gap-1"
      >
        {abierto ? 'Ocultar detalle' : 'Ver detalle y acciones'}
        <i className={abierto ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
      </button>

      {abierto && (
        <div className="space-y-3 pt-2 border-t border-white/5">
          {/* Override manual de estado */}
          <div>
            <p className="text-gray-500 text-xs mb-1.5">Cambiar estado manualmente</p>
            <div className="flex flex-wrap gap-1.5">
              {ESTADOS_BOTONES.map(({ estado }) => (
                <button
                  key={estado}
                  disabled={guardando || trabajo.estado === estado}
                  onClick={() => cambiarEstado(estado)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    trabajo.estado === estado ? 'bg-[#e2b040] text-[#1a1a2e]' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {TRABAJO_ESTADO_LABELS[estado]}
                </button>
              ))}
            </div>
          </div>

          {/* Validación */}
          <div>
            <p className="text-gray-500 text-xs mb-1.5">Validación admin</p>
            <div className="flex flex-wrap gap-1.5">
              {(['manually_confirmed', 'disputed', 'false_report'] as AdminValidationStatus[]).map((v) => (
                <button
                  key={v}
                  disabled={guardando}
                  onClick={() => cambiarValidacion(v)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-gray-300 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {VALIDATION_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Plantillas WhatsApp */}
          <div>
            <p className="text-gray-500 text-xs mb-1.5">Plantillas de WhatsApp</p>
            <div className="flex flex-wrap gap-2">
              {jobLink && prestador?.telefono && (
                <>
                  <a
                    href={buildWaUrl(prestador.telefono, mensajeNuevoContacto({ nombre: trabajo.vecino_nombre, servicio: trabajo.categoria || prestador.categoria, link: jobLink }))}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-300 rounded-lg text-xs transition-colors"
                  >
                    <i className="ri-whatsapp-line" />Avisar nuevo contacto
                  </a>
                  <CopyButton text={mensajeLinkActualizarEstado({ link: jobLink })} label="Copiar: link estado" />
                  <CopyButton text={mensajeRecordatorioEstado({ nombre: prestador.nombre, vecino: trabajo.vecino_nombre, link: jobLink })} label="Copiar: recordatorio" />
                </>
              )}
              {reviewLink && (
                <>
                  <CopyButton
                    text={mensajePedidoResena({ nombre: trabajo.vecino_nombre, prestador: `${prestador?.nombre ?? ''} ${prestador?.apellido ?? ''}`.trim(), link: reviewLink })}
                    label="Copiar: pedido reseña"
                  />
                  <CopyButton
                    text={mensajeRecordatorioResena({ nombre: trabajo.vecino_nombre, prestador: `${prestador?.nombre ?? ''} ${prestador?.apellido ?? ''}`.trim(), link: reviewLink })}
                    label="Copiar: recordatorio reseña"
                  />
                </>
              )}
            </div>
          </div>

          {/* Notas internas */}
          <div>
            <p className="text-gray-500 text-xs mb-1.5">Notas internas</p>
            <div className="flex gap-2">
              <input
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="flex-1 bg-[#16213e] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50"
                placeholder="Nota interna..."
              />
              <button
                onClick={guardarNotas}
                disabled={guardando}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrabajosAdmin() {
  const [tab, setTab] = useState<Tab>('todos');
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await trabajosAdminApi.listar();
      setTrabajos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar trabajos');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'nuevo_contacto', label: TRABAJO_ESTADO_LABELS.nuevo_contacto },
    { id: 'contactado', label: TRABAJO_ESTADO_LABELS.contactado },
    { id: 'presupuesto_enviado', label: TRABAJO_ESTADO_LABELS.presupuesto_enviado },
    { id: 'confirmado', label: TRABAJO_ESTADO_LABELS.confirmado },
    { id: 'terminado', label: TRABAJO_ESTADO_LABELS.terminado },
    { id: 'no_avanzo', label: TRABAJO_ESTADO_LABELS.no_avanzo },
  ];

  const filtrados = tab === 'todos' ? trabajos : trabajos.filter((t) => t.estado === tab);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Leads / Trabajos</h2>
          <p className="text-gray-400 text-sm mt-0.5">{trabajos.length} trabajo{trabajos.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <i className={`ri-refresh-line ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="flex gap-1 bg-[#1a1a2e] rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => {
          const count = t.id === 'todos' ? trabajos.length : trabajos.filter((tr) => tr.estado === t.id).length;
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
      ) : filtrados.length === 0 ? (
        <div className="text-center py-14">
          <i className="ri-briefcase-line text-4xl text-gray-600 mb-3 block" />
          <p className="text-gray-500 text-sm">No hay trabajos para este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((t) => <TarjetaTrabajo key={t.id} trabajo={t} onRecargar={cargar} />)}
        </div>
      )}
    </div>
  );
}
