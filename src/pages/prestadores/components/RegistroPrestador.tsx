import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { CATEGORIAS_SERVICIOS } from '../../../constants/categorias';

interface RegistroPrestadorProps {
  onRegistroExitoso: (dni: string) => void;
  onVolverLogin: () => void;
}

const categorias = CATEGORIAS_SERVICIOS;

const zonas = [
  'Villa Allende', 'Rio Ceballos', 'Mendiolaza', 'Unquillo', 'Saldán'
];

export default function RegistroPrestador({ onRegistroExitoso, onVolverLogin }: RegistroPrestadorProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    confirmarDni: '',
    email: '',
    telefono: '',
    categoria: '',
    descripcion: ''
  });
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState<string[]>([]);
  const [zonaPersonalizada, setZonaPersonalizada] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string>('');
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaPreviews, setGaleriaPreviews] = useState<{ url: string; esVideo: boolean }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewFoto(reader.result as string);
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

  const handleGaleriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setGaleriaFiles(prev => [...prev, file]);
      setGaleriaPreviews(prev => [...prev, { url, esVideo: file.type.startsWith('video/') }]);
    });
    e.target.value = '';
  };

  const removeGaleriaItem = (index: number) => {
    URL.revokeObjectURL(galeriaPreviews[index].url);
    setGaleriaFiles(prev => prev.filter((_, i) => i !== index));
    setGaleriaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!foto) {
      setError('La foto de perfil es obligatoria');
      return;
    }

    if (!formData.dni.trim()) {
      setError('El DNI es obligatorio');
      return;
    }

    if (formData.dni.trim() !== formData.confirmarDni.trim()) {
      setError('Los DNI ingresados no coinciden');
      return;
    }

    if (!formData.categoria) {
      setError('Seleccioná una categoría');
      return;
    }

    if (zonasSeleccionadas.length === 0) {
      setError('Seleccioná al menos una zona de trabajo');
      return;
    }

    if (!formData.telefono.trim()) {
      setError('El teléfono es obligatorio para el contacto por WhatsApp');
      return;
    }

    setLoading(true);

    try {
      const { data: existingPrestador } = await supabase
        .from('prestadores')
        .select('dni')
        .eq('dni', formData.dni)
        .maybeSingle();

      if (existingPrestador) {
        setError('Este DNI ya está registrado');
        setLoading(false);
        return;
      }

      // Try to upload photo to Supabase Storage
      let fotoUrl = previewFoto; // fallback: base64

      const fileExt = foto.name.split('.').pop();
      const fileName = `${formData.dni}-${Date.now()}.${fileExt}`;
      const filePath = `prestadores/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fotos-prestadores')
        .upload(filePath, foto);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('fotos-prestadores')
          .getPublicUrl(filePath);
        fotoUrl = urlData.publicUrl;
      }

      // Subir archivos de galería (opcionales)
      const galeriaUrls: string[] = [];
      for (const file of galeriaFiles) {
        const ext = file.name.split('.').pop();
        const galeriaPath = `prestadores/galeria/${formData.dni}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: galeriaErr } = await supabase.storage
          .from('fotos-prestadores')
          .upload(galeriaPath, file);
        if (!galeriaErr) {
          const { data: galeriaUrlData } = supabase.storage
            .from('fotos-prestadores')
            .getPublicUrl(galeriaPath);
          galeriaUrls.push(galeriaUrlData.publicUrl);
        }
      }

      const { error: insertError } = await supabase
        .from('prestadores')
        .insert([{
          nombre: formData.nombre,
          apellido: formData.apellido,
          dni: formData.dni,
          email: formData.email || null,
          password: formData.dni,
          telefono: formData.telefono,
          categoria: formData.categoria,
          zona: zonasSeleccionadas.join(', '),
          foto_url: fotoUrl,
          descripcion: formData.descripcion,
          galeria_urls: galeriaUrls.length > 0 ? galeriaUrls : null
        }]);

      if (insertError) throw insertError;

      onRegistroExitoso(formData.dni);
    } catch (err) {
      console.error('Error al registrar:', err);
      setError('Error al crear la cuenta. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex items-center justify-center p-4">
      <div className="bg-[#16213e]/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-[#e2b040]/20 my-8">

        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-[#e2b040] transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line"></i>
            <span className="text-sm">Volver al inicio</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-xl mb-4">
            <i className="ri-briefcase-line text-3xl text-[#1a1a2e]"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Registro de Prestador</h2>
          <p className="text-gray-400">Completá tus datos para ofrecer tus servicios</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-5 text-sm flex items-center gap-2">
            <i className="ri-error-warning-line"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile photo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Foto de Perfil <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-4">
              {previewFoto ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#e2b040] shrink-0">
                  <img src={previewFoto} alt="Preview" className="w-full h-full object-cover object-top" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#1a1a2e] border-2 border-dashed border-[#e2b040]/40 flex items-center justify-center shrink-0">
                  <i className="ri-user-line text-2xl text-gray-500"></i>
                </div>
              )}
              <label className="flex-1 px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-gray-400 hover:border-[#e2b040] transition-colors cursor-pointer text-sm">
                <i className="ri-upload-cloud-line mr-2"></i>
                {foto ? foto.name : 'Seleccionar foto (obligatoria)'}
                <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre <span className="text-red-400">*</span></label>
              <input
                type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                placeholder="Tu nombre" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Apellido <span className="text-red-400">*</span></label>
              <input
                type="text" name="apellido" value={formData.apellido} onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                placeholder="Tu apellido" required
              />
            </div>
          </div>

          {/* DNI — usado como usuario y contraseña */}
          <div className="bg-[#e2b040]/5 border border-[#e2b040]/20 rounded-xl p-4 space-y-4">
            <div className="flex items-start gap-2">
              <i className="ri-shield-keyhole-line text-[#e2b040] mt-0.5 shrink-0"></i>
              <p className="text-sm text-[#f0d080]">
                Tu <strong>DNI</strong> será tu <strong>usuario y contraseña</strong> para ingresar al sistema. No necesitás recordar nada más.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  DNI <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" name="dni" value={formData.dni} onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                  placeholder="Número de DNI" required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar DNI <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" name="confirmarDni" value={formData.confirmarDni} onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                  placeholder="Repetí tu DNI" required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
              <span className="text-gray-500 text-xs ml-2">(opcional)</span>
            </label>
            <input
              type="email" name="email" value={formData.email} onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono WhatsApp <span className="text-red-400">*</span>
              <span className="text-gray-500 text-xs ml-2">(con código de área, ej: 1123456789)</span>
            </label>
            <div className="flex">
              <span className="px-3 py-3 bg-[#1a1a2e] border border-r-0 border-[#e2b040]/30 rounded-l-lg text-gray-400 text-sm">+54 9</span>
              <input
                type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                className="flex-1 px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-r-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                placeholder="1123456789" required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Categoría <span className="text-red-400">*</span></label>
            <select
              name="categoria" value={formData.categoria} onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white focus:outline-none focus:border-[#e2b040] transition-colors cursor-pointer"
              required
            >
              <option value="">Seleccioná tu categoría</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Zona de Trabajo <span className="text-red-400">*</span>
              <span className="text-gray-500 text-xs ml-2 font-normal">(podés elegir varias)</span>
            </label>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Descripción del Servicio <span className="text-red-400">*</span></label>
            <textarea
              name="descripcion" value={formData.descripcion} onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors resize-none"
              rows={4} placeholder="Describí tu servicio, experiencia y especialidades..." required
            />
          </div>

          {/* Galería multimedia (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fotos / Videos del trabajo
              <span className="text-gray-500 text-xs ml-2">(opcional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Podés agregar fotos o videos de trabajos anteriores, certificados, flyers, etc.
            </p>
            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a2e] border border-dashed border-[#e2b040]/30 rounded-lg text-gray-400 hover:border-[#e2b040] hover:text-gray-300 transition-colors cursor-pointer text-sm w-full">
              <i className="ri-image-add-line text-lg"></i>
              Agregar fotos o videos
              <input type="file" accept="image/*,video/*" multiple onChange={handleGaleriaChange} className="hidden" />
            </label>

            {galeriaPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {galeriaPreviews.map((item, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#e2b040]/20 bg-[#1a1a2e]">
                    {item.esVideo ? (
                      <video src={item.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={item.url} alt={`Trabajo ${i + 1}`} className="w-full h-full object-cover" />
                    )}
                    {item.esVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <i className="ri-play-circle-fill text-white text-3xl opacity-60"></i>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeGaleriaItem(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-500 transition-colors cursor-pointer"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-[#e2b040]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-loader-4-line animate-spin"></i> Registrando...
              </span>
            ) : (
              'Crear Cuenta'
            )}
          </button>

          <p className="text-center text-gray-400 text-sm">
            ¿Ya tenés cuenta?{' '}
            <button type="button" onClick={onVolverLogin} className="text-[#e2b040] hover:text-[#f0d080] font-semibold cursor-pointer">
              Iniciar sesión
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
