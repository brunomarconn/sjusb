import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { prestadoresMock } from '../../mocks/prestadores';

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
  foto_url: string;
  descripcion: string;
  created_at: string;
  valoraciones?: Valoracion[];
}

const categorias = [
  'todas',
  'electricista', 'jardinero', 'piletero', 'albañil', 'bicicletero',
  'pintor', 'gasista', 'plomero', 'forrajería', 'peluquería canina',
  'mantenimiento aire acondicionado', 'impermeabilizador hogar',
  'alquiler vajilla', 'pastelería', 'cambio de baterías',
  'limpieza de tapizados', 'personal trainer', 'adiestrador de perros',
  'maestro particular', 'servicios de catering',
];

// Números de WhatsApp de MServicios (round-robin)
const NUMEROS_WA = ['3516576801', '3513227999', '3512178797'];
const WA_INDEX_KEY = 'mservicios_wa_index';
// IDs de prestadores contactados (para validar valoraciones)
const CONTACTADOS_KEY = 'mservicios_contactados';

function getSiguienteNumeroWA(): string {
  const idx = parseInt(localStorage.getItem(WA_INDEX_KEY) || '0', 10);
  const numero = NUMEROS_WA[idx % NUMEROS_WA.length];
  localStorage.setItem(WA_INDEX_KEY, String((idx + 1) % NUMEROS_WA.length));
  return numero;
}

function marcarContactado(prestadorId: string) {
  const contactados: string[] = JSON.parse(localStorage.getItem(CONTACTADOS_KEY) || '[]');
  if (!contactados.includes(prestadorId)) {
    contactados.push(prestadorId);
    localStorage.setItem(CONTACTADOS_KEY, JSON.stringify(contactados));
  }
}

function yaContacto(prestadorId: string): boolean {
  const contactados: string[] = JSON.parse(localStorage.getItem(CONTACTADOS_KEY) || '[]');
  return contactados.includes(prestadorId);
}

