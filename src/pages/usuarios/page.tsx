import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { prestadoresMock } from '../../mocks/prestadores';
import AppHeader from '../../components/AppHeader';
import { CATEGORIAS_FILTRO_USUARIOS } from '../../constants/categorias';

interface Valoracion {
  id: string;
  prestador_id: string;
  cliente_email: string;
  nombre_cliente: string;
  puntuacion: number;
  comentario: string;
  created_at: string;
}

interface Prestador {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono?: string;
  categoria: string;
  zona?: string;
  foto_url: string;
  descripcion: string;
  created_at: string;
  valoraciones?: Valoracion[];
}

const categorias = CATEGORIAS_FILTRO_USUARIOS;

const todasLasZonas = [
  'Sierras Chicas',
  'Villa Allende',
  'Río Ceballos',
  'Mendiolaza',
  'Unquillo',
  'Saldán',
  'La Calera',
  'Dumesnil',
  'Córdoba Capital',
  'Córdoba Centro',
  'Córdoba y alrededores',
  'Malagueño',
  'Colonia Caroya',
  'Jesús María',
  'Monte Cristo',
  'Cosquín',
  'La Falda',
  'Carlos Paz',
];

const SIERRAS_CHICAS_TOWNS = [
  'villa allende', 'río ceballos', 'rio ceballos',
  'mendiolaza', 'unquillo', 'saldán', 'saldan',
  'la calera', 'dumesnil', 'sierras chicas',
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesZona(prestadorZona: string, filtro: string): boolean {
  if (!filtro.trim()) return true;
  const zona = normalizeText(prestadorZona);
  const f = normalizeText(filtro);

  if (zona.includes(f)) return true;

  // Prestador tiene "Sierras Chicas" y el usuario busca una ciudad miembro
  if (zona.includes('sierras chicas') && SIERRAS_CHICAS_TOWNS.some(t => t !== 'sierras chicas' && t.includes(f))) {
    return true;
  }

  // Usuario busca "Sierras Chicas" y el prestador está en alguna ciudad miembro
  if (f.includes('sierra') && SIERRAS_CHICAS_TOWNS.some(t => zona.includes(t))) {
    return true;
  }

  return false;
}

const otrosServicios = [
  { label: 'Plomero', cat: 'plomero' },
  { label: 'Electricista', cat: 'electricista' },
  { label: 'Pintor', cat: 'pintor' },
  { label: 'Gasista', cat: 'gasista' },
  { label: 'Albañil', cat: 'albañil' },
  { label: 'Jardinero', cat: 'jardinero' },
  { label: 'Peluquería Canina', cat: 'peluquería canina' },
  { label: 'Personal Trainer', cat: 'personal trainer' },
  { label: 'Carpintero', cat: 'carpintero' },
  { label: 'Piletero', cat: 'piletero' },
  { label: 'Servicio Técnico Informático', cat: 'Servicio Técnico Informático' },
];

const RESERVADOS_KEY = 'mservicios_reservados';

function splitZonas(zona?: string): string[] {
  return (zona || '')
    .split(',')
    .map((z) => z.trim())
    .filter(Boolean);
}

// eslint-disable-next-line react-refresh/only-export-components
export function marcarReservado(prestadorId: string) {
  const reservados: string[] = JSON.parse(localStorage.getItem(RESERVADOS_KEY) || '[]');
  if (!reservados.includes(prestadorId)) {
    reservados.push(prestadorId);
    localStorage.setItem(RESERVADOS_KEY, JSON.stringify(reservados));
  }
}

function yaReservo(prestadorId: string): boolean {
  const reservados: string[] = JSON.parse(localStorage.getItem(RESERVADOS_KEY) || '[]');
  return reservados.includes(prestadorId);
}

function getTituloCategoria(cat: string): string {
  if (cat === 'todas') return 'Encontrá tu profesional';
  const nombre = cat.charAt(0).toUpperCase() + cat.slice(1);
  return `${nombre} disponibles en Córdoba`;
}

function getMensajeCantidad(count: number): string {
  if (count === 1) return 'Te mostramos el mejor resultado disponible';
  if (count <= 3) return `${count} prestadores disponibles en tu zona`;
  return `${count} prestadores disponibles`;
}

export default function Usuarios() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [busqueda, setBusqueda] = useState(() => searchParams.get('q') || '');
  const [categoriaFiltro, setCategoriaFiltro] = useState(() => searchParams.get('categoria') || 'todas');
  const [zonaInput, setZonaInput] = useState('');
  const [mostrarSugerenciasZona, setMostrarSugerenciasZona] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mostrarModalValoracion, setMostrarModalValoracion] = useState(false);
  const [prestadorSeleccionado, setPrestadorSeleccionado] = useState<Prestador | null>(null);
  const [puntuacion, setPuntuacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [enviandoValoracion, setEnviandoValoracion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mostrarValoraciones, setMostrarValoraciones] = useState<string | null>(null);
  const [puntosUsuario, setPuntosUsuario] = useState<number | null>(null);
  const [categoriasExtra, setCategoriasExtra] = useState<string[]>([]);

  const clienteDni = localStorage.getItem('mservicios_cliente_dni');

  useEffect(() => {
    cargarPrestadores();
    cargarCategoriasExtra();
    if (clienteDni) cargarPuntosUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarCategoriasExtra = async () => {
    try {
      const { data } = await supabase.from('prestadores').select('categoria');
      if (!data) return;
      const conocidas = new Set(categorias);
      const extras = [...new Set(data.map((p: { categoria: string }) => p.categoria))]
        .filter((c) => c && !conocidas.has(c));
      setCategoriasExtra(extras);
    } catch {
      // si falla, simplemente no se muestran categorías extra
    }
  };

  const cargarPuntosUsuario = async () => {
    if (!clienteDni) return;
    try {
      const { data } = await supabase.from('clientes').select('puntos').eq('dni', clienteDni).maybeSingle();
      if (data) setPuntosUsuario(data.puntos);
    } catch (e) {
      console.error('Error al cargar puntos:', e);
    }
  };

  const cargarPrestadores = async () => {
    setLoading(true);
    setError('');
    try {
      const selectBase = `id, nombre, apellido, dni, email, telefono, categoria, zona, foto_url, descripcion, created_at,
          valoraciones ( id, prestador_id, cliente_email, nombre_cliente, puntuacion, comentario, created_at )`;

      let result = await supabase
        .from('prestadores')
        .select(selectBase)
        .or('enabled.is.null,enabled.eq.true')
        .order('created_at', { ascending: false });

      // Si falla por la columna enabled (aún no migrada), reintentamos sin el filtro
      if (result.error) {
        const msg = result.error.message?.toLowerCase() ?? '';
        const esErrorColumna = msg.includes('enabled') || msg.includes('schema cache') || msg.includes('could not find');
        if (esErrorColumna) {
          result = await supabase
            .from('prestadores')
            .select(selectBase)
            .order('created_at', { ascending: false });
        }
      }

      if (result.error) throw result.error;

      if (result.data && result.data.length > 0) {
        setPrestadores(result.data as Prestador[]);
      } else {
        setPrestadores(adaptarMock());
      }
    } catch {
      setPrestadores(adaptarMock());
    } finally {
      setLoading(false);
    }
  };

  const adaptarMock = (): Prestador[] =>
    prestadoresMock.map((p) => {
      const partes = p.nombre.split(' ');
      return {
        id: String(p.id),
        nombre: partes[0] || p.nombre,
        apellido: partes.slice(1).join(' ') || '',
        dni: p.dni,
        email: p.email,
        telefono: '5491100000000',
        categoria: p.categoria,
        foto_url: p.foto_url,
        descripcion: p.descripcion,
        created_at: new Date().toISOString(),
        valoraciones: [],
      };
    });

  const toggleDesc = (id: string) => {
    setExpandedDesc((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleValorar = (prestador: Prestador) => {
    if (!clienteDni) {
      if (window.confirm('Para valorar necesitás iniciar sesión. ¿Querés hacerlo ahora?')) navigate('/mi-cuenta');
      return;
    }
    if (!yaReservo(prestador.id)) {
      alert('Solo podés valorar a un prestador con quien hayas hecho una reserva.');
      return;
    }
    setPrestadorSeleccionado(prestador);
    setMostrarModalValoracion(true);
    setPuntuacion(5);
    setComentario('');
    setNombreCliente('');
  };

  const handleEnviarValoracion = async () => {
    if (!prestadorSeleccionado || !nombreCliente.trim() || !comentario.trim()) return;
    setEnviandoValoracion(true);
    try {
      const { error: insertError } = await supabase.from('valoraciones').insert([{
        prestador_id: prestadorSeleccionado.id,
        cliente_email: clienteDni || 'anonimo',
        nombre_cliente: nombreCliente.trim(),
        puntuacion,
        comentario: comentario.trim()
      }]);
      if (insertError) throw insertError;

      const nuevaValoracion: Valoracion = {
        id: Date.now().toString(),
        prestador_id: prestadorSeleccionado.id,
        cliente_email: clienteDni || '',
        nombre_cliente: nombreCliente.trim(),
        puntuacion,
        comentario: comentario.trim(),
        created_at: new Date().toISOString()
      };
      setPrestadores((prev) => prev.map((p) =>
        p.id === prestadorSeleccionado.id
          ? { ...p, valoraciones: [nuevaValoracion, ...(p.valoraciones || [])] }
          : p
      ));
      setMostrarModalValoracion(false);
      setPrestadorSeleccionado(null);
      setMensajeExito('¡Valoración enviada con éxito!');
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (e) {
      console.error('Error al enviar valoración:', e);
    } finally {
      setEnviandoValoracion(false);
    }
  };

  const calcularPromedio = (vals: Valoracion[] = []) => {
    if (!vals.length) return 0;
    return vals.reduce((acc, v) => acc + v.puntuacion, 0) / vals.length;
  };

  const renderEstrellas = (promedio: number, small = false) =>
    [1, 2, 3, 4, 5].map((s) => (
      <i key={s} className={`${small ? 'text-sm' : 'text-base'} ${s <= Math.round(promedio) ? 'ri-star-fill text-[#e2b040]' : 'ri-star-line text-gray-600'}`}></i>
    ));

  const zonasDisponibles = (() => {
    const zonas = new Map<string, string>();

    for (const prestador of prestadores) {
      for (const zona of splitZonas(prestador.zona)) {
        zonas.set(normalizeText(zona), zona);
      }
    }

    const tieneSierrasChicas = [...zonas.keys()].some((zona) =>
      SIERRAS_CHICAS_TOWNS.some((town) => zona.includes(normalizeText(town)))
    );
    if (tieneSierrasChicas) zonas.set('sierras chicas', 'Sierras Chicas');

    if (zonas.size === 0) {
      for (const zona of todasLasZonas) zonas.set(normalizeText(zona), zona);
    }

    return [...zonas.values()].sort((a, b) => a.localeCompare(b, 'es'));
  })();

  const sugerenciasZona = zonasDisponibles.filter(
    (z) => !zonaInput.trim() || normalizeText(z).includes(normalizeText(zonaInput))
  ).slice(0, 8);

  const hayFiltrosExtra = zonaInput || categoriaFiltro !== 'todas';

  const prestadoresFiltrados = prestadores.filter((p) => {
    const texto = normalizeText(busqueda);
    const haystack = normalizeText([
      p.nombre,
      p.apellido,
      `${p.nombre} ${p.apellido}`,
      p.descripcion,
      p.categoria,
      p.zona || '',
    ].join(' '));
    const coincideBusqueda =
      !texto ||
      haystack.includes(texto);
    const coincideCategoria = categoriaFiltro === 'todas' || p.categoria === categoriaFiltro;
    const coincideZona = matchesZona(p.zona || '', zonaInput);
    return coincideBusqueda && coincideCategoria && coincideZona;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      <AppHeader puntosUsuario={puntosUsuario} />

      {/* Toast */}
      {mensajeExito && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 text-white px-6 py-3 rounded-xl shadow-2xl backdrop-blur-sm flex items-center gap-2 animate-fade-in whitespace-nowrap text-sm">
          <i className="ri-checkbox-circle-fill text-lg"></i>
          {mensajeExito}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pt-24 sm:pt-28">

        {/* Header del listado */}
        <div className="mb-5 sm:mb-7">
          <h1 className="text-xl sm:text-3xl font-bold text-white mb-1">{getTituloCategoria(categoriaFiltro)}</h1>
          <p className="text-gray-400 text-sm">Prestadores verificados listos para contactar por WhatsApp.</p>
          {clienteDni && puntosUsuario !== null && puntosUsuario >= 5 && (
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-2 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-xs sm:text-sm font-semibold">
              <i className="ri-gift-2-line"></i>
              ¡Tenés 10% de descuento disponible!
            </div>
          )}
        </div>

        {/* ── Filtros ── */}
        <div className="relative z-10 bg-[#16213e]/60 backdrop-blur-sm p-3 sm:p-4 rounded-2xl border border-[#e2b040]/20 mb-6 sm:mb-8">

          {/* Fila principal: búsqueda + botón de filtros (mobile) */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                placeholder="Buscar servicio, nombre, zona..."
                style={{ fontSize: '16px' }}
                autoComplete="off"
              />
            </div>

            {/* Botón "Filtros" — solo visible en mobile */}
            <button
              className={`sm:hidden relative flex items-center gap-1.5 px-3 py-3 rounded-xl border transition-colors cursor-pointer min-w-[72px] justify-center ${
                filtrosAbiertos || hayFiltrosExtra
                  ? 'bg-[#e2b040]/10 border-[#e2b040]/50 text-[#e2b040]'
                  : 'bg-[#1a1a2e] border-[#e2b040]/30 text-gray-400'
              }`}
              onClick={() => setFiltrosAbiertos((v) => !v)}
              aria-label="Filtros adicionales"
            >
              <i className="ri-filter-3-line text-base"></i>
              <span className="text-xs font-semibold">Filtros</span>
              {/* Punto indicador de filtro activo */}
              {hayFiltrosExtra && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#e2b040] rounded-full"></span>
              )}
            </button>
          </div>

          {/* Filtros adicionales: siempre en desktop, toggle en mobile */}
          <div className={`gap-3 mt-3 ${filtrosAbiertos ? 'flex flex-col' : 'hidden'} sm:flex sm:flex-row`}>

            {/* Zona — autocompletado */}
            <div className="flex-1 sm:flex-none sm:w-52 relative">
              <i className="ri-map-pin-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"></i>
              <input
                type="text"
                value={zonaInput}
                onChange={(e) => { setZonaInput(e.target.value); setMostrarSugerenciasZona(true); }}
                onFocus={() => setMostrarSugerenciasZona(true)}
                onBlur={() => setTimeout(() => setMostrarSugerenciasZona(false), 150)}
                placeholder="Buscar zona..."
                className="w-full pl-9 pr-8 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                style={{ fontSize: '16px' }}
                autoComplete="off"
              />
              {zonaInput && (
                <button
                  onClick={() => setZonaInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer z-10 p-1"
                  aria-label="Limpiar zona"
                >
                  <i className="ri-close-line text-sm"></i>
                </button>
              )}
              {mostrarSugerenciasZona && sugerenciasZona.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#16213e] border border-[#e2b040]/20 rounded-xl shadow-2xl z-30 overflow-hidden max-h-56 overflow-y-auto">
                  {sugerenciasZona.map((z) => (
                    <button
                      key={z}
                      onMouseDown={() => { setZonaInput(z); setMostrarSugerenciasZona(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-[#e2b040]/10 hover:text-[#f0d080] transition-colors flex items-center gap-2 cursor-pointer min-h-[48px]"
                    >
                      <i className="ri-map-pin-line text-[#e2b040]/50 shrink-0 text-sm"></i>
                      <span className="flex-1">{z}</span>
                      {z === 'Sierras Chicas' && (
                        <span className="text-[#e2b040]/40 text-xs">macro-zona</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Categoría */}
            <div className="flex-1 sm:flex-none sm:w-52">
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full px-3 py-3 bg-[#1a1a2e] border border-[#e2b040]/20 rounded-xl text-gray-400 focus:outline-none focus:border-[#e2b040]/50 transition-colors cursor-pointer"
                style={{ fontSize: '16px' }}
              >
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'todas' ? 'Todas las categorías' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
                {categoriasExtra.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-[#e2b040]/30 border-t-[#e2b040] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 text-sm">Cargando prestadores...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-12">
            <i className="ri-wifi-off-line text-5xl text-red-400 mb-4 block"></i>
            <p className="text-red-400 text-base mb-2 font-semibold">No pudimos cargar los prestadores</p>
            <p className="text-gray-500 text-sm mb-5">Verificá tu conexión e intentá de nuevo</p>
            <button
              onClick={cargarPrestadores}
              className="min-h-[48px] px-6 py-3 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-semibold hover:bg-[#f0d080] transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-refresh-line mr-2"></i>Intentar de nuevo
            </button>
          </div>
        )}

        {/* Grid de prestadores */}
        {!loading && !error && (
          <>
            {prestadoresFiltrados.length > 0 && (
              <p className="text-gray-400 text-sm mb-4">
                {getMensajeCantidad(prestadoresFiltrados.length)}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {prestadoresFiltrados.map((prestador) => {
                const vals = prestador.valoraciones || [];
                const promedio = calcularPromedio(vals);
                const expandido = mostrarValoraciones === prestador.id;
                const puedeValorar = clienteDni && yaReservo(prestador.id);
                const descExpandida = expandedDesc.has(prestador.id);

                return (
                  <div
                    key={prestador.id}
                    className="bg-[#16213e]/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-[#e2b040]/20 overflow-hidden hover:border-[#e2b040]/50 active:border-[#e2b040]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#e2b040]/10 flex flex-col min-w-0"
                  >
                    {/* Foto */}
                    <div className="w-full h-36 sm:h-60 overflow-hidden relative">
                      <img
                        src={prestador.foto_url}
                        alt={`${prestador.nombre} ${prestador.apellido}`}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://readdy.ai/api/search-image?query=professional+service+worker+portrait+neutral+background&width=400&height=300&seq=fallback01&orientation=portrait';
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#16213e] to-transparent"></div>
                      {/* Verificado */}
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-[#16213e]/85 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-semibold text-green-400 border border-green-400/30">
                        <i className="ri-shield-check-fill text-xs"></i>
                        Verificado
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 flex flex-col flex-1 min-w-0">
                      {/* Nombre */}
                      <h3 className="text-sm sm:text-lg font-bold text-white mb-0.5 leading-snug break-words">
                        {prestador.nombre} {prestador.apellido}
                      </h3>

                      {/* Categoría · Zona */}
                      <p className="text-xs sm:text-sm mb-2 sm:mb-3 leading-snug break-words">
                        <span className="text-[#f0d080] font-medium capitalize">{prestador.categoria}</span>
                        {prestador.zona && (
                          <span className="text-gray-500"> · {prestador.zona}</span>
                        )}
                      </p>

                      {/* Estrellas */}
                      {vals.length > 0 && (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2 sm:mb-3">
                          <div className="flex">{renderEstrellas(promedio, true)}</div>
                          <span className="text-[#e2b040] text-sm font-semibold">{promedio.toFixed(1)}</span>
                          <span className="text-gray-500 text-xs">· {vals.length} trabajo{vals.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}

                      {/* Descripción con expand/collapse */}
                      <p className={`text-gray-400 text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words ${descExpandida ? '' : 'line-clamp-2'}`}>
                        {prestador.descripcion}
                      </p>
                      {prestador.descripcion && prestador.descripcion.length > 90 && (
                        <button
                          onClick={() => toggleDesc(prestador.id)}
                          className="mt-1 mb-2 text-[#e2b040]/60 hover:text-[#e2b040] text-xs transition-colors cursor-pointer self-start py-1.5 pr-2"
                          aria-label={descExpandida ? 'Ver menos' : 'Ver más descripción'}
                        >
                          {descExpandida ? 'Ver menos ↑' : 'Ver más ↓'}
                        </button>
                      )}

                      {/* Espaciador */}
                      <div className="flex-1 min-h-[8px]" />

                      {/* CTA principal — WhatsApp */}
                      <button
                        onClick={() => navigate(`/reservar/${prestador.id}`)}
                        className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 sm:py-4 bg-[#25D366] hover:bg-[#1da851] active:bg-[#178f42] text-white rounded-xl font-bold text-xs sm:text-base transition-all duration-200 cursor-pointer mb-2 shadow-md shadow-[#25D366]/20 min-h-[46px] sm:min-h-[52px]"
                        aria-label={`Contactar a ${prestador.nombre} por WhatsApp`}
                      >
                        <i className="ri-whatsapp-line text-base sm:text-xl"></i>
                        <span className="sm:hidden">WhatsApp</span>
                        <span className="hidden sm:inline">Contactar por WhatsApp</span>
                      </button>

                      {clienteDni && (
                        <button
                          onClick={() => navigate(`/chat?prestador=${prestador.id}`)}
                          className="w-full flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2.5 border border-[#e2b040]/45 bg-[#e2b040]/10 text-[#f0d080] hover:bg-[#e2b040]/15 rounded-lg font-semibold text-[11px] sm:text-sm transition-colors cursor-pointer mb-2 min-h-[40px]"
                          aria-label={`Enviar mensaje a ${prestador.nombre} por la página`}
                        >
                          <i className="ri-message-3-line text-sm sm:text-base"></i>
                          <span className="sm:hidden">Mensaje</span>
                          <span className="hidden sm:inline">Enviar mensaje por la página</span>
                        </button>
                      )}

                      {/* Acciones secundarias */}
                      <div className="flex flex-wrap items-center justify-between gap-x-2 pt-0.5">
                        {vals.length > 0 ? (
                          <button
                            onClick={() => setMostrarValoraciones(expandido ? null : prestador.id)}
                            className="text-gray-500 hover:text-[#e2b040] text-xs transition-colors cursor-pointer py-2 pr-2"
                          >
                            {expandido ? 'Ocultar opiniones' : `Ver ${vals.length} opinión${vals.length !== 1 ? 'es' : ''}`}
                            <i className={`ml-1 ${expandido ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>
                          </button>
                        ) : (
                          <span className="text-gray-600 text-xs italic py-2">Sin opiniones aún</span>
                        )}
                        {puedeValorar && (
                          <button
                            onClick={() => handleValorar(prestador)}
                            className="text-[#e2b040]/70 hover:text-[#e2b040] text-xs transition-colors cursor-pointer flex items-center gap-1 ml-auto py-2 pl-2"
                          >
                            <i className="ri-star-line"></i>Valorar
                          </button>
                        )}
                      </div>

                      {/* Valoraciones expandidas */}
                      {expandido && vals.length > 0 && (
                        <div className="mt-3 space-y-3 border-t border-[#e2b040]/10 pt-3">
                          {vals.slice(0, 3).map((v) => (
                            <div key={v.id} className="bg-[#1a1a2e]/60 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white text-xs font-semibold">{v.nombre_cliente}</span>
                                <div className="flex">{renderEstrellas(v.puntuacion, true)}</div>
                              </div>
                              <p className="text-gray-400 text-xs leading-relaxed whitespace-pre-line break-words">{v.comentario}</p>
                            </div>
                          ))}
                          {vals.length > 3 && (
                            <p className="text-gray-500 text-xs text-center">+{vals.length - 3} valoraciones más</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sin resultados */}
            {prestadoresFiltrados.length === 0 && (
              <div className="text-center py-14 px-4">
                <i className="ri-search-line text-5xl text-gray-600 mb-4 block"></i>
                <p className="text-gray-300 text-lg mb-2 font-semibold">No encontramos prestadores</p>
                <p className="text-gray-500 text-sm mb-6">Próximamente más opciones en tu zona. Podés intentar con otros términos.</p>
                {(busqueda || categoriaFiltro !== 'todas' || zonaInput) && (
                  <button
                    onClick={() => { setBusqueda(''); setCategoriaFiltro('todas'); setZonaInput(''); }}
                    className="min-h-[48px] px-6 py-3 border border-[#e2b040]/40 text-[#e2b040] rounded-xl hover:bg-[#e2b040]/10 transition-colors cursor-pointer text-sm whitespace-nowrap"
                  >
                    <i className="ri-close-circle-line mr-2"></i>Limpiar filtros
                  </button>
                )}
              </div>
            )}

            {/* Otros servicios */}
            <div className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-[#e2b040]/10">
              <div className="text-center mb-5">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">Otros servicios que te pueden interesar</h3>
                <p className="text-gray-500 text-sm">Explorá más categorías disponibles</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {otrosServicios
                  .filter((s) => s.cat !== categoriaFiltro)
                  .map((s) => (
                    <button
                      key={s.cat}
                      onClick={() => {
                        setCategoriaFiltro(s.cat);
                        setBusqueda('');
                        setZonaInput('');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="min-h-[40px] px-4 py-2 bg-[#16213e]/60 border border-[#e2b040]/20 text-gray-300 rounded-full text-sm hover:border-[#e2b040]/60 hover:text-[#f0d080] active:bg-[#e2b040]/10 transition-all cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal valoración ── */}
      {mostrarModalValoracion && prestadorSeleccionado && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={() => setMostrarModalValoracion(false)}
        >
          <div
            className="bg-[#16213e] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-w-md w-full border border-[#e2b040]/20 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Valorar a {prestadorSeleccionado.nombre}</h3>
              <button onClick={() => setMostrarModalValoracion(false)} className="p-2 text-gray-400 hover:text-white cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-5">Tu opinión ayuda a otros usuarios</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tu nombre</label>
                <input
                  type="text"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                  placeholder="Ej: María G."
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Puntuación</label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setPuntuacion(star)} className="cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <i className={`text-3xl ${star <= puntuacion ? 'ri-star-fill text-[#e2b040]' : 'ri-star-line text-gray-600'}`}></i>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Comentario</label>
                <textarea
                  value={comentario}
                  onChange={(e) => { if (e.target.value.length <= 500) setComentario(e.target.value); }}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors resize-none"
                  rows={4}
                  placeholder="Compartí tu experiencia con este profesional..."
                  style={{ fontSize: '16px' }}
                />
                <p className="text-gray-500 text-xs mt-1 text-right">{comentario.length}/500</p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setMostrarModalValoracion(false)}
                className="flex-1 min-h-[52px] px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors cursor-pointer font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviarValoracion}
                disabled={enviandoValoracion || !nombreCliente.trim() || !comentario.trim()}
                className="flex-1 min-h-[52px] px-4 py-3 bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] rounded-xl font-bold hover:shadow-lg hover:shadow-[#e2b040]/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviandoValoracion ? 'Enviando...' : 'Enviar valoración'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
