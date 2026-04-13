// ─────────────────────────────────────────────────────────────
// Página: /reservar/:prestadorId
// Permite elegir día y turno según la disponibilidad del
// prestador y completar los datos de contacto.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { marcarReservado } from '../usuarios/page';

// ── Tipos ─────────────────────────────────────────────────────

interface Prestador {
  id: string;
  nombre: string;
  apellido: string;
  categoria: string;
  foto_url: string;
  telefono?: string;
}

interface DisponibilidadSlot {
  dia_semana: number; // 0=Dom, 1=Lun, ..., 6=Sáb
  turno: 'mañana' | 'tarde';
}

// ── Helpers ───────────────────────────────────────────────────

const DIAS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
];

function formatFecha(date: Date): string {
  return `${DIAS_ES[date.getDay()]} ${date.getDate()} de ${MESES_ES[date.getMonth()]}`;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Genera los próximos N días a partir de hoy
function proximosDias(n: number): Date[] {
  const dias: Date[] = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    dias.push(d);
  }
  return dias;
}

// ── Componente principal ──────────────────────────────────────

export default function ReservarPage() {
  const { prestadorId } = useParams<{ prestadorId: string }>();
  const navigate = useNavigate();

  const [prestador, setPrestador]         = useState<Prestador | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadSlot[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  // Selección del usuario
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<'mañana' | 'tarde' | null>(null);

  // Datos de contacto
  const [nombre, setNombre]     = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [reservado, setReservado] = useState(false);
  const [errorTelefono, setErrorTelefono] = useState('');

  const dias = proximosDias(21);

  useEffect(() => {
    if (!prestadorId) return;
    cargarDatos();
  }, [prestadorId]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      // Cargar prestador
      const { data: p, error: pErr } = await supabase
        .from('prestadores')
        .select('id, nombre, apellido, categoria, foto_url, telefono')
        .eq('id', prestadorId)
        .maybeSingle();

      if (pErr) throw pErr;
      if (!p) { setError('Prestador no encontrado'); return; }
      setPrestador(p);

      // Cargar disponibilidad
      const { data: disp, error: dErr } = await supabase
        .from('disponibilidad_prestadores')
        .select('dia_semana, turno')
        .eq('prestador_id', prestadorId);

      if (dErr) throw dErr;
      setDisponibilidad((disp || []) as DisponibilidadSlot[]);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar la información del prestador.');
    } finally {
      setLoading(false);
    }
  };

  // Turnos disponibles para un día dado
  function turnosDelDia(date: Date): ('mañana' | 'tarde')[] {
    const dia = date.getDay();
    return disponibilidad
      .filter(d => d.dia_semana === dia)
      .map(d => d.turno);
  }

  function esDiaDisponible(date: Date): boolean {
    return turnosDelDia(date).length > 0;
  }

  function seleccionarDia(date: Date) {
    setDiaSeleccionado(date);
    const turnos = turnosDelDia(date);
    // Auto-seleccionar si solo hay un turno
    if (turnos.length === 1) {
      setTurnoSeleccionado(turnos[0]);
    } else {
      setTurnoSeleccionado(null);
    }
  }

  function validarTelefono(valor: string): string {
    const soloDigitos = valor.replace(/\D/g, '');
    if (soloDigitos.length < 10) return 'El teléfono debe tener al menos 10 dígitos';
    return '';
  }

  function handleTelefonoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value;
    setTelefono(valor);
    if (valor.length > 0) setErrorTelefono(validarTelefono(valor));
    else setErrorTelefono('');
  }

  async function handleConfirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!diaSeleccionado || !turnoSeleccionado || !nombre.trim() || !apellido.trim() || !telefono.trim()) return;
    if (!prestador) return;

    // Validar teléfono antes de continuar
    const errTel = validarTelefono(telefono);
    if (errTel) { setErrorTelefono(errTel); return; }

    setEnviando(true);
    try {
      const diaStr   = formatFecha(diaSeleccionado);
      const turnoStr = turnoSeleccionado === 'mañana' ? 'Mañana' : 'Tarde';

      // ── 1. Construir y abrir WhatsApp PRIMERO (no depende de nada externo) ──
      const mensaje = `Hola! Me comunico desde *MServicios* para hacer una reserva 📅

👤 *Nombre:* ${nombre.trim()} ${apellido.trim()}
📅 *Día:* ${diaStr}
⏰ *Turno:* ${turnoStr}
🔧 *Servicio:* ${prestador.categoria}`;

      const numeroPrestador = prestador.telefono?.replace(/\D/g, '');
      if (numeroPrestador) {
        window.open(`https://wa.me/549${numeroPrestador}?text=${encodeURIComponent(mensaje)}`, '_blank');
      }

      // ── 2. Guardar reserva directamente en Supabase ──
      await supabase.from('reservas').insert({
        prestador_id: prestador.id,
        nombre:   nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.replace(/\D/g, ''),
        dia:   toISODate(diaSeleccionado),
        turno: turnoSeleccionado,
      });

      // ── 3. Marcar como reservado (habilita valoración) ──
      marcarReservado(prestador.id);

      // ── 4. Notificar por email en background (fire & forget) ──
      supabase.functions.invoke('enviar-reserva', {
        body: {
          prestador_id:        prestador.id,
          prestador_nombre:    prestador.nombre,
          prestador_apellido:  prestador.apellido,
          prestador_categoria: prestador.categoria,
          nombre:   nombre.trim(),
          apellido: apellido.trim(),
          telefono: telefono.replace(/\D/g, ''),
          dia:   toISODate(diaSeleccionado),
          turno: turnoSeleccionado,
        },
      }).catch(err => console.warn('[enviar-reserva]', err));

      setReservado(true);
    } catch (err) {
      console.error('Error al confirmar reserva:', err);
    } finally {
      setEnviando(false);
    }
  }

  // ── Loading / Error ───────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-4xl text-[#e2b040]" />
      </div>
    );
  }

  if (error || !prestador) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-6 text-center">
        <i className="ri-error-warning-line text-5xl text-red-400 mb-4" />
        <p className="text-red-400 text-lg mb-6">{error || 'Prestador no encontrado'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-semibold">
          Volver
        </button>
      </div>
    );
  }

  // ── Pantalla de éxito ────────────────────────────────────
  if (reservado) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <i className="ri-checkbox-circle-fill text-5xl text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">¡Reserva enviada!</h2>
        <p className="text-gray-400 mb-2">
          Tu solicitud fue enviada a <span className="text-white font-semibold">{prestador.nombre} {prestador.apellido}</span> por WhatsApp.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          El prestador se pondrá en contacto para confirmar el turno.
        </p>
        <button
          onClick={() => navigate('/usuarios')}
          className="px-8 py-3 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold hover:bg-[#f0d080] transition-colors"
        >
          Ver más prestadores
        </button>
      </div>
    );
  }

  // ── Sin disponibilidad cargada ────────────────────────────
  const hayDisponibilidad = dias.some(d => esDiaDisponible(d));

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <header className="bg-[#16213e] border-b border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
        >
          <i className="ri-arrow-left-line text-lg" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-lg flex items-center justify-center">
            <i className="ri-calendar-check-line text-sm text-[#1a1a2e]" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">Hacer una reserva</h1>
            <p className="text-gray-500 text-xs">{prestador.nombre} {prestador.apellido}</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Tarjeta del prestador */}
        <div className="bg-[#16213e] rounded-2xl border border-[#e2b040]/20 p-4 flex items-center gap-4">
          <img
            src={prestador.foto_url}
            alt={prestador.nombre}
            className="w-16 h-16 rounded-xl object-cover object-top flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://readdy.ai/api/search-image?query=professional+service+worker+portrait&width=200&height=200&seq=fb01'; }}
          />
          <div>
            <h2 className="text-white font-bold text-base">{prestador.nombre} {prestador.apellido}</h2>
            <span className="inline-block px-2.5 py-0.5 bg-[#e2b040]/20 text-[#e2b040] rounded-full text-xs font-medium capitalize mt-1">
              {prestador.categoria}
            </span>
          </div>
        </div>

        {/* Selector de fecha */}
        <div className="bg-[#16213e] rounded-2xl border border-[#e2b040]/20 p-5">
          <h3 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
            <i className="ri-calendar-line text-[#e2b040]" />
            Elegí una fecha
          </h3>

          {!hayDisponibilidad ? (
            <div className="text-center py-6">
              <i className="ri-calendar-close-line text-4xl text-gray-600 mb-3 block" />
              <p className="text-gray-400 text-sm">Este prestador aún no cargó su disponibilidad.</p>
              <p className="text-gray-500 text-xs mt-1">Podés contactarlo directamente por WhatsApp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Encabezado días */}
              {DIAS_CORTO.map(d => (
                <div key={d} className="text-center text-xs text-gray-500 pb-1 font-medium">{d}</div>
              ))}

              {/* Spacer para alinear el primer día de la semana */}
              {Array.from({ length: dias[0].getDay() }).map((_, i) => (
                <div key={`spacer-${i}`} />
              ))}

              {/* Días */}
              {dias.map((dia, idx) => {
                const disponible = esDiaDisponible(dia);
                const seleccionado = diaSeleccionado && toISODate(dia) === toISODate(diaSeleccionado);
                return (
                  <button
                    key={idx}
                    onClick={() => disponible && seleccionarDia(dia)}
                    disabled={!disponible}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all
                      ${seleccionado
                        ? 'bg-[#e2b040] text-[#1a1a2e] shadow-lg shadow-[#e2b040]/30'
                        : disponible
                          ? 'bg-[#e2b040]/10 text-[#e2b040] hover:bg-[#e2b040]/25 cursor-pointer border border-[#e2b040]/30'
                          : 'text-gray-700 cursor-not-allowed'
                      }
                    `}
                  >
                    <span>{dia.getDate()}</span>
                    <span className="text-[10px] leading-none opacity-70">
                      {DIAS_CORTO[dia.getDay()]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selector de turno */}
          {diaSeleccionado && (
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-gray-300 text-sm font-medium mb-3">
                Turno para el {formatFecha(diaSeleccionado)}
              </p>
              <div className="flex gap-3">
                {(['mañana', 'tarde'] as const).map(turno => {
                  const disponible = turnosDelDia(diaSeleccionado).includes(turno);
                  const seleccionado = turnoSeleccionado === turno;
                  return (
                    <button
                      key={turno}
                      onClick={() => disponible && setTurnoSeleccionado(turno)}
                      disabled={!disponible}
                      className={`
                        flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all
                        ${seleccionado
                          ? 'bg-[#e2b040] text-[#1a1a2e]'
                          : disponible
                            ? 'bg-[#e2b040]/10 text-[#e2b040] border border-[#e2b040]/30 hover:bg-[#e2b040]/20 cursor-pointer'
                            : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                        }
                      `}
                    >
                      <i className={turno === 'mañana' ? 'ri-sun-line' : 'ri-moon-line'} />
                      {turno.charAt(0).toUpperCase() + turno.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Formulario de datos */}
        {hayDisponibilidad && (
          <form onSubmit={handleConfirmar} className="bg-[#16213e] rounded-2xl border border-[#e2b040]/20 p-5 space-y-4">
            <h3 className="text-white font-semibold text-base flex items-center gap-2">
              <i className="ri-user-line text-[#e2b040]" />
              Tus datos de contacto
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  placeholder="Juan"
                  className="w-full px-3 py-2.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50 text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Apellido *</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={e => setApellido(e.target.value)}
                  required
                  placeholder="García"
                  className="w-full px-3 py-2.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50 text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Teléfono / WhatsApp *</label>
              <input
                type="tel"
                value={telefono}
                onChange={handleTelefonoChange}
                required
                placeholder="3512345678"
                inputMode="numeric"
                className={`w-full px-3 py-2.5 bg-[#1a1a2e] border rounded-lg text-white placeholder-gray-600 focus:outline-none text-sm transition-colors ${
                  errorTelefono ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-[#e2b040]/50'
                }`}
              />
              {errorTelefono ? (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <i className="ri-error-warning-line" />{errorTelefono}
                </p>
              ) : (
                <p className="text-gray-600 text-xs mt-1">Solo números, mínimo 10 dígitos</p>
              )}
            </div>

            {/* Resumen */}
            {diaSeleccionado && turnoSeleccionado && (
              <div className="bg-[#e2b040]/10 border border-[#e2b040]/30 rounded-xl p-4">
                <p className="text-[#e2b040] text-sm font-semibold mb-1">Resumen de tu reserva</p>
                <p className="text-gray-300 text-sm">
                  <i className="ri-calendar-check-line mr-1.5" />
                  {formatFecha(diaSeleccionado)} — {turnoSeleccionado === 'mañana' ? '🌅 Mañana' : '🌆 Tarde'}
                </p>
                <p className="text-gray-300 text-sm mt-1">
                  <i className="ri-whatsapp-line mr-1.5" />
                  Se abrirá WhatsApp para confirmar con el prestador
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!diaSeleccionado || !turnoSeleccionado || !nombre.trim() || !apellido.trim() || telefono.replace(/\D/g,'').length < 10 || !!errorTelefono || enviando}
              className="
                w-full py-3.5 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold text-base
                hover:bg-[#f0d080] active:scale-95 transition-all
                disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
                flex items-center justify-center gap-2
              "
            >
              {enviando ? (
                <>
                  <i className="ri-loader-4-line animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <i className="ri-whatsapp-line" />
                  Confirmar reserva por WhatsApp
                </>
              )}
            </button>
          </form>
        )}

        {/* Si no hay disponibilidad: botón directo a WhatsApp */}
        {!hayDisponibilidad && (
          <button
            onClick={() => {
              const telefonos = ['3513227999', '3516576801', '3512178797'];
              const telefonoAleatorio = telefonos[Math.floor(Math.random() * telefonos.length)];
              const mensaje = encodeURIComponent(`Hola! Me contacto desde *MServicios*. Me interesa el servicio de *${prestador.categoria}* de *${prestador.nombre}* *${prestador.apellido}*. ¿Cuándo tiene disponibilidad?`);
              window.open(`https://wa.me/549${telefonoAleatorio}?text=${mensaje}`, '_blank');
            }} 
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-colors"
          >
            <i className="ri-whatsapp-line text-lg" />
            Contactar por WhatsApp
          </button>
        )}
      </div>
    </div>
  );
} // 351 322-7999, 351 657-6801
