// ─────────────────────────────────────────────────────────────
// Página: /pagar/:id
// Checkout de pago mock — solo activo cuando PAYMENT_MODE=mock.
// En producción, esta página nunca se usa porque el link va a MercadoPago.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ordenesService } from '../../services/ordenesService';
import type { OrdenConDetalle } from '../../types/ordenes';
import { formatMonto } from '../../types/ordenes';

const MOCK_MODE = import.meta.env.VITE_PAYMENT_MODE === 'mock';

export default function PagarPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [datos, setDatos] = useState<OrdenConDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  const isMock = searchParams.get('mock') === '1';
  const prefId = searchParams.get('prefId');

  const clienteDni = localStorage.getItem('mservicios_cliente_dni') ?? undefined;

  useEffect(() => {
    if (!id) return;
    // En modo mock intentamos cargar la orden
    // En prod esto nunca se usa, pero igual mostramos info si llegan
    ordenesService
      .obtenerOrden(id, { clienteDni })
      .then(setDatos)
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handlePagar(aprobar: boolean) {
    if (!id) return;
    setProcesando(true);
    try {
      await ordenesService.simularPago(id, aprobar ? 'approved' : 'rejected');
      // Redirigir como si fuera la pasarela real
      navigate(
        `/orden/${id}?pago=${aprobar ? 'exitoso' : 'error'}`,
        { replace: true }
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al simular pago');
      setProcesando(false);
    }
  }

  // ── En producción: mostrar mensaje de que esta ruta no aplica ──
  if (!MOCK_MODE || !isMock) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
        <div className="text-center">
          <i className="ri-information-line text-5xl text-[#e2b040] mb-4 block" />
          <p className="text-white text-lg mb-2">Esta página es solo para entorno de pruebas.</p>
          <p className="text-gray-400 text-sm mb-6">
            En producción, el pago se realiza directamente en MercadoPago.
          </p>
          <button
            onClick={() => navigate(`/orden/${id}`)}
            className="px-6 py-2.5 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-semibold hover:bg-[#e2b040]/90 transition-colors"
          >
            Ver orden
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-4xl text-[#e2b040]" />
      </div>
    );
  }

  const orden = datos?.orden;

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card de pago mock */}
        <div className="bg-[#16213e] border border-yellow-500/30 rounded-2xl overflow-hidden">
          {/* Header estilo pasarela */}
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <i className="ri-test-tube-line text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-sm">ENTORNO DE PRUEBA</span>
            </div>
            <p className="text-gray-400 text-xs">
              Esto simula la pasarela de pago. No se realiza ningún cobro real.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Logo */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#e2b040]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <i className="ri-bank-card-line text-3xl text-[#e2b040]" />
              </div>
              <h1 className="text-xl font-bold text-white">MServicios Pay</h1>
              <p className="text-gray-400 text-sm">Pasarela de pago segura</p>
            </div>

            {/* Detalle de la compra */}
            <div className="bg-[#1a1a2e] rounded-xl p-4 space-y-3">
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Resumen</p>
              {orden ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">{orden.titulo}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-[#e2b040] text-2xl font-bold">{formatMonto(orden.monto_bruto)}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-gray-400 text-sm">Orden #{id?.slice(0, 8)}…</p>
                  {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </div>
              )}
              {prefId && (
                <p className="text-xs text-gray-600 font-mono">Ref: {prefId}</p>
              )}
            </div>

            {/* Tarjeta de prueba */}
            <div className="bg-[#1a1a2e] rounded-xl p-4 space-y-3">
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Tarjeta de prueba</p>
              <div className="space-y-2 text-sm">
                {[
                  ['Número', '4509 9535 6623 3704'],
                  ['Vencimiento', '11/25'],
                  ['CVV', '123'],
                  ['Nombre', 'APRO'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-300 font-mono">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="space-y-3">
              <button
                onClick={() => handlePagar(true)}
                disabled={procesando}
                className="w-full py-4 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold text-lg hover:bg-[#e2b040]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {procesando
                  ? <><i className="ri-loader-4-line animate-spin" /> Procesando...</>
                  : <><i className="ri-check-line" /> Confirmar pago</>
                }
              </button>
              <button
                onClick={() => handlePagar(false)}
                disabled={procesando}
                className="w-full py-3 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
              >
                <i className="ri-close-line" />
                Simular pago rechazado
              </button>
              <button
                onClick={() => navigate(`/orden/${id}?pago=pendiente`)}
                disabled={procesando}
                className="w-full py-3 text-gray-600 hover:text-gray-400 transition-colors text-sm"
              >
                Cancelar y volver a la orden
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-4">
          <i className="ri-lock-line mr-1" />
          Pago simulado — sin datos reales — modo desarrollo
        </p>
      </div>
    </div>
  );
}
