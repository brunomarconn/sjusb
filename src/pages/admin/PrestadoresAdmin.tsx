import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { supabase } from '../../lib/supabase';

// ─── Constantes ────────────────────────────────────────────────
const CATEGORIAS = [
  'electricista', 'jardinero', 'piletero', 'albañil', 'bicicletero',
  'pintor', 'gasista', 'plomero', 'forrajería', 'peluquería canina',
  'mantenimiento aire acondicionado', 'impermeabilizador hogar',
  'alquiler vajilla', 'pastelería', 'cambio de baterías',
  'limpieza de tapizados', 'personal trainer', 'adiestrador de perros',
  'maestro particular', 'servicios de catering', 'carpintero',
  'cuidador canino profesional', 'limpieza de autos', 'Servicio Técnico Informático',
];

const ZONAS = [
  'Villa Allende', 'Rio Ceballos', 'Mendiolaza', 'Unquillo', 'Saldán',
];

const inp =
  'w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50 text-sm';

// ─── Tipos ─────────────────────────────────────────────────────
interface Valoracion {
  id: string;
  prestador_id?: string;
  nombre_cliente: string;
  puntuacion: number;
  comentario: string;
  created_at: string;
}

interface PrestadorAdmin {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono?: string;
  categoria: string;
  zona?: string;
  foto_url: string;
  galeria_urls?: string[] | null;
  descripcion: string;
  enabled: boolean;
  trabajos_completados: number;
  created_at: string;
  valoraciones?: Valoracion[];
}

type FormData = Omit<PrestadorAdmin, 'id' | 'created_at' | 'valoraciones'>;
type EstadoFiltro = 'todos' | 'activos' | 'pausados';
type ModalConfirm = { tipo: 'eliminar' | 'pausar' | 'activar'; prestador: PrestadorAdmin };
type GaleriaPreview = { url: string; esVideo: boolean; remote?: boolean };

const EMPTY_FORM: FormData = {
  nombre: '', apellido: '', dni: '', email: '', telefono: '',
  categoria: 'electricista', zona: '', foto_url: '', galeria_urls: null, descripcion: '',
  enabled: true, trabajos_completados: 0,
};

// ─── Helpers ───────────────────────────────────────────────────
function calcPromedio(vals?: Valoracion[]): string | null {
  if (!vals?.length) return null;
  return (vals.reduce((s, v) => s + v.puntuacion, 0) / vals.length).toFixed(1);
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url);
}

function Badge({ activo }: { activo: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activo ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
      {activo ? 'Activo' : 'Pausado'}
    </span>
  );
}

