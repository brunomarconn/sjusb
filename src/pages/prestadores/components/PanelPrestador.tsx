import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, type Prestador, type Valoracion } from '../../../lib/supabase';
import { CATEGORIAS_SERVICIOS } from '../../../constants/categorias';

// ── Tipos disponibilidad ──────────────────────────────────────
type Turno = 'mañana' | 'tarde';
type DisponibilidadMap = Record<number, Turno[]>; // dia_semana → turnos activos

const DIAS_SEMANA = [
  { valor: 1, nombre: 'Lunes' },
  { valor: 2, nombre: 'Martes' },
  { valor: 3, nombre: 'Miércoles' },
  { valor: 4, nombre: 'Jueves' },
  { valor: 5, nombre: 'Viernes' },
  { valor: 6, nombre: 'Sábado' },
  { valor: 0, nombre: 'Domingo' },
];

interface PanelPrestadorProps {
  prestadorData: { dni: string };
  onCerrarSesion: () => void;
}

const categorias = CATEGORIAS_SERVICIOS;

const zonas = [
  'Villa Allende',
  'Rio Ceballos',
  'Mendiolaza',
  'Unquillo',
  'Saldán',
];

export default function PanelPrestador({ prestadorData, onCerrarSesion }: PanelPrestadorProps) {
  const navigate = useNavigate();
  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    categoria: '',
    zona: '',
    descripcion: '',
    foto: null as File | null
  });
  const [fotoPreview, setFotoPreview] = useState<string>('');

  // ── Zonas de trabajo ─────────────────────────────────────
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState<string[]>([]);
  const [zonaPersonalizada, setZonaPersonalizada] = useState('');

  // ── Galería multimedia ────────────────────────────────────
  const [galeriaActual, setGaleriaActual] = useState<string[]>([]);
  const [galeriaNew, setGaleriaNew] = useState<File[]>([]);
  const [galeriaNuevoPreviews, setGaleriaNuevoPreviews] = useState<{ url: string; esVideo: boolean }[]>([]);

  // ── Disponibilidad ────────────────────────────────────────
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadMap>({});
  const [guardandoDisp, setGuardandoDisp] = useState(false);
  const [dispGuardada, setDispGuardada] = useState(false);

  const cargarDatos = async () => {
      try {
        // Cargar datos del prestador
        const { data: prestadorInfo, error: prestadorError } = await supabase
          .from('prestadores')
          .select('*')
          .eq('dni', prestadorData.dni)
          .maybeSingle();

        if (prestadorError) throw prestadorError;

        if (prestadorInfo) {
          setPrestador(prestadorInfo);
          // Guardar UUID para el sistema de chat
          localStorage.setItem('mservicios_prestador_id', prestadorInfo.id);
          cargarDisponibilidad(prestadorInfo.id);
          setFormData({
            nombre: prestadorInfo.nombre,
            apellido: prestadorInfo.apellido,
            email: prestadorInfo.email,
            telefono: prestadorInfo.telefono || '',
            categoria: prestadorInfo.categoria,
            zona: prestadorInfo.zona || '',
            descripcion: prestadorInfo.descripcion,
            foto: null
          });
          setFotoPreview(prestadorInfo.foto_url);
          setZonasSeleccionadas(
            prestadorInfo.zona
              ? prestadorInfo.zona.split(',').map((z: string) => z.trim()).filter(Boolean)
              : []
          );
          setGaleriaActual(prestadorInfo.galeria_urls || []);

          // Cargar valoraciones del prestador
          const { data: valoracionesData, error: valoracionesError } = await supabase
            .from('valoraciones')
            .select('*')
            .eq('prestador_id', prestadorInfo.id)
            .order('created_at', { ascending: false });

          if (valoracionesError) throw valoracionesError;

          setValoraciones(valoracionesData || []);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestadorData.dni]);

  const cargarDisponibilidad = async (prestadorId: string) => {
    const { data } = await supabase
      .from('disponibilidad_prestadores')
      .select('dia_semana, turno')
      .eq('prestador_id', prestadorId);

    if (data) {
      const mapa: DisponibilidadMap = {};
      data.forEach(({ dia_semana, turno }: { dia_semana: number; turno: Turno }) => {
        if (!mapa[dia_semana]) mapa[dia_semana] = [];
        mapa[dia_semana].push(turno);
      });
      setDisponibilidad(mapa);
    }
  };

  const toggleTurno = (dia: number, turno: Turno) => {
    setDisponibilidad(prev => {
      const actual = prev[dia] || [];
      const existe = actual.includes(turno);
      const nuevo = existe ? actual.filter(t => t !== turno) : [...actual, turno];
      return { ...prev, [dia]: nuevo };
    });
  };

  const guardarDisponibilidad = async () => {
    if (!prestador) return;
    setGuardandoDisp(true);
    try {
      // Borrar todos los slots actuales del prestador
      await supabase
        .from('disponibilidad_prestadores')
        .delete()
        .eq('prestador_id', prestador.id);

      // Insertar los nuevos
      const inserts: { prestador_id: string; dia_semana: number; turno: Turno }[] = [];
      for (const [dia, turnos] of Object.entries(disponibilidad)) {
        for (const turno of turnos) {
          inserts.push({ prestador_id: prestador.id, dia_semana: Number(dia), turno });
        }
      }

      if (inserts.length > 0) {
        await supabase.from('disponibilidad_prestadores').insert(inserts);
      }

      setDispGuardada(true);
      setTimeout(() => setDispGuardada(false), 3000);
    } catch (e) {
      console.error('Error al guardar disponibilidad:', e);
    } finally {
      setGuardandoDisp(false);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, foto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleZona = (zona: string) => {
    setZonasSeleccionadas(prev =>
      prev.includes(zona) ? prev.filter(z => z !== zona) : [...prev, zona]
    );
  };

  const agregarZonaPersonalizada = () => {
    const z = zonaPersonalizada.trim();
    if (!z || zonasSeleccionadas.includes(z)) return;
    setZonasSeleccionadas(prev => [...prev, z]);
    setZonaPersonalizada('');
  };

  const quitarZona = (zona: string) => {
    setZonasSeleccionadas(prev => prev.filter(z => z !== zona));
  };

  const esVideoUrl = (url: string) =>
    /\.(mp4|mov|avi|webm|mkv|ogv)(\?.*)?$/i.test(url);

  const handleGaleriaNuevaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setGaleriaNew(prev => [...prev, file]);
      setGaleriaNuevoPreviews(prev => [...prev, { url, esVideo: file.type.startsWith('video/') }]);
    });
    e.target.value = '';
  };

  const removeGaleriaActual = (index: number) => {
    setGaleriaActual(prev => prev.filter((_, i) => i !== index));
  };

  const removeGaleriaNueva = (index: number) => {
    URL.revokeObjectURL(galeriaNuevoPreviews[index].url);
    setGaleriaNew(prev => prev.filter((_, i) => i !== index));
    setGaleriaNuevoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!prestador) return;

    try {
      let fotoUrl = prestador.foto_url;

      // Si hay una nueva foto, subirla
      if (formData.foto) {
        const fileExt = formData.foto.name.split('.').pop();
        const fileName = `${prestador.dni}-${Date.now()}.${fileExt}`;
        const filePath = `prestadores/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('fotos-prestadores')
          .upload(filePath, formData.foto);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('fotos-prestadores')
            .getPublicUrl(filePath);
          fotoUrl = urlData.publicUrl;
        } else {
          // Si falla la subida, usar el preview
          fotoUrl = fotoPreview;
        }
      }

      // Subir nuevos archivos de galería
      const nuevasUrls: string[] = [];
      for (const file of galeriaNew) {
        const ext = file.name.split('.').pop();
        const galeriaPath = `prestadores/galeria/${prestador.dni}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: galeriaErr } = await supabase.storage
          .from('fotos-prestadores')
          .upload(galeriaPath, file);
        if (!galeriaErr) {
          const { data: galeriaUrlData } = supabase.storage
            .from('fotos-prestadores')
            .getPublicUrl(galeriaPath);
          nuevasUrls.push(galeriaUrlData.publicUrl);
        }
      }
      const galeriaFinal = [...galeriaActual, ...nuevasUrls];

      // Actualizar datos del prestador
      const { error: updateError } = await supabase
        .from('prestadores')
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono,
          categoria: formData.categoria,
          zona: zonasSeleccionadas.join(', '),
          descripcion: formData.descripcion,
          foto_url: fotoUrl,
          galeria_urls: galeriaFinal.length > 0 ? galeriaFinal : null
        })
        .eq('dni', prestador.dni);

      if (updateError) throw updateError;

      setGaleriaNew([]);
      setGaleriaNuevoPreviews([]);
      await cargarDatos();
      setIsEditing(false);
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al actualizar el perfil');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!prestador) {
    return null;
  }

  const valoracionPromedio = valoraciones.length > 0
    ? valoraciones.reduce((acc, val) => acc + val.puntuacion, 0) / valoraciones.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419]">
      {/* Header */}
      <header className="bg-[#16213e]/80 backdrop-blur-sm border-b border-[#e2b040]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="ri-tools-line text-lg text-[#1a1a2e]"></i>
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">ServiciosYa</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-2 sm:px-3 sm:py-1.5 bg-[#e2b040]/10 text-[#e2b040] rounded-lg hover:bg-[#e2b040]/20 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Inicio"
            >
              <i className="ri-home-line"></i>
              <span className="hidden sm:inline text-sm">Inicio</span>
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="p-2 sm:px-3 sm:py-1.5 bg-[#e2b040]/10 text-[#e2b040] rounded-lg hover:bg-[#e2b040]/20 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Mensajes"
            >
              <i className="ri-chat-3-line"></i>
              <span className="hidden sm:inline text-sm">Mensajes</span>
            </button>
            <button
              onClick={onCerrarSesion}
              className="p-2 sm:px-3 sm:py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Cerrar Sesión"
            >
              <i className="ri-logout-box-line"></i>
              <span className="hidden sm:inline text-sm">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Mi Perfil</h1>
            <p className="text-gray-400 text-lg">Gestioná tu información y visualizá tus valoraciones</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Perfil */}
            <div className="lg:col-span-2">
              <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Información Personal</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-lg font-semibold hover:bg-[#f0d080] transition-all duration-300 whitespace-nowrap cursor-pointer text-sm flex items-center gap-2"
                    >
                      <i className="ri-edit-line"></i>
                      Editar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-lg font-semibold hover:bg-[#f0d080] transition-all duration-300 whitespace-nowrap cursor-pointer text-sm"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            nombre: prestador.nombre,
                            apellido: prestador.apellido,
                            email: prestador.email,
                            telefono: (prestador as any).telefono || '',
                            categoria: prestador.categoria,
                            zona: (prestador as any).zona || '',
                            descripcion: prestador.descripcion,
                            foto: null
                          });
                          setFotoPreview(prestador.foto_url);
                          setZonasSeleccionadas(
                            prestador.zona
                              ? prestador.zona.split(',').map((z: string) => z.trim()).filter(Boolean)
                              : []
                          );
                          setZonaPersonalizada('');
                          setGaleriaActual(prestador.galeria_urls || []);
                          setGaleriaNew([]);
                          setGaleriaNuevoPreviews([]);
                        }}
                        className="px-4 py-2 bg-transparent border border-[#e2b040] text-[#e2b040] rounded-lg hover:bg-[#e2b040] hover:text-[#1a1a2e] transition-all duration-300 whitespace-nowrap cursor-pointer text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#e2b040] flex-shrink-0">
                      <img src={fotoPreview} alt="Perfil" className="w-full h-full object-cover object-top" />
                    </div>
                    {isEditing && (
                      <label className="px-4 py-2 bg-[#16213e] border border-[#e2b040]/30 rounded-lg text-gray-400 hover:border-[#e2b040] transition-colors cursor-pointer text-sm flex items-center gap-2">
                        <i className="ri-upload-2-line"></i>
                        Cambiar foto
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFotoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white text-sm font-semibold mb-2">Nombre</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-[#16213e] border border-[#e2b040]/30 rounded-lg text-white focus:outline-none focus:border-[#e2b040] transition-colors text-sm"
                        />
                      ) : (
                        <p className="text-gray-300 text-base">{formData.nombre}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white text-sm font-semibold mb-2">Apellido</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-[#16213e] border border-[#e2b040]/30 rounded-lg text-white focus:outline-none focus:border-[#e2b040] transition-colors text-sm"
                        />
                      ) : (
                        <p className="text-gray-300 text-base">{formData.apellido}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">DNI</label>
                    <p className="text-gray-300 text-base">{prestador.dni}</p>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#16213e] border border-[#e2b040]/30 rounded-lg text-white focus:outline-none focus:border-[#e2b040] transition-colors text-sm"
                      />
                    ) : (
                      <p className="text-gray-300 text-base">{formData.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">
                      Teléfono WhatsApp
                      <span className="text-gray-500 text-xs ml-2">(con código de área)</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#16213e] border border-[#e2b040]/30 rounded-lg text-white focus:outline-none focus:border-[#e2b040] transition-colors text-sm"
                        placeholder="Ej: 1123456789"
                      />
                    ) : (
                      <p className="text-gray-300 text-base">{formData.telefono || 'No especificado'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">Categoría</label>
                    {isEditing ? (
                      <select
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#16213e] border border-[#e2b040]/30 rounded-lg text-white focus:outline-none focus:border-[#e2b040] transition-colors text-sm cursor-pointer"
                      >
                        {categorias.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-block px-4 py-2 bg-[#e2b040]/20 text-[#e2b040] rounded-full text-sm font-semibold">
                        {formData.categoria}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">
                      Zona de Trabajo
                      {isEditing && <span className="text-gray-500 text-xs ml-2 font-normal">(podés elegir varias)</span>}
                    </label>
                    {isEditing ? (
                      <div className="bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg p-3 space-y-3">
                        {/* Chips predefinidos */}
                        <div className="flex flex-wrap gap-2">
                          {zonas.map(zona => {
                            const activa = zonasSeleccionadas.includes(zona);
                            return (
                              <button
                                key={zona}
                                type="button"
                                onClick={() => toggleZona(zona)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                  activa
                                    ? 'bg-[#e2b040] text-[#1a1a2e]'
                                    : 'bg-[#16213e] border border-[#e2b040]/30 text-gray-400 hover:border-[#e2b040] hover:text-gray-200'
                                }`}
                              >
                                {activa && <i className="ri-check-line text-xs"></i>}
                                {zona}
                              </button>
                            );
                          })}
                        </div>

                        {/* Input zona personalizada */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={zonaPersonalizada}
                            onChange={e => setZonaPersonalizada(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarZonaPersonalizada(); } }}
                            placeholder="Otra zona (escribí y presioná +)"
                            className="flex-1 px-3 py-2 bg-[#16213e] border border-[#e2b040]/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e2b040] transition-colors"
                          />
                          <button
                            type="button"
                            onClick={agregarZonaPersonalizada}
                            className="px-3 py-2 bg-[#e2b040]/20 text-[#e2b040] rounded-lg hover:bg-[#e2b040]/30 transition-colors cursor-pointer text-sm"
                          >
                            <i className="ri-add-line"></i>
                          </button>
                        </div>

                        {/* Zonas seleccionadas */}
                        {zonasSeleccionadas.length > 0 && (
                          <div className="pt-2 border-t border-[#e2b040]/10 flex flex-wrap gap-2">
                            {zonasSeleccionadas.map(zona => (
                              <span key={zona} className="flex items-center gap-1 px-3 py-1 bg-[#e2b040]/20 text-[#e2b040] rounded-full text-sm">
                                <i className="ri-map-pin-line text-xs"></i>
                                {zona}
                                <button
                                  type="button"
                                  onClick={() => quitarZona(zona)}
                                  className="ml-1 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                  <i className="ri-close-line text-xs"></i>
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {zonasSeleccionadas.length > 0 ? (
                          zonasSeleccionadas.map(zona => (
                            <span key={zona} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#e2b040]/20 text-[#e2b040] rounded-full text-sm font-semibold">
                              <i className="ri-map-pin-line text-xs"></i>
                              {zona}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm italic">No especificada</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">Descripción del Servicio</label>
                    {isEditing ? (
                      <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#16213e] border border-[#e2b040]/30 rounded-lg text-white focus:outline-none focus:border-[#e2b040] transition-colors text-sm resize-none"
                        rows={4}
                      />
                    ) : (
                      <p className="text-gray-300 text-base leading-relaxed">{formData.descripcion}</p>
                    )}
                  </div>

                  {/* Fotos / Videos del trabajo */}
                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">
                      Fotos / Videos del Trabajo
                      {!isEditing && galeriaActual.length > 0 && (
                        <span className="text-gray-500 text-xs ml-2 font-normal">(clic para abrir)</span>
                      )}
                    </label>

                    {/* Vista normal */}
                    {!isEditing && (
                      galeriaActual.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {galeriaActual.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              className="relative aspect-square rounded-lg overflow-hidden border border-[#e2b040]/20 bg-[#16213e] group"
                            >
                              {esVideoUrl(url) ? (
                                <video src={url} className="w-full h-full object-cover" muted />
                              ) : (
                                <img src={url} alt={`Trabajo ${i + 1}`} className="w-full h-full object-cover" />
                              )}
                              {esVideoUrl(url) && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <i className="ri-play-circle-fill text-white text-3xl opacity-60"></i>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <i className="ri-zoom-in-line text-white text-xl"></i>
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">Sin fotos ni videos cargados aún</p>
                      )
                    )}

                    {/* Vista edición */}
                    {isEditing && (
                      <div className="space-y-3">
                        {galeriaActual.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Actuales — × para eliminar</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {galeriaActual.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#e2b040]/20 bg-[#1a1a2e]">
                                  {esVideoUrl(url) ? (
                                    <video src={url} className="w-full h-full object-cover" muted />
                                  ) : (
                                    <img src={url} alt={`Trabajo ${i + 1}`} className="w-full h-full object-cover" />
                                  )}
                                  {esVideoUrl(url) && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <i className="ri-play-circle-fill text-white text-2xl opacity-60"></i>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeGaleriaActual(i)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-500 transition-colors cursor-pointer"
                                  >
                                    <i className="ri-close-line"></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {galeriaNuevoPreviews.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Nuevos para agregar</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {galeriaNuevoPreviews.map((item, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#e2b040]/40 bg-[#1a1a2e]">
                                  {item.esVideo ? (
                                    <video src={item.url} className="w-full h-full object-cover" muted />
                                  ) : (
                                    <img src={item.url} alt={`Nuevo ${i + 1}`} className="w-full h-full object-cover" />
                                  )}
                                  {item.esVideo && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <i className="ri-play-circle-fill text-white text-2xl opacity-60"></i>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeGaleriaNueva(i)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-500 transition-colors cursor-pointer"
                                  >
                                    <i className="ri-close-line"></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a2e] border border-dashed border-[#e2b040]/30 rounded-lg text-gray-400 hover:border-[#e2b040] hover:text-gray-300 transition-colors cursor-pointer text-sm w-full">
                          <i className="ri-image-add-line text-lg"></i>
                          Agregar fotos o videos
                          <input type="file" accept="image/*,video/*" multiple onChange={handleGaleriaNuevaChange} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-2xl p-6 shadow-xl">
                <div className="text-center">
                  <i className="ri-star-fill text-[#1a1a2e] text-4xl mb-3"></i>
                  <h3 className="text-3xl font-bold text-[#1a1a2e] mb-1">
                    {valoracionPromedio > 0 ? valoracionPromedio.toFixed(1) : 'N/A'}
                  </h3>
                  <p className="text-[#1a1a2e] font-semibold">Valoración Promedio</p>
                </div>
              </div>

              <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-6">
                <div className="text-center">
                  <i className="ri-message-3-line text-[#e2b040] text-4xl mb-3"></i>
                  <h3 className="text-3xl font-bold text-white mb-1">{valoraciones.length}</h3>
                  <p className="text-gray-400 font-semibold">Valoraciones Totales</p>
                </div>
              </div>
            </div>
          </div>

          {/* Disponibilidad */}
          <div className="mt-8">
            <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Mi Disponibilidad</h2>
                  <p className="text-gray-400 text-sm mt-1">Configurá los días y turnos en que podés trabajar</p>
                </div>
                <button
                  onClick={guardarDisponibilidad}
                  disabled={guardandoDisp}
                  className="px-4 py-2 bg-[#e2b040] text-[#1a1a2e] rounded-lg font-semibold hover:bg-[#f0d080] transition-all text-sm flex items-center gap-2 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  {guardandoDisp ? (
                    <><i className="ri-loader-4-line animate-spin" /> Guardando...</>
                  ) : dispGuardada ? (
                    <><i className="ri-checkbox-circle-line" /> Guardado</>
                  ) : (
                    <><i className="ri-save-line" /> Guardar</>
                  )}
                </button>
              </div>

              <div className="grid gap-2">
                {DIAS_SEMANA.map(({ valor, nombre }) => {
                  const turnos = disponibilidad[valor] || [];
                  return (
                    <div key={valor} className="flex items-center bg-[#16213e] rounded-xl px-4 py-3 gap-3">
                      <span className="text-white font-medium text-sm flex-shrink-0 w-20">{nombre}</span>
                      <div className="flex gap-2 flex-1">
                        {(['mañana', 'tarde'] as Turno[]).map(turno => {
                          const activo = turnos.includes(turno);
                          return (
                            <button
                              key={turno}
                              onClick={() => toggleTurno(valor, turno)}
                              className={`
                                flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer
                                ${activo
                                  ? 'bg-[#e2b040] text-[#1a1a2e]'
                                  : 'bg-[#1a1a2e] border border-white/10 text-gray-500 hover:border-[#e2b040]/30 hover:text-gray-300'
                                }
                              `}
                            >
                              <i className={turno === 'mañana' ? 'ri-sun-line' : 'ri-moon-line'} />
                              {turno === 'mañana' ? 'Mañana' : 'Tarde'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-gray-600 text-xs mt-4">
                <i className="ri-information-line mr-1" />
                Los clientes verán estos días al querer reservar un turno con vos.
              </p>
            </div>
          </div>

          {/* Valoraciones */}
          <div className="mt-8">
            <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-[#e2b040]/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Mis Valoraciones</h2>
              
              {valoraciones.length > 0 ? (
                <div className="space-y-4">
                  {valoraciones.map(valoracion => (
                    <div key={valoracion.id} className="bg-[#16213e] border border-[#e2b040]/20 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white font-semibold text-base">{valoracion.nombre_cliente}</h4>
                          <p className="text-gray-500 text-sm">
                            {new Date(valoracion.created_at).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <i
                              key={star}
                              className={`${star <= valoracion.puntuacion ? 'ri-star-fill text-[#e2b040]' : 'ri-star-line text-gray-600'}`}
                            ></i>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{valoracion.comentario}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <i className="ri-message-3-line text-6xl text-gray-600 mb-4"></i>
                  <p className="text-gray-400 text-lg">Aún no tienes valoraciones</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
