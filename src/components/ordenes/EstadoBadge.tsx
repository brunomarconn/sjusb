import React from 'react';
import type { OrdenEstado } from '../../types/ordenes';
import { ESTADO_LABELS, ESTADO_COLORS } from '../../types/ordenes';

interface EstadoBadgeProps {
  estado: OrdenEstado;
  className?: string;
}

const ESTADO_ICONS: Record<OrdenEstado, string> = {
  draft:                'ri-draft-line',
  payment_pending:      'ri-time-line',
  paid_pending_service: 'ri-shield-check-line',
  service_completed:    'ri-check-double-line',
  released:             'ri-money-dollar-circle-line',
  cancelled:            'ri-close-circle-line',
  refunded:             'ri-refund-2-line',
};

export function EstadoBadge({ estado, className = '' }: EstadoBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_COLORS[estado]} ${className}`}
    >
      <i className={ESTADO_ICONS[estado]} />
      {ESTADO_LABELS[estado]}
    </span>
  );
}
