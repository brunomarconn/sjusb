import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

interface RegistroPrestadorProps {
  onRegistroExitoso: (dni: string) => void;
  onVolverLogin: () => void;
}

export default function RegistroPrestador({ onRegistroExitoso, onVolverLogin }: RegistroPrestadorProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    categoria: '',
    descripcion: ''
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!foto) {
      setError('La foto de perfil es obligatoria');
      return;
    }

    if (!formData.categoria) {
      setError('Debes seleccionar una categoría');
      return;
    }

    setLoading(true);

    try {
      // Verificar si el DNI ya existe
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

      // Subir foto a Supabase Storage
      const fileExt = foto.name.split('.').pop();
      const fileName = `${formData.dni}-${Date.now()}.${fileExt}`;
      const filePath = `prestadores/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fotos-prestadores')
        .upload(filePath, foto);

      if (uploadError) {
        // Si el bucket no existe, intentar crearlo
        if (uploadError.message.includes('not found')) {
          // Usar la foto de preview como fallback
          const fotoUrl = previewFoto;
          
          // Crear prestador con foto de preview
          const { error: insertError } = await supabase
            .from('prestadores')
            .insert([
              {
                nombre: formData.nombre,
                apellido: formData.apellido,
                dni: formData.dni,
                email: formData.email,
                categoria: formData.categoria,
                foto_url: fotoUrl,
                descripcion: formData.descripcion
              }
            ]);

          if (insertError) throw insertError;
          onRegistroExitoso(formData.dni);
          return;
        }
        throw uploadError;
      }

      // Obtener URL pública de la foto
      const { data: urlData } = supabase.storage
        .from('fotos-prestadores')
        .getPublicUrl(filePath);

      const fotoUrl = urlData.publicUrl;

      // Crear prestador
      const { error: insertError } = await supabase
        .from('prestadores')
        .insert([
          {
            nombre: formData.nombre,
            apellido: formData.apellido,
            dni: formData.dni,
            email: formData.email,
            categoria: formData.categoria,
            foto_url: fotoUrl,
            descripcion: formData.descripcion
          }
        ]);

      if (insertError) throw insertError;

      onRegistroExitoso(formData.dni);
    } catch (err) {
      console.error('Error al registrar:', err);
      setError('Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex items-center justify-center p-4">
      <div className="bg-[#16213e]/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-[#e2b040]/20 my-8">

        {/* Botón volver */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-[#e2b040] transition-colors mb-6 cursor-pointer"
        >
          <i className="ri-arrow-left-line"></i>
          <span className="text-sm">Volver al inicio</span>
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-xl mb-4">
            <i className="ri-briefcase-line text-3xl text-[#1a1a2e]"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Registro de Prestador</h2>
          <p className="text-gray-400">Completá tus datos para ofrecer tus servicios</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto de Perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Foto de Perfil <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-4">
              {previewFoto && (
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#e2b040]">
                  <img src={previewFoto} alt="Preview" className="w-full h-full object-cover object-top" />
                </div>
              )}
              <label className="flex-1 px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-gray-400 hover:border-[#e2b040] transition-colors cursor-pointer">
                <i className="ri-upload-cloud-line mr-2"></i>
                {foto ? foto.name : 'Seleccionar foto'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Apellido <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                DNI <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categoría <span className="text-red-400">*</span>
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white focus:outline-none focus:border-[#e2b040] transition-colors cursor-pointer"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción del Servicio <span className="text-red-400">*</span>
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e2b040] transition-colors resize-none"
              rows={4}
              placeholder="Describí tu servicio, experiencia y especialidades..."
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#e2b040] to-[#f0d080] text-[#1a1a2e] py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-[#e2b040]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>

          <button
            type="button"
            onClick={onVolverLogin}
            className="w-full text-[#e2b040] hover:text-[#f0d080] transition-colors text-sm whitespace-nowrap"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </form>
      </div>
    </div>
  );
}