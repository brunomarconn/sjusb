import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ordenesService } from '../../services/ordenesService';
import type { CrearOrdenInput } from '../../types/ordenes';

interface Prestador {
  id: string;
  nombre: string;
  apellido: string;
  categoria: string;
}

interface ModalCrearOrdenProps {
  onClose: () => void;
  onCreada: () => void;
}

const COMISION_DEFAULT = 15;

export function ModalCrearOrden({ onClose, onCreada }: ModalCrearOrdenProps) {
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [form, setForm] = useState<CrearOrdenInput>({
    cliente_dni: '',
    cliente_email: '',
    prestador_id: '',
    titulo: '',
    descripcion: '',
    monto_bruto: 0,
    porcentaje_comision: COMISION_DEFAULT,
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Cargar prestadores activos
  useEffect(() => {
    supabase
      .from('prestadores')
      .select('id, nombre, apellido, categoria')
      .order('nombre')
      .then(({ data }) => setPrestadores(data ?? []));
  }, []);

  // Cálculo en tiempo real
  const montoPrestador = Math.round(
    form.monto_bruto * (1 - (form.porcentaje_comision ?? COMISION_DEFAULT) / 100) * 100
  ) / 100;

  const montoComision = Math.round(
    form.monto_bruto * ((form.porcentaje_comision ?? COMISION_DEFAULT) / 100) * 100
  ) / 100;

  const formatARS = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.cliente_dni.trim()) { setError('DNI del cliente es requerido'); return; }
    if (!form.prestador_id)       { setError('Elegí un prestador'); return; }
    if (!form.titulo.trim())       { setError('El título es requerido'); return; }
    if (!form.monto_bruto || form.monto_bruto <= 0) { setError('El monto debe ser mayor a 0'); return; }

    setCargando(true);
    try {
      await ordenesService.crearOrden(form);
      onCreada();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la orden');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <i className="ri-file-add-line text-[#e2b040]" />
            Nueva Orden
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* DNI cliente */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">DNI del cliente *</label>
            <input
              type="text"
              value={form.cliente_dni}
              onChange={e => setForm(f => ({ ...f, cliente_dni: e.target.value }))}
              placeholder="12345678"
              className="w-full bg-[#16213e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50"
            />
          </div>

          {/* Email cliente (opcional) */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email del cliente (opcional)</label>
            <input
              type="email"
              value={form.cliente_email ?? ''}
              onChange={e => setForm(f => ({ ...f, cliente_email: e.target.value }))}
              placeholder="cliente@email.com"
              className="w-full bg-[#16213e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50"
            />
          </div>

          {/* Prestador */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Prestador *</label>
            <select
              value={form.prestador_id}
              onChange={e => setForm(f => ({ ...f, prestador_id: e.target.value }))}
              className="w-full bg-[#16213e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e2b040]/50"
            >
              <option value="">— Seleccioná un prestador —</option>
              {prestadores.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido} — {p.categoria}
                </option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Título del servicio *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Limpieza de pileta 2h"
              className="w-full bg-[#16213e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Descripción (opcional)</label>
            <textarea
              value={form.descripcion ?? ''}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Detalle del trabajo acordado..."
              rows={3}
              className="w-full bg-[#16213e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50 resize-none"
            />
          </div>

          {/* Monto + comisión */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Monto bruto (ARS) *</label>
              <input
                type="number"
                min={1}
                value={form.monto_bruto || ''}
                onChange={e => setForm(f => ({ ...f, monto_bruto: parseFloat(e.target.value) || 0 }))}
                placeholder="20000"
                className="w-full bg-[#16213e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Comisión (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.porcentaje_comision ?? COMISION_DEFAULT}
                onChange={e => setForm(f => ({ ...f, porcentaje_comision: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-[#16213e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e2b040]/50"
              />
            </div>
          </div>

          {/* Preview de distribución */}
          {form.monto_bruto > 0 && (
            <div className="bg-[#16213e] rounded-xl p-4 border border-white/5 text-sm space-y-2">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Distribución del pago</p>
              <div className="flex justify-between">
                <span className="text-gray-400">Para el prestador</span>
                <span className="text-green-400 font-semibold">{formatARS(montoPrestador)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Comisión plataforma ({form.porcentaje_comision}%)</span>
                <span className="text-purple-400 font-semibold">{formatARS(montoComision)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="text-white font-semibold">Total cliente paga</span>
                <span className="text-[#e2b040] font-bold">{formatARS(form.monto_bruto)}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex gap-2">
              <i className="ri-error-warning-line shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="flex-1 py-2.5 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-semibold hover:bg-[#e2b040]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {cargando ? (
                <>
                  <i className="ri-loader-4-line animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <i className="ri-file-add-line" />
                  Crear orden
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