// ─── Componente principal ──────────────────────────────────────
export default function PrestadoresAdmin() {
  const [prestadores, setPrestadores] = useState<PrestadorAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos');

  // Modal crear/editar
  const [modalForm, setModalForm] = useState(false);
  const [editando, setEditando] = useState<PrestadorAdmin | null>(null);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState<string[]>([]);
  const [zonaPersonalizada, setZonaPersonalizada] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState('');
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaPreviews, setGaleriaPreviews] = useState<GaleriaPreview[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Modal valoraciones (vista detalle)
  const [modalVals, setModalVals] = useState<PrestadorAdmin | null>(null);
  const [nuevaVal, setNuevaVal] = useState({ nombre: '', puntuacion: 5, comentario: '' });
  const [enviandoVal, setEnviandoVal] = useState(false);

  // Modal confirmar acción
  const [confirmModal, setConfirmModal] = useState<ModalConfirm | null>(null);
  const [procesando, setProcesando] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Data ────────────────────────────────────────────────────
  async function obtenerPrestadoresConValoraciones(): Promise<PrestadorAdmin[]> {
    const selects = [
      'id, nombre, apellido, dni, email, telefono, categoria, zona, foto_url, galeria_urls, descripcion, enabled, trabajos_completados, created_at',
      'id, nombre, apellido, dni, email, telefono, categoria, zona, foto_url, galeria_urls, descripcion, created_at',
      'id, nombre, apellido, dni, email, categoria, foto_url, galeria_urls, descripcion, created_at',
      'id, nombre, apellido, dni, email, categoria',
    ];

    let prestadoresData: Partial<PrestadorAdmin>[] | null = null;
    let prestadoresError: unknown = null;

    for (const select of selects) {
      const result = await supabase
        .from('prestadores')
        .select(select)
        .order('created_at', { ascending: false });

      if (!result.error) {
        prestadoresData = result.data as Partial<PrestadorAdmin>[];
        prestadoresError = null;
        break;
      }

      prestadoresError = result.error;
    }

    if (prestadoresError) throw prestadoresError;

    const { data: valoracionesData, error: valoracionesError } = await supabase
      .from('valoraciones')
      .select('id, prestador_id, nombre_cliente, puntuacion, comentario, created_at')
      .order('created_at', { ascending: false });

    if (valoracionesError) throw valoracionesError;

    const valoracionesPorPrestador = new Map<string, Valoracion[]>();

    for (const valoracion of valoracionesData || []) {
      if (!valoracion.prestador_id) continue;
      const actuales = valoracionesPorPrestador.get(valoracion.prestador_id) || [];
      actuales.push(valoracion);
      valoracionesPorPrestador.set(valoracion.prestador_id, actuales);
    }

    return (prestadoresData || []).map((prestador) => ({
      ...prestador,
      telefono: prestador.telefono || '',
      zona: prestador.zona || '',
      foto_url: prestador.foto_url || '',
      galeria_urls: prestador.galeria_urls || null,
      descripcion: prestador.descripcion || '',
      enabled: prestador.enabled ?? true,
      trabajos_completados: prestador.trabajos_completados ?? 0,
      created_at: prestador.created_at || new Date(0).toISOString(),
      valoraciones: valoracionesPorPrestador.get(prestador.id) || [],
    })) as PrestadorAdmin[];
  }

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await obtenerPrestadoresConValoraciones();
      setPrestadores(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar prestadores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!modalForm) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalForm]);

  // ── Toast ────────────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const syncZonaForm = (zonas: string[]) => {
    setZonasSeleccionadas(zonas);
    setForm((prev) => ({ ...prev, zona: zonas.join(', ') }));
  };

  const toggleZona = (zona: string) => {
    const next = zonasSeleccionadas.includes(zona)
      ? zonasSeleccionadas.filter((z) => z !== zona)
      : [...zonasSeleccionadas, zona];
    syncZonaForm(next);
  };

  const agregarZonaPersonalizada = () => {
    const zona = zonaPersonalizada.trim();
    if (!zona || zonasSeleccionadas.includes(zona)) return;
    syncZonaForm([...zonasSeleccionadas, zona]);
    setZonaPersonalizada('');
  };

  const quitarZona = (zona: string) => {
    syncZonaForm(zonasSeleccionadas.filter((z) => z !== zona));
  };

  const handleFotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGaleriaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const nextPreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      esVideo: file.type.startsWith('video/'),
      remote: false,
    }));

    setGaleriaFiles((prev) => [...prev, ...files]);
    setGaleriaPreviews((prev) => [...prev, ...nextPreviews]);
    e.target.value = '';
  };

  const removeGaleriaItem = (index: number) => {
    const preview = galeriaPreviews[index];
    if (preview && !preview.remote) URL.revokeObjectURL(preview.url);

    const remoteCountBefore = galeriaPreviews.slice(0, index).filter((item) => item.remote).length;
    if (preview?.remote) {
      setForm((prev) => ({
        ...prev,
        galeria_urls: (prev.galeria_urls || []).filter((_, i) => i !== remoteCountBefore),
      }));
    } else {
      const localIndex = index - remoteCountBefore;
      setGaleriaFiles((prev) => prev.filter((_, i) => i !== localIndex));
    }

    setGaleriaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Filtrado ─────────────────────────────────────────────────
  const filtrados = prestadores.filter((p) => {
    const q = busqueda.toLowerCase();
    const matchQ =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      p.apellido.toLowerCase().includes(q) ||
      p.dni.includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      (p.zona || '').toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q);
    const activo = p.enabled !== false;
    const matchE =
      estadoFiltro === 'todos' ||
      (estadoFiltro === 'activos' ? activo : !activo);
    return matchQ && matchE;
  });

  // ── CRUD ─────────────────────────────────────────────────────
  function abrirCrear() {
    setEditando(null);
    setForm({ ...EMPTY_FORM });
    setZonasSeleccionadas([]);
    setZonaPersonalizada('');
    setFotoFile(null);
    setFotoPreview('');
    setGaleriaFiles([]);
    setGaleriaPreviews([]);
    setModalForm(true);
  }

  function abrirEditar(p: PrestadorAdmin) {
    setEditando(p);
    setForm({
      nombre: p.nombre, apellido: p.apellido, dni: p.dni,
      email: p.email, telefono: p.telefono || '',
      categoria: p.categoria, zona: p.zona || '',
      foto_url: p.foto_url, galeria_urls: p.galeria_urls || null, descripcion: p.descripcion,
      enabled: p.enabled ?? true,
      trabajos_completados: p.trabajos_completados ?? 0,
    });
    setZonasSeleccionadas(
      p.zona
        ? p.zona.split(',').map((z) => z.trim()).filter(Boolean)
        : []
    );
    setZonaPersonalizada('');
    setFotoFile(null);
    setFotoPreview(p.foto_url || '');
    setGaleriaFiles([]);
    setGaleriaPreviews(
      (p.galeria_urls || []).map((url) => ({ url, esVideo: isVideoUrl(url), remote: true }))
    );
    setModalForm(true);
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.dni.trim()) {
      showToast('Nombre, apellido y DNI son obligatorios', false);
      return;
    }
    if (zonasSeleccionadas.length === 0) {
      showToast('Seleccioná al menos una zona', false);
      return;
    }
    if (!editando && !fotoFile) {
      showToast('La foto de perfil es obligatoria', false);
      return;
    }
    setGuardando(true);
    try {
      let fotoUrl = form.foto_url?.trim() || '';

      if (fotoFile) {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `${form.dni.trim()}-${Date.now()}.${fileExt}`;
        const filePath = `prestadores/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('fotos-prestadores')
          .upload(filePath, fotoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('fotos-prestadores')
          .getPublicUrl(filePath);

        fotoUrl = urlData.publicUrl;
      }

      const galeriaUrls = [...(form.galeria_urls || [])];
      for (const file of galeriaFiles) {
        const ext = file.name.split('.').pop();
        const galeriaPath = `prestadores/galeria/${form.dni.trim()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: galeriaErr } = await supabase.storage
          .from('fotos-prestadores')
          .upload(galeriaPath, file);

        if (galeriaErr) throw galeriaErr;

        const { data: galeriaUrlData } = supabase.storage
          .from('fotos-prestadores')
          .getPublicUrl(galeriaPath);

        galeriaUrls.push(galeriaUrlData.publicUrl);
      }

      const payload = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        email: form.email.trim(),
        telefono: form.telefono?.trim() || null,
        categoria: form.categoria,
        zona: zonasSeleccionadas.join(', '),
        foto_url: fotoUrl,
        galeria_urls: galeriaUrls.length ? galeriaUrls : null,
        descripcion: form.descripcion?.trim() || '',
        enabled: form.enabled,
        trabajos_completados: editando ? Number(form.trabajos_completados) || 0 : 0,
      };

      if (editando) {
        const { error: err } = await supabase.from('prestadores').update(payload).eq('id', editando.id);
        if (err) throw err;
        showToast('Prestador actualizado correctamente ✓');
      } else {
        const password = form.dni.trim();
        const { error: err } = await supabase.from('prestadores').insert([{ ...payload, password }]);
        if (err) throw err;
        showToast('Prestador creado correctamente ✓');
      }

      setModalForm(false);
      setFotoFile(null);
      setFotoPreview('');
      setGaleriaFiles([]);
      setGaleriaPreviews([]);
      setZonaPersonalizada('');
      await cargar();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al guardar', false);
    } finally {
      setGuardando(false);
    }
  }

  async function ejecutarAccion() {
    if (!confirmModal) return;
    setProcesando(true);
    try {
      const { tipo, prestador } = confirmModal;
      if (tipo === 'eliminar') {
        const { error: err } = await supabase.from('prestadores').delete().eq('id', prestador.id);
        if (err) throw err;
        showToast('Prestador eliminado');
        if (modalVals?.id === prestador.id) setModalVals(null);
      } else {
        const nuevoEstado = tipo === 'activar';
        const { error: err } = await supabase.from('prestadores').update({ enabled: nuevoEstado }).eq('id', prestador.id);
        if (err) throw err;
        showToast(nuevoEstado ? 'Prestador reactivado ✓' : 'Prestador pausado');
      }
      setConfirmModal(null);
      await cargar();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', false);
    } finally {
      setProcesando(false);
    }
  }

  async function agregarValoracion(prestadorId: string) {
    if (!nuevaVal.nombre.trim() || !nuevaVal.comentario.trim()) {
      showToast('Nombre y comentario son obligatorios', false);
      return;
    }
    setEnviandoVal(true);
    try {
      const { error: err } = await supabase.from('valoraciones').insert([{
        prestador_id: prestadorId,
        cliente_email: 'admin@mrsservicios.com',
        nombre_cliente: nuevaVal.nombre.trim(),
        puntuacion: nuevaVal.puntuacion,
        comentario: nuevaVal.comentario.trim(),
      }]);
      if (err) throw err;
      showToast('Valoración agregada ✓');
      setNuevaVal({ nombre: '', puntuacion: 5, comentario: '' });
      const updatedPrestadores = await obtenerPrestadoresConValoraciones();
      setPrestadores(updatedPrestadores);
      // Actualizar el modal con los datos frescos
      const updated = updatedPrestadores.find(p => p.id === prestadorId);
      if (updated) setModalVals(updated);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al agregar valoración', false);
    } finally {
      setEnviandoVal(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          <i className={toast.ok ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'}></i>
          {toast.msg}
        </div>
      )}

      {/* ── Cabecera ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Gestión de Prestadores</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtrados.length} de {prestadores.length} prestadores
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold text-sm hover:bg-[#e2b040]/90 transition-colors"
        >
          <i className="ri-user-add-line"></i>
          Nuevo prestador
        </button>
      </div>

      {/* ── Barra de búsqueda y filtros ── */}
      <div className="bg-[#16213e] border border-white/10 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[180px] relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"></i>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre, DNI, categoría, zona..."
            className={`${inp} pl-9`}
            style={{ fontSize: '16px' }}
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {(['todos', 'activos', 'pausados'] as EstadoFiltro[]).map((e) => (
            <button
              key={e}
              onClick={() => setEstadoFiltro(e)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${estadoFiltro === e ? 'bg-[#e2b040] text-[#1a1a2e]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              {e}
            </button>
          ))}
        </div>

        <button
          onClick={cargar}
          title="Actualizar"
          className="p-2.5 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 transition-colors"
        >
          <i className="ri-refresh-line"></i>
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <i className="ri-error-warning-line text-red-400 text-xl shrink-0"></i>
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={cargar} className="text-sm text-red-400 underline whitespace-nowrap">Reintentar</button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="text-center py-16">
          <i className="ri-loader-4-line animate-spin text-3xl text-[#e2b040]"></i>
          <p className="text-gray-500 text-sm mt-3">Cargando prestadores...</p>
        </div>
      )}

      {/* ── Lista ── */}
      {!loading && !error && (
        filtrados.length === 0 ? (
          <div className="text-center py-16">
            <i className="ri-user-search-line text-4xl text-gray-600 mb-3 block"></i>
            <p className="text-gray-500 text-sm">No se encontraron prestadores</p>
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="mt-3 text-xs text-[#e2b040] underline">
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((p) => {
              const activo = p.enabled !== false;
              const promedio = calcPromedio(p.valoraciones);
              return (
                <div
                  key={p.id}
                  className={`bg-[#16213e] border rounded-2xl p-4 transition-all ${activo ? 'border-white/10' : 'border-yellow-500/20'}`}
                >
                  {/* Fila principal */}
                  <div className="flex items-start gap-3">
                    {/* Foto */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#1a1a2e] shrink-0 border border-white/10">
                      {p.foto_url ? (
                        <img src={p.foto_url} alt="" className="w-full h-full object-cover object-center" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="ri-user-line text-2xl text-gray-600"></i>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <h3 className="text-white font-bold text-sm sm:text-base leading-tight">
                          {p.nombre} {p.apellido}
                        </h3>
                        <Badge activo={activo} />
                      </div>

                      <p className="text-[#e2b040] text-xs font-medium capitalize mb-1">{p.categoria}</p>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        <span className="text-gray-500 text-xs"><i className="ri-fingerprint-line mr-0.5"></i>{p.dni}</span>
                        {p.zona && <span className="text-gray-500 text-xs"><i className="ri-map-pin-line mr-0.5"></i>{p.zona}</span>}
                        {p.telefono && <span className="text-gray-500 text-xs"><i className="ri-phone-line mr-0.5"></i>{p.telefono}</span>}
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {promedio ? (
                          <span className="text-xs">
                            <i className="ri-star-fill text-[#e2b040] mr-0.5"></i>
                            <span className="text-[#e2b040] font-semibold">{promedio}</span>
                            <span className="text-gray-600 ml-1">({p.valoraciones?.length} valoraciones)</span>
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">Sin valoraciones</span>
                        )}
                        {p.trabajos_completados > 0 && (
                          <span className="text-gray-500 text-xs">
                            <i className="ri-briefcase-line mr-0.5"></i>{p.trabajos_completados} trabajos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/5 text-gray-300 rounded-xl text-xs sm:text-sm hover:bg-white/10 transition-colors"
                    >
                      <i className="ri-edit-line"></i>Editar
                    </button>

                    <button
                      onClick={() => { setModalVals(p); setNuevaVal({ nombre: '', puntuacion: 5, comentario: '' }); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#e2b040]/10 text-[#e2b040] rounded-xl text-xs sm:text-sm hover:bg-[#e2b040]/20 transition-colors"
                    >
                      <i className="ri-star-line"></i>Valoraciones
                    </button>

                    <button
                      onClick={() => setConfirmModal({ tipo: activo ? 'pausar' : 'activar', prestador: p })}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors ${activo ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                    >
                      <i className={activo ? 'ri-pause-circle-line' : 'ri-play-circle-line'}></i>
                      {activo ? 'Pausar' : 'Activar'}
                    </button>

                    <button
                      onClick={() => setConfirmModal({ tipo: 'eliminar', prestador: p })}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs sm:text-sm hover:bg-red-500/20 transition-colors ml-auto"
                    >
                      <i className="ri-delete-bin-line"></i>Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ═══════════════════════════════════════
          MODAL: Crear / Editar prestador
      ═══════════════════════════════════════ */}
      {modalForm && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50"
          onClick={() => !guardando && setModalForm(false)}
        >
          <div
            className="bg-[#16213e] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#16213e] border-b border-white/10 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="text-white font-bold text-lg">
                {editando ? 'Editar prestador' : 'Nuevo prestador'}
              </h3>
              <button onClick={() => setModalForm(false)} className="p-2 text-gray-500 hover:text-white">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="max-h-[calc(92vh-73px)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="p-5 sm:p-6 space-y-5">

              {/* Foto archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Foto de Perfil {!editando && <span className="text-red-400">*</span>}
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {fotoPreview ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#e2b040] shrink-0 mx-auto sm:mx-0">
                      <img src={fotoPreview} alt="" className="w-full h-full object-cover object-top" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#1a1a2e] border-2 border-dashed border-[#e2b040]/40 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                      <i className="ri-user-line text-2xl text-gray-500"></i>
                    </div>
                  )}
                  <label className="flex-1 min-h-[72px] px-4 py-4 bg-[#1a1a2e] border border-[#e2b040]/30 rounded-xl text-gray-300 hover:border-[#e2b040] transition-colors cursor-pointer text-sm flex items-center">
                    <i className="ri-upload-cloud-line mr-2 text-base shrink-0"></i>
                    <span className="truncate">
                      {fotoFile ? fotoFile.name : (editando ? 'Seleccionar nueva foto (opcional)' : 'Seleccionar foto (obligatoria)')}
                    </span>
                    <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Nombre + Apellido */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Nombre <span className="text-red-400">*</span></label>
                  <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Juan" className={inp} style={{ fontSize: '16px' }} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Apellido <span className="text-red-400">*</span></label>
                  <input value={form.apellido} onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
                    placeholder="Pérez" className={inp} style={{ fontSize: '16px' }} />
                </div>
              </div>

              {/* DNI + Email */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">DNI <span className="text-red-400">*</span></label>
                  <input value={form.dni} onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))}
                    placeholder="12345678" className={inp} style={{ fontSize: '16px' }} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="juan@email.com" className={inp} style={{ fontSize: '16px' }} />
                </div>
              </div>

              {/* Teléfono + Categoría */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Teléfono / WhatsApp</label>
                  <input value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                    placeholder="5493512345678" className={inp} style={{ fontSize: '16px' }} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Categoría</label>
                  <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                    className={inp} style={{ fontSize: '16px' }}>
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Zona */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Zona de Trabajo <span className="text-red-400">*</span>
                  <span className="text-gray-500 ml-1 font-normal">(podés elegir varias)</span>
                </label>
                <div className="rounded-xl border border-[#e2b040]/30 bg-[#1f2a4d] p-3 space-y-3">
                  <div className="flex flex-wrap gap-2.5">
                    {ZONAS.map((zona) => {
                      const activa = zonasSeleccionadas.includes(zona);
                      return (
                        <button
                          key={zona}
                          type="button"
                          onClick={() => toggleZona(zona)}
                          className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                            activa
                              ? 'bg-[#e2b040]/20 text-[#e2b040] border-[#e2b040]'
                              : 'bg-transparent text-gray-300 border-[#e2b040]/40 hover:border-[#e2b040]'
                          }`}
                        >
                          {zona}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={zonaPersonalizada}
                      onChange={(e) => setZonaPersonalizada(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          agregarZonaPersonalizada();
                        }
                      }}
                      placeholder="Otra zona (escribí y presioná +)"
                      className={`${inp} border-[#e2b040]/20`}
                      style={{ fontSize: '16px' }}
                    />
                    <button
                      type="button"
                      onClick={agregarZonaPersonalizada}
                      className="w-11 shrink-0 rounded-xl bg-[#6b5635] text-[#f3d37a] hover:bg-[#7a6440] transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {zonasSeleccionadas.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {zonasSeleccionadas.map((zona) => (
                        <span key={zona} className="flex items-center gap-1 px-3 py-1 bg-[#e2b040]/20 text-[#e2b040] rounded-full text-sm">
                          {zona}
                          <button type="button" onClick={() => quitarZona(zona)} className="text-[#e2b040] hover:text-white">
                            <i className="ri-close-line"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={3}
                  placeholder="Descripción del servicio que ofrece..."
                  className={`${inp} resize-none`}
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* ContraseÃ±a inicial + Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Fotos / Videos del trabajo
                  <span className="text-gray-500 ml-1 font-normal">(opcional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  PodÃ©s agregar fotos o videos de trabajos anteriores, certificados o flyers.
                </p>
                <label className="flex items-center justify-center gap-2 min-h-[52px] px-4 py-3 border border-[#e2b040]/30 border-dashed rounded-xl bg-[#1a1a2e] text-gray-300 hover:border-[#e2b040] transition-colors cursor-pointer text-sm">
                  <i className="ri-image-add-line text-base"></i>
                  <span>Agregar fotos o videos</span>
                  <input type="file" accept="image/*,video/*" multiple onChange={handleGaleriaChange} className="hidden" />
                </label>

                {galeriaPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    {galeriaPreviews.map((item, index) => (
                      <div key={`${item.url}-${index}`} className="relative rounded-xl overflow-hidden border border-white/10 bg-[#1a1a2e] aspect-square">
                        {item.esVideo ? (
                          <video src={item.url} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeGaleriaItem(index)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white hover:bg-red-500/80 transition-colors"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                {/*
                <div>
                    <label className="block text-xs text-gray-400 mb-1.5">ContraseÃ±a inicial</label>
                    <input
                      placeholder="Si lo dejÃ¡s vacÃ­o se usarÃ¡ el DNI"
                  </div>
                */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Estado</label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
                    className="flex items-center gap-3 w-full px-3 py-2.5 bg-[#1a1a2e] border border-white/10 rounded-xl hover:border-[#e2b040]/30 transition-colors"
                  >
                    <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${form.enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                    </div>
                    <span className={`text-sm font-medium ${form.enabled ? 'text-green-400' : 'text-gray-500'}`}>
                      {form.enabled ? 'Activo' : 'Pausado'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModalForm(false)}
                  disabled={guardando}
                  className="flex-1 py-3 bg-white/5 text-gray-300 rounded-xl text-sm hover:bg-white/10 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  disabled={guardando}
                  className="flex-1 py-3 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold text-sm hover:bg-[#e2b040]/90 transition-colors disabled:opacity-60"
                >
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear prestador'}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MODAL: Valoraciones
      ═══════════════════════════════════════ */}
      {modalVals && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={() => setModalVals(null)}
        >
          <div
            className="bg-[#16213e] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[94vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#16213e] border-b border-white/10 px-5 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-white font-bold">Valoraciones</h3>
                <p className="text-xs text-gray-500">{modalVals.nombre} {modalVals.apellido}</p>
              </div>
              <button onClick={() => setModalVals(null)} className="p-2 text-gray-500 hover:text-white">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Agregar nueva valoración */}
              <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-[#e2b040]">
                  <i className="ri-add-circle-line mr-1.5"></i>Agregar valoración manual
                </h4>
                <input
                  value={nuevaVal.nombre}
                  onChange={(e) => setNuevaVal((v) => ({ ...v, nombre: e.target.value }))}
                  placeholder="Nombre del cliente"
                  className={inp}
                  style={{ fontSize: '16px' }}
                />
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Puntuación: {nuevaVal.puntuacion} ★</label>
                  <input
                    type="range" min={1} max={5} step={1}
                    value={nuevaVal.puntuacion}
                    onChange={(e) => setNuevaVal((v) => ({ ...v, puntuacion: Number(e.target.value) }))}
                    className="w-full accent-[#e2b040]"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                    {[1, 2, 3, 4, 5].map((n) => <span key={n}>{n}★</span>)}
                  </div>
                </div>
                <textarea
                  value={nuevaVal.comentario}
                  onChange={(e) => setNuevaVal((v) => ({ ...v, comentario: e.target.value }))}
                  placeholder="Comentario sobre el servicio..."
                  rows={2}
                  className={`${inp} resize-none`}
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={() => agregarValoracion(modalVals.id)}
                  disabled={enviandoVal}
                  className="w-full py-2.5 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold text-sm hover:bg-[#e2b040]/90 transition-colors disabled:opacity-60"
                >
                  {enviandoVal ? 'Guardando...' : 'Agregar valoración'}
                </button>
              </div>

              {/* Lista de valoraciones existentes */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Valoraciones existentes ({modalVals.valoraciones?.length || 0})
                </h4>
                {!modalVals.valoraciones?.length ? (
                  <p className="text-center text-gray-600 text-sm py-6">Este prestador aún no tiene valoraciones</p>
                ) : (
                  <div className="space-y-2">
                    {[...(modalVals.valoraciones || [])].reverse().map((v) => (
                      <div key={v.id} className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-sm font-semibold">{v.nombre_cliente}</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <i key={s} className={`text-xs ${s <= v.puntuacion ? 'ri-star-fill text-[#e2b040]' : 'ri-star-line text-gray-600'}`}></i>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed">{v.comentario}</p>
                        <p className="text-gray-600 text-xs mt-1">{new Date(v.created_at).toLocaleDateString('es-AR')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MODAL: Confirmar acción
      ═══════════════════════════════════════ */}
      {confirmModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => !procesando && setConfirmModal(null)}
        >
          <div
            className="bg-[#16213e] border border-white/10 rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ícono */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              confirmModal.tipo === 'eliminar' ? 'bg-red-500/15' :
              confirmModal.tipo === 'pausar' ? 'bg-yellow-500/15' : 'bg-green-500/15'
            }`}>
              <i className={`text-3xl ${
                confirmModal.tipo === 'eliminar' ? 'ri-delete-bin-line text-red-400' :
                confirmModal.tipo === 'pausar' ? 'ri-pause-circle-line text-yellow-400' :
                'ri-play-circle-line text-green-400'
              }`}></i>
            </div>

            <h3 className="text-white font-bold text-center text-lg mb-2">
              {confirmModal.tipo === 'eliminar' ? '¿Eliminar prestador?' :
               confirmModal.tipo === 'pausar' ? '¿Pausar prestador?' : '¿Reactivar prestador?'}
            </h3>

            <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
              {confirmModal.tipo === 'eliminar'
                ? `Se eliminará definitivamente a ${confirmModal.prestador.nombre} ${confirmModal.prestador.apellido} y todos sus datos. Esta acción no se puede deshacer.`
                : confirmModal.tipo === 'pausar'
                  ? `${confirmModal.prestador.nombre} dejará de aparecer en la búsqueda pública. Podés reactivarlo cuando quieras.`
                  : `${confirmModal.prestador.nombre} volverá a ser visible en la búsqueda pública.`}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={procesando}
                className="flex-1 py-3 bg-white/5 text-gray-300 rounded-xl text-sm hover:bg-white/10 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarAccion}
                disabled={procesando}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 ${
                  confirmModal.tipo === 'eliminar' ? 'bg-red-500 text-white hover:bg-red-600' :
                  confirmModal.tipo === 'pausar' ? 'bg-yellow-500 text-[#1a1a2e] hover:bg-yellow-400' :
                  'bg-green-500 text-white hover:bg-green-400'
                }`}
              >
                {procesando ? 'Procesando...' :
                 confirmModal.tipo === 'eliminar' ? 'Sí, eliminar' :
                 confirmModal.tipo === 'pausar' ? 'Sí, pausar' : 'Sí, activar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
