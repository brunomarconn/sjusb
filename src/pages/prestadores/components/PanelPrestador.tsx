import { useState, useEffect } from 'react';
import { supabase, type Prestador, type Valoracion } from '../../../lib/supabase';

interface PanelPrestadorProps {
  prestadorData: { dni: string };
  onCerrarSesion: () => void;
}

const categorias = [
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
  'maestro particular'
];

export default function PanelPrestador({ prestadorData, onCerrarSesion }: PanelPrestadorProps) {
  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    categoria: '',
    descripcion: '',
    foto: null as File | null
  });
  const [fotoPreview, setFotoPreview] = useState<string>('');

  useEffect(() => {
    cargarDatos();
  }, [prestadorData.dni]);

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
        setFormData({
          nombre: prestadorInfo.nombre,
          apellido: prestadorInfo.apellido,
          email: prestadorInfo.email,
          categoria: prestadorInfo.categoria,
          descripcion: prestadorInfo.descripcion,
          foto: null
        });
        setFotoPreview(prestadorInfo.foto_url);

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

      // Actualizar datos del prestador
      const { error: updateError } = await supabase
        .from('prestadores')
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          categoria: formData.categoria,
          descripcion: formData.descripcion,
          foto_url: fotoUrl
        })
        .eq('dni', prestador.dni);

      if (updateError) throw updateError;

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
      <header className="bg-[#16213e]/80 backdrop-blur-sm border-b border-[#e2b040]/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-lg flex items-center justify-center">
              <i className="ri-tools-line text-xl text-[#1a1a2e]"></i>
            </div>
            <span className="text-2xl font-bold text-white">MServicios</span>
          </div>

          <button
            onClick={onCerrarSesion}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-logout-box-line mr-2"></i>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="px-6 py-12">
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
                            categoria: prestador.categoria,
                            descripcion: prestador.descripcion,
                            foto: null
                          });
                          setFotoPreview(prestador.foto_url);
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
