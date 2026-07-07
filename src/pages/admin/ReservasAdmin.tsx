import { useState, useEffect, useCallback } from 'react';
import { reservasApi } from '../../api/reservasApi';
import { comisionesApi } from '../../api/comisionesApi';
import type { Reserva, Comision } from '../../types/reservas';
import {
  RESERVA_ESTADO_LABELS,
  RESERVA_ESTADO_COLORS,
  COMISION_ESTADO_LABELS,
  COMISION_ESTADO_COLORS,
  formatFechaReserva,
  estaVencida,
} from '../../types/reservas';

type Tab = 'activas' | 'vencidas' | 'comisiones' | 'pagadas' | 'cancelaciones' | 'incidentes';

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {text}
    </span>
  );
}

function CopyButton({
  text,
  label,
  onCopied,
}: {
  text: string;
  label?: string;
  onCopied?: () => Promise<void> | void;
}) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await navigator.clipboard.writeText(text);
    await onCopied?.();
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <button
      onClick={copiar}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#e2b040]/10 hover:bg-[#e2b040]/20 text-[#e2b040] rounded-lg text-xs transition-colors cursor-pointer"
    >
      <i className={copiado ? 'ri-check-line' : 'ri-file-copy-line'} />
      {copiado ? 'Copiado' : (label ?? 'Copiar')}
    </button>
  );
}

function TarjetaReserva({
  reserva,
  acciones,
}: {
  reserva: Reserva;
  acciones?: React.ReactNode;
}) {
  const prestador = reserva.prestadores;

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-white font-semibold text-sm">{reserva.nombre} {reserva.apellido}</p>
          <p className="text-gray-400 text-xs mt-0.5">
            <i className="ri-phone-line mr-1" />{reserva.telefono}
          </p>
        </div>
        <Badge
          text={RESERVA_ESTADO_LABELS[reserva.estado]}
          colorClass={RESERVA_ESTADO_COLORS[reserva.estado]}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-400">
        {prestador && (
          <span className="flex items-center gap-1">
            <i className="ri-user-star-line text-[#e2b040]" />
            {prestador.nombre} {prestador.apellido} - {prestador.categoria}
          </span>
        )}
        <span className="flex items-center gap-1">
          <i className="ri-calendar-line text-[#e2b040]" />
          {formatFechaReserva(reserva.dia)} - {reserva.turno === 'mañana' ? 'Mañana' : 'Tarde'}
        </span>
        {reserva.zona && (
          <span className="flex items-center gap-1">
            <i className="ri-map-pin-line text-[#e2b040]" />
            {reserva.zona}
          </span>
        )}
        {reserva.descripcion_trabajo && (
          <span className="flex items-center gap-1 sm:col-span-2">
            <i className="ri-tools-line text-[#e2b040]" />
            {reserva.descripcion_trabajo}
          </span>
        )}
        {reserva.motivo_cancelacion && (
          <span className="sm:col-span-2 flex items-start gap-1 text-orange-300">
            <i className="ri-information-line mt-0.5" />
            Motivo: {reserva.motivo_cancelacion}
          </span>
        )}
      </div>

      {acciones && <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">{acciones}</div>}
    </div>
  );
}

