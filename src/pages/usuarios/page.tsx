import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { prestadoresMock } from '../../mocks/prestadores';

interface Valoracion {
  id: string;
  prestador_id: string;
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
  categoria: string;
  foto_url: string;
  descripcion: string;
  created_at: string;
  valoraciones?: Valoracion[];
}

const categorias = [
  'todas',
  'electricista',
  'jardinero',
  'piletero',
  'albañil',
  'bicicletero',
  'pintor',
  'gasista',
  'plomero',
  'forrajería',
  'peluquería canina',
  'mantenimiento aire acondicionado',
  'impermeabilizador hogar',
  'alquiler vajilla',
  'pastelería',
  'cambio de baterías',
  'limpieza de tapizados',
  'personal trainer',
  'adiestrador de perros',
  'maestro particular',
  'cuidador canino profesional'
];

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

  useEffect(() => {
    cargarPrestadores();
  }, []);

  const cargarPrestadores = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('prestadores')
        .select(`
          id, nombre, apellido, dni, email, categoria, foto_url, descripcion, created_at,
          valoraciones ( id, prestador_id, nombre_cliente, puntuacion, comentario, created_at )
        `)
        .order('created_at', { ascending: false });

      if (err) throw err;

      if (data && data.length > 0) {
        setPrestadores((data as Prestador[]) || []);
      } else {
        // Sin datos en Supabase, usar mock
        const mockAdaptado: Prestador[] = prestadoresMock.map((p) => {
          const partes = p.nombre.split(' ');
          const nombre = partes[0] || p.nombre;
          const apellido = partes.slice(1).join(' ') || '';
          return {
            id: String(p.id),
            nombre,
            apellido,
            dni: p.dni,
            email: p.email,
            categoria: p.categoria,
            foto_url: p.foto_url,
            descripcion: p.descripcion,
            created_at: new Date().toISOString(),
            valoraciones: [],
          };
        });
        setPrestadores(mockAdaptado);
      }
    } catch (e) {
      // Supabase no disponible: usar datos de ejemplo
      const mockAdaptado: Prestador[] = prestadoresMock.map((p) => {
        const partes = p.nombre.split(' ');
        const nombre = partes[0] || p.nombre;
        const apellido = partes.slice(1).join(' ') || '';
        return {
          id: String(p.id),
          nombre,
          apellido,
          dni: p.dni,
          email: p.email,
          categoria: p.categoria,
          foto_url: p.foto_url,
          descripcion: p.descripcion,
          created_at: new Date().toISOString(),
          valoraciones: [],
        };
      });
      setPrestadores(mockAdaptado);
    } finally {
      setLoading(false);
    }
  };

  const handleContactar = (prestador: Prestador) => {
    const mensaje = `Hola, te contacto desde MServicios. Estoy interesado en los servicios de ${prestador.nombre} ${prestador.apellido} (${prestador.categoria}). ¿Podrían darme más información?`;
    const numeroWhatsApp = '543513227999';
    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleValorar = (prestador: Prestador) => {
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
          cliente_email: 'anonimo@mservicios.com',
          nombre_cliente: nombreCliente.trim(),
          puntuacion,
          comentario: comentario.trim()
        }]);

      if (insertError) throw insertError;

      // Actualizar localmente sin recargar todo
      const nuevaValoracion: Valoracion = {
        id: Date.now().toString(),
        prestador_id: prestadorSeleccionado.id,
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

  const prestadoresFiltrados = prestadores.filter((p) => {
    const texto = busqueda.toLowerCase();
    const coincideBusqueda =
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
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-xl">
              <i className="ri-tools-line text-xl text-[#1a1a2e]"></i>
            </div>
            <span className="text-2xl font-bold text-[#e2b040]">MServicios</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2 bg-transparent border border-[#e2b040] text-[#e2b040] rounded-full font-semibold hover:bg-[#e2b040] hover:text-[#1a1a2e] transition-all duration-300 whitespace-nowrap cursor-pointer text-sm"
          >
            <i className="ri-arrow-left-line"></i>
            Volver al Inicio
          </button>
        </div>
      </header>

      {/* Mensaje de éxito */}
      {mensajeExito && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 text-white px-8 py-4 rounded-xl shadow-2xl backdrop-blur-sm flex items-center gap-3 animate-fade-in">
          <i className="ri-checkbox-circle-fill text-xl"></i>
          {mensajeExito}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Encontrá tu profesional</h1>
          <p className="text-gray-400 text-lg">
            Buscá entre nuestros prestadores de servicios y contactalos directamente
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-[#16213e]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#e2b040]/20 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filtrar por categoría</label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white focus:outline-none focus:border-[#e2b040] transition-colors text-sm cursor-pointer"
              >
                {categorias.map((cat) => (
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
            <p className="text-gray-400">Cargando prestadores...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-12">
            <i className="ri-error-warning-line text-5xl text-red-400 mb-4 block"></i>
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={cargarPrestadores}
              className="px-6 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-lg font-semibold hover:bg-[#f0d080] transition-colors cursor-pointer whitespace-nowrap"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Lista de Prestadores */}
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

                return (
                  <div
                    key={prestador.id}
                    className="bg-[#16213e]/60 backdrop-blur-sm rounded-2xl border border-[#e2b040]/20 overflow-hidden hover:border-[#e2b040]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#e2b040]/10 flex flex-col"
                  >
                    <div className="w-full h-56 overflow-hidden">
                      <img
                        src={prestador.foto_url}
                        alt={`${prestador.nombre} ${prestador.apellido}`}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://readdy.ai/api/search-image?query=professional%20service%20worker%20portrait%20neutral%20background&width=400&height=300&seq=fallback01&orientation=portrait';
                        }}
                      />
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="mb-3">
                        <h3 className="text-lg font-bold text-white mb-1">
                          {prestador.nombre} {prestador.apellido}
                        </h3>
                        <span className="inline-block px-3 py-1 bg-[#e2b040]/20 text-[#f0d080] rounded-full text-xs font-medium capitalize">
                          {prestador.categoria}
                        </span>
                      </div>

                      <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-1">
                        {prestador.descripcion}
                      </p>

                      {/* Valoración promedio */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`text-sm ${
                                star <= Math.round(promedio)
                                  ? 'ri-star-fill text-[#e2b040]'
                                  : 'ri-star-line text-gray-600'
                              }`}
                            ></i>
                          ))}
                        </div>
                        <span className="text-gray-400 text-xs">
                          {promedio > 0 ? promedio.toFixed(1) : 'Sin valoraciones'}{' '}
                          ({vals.length})
                        </span>
                      </div>

                      {/* Botones */}
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => handleContactar(prestador)}
                          className="flex-1 bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] py-2.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-[#e2b040]/50 transition-all whitespace-nowrap cursor-pointer text-sm"
                        >
                          <i className="ri-whatsapp-line mr-1"></i>
                          Contactar
                        </button>
                        <button
                          onClick={() => handleValorar(prestador)}
                          title="Dejar valoración"
                          className="w-10 h-10 flex items-center justify-center bg-[#1a1a2e] border border-[#e2b040]/30 text-[#e2b040] rounded-lg hover:bg-[#e2b040]/10 transition-colors cursor-pointer"
                        >
                          <i className="ri-star-line"></i>
                        </button>
                      </div>

                      {/* Toggle valoraciones */}
                      {vals.length > 0 && (
                        <button
                          onClick={() => setMostrarValoraciones(expandido ? null : prestador.id)}
                          className="text-xs text-[#e2b040]/70 hover:text-[#e2b040] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <i className={`${expandido ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>
                          {expandido ? 'Ocultar' : 'Ver'} valoraciones ({vals.length})
                        </button>
                      )}

                      {/* Lista de valoraciones expandible */}
                      {expandido && vals.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#e2b040]/20 space-y-2 max-h-48 overflow-y-auto">
                          {vals.slice(0, 5).map((val) => (
                            <div key={val.id} className="bg-[#1a1a2e]/50 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white text-xs font-medium">{val.nombre_cliente}</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <i
                                      key={star}
                                      className={`text-xs ${
                                        star <= val.puntuacion
                                          ? 'ri-star-fill text-[#e2b040]'
                                          : 'ri-star-line text-gray-600'
                                      }`}
                                    ></i>
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-400 text-xs">{val.comentario}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {prestadoresFiltrados.length === 0 && (
              <div className="text-center py-16">
                <i className="ri-search-line text-6xl text-gray-600 mb-4 block"></i>
                <p className="text-gray-400 text-lg">No se encontraron prestadores</p>
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

      {/* Modal de Valoración */}
      {mostrarModalValoracion && prestadorSeleccionado && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#16213e] rounded-2xl p-8 max-w-md w-full border border-[#e2b040]/20">
            <h3 className="text-2xl font-bold text-white mb-1">
              Valorar a {prestadorSeleccionado.nombre}
            </h3>
            <p className="text-gray-400 text-sm mb-6">Tu valoración es anónima</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tu nombre (visible en la valoración)
                </label>
                <input
                  type="text"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors text-sm"
                  placeholder="Ej: Juan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Puntuación</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setPuntuacion(star)}
                      className="cursor-pointer"
                    >
                      <i
                        className={`text-3xl ${
                          star <= puntuacion ? 'ri-star-fill text-[#e2b040]' : 'ri-star-line text-gray-600'
                        }`}
                      ></i>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Comentario</label>
                <textarea
                  value={comentario}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setComentario(e.target.value);
                  }}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors resize-none text-sm"
                  rows={4}
                  placeholder="Compartí tu experiencia..."
                />
                <p className="text-gray-500 text-xs mt-1 text-right">{comentario.length}/500</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setMostrarModalValoracion(false)}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviarValoracion}
                disabled={enviandoValoracion || !nombreCliente.trim() || !comentario.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] rounded-lg font-semibold hover:shadow-lg hover:shadow-[#e2b040]/50 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviandoValoracion ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
