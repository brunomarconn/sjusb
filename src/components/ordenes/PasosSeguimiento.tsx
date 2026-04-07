import React from 'react';
import type { OrdenEstado } from '../../types/ordenes';

interface Paso {
  estado: OrdenEstado;
  label: string;
  icono: string;
  descripcion: string;
}

const PASOS: Paso[] = [
  {
    estado: 'draft',
    label: 'Orden creada',
    icono: 'ri-file-add-line',
    descripcion: 'La orden fue registrada en el sistema.',
  },
  {
    estado: 'payment_pending',
    label: 'Esperando pago',
    icono: 'ri-bank-card-line',
    descripcion: 'El cliente debe completar el pago.',
  },
  {
    estado: 'paid_pending_service',
    label: 'Pago confirmado',
    icono: 'ri-shield-check-line',
    descripcion: 'Fondos retenidos. El prestador realizará el servicio.',
  },
  {
    estado: 'service_completed',
    label: 'Servicio realizado',
    icono: 'ri-check-double-line',
    descripcion: 'El servicio fue confirmado. Pendiente liberación de fondos.',
  },
  {
    estado: 'released',
    label: 'Fondos liberados',
    icono: 'ri-money-dollar-circle-line',
    descripcion: 'Los fondos fueron transferidos al prestador.',
  },
];

// Índice del estado en la secuencia principal (ignora cancelled/refunded)
function getIndice(estado: OrdenEstado): number {
  return PASOS.findIndex(p => p.estado === estado);
}

interface PasosSeguimientoProps {
  estadoActual: OrdenEstado;
}

export function PasosSeguimiento({ estadoActual }: PasosSeguimientoProps) {
  // Estados cancelados / reembolsados muestran mensaje aparte
  if (estadoActual === 'cancelled' || estadoActual === 'refunded') {
    const esCancelado = estadoActual === 'cancelled';
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
        <i className={`text-2xl ${esCancelado ? 'ri-close-circle-line text-red-400' : 'ri-refund-2-line text-orange-400'}`} />
        <div>
          <p className="font-semibold text-white">
            {esCancelado ? 'Orden cancelada' : 'Orden reembolsada'}
          </p>
          <p className="text-sm text-gray-400">
            {esCancelado
              ? 'Esta orden fue cancelada y no se puede reactivar.'
              : 'El pago fue reembolsado al cliente.'}
          </p>
        </div>
      </div>
    );
  }

  const indiceActual = getIndice(estadoActual);

  return (
    <div className="w-full">
      {/* Barra de progreso */}
      <div className="relative flex items-center justify-between mb-2">
        {/* Línea de fondo */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 z-0" />
        {/* Línea de progreso */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#e2b040] z-0 transition-all duration-500"
          style={{ width: `${(indiceActual / (PASOS.length - 1)) * 100}%` }}
        />

        {PASOS.map((paso, idx) => {
          const completado = idx < indiceActual;
          const activo     = idx === indiceActual;

          return (
            <div
              key={paso.estado}
              className="relative z-10 flex flex-col items-center"
              style={{ flex: '1 1 0', maxWidth: `${100 / PASOS.length}%` }}
            >
              {/* Círculo */}
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all
                  ${completado ? 'bg-[#e2b040] text-[#1a1a2e]' : ''}
                  ${activo     ? 'bg-[#e2b040] text-[#1a1a2e] ring-4 ring-[#e2b040]/30' : ''}
                  ${!completado && !activo ? 'bg-[#16213e] border border-white/20 text-gray-500' : ''}
                `}
              >
                {completado
                  ? <i className="ri-check-line font-bold" />
                  : <i className={paso.icono} />
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex">
        {PASOS.map((paso, idx) => {
          const activo = idx === indiceActual;
          return (
            <div
              key={paso.estado}
              className="flex flex-col items-center text-center px-1"
              style={{ flex: '1 1 0' }}
            >
              <span
                className={`text-xs leading-tight mt-1 ${activo ? 'text-[#e2b040] font-semibold' : 'text-gray-500'}`}
              >
                {paso.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Descripción del paso actual */}
      {indiceActual >= 0 && (
        <p className="text-sm text-gray-400 text-center mt-3">
          {PASOS[indiceActual].descripcion}
        </p>
      )}
    </div>
  );
}
