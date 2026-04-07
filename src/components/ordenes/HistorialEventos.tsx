import React from 'react';
import type { OrdenEvento } from '../../types/ordenes';
import { ESTADO_LABELS } from '../../types/ordenes';

const TIPO_ICONO: Record<string, string> = {
  orden_creada:       'ri-file-add-line',
  pago_generado:      'ri-bank-card-line',
  pago_confirmado:    'ri-shield-check-line',
  pago_rejected:      'ri-close-circle-line',
  pago_cancelled:     'ri-close-circle-line',
  servicio_completado:'ri-check-double-line',
  fondos_liberados:   'ri-money-dollar-circle-line',
};

const TIPO_COLOR: Record<string, string> = {
  orden_creada:       'text-gray-400 bg-gray-500/20',
  pago_generado:      'text-yellow-400 bg-yellow-500/20',
  pago_confirmado:    'text-blue-400 bg-blue-500/20',
  pago_rejected:      'text-red-400 bg-red-500/20',
  pago_cancelled:     'text-red-400 bg-red-500/20',
  servicio_completado:'text-purple-400 bg-purple-500/20',
  fondos_liberados:   'text-green-400 bg-green-500/20',
};

const TIPO_LABEL: Record<string, string> = {
  orden_creada:       'Orden creada',
  pago_generado:      'Link de pago generado',
  pago_confirmado:    'Pago confirmado',
  pago_rejected:      'Pago rechazado',
  pago_cancelled:     'Pago cancelado',
  servicio_completado:'Servicio completado',
  fondos_liberados:   'Fondos liberados',
};

function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

interface HistorialEventosProps {
  eventos: OrdenEvento[];
}

export function HistorialEventos({ eventos }: HistorialEventosProps) {
  if (eventos.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Sin eventos registrados.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-white/10 space-y-6 pl-6">
      {eventos.map((ev) => {
        const icono = TIPO_ICONO[ev.tipo] ?? 'ri-information-line';
        const color = TIPO_COLOR[ev.tipo] ?? 'text-gray-400 bg-gray-500/20';
        const label = TIPO_LABEL[ev.tipo] ?? ev.tipo;

        return (
          <li key={ev.id} className="relative">
            {/* Punto en la línea */}
            <div
              className={`absolute -left-[1.65rem] w-8 h-8 rounded-full flex items-center justify-center text-sm ${color}`}
            >
              <i className={icono} />
            </div>

            <div className="bg-[#16213e] rounded-xl p-4 ml-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <span className="font-semibold text-white text-sm">{label}</span>
                <span className="text-xs text-gray-500 shrink-0">{formatFecha(ev.creado_at)}</span>
              </div>

              {/* Transición de estado */}
              {ev.estado_anterior && ev.estado_nuevo && ev.estado_anterior !== ev.estado_nuevo && (
                <p className="text-xs text-gray-400 mt-1">
                  {ESTADO_LABELS[ev.estado_anterior] ?? ev.estado_anterior}
                  {' → '}
                  <span className="text-white">{ESTADO_LABELS[ev.estado_nuevo] ?? ev.estado_nuevo}</span>
                </p>
              )}

              {/* Datos extra */}
              {ev.datos && Object.keys(ev.datos).length > 0 && (
                <details className="mt-2 text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-300 transition-colors">
                    Ver detalles
                  </summary>
                  <pre className="mt-2 bg-black/30 rounded p-2 overflow-x-auto text-gray-400 text-xs leading-relaxed">
                    {JSON.stringify(ev.datos, null, 2)}
                  </pre>
                </details>
              )}

              {ev.creado_por && (
                <p className="text-xs text-gray-600 mt-1.5">por {ev.creado_por}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
