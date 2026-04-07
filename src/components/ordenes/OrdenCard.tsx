import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Orden } from '../../types/ordenes';
import { EstadoBadge } from './EstadoBadge';
import { formatMonto } from '../../types/ordenes';

interface OrdenCardProps {
  orden: Orden;
  /** Si true, muestra botones de acción de admin */
  esAdmin?: boolean;
  onCompletarServicio?: (orden: Orden) => void;
  onLiberarFondos?: (orden: Orden) => void;
}

function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(iso));
}

export function OrdenCard({
  orden,
  esAdmin = false,
  onCompletarServicio,
  onLiberarFondos,
}: OrdenCardProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#16213e] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-[#e2b040]/30 transition-colors">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{orden.titulo}</h3>
          {orden.descripcion && (
            <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{orden.descripcion}</p>
          )}
        </div>
        <EstadoBadge estado={orden.estado} />
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Monto</p>
          <p className="text-[#e2b040] font-bold text-base">{formatMonto(orden.monto_bruto)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Prestador</p>
          <p className="text-white">
            {orden.prestadores
              ? `${orden.prestadores.nombre} ${orden.prestadores.apellido}`
              : orden.prestador_id.slice(0, 8) + '…'}
          </p>
        </div>
        {esAdmin && (
          <>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Para prestador</p>
              <p className="text-green-400">{formatMonto(orden.monto_prestador)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Comisión ({orden.porcentaje_comision}%)</p>
              <p className="text-purple-400">{formatMonto(orden.monto_comision)}</p>
            </div>
          </>
        )}
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Creada</p>
          <p className="text-gray-300">{formatFecha(orden.creado_at)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">DNI cliente</p>
          <p className="text-gray-300">{orden.cliente_dni}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 flex-wrap mt-1">
        {/* Ver detalle (siempre disponible) */}
        <button
          onClick={() => navigate(`/orden/${orden.id}`)}
          className="flex-1 py-2 px-3 text-sm bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
        >
          <i className="ri-eye-line" />
          Ver detalle
        </button>

        {/* Ir a pagar (si está pendiente de pago y tiene link) */}
        {orden.estado === 'payment_pending' && orden.pago_link && (
          <a
            href={orden.pago_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 text-sm bg-[#e2b040]/20 text-[#e2b040] rounded-xl hover:bg-[#e2b040]/30 transition-colors flex items-center justify-center gap-1.5"
          >
            <i className="ri-bank-card-line" />
            Pagar
          </a>
        )}

        {/* Acciones admin */}
        {esAdmin && orden.estado === 'paid_pending_service' && onCompletarServicio && (
          <button
            onClick={() => onCompletarServicio(orden)}
            className="flex-1 py-2 px-3 text-sm bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-1.5"
          >
            <i className="ri-check-double-line" />
            Completar
          </button>
        )}

        {esAdmin && orden.estado === 'service_completed' && onLiberarFondos && (
          <button
            onClick={() => onLiberarFondos(orden)}
            className="flex-1 py-2 px-3 text-sm bg-green-500/20 text-green-300 rounded-xl hover:bg-green-500/30 transition-colors flex items-center justify-center gap-1.5"
          >
            <i className="ri-money-dollar-circle-line" />
            Liberar fondos
          </button>
        )}
      </div>
    </div>
  );
}
