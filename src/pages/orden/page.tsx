// ─────────────────────────────────────────────────────────────
// Página: /orden/:id
// Detalle y seguimiento de una orden para cliente o prestador.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PasosSeguimiento } from '../../components/ordenes/PasosSeguimiento';
import { HistorialEventos } from '../../components/ordenes/HistorialEventos';
import { EstadoBadge } from '../../components/ordenes/EstadoBadge';
import { ordenesService } from '../../services/ordenesService';
import type { OrdenConDetalle } from '../../types/ordenes';
import { formatMonto } from '../../types/ordenes';

const MOCK_MODE = import.meta.env.VITE_PAYMENT_MODE === 'mock';

export default function OrdenPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [datos, setDatos] = useState<OrdenConDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [simulando, setSimulando] = useState(false);
  const [mensajeSimulacion, setMensajeSimulacion] = useState('');

  // Leer identidad del localStorage / sessionStorage
  const clienteDni  = localStorage.getItem('mservicios_cliente_dni') ?? undefined;
  const prestadorId = localStorage.getItem('mservicios_prestador_id') ?? undefined;
  const esAdmin     = sessionStorage.getItem('mservicios_admin_ok') === '1';

  // Mensaje de retorno de la pasarela de pago
  const pagoQueryParam = searchParams.get('pago');

  async function cargar() {
    if (!id) return;
    setCargando(true);
    setError('');
    try {
      const res = await ordenesService.obtenerOrden(id, {
        esAdmin,
        clienteDni,
        prestadorId,
      });
      setDatos(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la orden');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function simularPago(estado: 'approved' | 'rejected') {
    if (!id) return;
    setSimulando(true);
    setMensajeSimulacion('');
    try {
      await ordenesService.simularPago(id, estado);
      setMensajeSimulacion(`Pago simulado (${estado === 'approved' ? 'aprobado' : 'rechazado'}).`);
      setTimeout(cargar, 800);
    } catch (err: unknown) {
      setMensajeSimulacion(err instanceof Error ? err.message : 'Error al simular');
    } finally {
      setSimulando(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-4xl text-[#e2b040]" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────
  if (error || !datos) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
        <div className="text-center">
          <i className="ri-error-warning-line text-5xl text-red-400 mb-4 block" />
          <p className="text-red-400 text-lg mb-4">{error || 'Orden no encontrada'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-semibold hover:bg-[#e2b040]/90 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const { orden, eventos, liquidacion } = datos;

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Header */}
      <header className="bg-[#16213e] border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
            <i className="ri-arrow-left-line text-xl" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-white truncate">{orden.titulo}</h1>
            <p className="text-xs text-gray-500 font-mono">#{orden.id.slice(0, 8)}…</p>
          </div>
          <EstadoBadge estado={orden.estado} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Banner de retorno de pasarela */}
        {pagoQueryParam === 'exitoso' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
            <i className="ri-checkbox-circle-line text-green-400 text-2xl" />
            <div>
              <p className="text-green-400 font-semibold">¡Pago realizado con éxito!</p>
              <p className="text-sm text-gray-400">Tu pago está siendo procesado. El estado se actualizará en breve.</p>
            </div>
          </div>
        )}
        {pagoQueryParam === 'pendiente' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
            <i className="ri-time-line text-yellow-400 text-2xl" />
            <div>
              <p className="text-yellow-400 font-semibold">Pago pendiente</p>
              <p className="text-sm text-gray-400">Tu pago está siendo revisado. Te notificaremos cuando se confirme.</p>
            </div>
          </div>
        )}
        {pagoQueryParam === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <i className="ri-close-circle-line text-red-400 text-2xl" />
            <div>
              <p className="text-red-400 font-semibold">El pago no se pudo completar</p>
              <p className="text-sm text-gray-400">Podés intentarlo nuevamente desde el botón de pago.</p>
            </div>
          </div>
        )}

        {/* Seguimiento de estado */}
        <section className="bg-[#16213e] border border-white/10 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-6 flex items-center gap-2">
            <i className="ri-map-pin-time-line text-[#e2b040]" />
            Estado de la orden
          </h2>
          <PasosSeguimiento estadoActual={orden.estado} />
        </section>

        {/* Detalle financiero */}
        <section className="bg-[#16213e] border border-white/10 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-money-dollar-circle-line text-[#e2b040]" />
            Detalle del pago
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Servicio</span>
              <span className="text-white font-semibold">{formatMonto(orden.monto_bruto)}</span>
            </div>
            {orden.paid_at && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Fecha de pago</span>
                <span className="text-gray-300">
                  {new Intl.DateTimeFormat('es-AR').format(new Date(orden.paid_at))}
                </span>
              </div>
            )}
            {liquidacion && (
              <>
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Para el prestador</span>
                    <span className="text-green-400">{formatMonto(liquidacion.monto_prestador)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Comisión plataforma</span>
                    <span className="text-purple-400">{formatMonto(liquidacion.monto_comision)}</span>
                  </div>
                  {liquidacion.metodo_transferencia && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Método de liberación</span>
                      <span className="text-gray-300">{liquidacion.metodo_transferencia}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Prestador */}
        {orden.prestadores && (
          <section className="bg-[#16213e] border border-white/10 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <i className="ri-user-3-line text-[#e2b040]" />
              Prestador
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#e2b040]/10 rounded-full flex items-center justify-center">
                <i className="ri-user-3-line text-2xl text-[#e2b040]" />
              </div>
              <div>
                <p className="text-white font-semibold">
                  {orden.prestadores.nombre} {orden.prestadores.apellido}
                </p>
                <p className="text-gray-400 text-sm capitalize">{orden.prestadores.categoria}</p>
              </div>
            </div>
          </section>
        )}

        {/* Botón de chat (clientes, prestadores y admin) */}
        {(clienteDni || prestadorId || esAdmin) && (
          <button
            onClick={() => navigate(`/chat?orden=${orden.id}`)}
            className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-medium text-base hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <i className="ri-chat-3-line text-[#e2b040] text-xl" />
            Abrir chat de la orden
          </button>
        )}

        {/* Botón de pago (si corresponde) */}
        {orden.estado === 'payment_pending' && orden.pago_link && (
          <a
            href={orden.pago_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 bg-[#e2b040] text-[#1a1a2e] rounded-2xl font-bold text-center text-lg hover:bg-[#e2b040]/90 transition-colors flex items-center justify-center gap-2"
          >
            <i className="ri-bank-card-line" />
            Ir a pagar
          </a>
        )}

        {/* MODO MOCK: Simulador de pagos */}
        {MOCK_MODE && orden.estado === 'payment_pending' && (
          <section className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-test-tube-line text-yellow-400 text-lg" />
              <h2 className="font-semibold text-yellow-400">Modo de prueba</h2>
            </div>
            {mensajeSimulacion && (
              <p className="text-sm text-gray-300 mb-3">{mensajeSimulacion}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => simularPago('approved')}
                disabled={simulando}
                className="flex-1 py-2.5 bg-green-500/20 text-green-300 rounded-xl hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {simulando ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-check-line" />}
                Simular aprobado
              </button>
              <button
                onClick={() => simularPago('rejected')}
                disabled={simulando}
                className="flex-1 py-2.5 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {simulando ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-close-line" />}
                Simular rechazado
              </button>
            </div>
          </section>
        )}

        {/* Historial de eventos */}
        <section className="bg-[#16213e] border border-white/10 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-6 flex items-center gap-2">
            <i className="ri-history-line text-[#e2b040]" />
            Historial
          </h2>
          <HistorialEventos eventos={eventos} />
        </section>
      </main>
    </div>
  );
}