function TarjetaComision({
  comision,
  modo = 'gestion',
  onCopiada,
  onPagada,
  onIncidente,
  onPendiente,
}: {
  comision: Comision;
  modo?: 'gestion' | 'pagadas' | 'incidentes';
  onCopiada?: (id: string) => Promise<void>;
  onPagada?: (id: string) => Promise<void>;
  onIncidente?: (id: string) => Promise<void>;
  onPendiente?: (id: string) => Promise<void>;
}) {
  const r = comision.reservas;
  const p = comision.prestadores ?? comision.reservas?.prestadores;
  const monto = comision.monto ?? 3000;

  const mensajeWA = p
    ? `Hola ${p.nombre}! Se concreto la reserva del trabajo programado para el ${r ? formatFechaReserva(r.dia) : ''} (${r?.turno === 'mañana' ? 'Mañana' : 'Tarde'}). Te dejamos el link para abonar la comision correspondiente de $${monto.toLocaleString('es-AR')}:\n\n${comision.mp_init_point ?? '(link pendiente)'}\n\nMuchas gracias.`
    : '';

  const marcarCopiada = () => onCopiada?.(comision.id);

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-white font-semibold text-sm">
            {p ? `${p.nombre} ${p.apellido}` : 'Prestador sin datos'}
          </p>
          {p?.telefono && (
            <p className="text-gray-400 text-xs mt-0.5">
              <i className="ri-whatsapp-line mr-1 text-green-400" />{p.telefono}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#e2b040] font-bold text-sm">${monto.toLocaleString('es-AR')}</span>
          <Badge
            text={COMISION_ESTADO_LABELS[comision.estado]}
            colorClass={COMISION_ESTADO_COLORS[comision.estado]}
          />
        </div>
      </div>

      {r && (
        <div className="text-xs text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
          <span><i className="ri-calendar-line mr-1 text-[#e2b040]" />{formatFechaReserva(r.dia)} - {r.turno === 'mañana' ? 'Mañana' : 'Tarde'}</span>
          <span><i className="ri-user-line mr-1 text-[#e2b040]" />{r.nombre} {r.apellido}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
        {comision.mp_init_point && (
          <>
            <a
              href={comision.mp_init_point}
              target="_blank"
              rel="noopener noreferrer"
              onClick={marcarCopiada}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 rounded-lg text-xs transition-colors"
            >
              <i className="ri-links-line" />
              Abrir link MP
            </a>
            <CopyButton text={comision.mp_init_point} label="Copiar link" onCopied={marcarCopiada} />
          </>
        )}
        {mensajeWA && (
          <CopyButton text={mensajeWA} label="Copiar msg WhatsApp" onCopied={marcarCopiada} />
        )}

        {modo !== 'pagadas' && onPagada && (
          <button
            onClick={() => onPagada(comision.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-300 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <i className="ri-checkbox-circle-line" />
            Marcar pagada
          </button>
        )}

        {modo === 'gestion' && onIncidente && (
          <button
            onClick={() => onIncidente(comision.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <i className="ri-error-warning-line" />
            Marcar incidente
          </button>
        )}

        {modo === 'incidentes' && onPendiente && (
          <button
            onClick={() => onPendiente(comision.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <i className="ri-arrow-go-back-line" />
            Volver a gestion
          </button>
        )}
      </div>
    </div>
  );
}

export default function ReservasAdmin() {
  const [tab, setTab] = useState<Tab>('activas');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState<Set<string>>(new Set());
  const [procesandoTodas, setProcesandoTodas] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [rs, cs] = await Promise.all([
        reservasApi.listarTodas(),
        comisionesApi.listarTodas(),
      ]);
      setReservas(rs);
      setComisiones(cs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const activas = reservas.filter(r => r.estado === 'reserva_activa' && !estaVencida(r));
  const vencidas = reservas.filter(r => r.estado === 'reserva_activa' && estaVencida(r));
  const cancelaciones = reservas.filter(r => [
    'cancelada_por_usuario',
    'cancelacion_solicitada_por_prestador',
    'cancelacion_confirmada_por_usuario',
    'cancelacion_rechazada_por_usuario',
  ].includes(r.estado));
  const incidentesReservas = reservas.filter(r => r.estado === 'incidente');

  const comisionesGestion = comisiones.filter(c => [
    'link_pago_generado',
    'comision_pendiente',
    'comision_vencida',
  ].includes(c.estado));
  const comisionesPagadas = comisiones.filter(c => c.estado === 'comision_pagada');
  const comisionesIncidente = comisiones.filter(c => c.estado === 'incidente');
  const incidentesTotal = incidentesReservas.length + comisionesIncidente.length;

  async function procesarVencida(reservaId: string) {
    setProcesando(prev => new Set(prev).add(reservaId));
    try {
      await reservasApi.procesarVencida(reservaId);
      await cargar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al procesar reserva');
    } finally {
      setProcesando(prev => {
        const s = new Set(prev);
        s.delete(reservaId);
        return s;
      });
    }
  }

  async function procesarTodas() {
    setProcesandoTodas(true);
    try {
      const resultado = await reservasApi.procesarTodasVencidas();
      if (resultado.errores.length > 0) {
        alert(`Se procesaron ${resultado.procesadas.length} reserva(s). ${resultado.errores.length} fallaron:\n` +
          resultado.errores.map(e => `- ${e.reserva_id}: ${e.mensaje}`).join('\n'));
      }
      await cargar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al procesar reservas');
    } finally {
      setProcesandoTodas(false);
    }
  }

  async function confirmarCancelacion(reservaId: string) {
    await reservasApi.actualizarEstado(reservaId, 'cancelacion_confirmada_por_usuario');
    await cargar();
  }

  async function rechazarCancelacion(reservaId: string) {
    await reservasApi.actualizarEstado(reservaId, 'cancelacion_rechazada_por_usuario');
    await cargar();
  }

  async function marcarIncidenteReserva(reservaId: string) {
    await reservasApi.actualizarEstado(reservaId, 'incidente');
    await cargar();
  }

  async function marcarComisionCopiada(comisionId: string) {
    await comisionesApi.marcarPendienteSiLinkGenerado(comisionId);
    await cargar();
  }

  async function comisionPagada(comisionId: string) {
    await comisionesApi.marcarPagadaManual(comisionId);
    await cargar();
  }

  async function comisionIncidente(comisionId: string) {
    await comisionesApi.marcarIncidente(comisionId);
    await cargar();
  }

  async function comisionPendiente(comisionId: string) {
    await comisionesApi.actualizarEstado(comisionId, 'comision_pendiente');
    await cargar();
  }

  const TABS: { id: Tab; label: string; count: number; color?: string }[] = [
    { id: 'activas', label: 'Activas', count: activas.length },
    { id: 'vencidas', label: 'Para procesar', count: vencidas.length, color: vencidas.length > 0 ? 'text-orange-300' : undefined },
    { id: 'comisiones', label: 'Comisiones', count: comisionesGestion.length },
    { id: 'pagadas', label: 'Pagadas', count: comisionesPagadas.length, color: comisionesPagadas.length > 0 ? 'text-green-300' : undefined },
    { id: 'cancelaciones', label: 'Cancelaciones', count: cancelaciones.length },
    { id: 'incidentes', label: 'Incidentes', count: incidentesTotal, color: incidentesTotal > 0 ? 'text-red-400' : undefined },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Reservas y Comisiones</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {reservas.length} reserva{reservas.length !== 1 ? 's' : ''} - {comisiones.length} comision{comisiones.length !== 1 ? 'es' : ''}
          </p>
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

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-1 bg-[#1a1a2e] rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer flex-shrink-0 ${
              tab === t.id
                ? 'bg-[#e2b040] text-[#1a1a2e]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-[#1a1a2e]/30 text-[#1a1a2e]' : (t.color ?? 'bg-white/10 text-gray-300')
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <i className="ri-loader-4-line animate-spin text-3xl text-[#e2b040]" />
        </div>
      ) : (
        <>
          {tab === 'activas' && (
            <div className="space-y-3">
              {activas.length === 0 ? (
                <EmptyState icon="ri-calendar-check-line" texto="No hay reservas activas" />
              ) : (
                activas.map(r => <TarjetaReserva key={r.id} reserva={r} />)
              )}
            </div>
          )}

          {tab === 'vencidas' && (
            <div className="space-y-3">
              {vencidas.length > 0 && (
                <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
                  <p className="text-orange-300 text-sm font-medium">
                    {vencidas.length} reserva{vencidas.length !== 1 ? 's' : ''} lista{vencidas.length !== 1 ? 's' : ''} para procesar
                  </p>
                  <button
                    onClick={procesarTodas}
                    disabled={procesandoTodas}
                    className="px-4 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-lg text-sm font-bold hover:bg-[#f0d080] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {procesandoTodas ? (
                      <span className="flex items-center gap-2"><i className="ri-loader-4-line animate-spin" />Procesando...</span>
                    ) : 'Procesar todas'}
                  </button>
                </div>
              )}
              {vencidas.length === 0 ? (
                <EmptyState icon="ri-checkbox-circle-line" texto="No hay reservas vencidas para procesar" />
              ) : (
                vencidas.map(r => (
                  <TarjetaReserva
                    key={r.id}
                    reserva={r}
                    acciones={
                      <button
                        onClick={() => procesarVencida(r.id)}
                        disabled={procesando.has(r.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#e2b040] text-[#1a1a2e] rounded-lg text-xs font-bold hover:bg-[#f0d080] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {procesando.has(r.id) ? (
                          <><i className="ri-loader-4-line animate-spin" />Procesando...</>
                        ) : (
                          <><i className="ri-coins-line" />Generar comision</>
                        )}
                      </button>
                    }
                  />
                ))
              )}
            </div>
          )}

          {tab === 'comisiones' && (
            <div className="space-y-3">
              {comisionesGestion.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {(['link_pago_generado', 'comision_pendiente', 'comision_vencida'] as const).map(est => {
                    const n = comisionesGestion.filter(c => c.estado === est).length;
                    return (
                      <div key={est} className={`rounded-xl p-3 text-center ${COMISION_ESTADO_COLORS[est]}`}>
                        <p className="text-lg font-bold">{n}</p>
                        <p className="text-xs mt-0.5">{COMISION_ESTADO_LABELS[est]}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {comisionesGestion.length === 0 ? (
                <EmptyState icon="ri-coins-line" texto="No hay comisiones para gestionar" />
              ) : (
                comisionesGestion.map(c => (
                  <TarjetaComision
                    key={c.id}
                    comision={c}
                    onCopiada={marcarComisionCopiada}
                    onPagada={comisionPagada}
                    onIncidente={comisionIncidente}
                  />
                ))
              )}
            </div>
          )}

          {tab === 'pagadas' && (
            <div className="space-y-3">
              {comisionesPagadas.length === 0 ? (
                <EmptyState icon="ri-checkbox-circle-line" texto="No hay comisiones pagadas" />
              ) : (
                comisionesPagadas.map(c => (
                  <TarjetaComision key={c.id} comision={c} modo="pagadas" />
                ))
              )}
            </div>
          )}

          {tab === 'cancelaciones' && (
            <div className="space-y-3">
              {cancelaciones.length === 0 ? (
                <EmptyState icon="ri-close-circle-line" texto="No hay cancelaciones" />
              ) : (
                cancelaciones.map(r => (
                  <TarjetaReserva
                    key={r.id}
                    reserva={r}
                    acciones={
                      r.estado === 'cancelacion_solicitada_por_prestador' ? (
                        <>
                          <button
                            onClick={() => confirmarCancelacion(r.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-300 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            <i className="ri-check-line" />Confirmar cancelacion
                          </button>
                          <button
                            onClick={() => rechazarCancelacion(r.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            <i className="ri-close-line" />Rechazar
                          </button>
                        </>
                      ) : r.estado === 'cancelacion_rechazada_por_usuario' ? (
                        <button
                          onClick={() => marcarIncidenteReserva(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          <i className="ri-error-warning-line" />Marcar incidente
                        </button>
                      ) : null
                    }
                  />
                ))
              )}
            </div>
          )}

          {tab === 'incidentes' && (
            <div className="space-y-3">
              {incidentesTotal === 0 ? (
                <EmptyState icon="ri-shield-check-line" texto="Sin incidentes registrados" />
              ) : (
                <>
                  {comisionesIncidente.map(c => (
                    <TarjetaComision
                      key={c.id}
                      comision={c}
                      modo="incidentes"
                      onPendiente={comisionPendiente}
                      onPagada={comisionPagada}
                    />
                  ))}
                  {incidentesReservas.map(r => <TarjetaReserva key={r.id} reserva={r} />)}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ icon, texto }: { icon: string; texto: string }) {
  return (
    <div className="text-center py-14">
      <i className={`${icon} text-4xl text-gray-600 mb-3 block`} />
      <p className="text-gray-500 text-sm">{texto}</p>
    </div>
  );
}