export default function Usuarios() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState(() => {
    return searchParams.get('categoria') || 'todas';
  });
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

  const clienteDni = localStorage.getItem('mservicios_cliente_dni');

  useEffect(() => {
    cargarPrestadores();
    if (clienteDni) cargarPuntosUsuario();
  }, []);

  const cargarPuntosUsuario = async () => {
    if (!clienteDni) return;
    try {
      const { data } = await supabase
        .from('clientes')
        .select('puntos')
        .eq('dni', clienteDni)
        .maybeSingle();
      if (data) setPuntosUsuario(data.puntos);
    } catch (_) {}
  };

  const cargarPrestadores = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('prestadores')
        .select(`
          id, nombre, apellido, dni, email, telefono, categoria, foto_url, descripcion, created_at,
          valoraciones ( id, prestador_id, cliente_email, nombre_cliente, puntuacion, comentario, created_at )
        `)
        .order('created_at', { ascending: false });

      if (err) throw err;

      if (data && data.length > 0) {
        setPrestadores(data as Prestador[]);
      } else {
        setPrestadores(adaptarMock());
      }
    } catch (_) {
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

  const handleContactar = async (prestador: Prestador) => {
    // Registrar contacto para permitir valoración
    marcarContactado(prestador.id);

    // Construir mensaje
    let mensaje = `Hola! Me contacto desde *MServicios*. Me interesa el servicio de *${prestador.categoria}* del prestador *${prestador.nombre} ${prestador.apellido}*. ¿Me pueden dar más información?`;

    // Si el usuario tiene 5+ puntos, solicitar canjeo automáticamente
    if (clienteDni && puntosUsuario !== null && puntosUsuario >= 5) {
      mensaje += ` Además, quiero canjear mis puntos para obtener el *10% de descuento*.`;

      // Resetear puntos en la base de datos
      try {
        await supabase
          .from('clientes')
          .update({ puntos: 0, tiene_promocion: false })
          .eq('dni', clienteDni);
        setPuntosUsuario(0);
      } catch (_) {}

      setMensajeExito('🎉 ¡Puntos canjeados! Tu solicitud de 10% de descuento se envió al equipo.');
      setTimeout(() => setMensajeExito(''), 5000);
    }

    // Round-robin entre nuestros números
    const numero = getSiguienteNumeroWA();
    window.open(`https://wa.me/549${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleValorar = (prestador: Prestador) => {
    if (!clienteDni) {
      if (window.confirm('Para valorar necesitás iniciar sesión. ¿Querés hacerlo ahora?')) {
        navigate('/mi-cuenta');
      }
      return;
    }

    if (!yaContacto(prestador.id)) {
      alert('Solo podés valorar a un prestador con quien hayas tenido contacto. Primero contactalo por WhatsApp.');
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
      const { error: insertError } = await supabase
        .from('valoraciones')
        .insert([{
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

      setPrestadores((prev) =>
        prev.map((p) =>
          p.id === prestadorSeleccionado.id
            ? { ...p, valoraciones: [nuevaValoracion, ...(p.valoraciones || [])] }
            : p
        )
      );

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
    if (vals.length === 0) return 0;
    return vals.reduce((acc, v) => acc + v.puntuacion, 0) / vals.length;
  };

  const renderEstrellas = (promedio: number, small = false) => {
    const size = small ? 'text-sm' : 'text-base';
    return [1, 2, 3, 4, 5].map((s) => (
      <i
        key={s}
        className={`${size} ${
          s <= Math.round(promedio) ? 'ri-star-fill text-[#e2b040]' : 'ri-star-line text-gray-600'
        }`}
      ></i>
    ));
  };

  const prestadoresFiltrados = prestadores.filter((p) => {
    const texto = busqueda.toLowerCase();
    const coincideBusqueda =
      !texto ||
      p.nombre.toLowerCase().includes(texto) ||
      p.apellido.toLowerCase().includes(texto) ||
      p.descripcion.toLowerCase().includes(texto) ||
      p.categoria.toLowerCase().includes(texto);
    const coincideCategoria = categoriaFiltro === 'todas' || p.categoria === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      {/* Header */}
      <header className="bg-[#16213e]/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img
              src="https://public.readdy.ai/ai/img_res/ebf8ba70-3b01-48d0-b580-89cd2fe53a3e.png"
              alt="MServicios"
              className="w-9 h-9 object-contain"
            />
            <span className="text-xl font-bold text-[#e2b040]">MServicios</span>
          </div>

          <div className="flex items-center gap-2">
            {clienteDni ? (
              <>
                <button
                  onClick={() => navigate('/chat')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-transparent border border-white/20 text-gray-300 rounded-full text-sm font-semibold hover:border-[#e2b040] hover:text-[#e2b040] transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-chat-3-line"></i>
                  Mensajes
                </button>
                <button
                  onClick={() => navigate('/puntos')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#e2b040]/10 border border-[#e2b040]/40 text-[#e2b040] rounded-full text-sm font-semibold hover:bg-[#e2b040]/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-medal-line"></i>
                  {puntosUsuario !== null ? `${puntosUsuario} Puntos` : 'Puntos'}
                </button>
                <button
                  onClick={() => navigate('/mi-cuenta')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-transparent border border-[#e2b040]/40 text-[#e2b040] rounded-full text-sm font-semibold hover:bg-[#e2b040]/10 transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-user-line"></i>
                  Mi Cuenta
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/mi-cuenta')}
                className="flex items-center gap-2 px-5 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-full font-semibold hover:bg-[#f0d080] transition-all whitespace-nowrap cursor-pointer text-sm"
              >
                <i className="ri-user-line"></i>
                Iniciar Sesión
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-600 text-gray-400 rounded-full font-semibold hover:border-[#e2b040] hover:text-[#e2b040] transition-all whitespace-nowrap cursor-pointer text-sm"
            >
              <i className="ri-home-line"></i>
              Inicio
            </button>
          </div>
        </div>
      </header>

      {/* Success toast */}
      {mensajeExito && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 text-white px-8 py-4 rounded-xl shadow-2xl backdrop-blur-sm flex items-center gap-3 animate-fade-in whitespace-nowrap">
          <i className="ri-checkbox-circle-fill text-xl"></i>
          {mensajeExito}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Encontrá tu profesional</h1>
          <p className="text-gray-400 text-lg">Buscá entre nuestros prestadores y contactalos por WhatsApp</p>
          {!clienteDni && (
            <p className="text-[#e2b040] text-sm mt-2">
              <i className="ri-information-line mr-1"></i>
              <button onClick={() => navigate('/mi-cuenta')} className="underline cursor-pointer hover:text-[#f0d080]">
                Iniciá sesión
              </button>{' '}
              para acumular puntos y obtener descuentos
            </p>
          )}
          {clienteDni && puntosUsuario !== null && puntosUsuario >= 5 && (
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-sm font-semibold">
              <i className="ri-gift-2-line"></i>
              ¡Tenés 10% de descuento disponible! Al próximo contacto se canjea automáticamente.
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-[#16213e]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#e2b040]/20 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <i className="ri-search-line mr-1"></i>Buscar por nombre o descripción
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors text-sm"
                placeholder="Ej: electricista, jardinero, Juan..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <i className="ri-filter-line mr-1"></i>Filtrar por categoría
              </label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white focus:outline-none focus:border-[#e2b040] transition-colors text-sm cursor-pointer"
              >
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'todas' ? 'Todas las categorías' : cat.charAt(0).toUpperCase() + cat.slice(1)}
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
            <p className="text-gray-400">Cargando prestadores...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-12">
            <i className="ri-error-warning-line text-5xl text-red-400 mb-4 block"></i>
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button onClick={cargarPrestadores}
              className="px-6 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-lg font-semibold hover:bg-[#f0d080] transition-colors cursor-pointer whitespace-nowrap">
              Reintentar
            </button>
          </div>
        )}

        {/* Providers grid */}
        {!loading && !error && (
          <>
            {prestadoresFiltrados.length > 0 && (
              <p className="text-gray-400 text-sm mb-4">
                {prestadoresFiltrados.length} prestador{prestadoresFiltrados.length !== 1 ? 'es' : ''} encontrado{prestadoresFiltrados.length !== 1 ? 's' : ''}
              </p>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prestadoresFiltrados.map((prestador) => {
                const vals = prestador.valoraciones || [];
                const promedio = calcularPromedio(vals);
                const expandido = mostrarValoraciones === prestador.id;
                const puedeValorar = clienteDni && yaContacto(prestador.id);

                return (
                  <div key={prestador.id}
                    className="bg-[#16213e]/60 backdrop-blur-sm rounded-2xl border border-[#e2b040]/20 overflow-hidden hover:border-[#e2b040]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#e2b040]/10 flex flex-col">

                    {/* Photo */}
                    <div className="w-full h-56 overflow-hidden relative">
                      <img
                        src={prestador.foto_url}
                        alt={`${prestador.nombre} ${prestador.apellido}`}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://readdy.ai/api/search-image?query=professional+service+worker+portrait+neutral+background&width=400&height=300&seq=fallback01&orientation=portrait';
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#16213e] to-transparent"></div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      {/* Name + category */}
                      <div className="mb-3">
                        <h3 className="text-lg font-bold text-white mb-1">
                          {prestador.nombre} {prestador.apellido}
                        </h3>
                        <span className="inline-block px-3 py-1 bg-[#e2b040]/20 text-[#f0d080] rounded-full text-xs font-medium capitalize">
                          {prestador.categoria}
                        </span>
                      </div>

                      {/* Rating */}
                      {vals.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex">{renderEstrellas(promedio, true)}</div>
                          <span className="text-[#e2b040] text-sm font-semibold">{promedio.toFixed(1)}</span>
                          <span className="text-gray-500 text-xs">({vals.length} valorac{vals.length !== 1 ? 'iones' : 'ión'})</span>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-1">{prestador.descripcion}</p>

                      {/* Action buttons */}
                      <div className="space-y-2">
                        {/* Botón de mensajes (solo si hay sesión) */}
                        {clienteDni && (
                          <button
                            onClick={() => {
                              marcarContactado(prestador.id);
                              navigate(`/chat?prestador=${prestador.id}`);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#e2b040] hover:bg-[#f0d080] text-[#1a1a2e] rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-chat-3-line text-lg"></i>
                            Enviar mensaje
                          </button>
                        )}

                        {/* WhatsApp button */}
                        <button
                          onClick={() => handleContactar(prestador)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-whatsapp-line text-lg"></i>
                          Contactar por WhatsApp
                        </button>

                        {/* Rate button */}
                        <button
                          onClick={() => handleValorar(prestador)}
                          disabled={!puedeValorar}
                          title={!clienteDni ? 'Iniciá sesión para valorar' : !puedeValorar ? 'Solo podés valorar prestadores que hayas contactado' : ''}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                            puedeValorar
                              ? 'bg-[#e2b040]/10 border border-[#e2b040]/30 text-[#e2b040] hover:bg-[#e2b040]/20 cursor-pointer'
                              : 'bg-gray-800/50 border border-gray-700/30 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          <i className="ri-star-line"></i>
                          {puedeValorar ? 'Dejar Valoración' : 'Contactá primero para valorar'}
                        </button>

                        {/* Show reviews toggle */}
                        {vals.length > 0 && (
                          <button
                            onClick={() => setMostrarValoraciones(expandido ? null : prestador.id)}
                            className="w-full text-center text-gray-400 hover:text-[#e2b040] text-xs py-1 transition-colors cursor-pointer"
                          >
                            {expandido ? 'Ocultar valoraciones' : `Ver ${vals.length} valorac${vals.length !== 1 ? 'iones' : 'ión'}`}
                            <i className={`ml-1 ${expandido ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>
                          </button>
                        )}
                      </div>

                      {/* Reviews list */}
                      {expandido && vals.length > 0 && (
                        <div className="mt-4 space-y-3 border-t border-[#e2b040]/10 pt-4">
                          {vals.slice(0, 3).map((v) => (
                            <div key={v.id} className="bg-[#1a1a2e]/60 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white text-xs font-semibold">{v.nombre_cliente}</span>
                                <div className="flex">{renderEstrellas(v.puntuacion, true)}</div>
                              </div>
                              <p className="text-gray-400 text-xs">{v.comentario}</p>
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

            {prestadoresFiltrados.length === 0 && !loading && (
              <div className="text-center py-20">
                <i className="ri-search-line text-5xl text-gray-600 mb-4 block"></i>
                <p className="text-gray-400 text-lg mb-2">No se encontraron prestadores</p>
                <p className="text-gray-500 text-sm mb-6">Probá con otros términos de búsqueda o una categoría diferente</p>
                {(busqueda || categoriaFiltro !== 'todas') && (
                  <button
                    onClick={() => { setBusqueda(''); setCategoriaFiltro('todas'); }}
                    className="mt-4 px-5 py-2 border border-[#e2b040]/40 text-[#e2b040] rounded-lg hover:bg-[#e2b040]/10 transition-colors cursor-pointer text-sm whitespace-nowrap"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Rating Modal */}
      {mostrarModalValoracion && prestadorSeleccionado && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#16213e] rounded-2xl p-8 max-w-md w-full border border-[#e2b040]/20">
            <h3 className="text-2xl font-bold text-white mb-1">
              Valorar a {prestadorSeleccionado.nombre}
            </h3>
            <p className="text-gray-400 text-sm mb-6">Tu opinión ayuda a otros usuarios</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tu nombre</label>
                <input
                  type="text" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors text-sm"
                  placeholder="Ej: María G."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Puntuación</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setPuntuacion(star)} className="cursor-pointer">
                      <i className={`text-3xl ${star <= puntuacion ? 'ri-star-fill text-[#e2b040]' : 'ri-star-line text-gray-600'}`}></i>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Comentario</label>
                <textarea
                  value={comentario} onChange={(e) => { if (e.target.value.length <= 500) setComentario(e.target.value); }}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors resize-none text-sm"
                  rows={4} placeholder="Compartí tu experiencia con este profesional..."
                />
                <p className="text-gray-500 text-xs mt-1 text-right">{comentario.length}/500</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarModalValoracion(false)}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleEnviarValoracion}
                disabled={enviandoValoracion || !nombreCliente.trim() || !comentario.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] rounded-lg font-semibold hover:shadow-lg hover:shadow-[#e2b040]/50 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
