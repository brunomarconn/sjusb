import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AppHeader from '../../components/AppHeader';
import serviciosDeCateringImg from '../../../images/serviciosdecatering.png';
import servicioTecnicoInformaticoImg from '../../../images/serviciotecnicoinformatico.png';
import tecnicoElectrodomesticosImg from '../../../images/tecnicoelectrodomesticos.jpeg';
import modistaImg from '../../../images/modista.jpeg';
import herreriaImg from '../../../images/herreria.png';

const servicios = [
  {
    nombre: 'Electricista',
    categoria: 'electricista',
    icono: 'ri-flashlight-line',
    imagen:
      'https://readdy.ai/api/search-image?query=professional%20electrician%20working%20on%20electrical%20panel%20wiring%20tools%20belt%20dark%20background%20warm%20lighting%20close%20up%20hands%20working&width=400&height=260&seq=serv01&orientation=landscape',
  },
  {
    nombre: 'Jardinero',
    categoria: 'jardinero',
    icono: 'ri-plant-line',
    imagen:
      'https://readdy.ai/api/search-image?query=professional%20gardener%20trimming%20green%20plants%20garden%20tools%20lush%20greenery%20outdoor%20natural%20light&width=400&height=260&seq=serv02&orientation=landscape',
  },
  {
    nombre: 'Piletero',
    categoria: 'piletero',
    icono: 'ri-water-flash-line',
    imagen:
      'https://readdy.ai/api/search-image?query=pool%20technician%20cleaning%20swimming%20pool%20blue%20water%20maintenance%20equipment%20sunny%20day&width=400&height=260&seq=serv03&orientation=landscape',
  },
  {
    nombre: 'Albañil',
    categoria: 'albañil',
    icono: 'ri-building-2-line',
    imagen:
      'https://readdy.ai/api/search-image?query=construction%20worker%20bricklayer%20building%20wall%20cement%20bricks%20professional%20work%20site%20helmet&width=400&height=260&seq=serv04&orientation=landscape',
  },
  {
    nombre: 'Bicicletero',
    categoria: 'bicicletero',
    icono: 'ri-bike-line',
    imagen:
      'https://readdy.ai/api/search-image?query=bicycle%20mechanic%20repairing%20bike%20wheel%20tools%20workshop%20close%20up%20hands%20working%20chain&width=400&height=260&seq=serv05&orientation=landscape',
  },
  {
    nombre: 'Pintor',
    categoria: 'pintor',
    icono: 'ri-paint-brush-line',
    imagen:
      'https://readdy.ai/api/search-image?query=professional%20painter%20painting%20wall%20roller%20brush%20white%20paint%20interior%20room%20clean%20work&width=400&height=260&seq=serv06&orientation=landscape',
  },
  {
    nombre: 'Gasista',
    categoria: 'gasista',
    icono: 'ri-fire-line',
    imagen:
      'https://readdy.ai/api/search-image?query=gas%20technician%20installing%20gas%20pipes%20boiler%20professional%20uniform%20tools%20indoor%20work&width=400&height=260&seq=serv07&orientation=landscape',
  },
  {
    nombre: 'Plomero',
    categoria: 'plomero',
    icono: 'ri-drop-line',
    imagen:
      'https://readdy.ai/api/search-image?query=plumber%20fixing%20pipes%20under%20sink%20wrench%20tools%20professional%20work%20bathroom%20close%20up&width=400&height=260&seq=serv08&orientation=landscape',
  },
  {
    nombre: 'Modista',
    categoria: 'modista',
    icono: 'ri-scissors-line',
    imagen: modistaImg,
  },
  {
    nombre: 'Peluquería Canina',
    categoria: 'peluquería canina',
    icono: 'ri-scissors-line',
    imagen:
      'https://readdy.ai/api/search-image?query=professional%20dog%20groomer%20grooming%20cute%20dog%20scissors%20comb%20pet%20salon%20clean%20background&width=400&height=260&seq=serv10&orientation=landscape',
  },
  {
    nombre: 'Servicio Técnico de Electrodomésticos',
    categoria: 'Servicio Técnico de Electrodomésticos',
    icono: 'ri-temp-cold-line',
    imagen: tecnicoElectrodomesticosImg,
  },
  {
    nombre: 'Impermeabilizador',
    categoria: 'impermeabilizador hogar',
    icono: 'ri-home-gear-line',
    imagen:
      'https://readdy.ai/api/search-image?query=worker%20applying%20waterproofing%20membrane%20roof%20terrace%20professional%20equipment%20protective%20gear%20outdoor&width=400&height=260&seq=serv12&orientation=landscape',
  },
  {
    nombre: 'Alquiler Vajilla',
    categoria: 'alquiler vajilla',
    icono: 'ri-restaurant-line',
    imagen:
      'https://readdy.ai/api/search-image?query=elegant%20tableware%20rental%20plates%20glasses%20cutlery%20event%20catering%20white%20background%20arranged%20neatly&width=400&height=260&seq=serv13&orientation=landscape',
  },
  {
    nombre: 'Pastelería',
    categoria: 'pastelería',
    icono: 'ri-cake-line',
    imagen:
      'https://readdy.ai/api/search-image?query=professional%20pastry%20chef%20decorating%20beautiful%20cake%20bakery%20kitchen%20warm%20light%20elegant%20desserts&width=400&height=260&seq=serv14&orientation=landscape',
  },
  {
    nombre: 'Herrería',
    categoria: 'herrería',
    icono: 'ri-hammer-line',
    imagen: herreriaImg,
  },
  {
    nombre: 'Limpieza Tapizados',
    categoria: 'limpieza de tapizados',
    icono: 'ri-brush-line',
    imagen:
      'https://readdy.ai/api/search-image?query=professional%20upholstery%20cleaning%20sofa%20steam%20cleaner%20foam%20clean%20fabric%20indoor%20service&width=400&height=260&seq=serv16&orientation=landscape',
  },
  {
    nombre: 'Personal Trainer',
    categoria: 'personal trainer',
    icono: 'ri-run-line',
    imagen:
      'https://readdy.ai/api/search-image?query=personal%20trainer%20coaching%20client%20gym%20workout%20fitness%20professional%20athletic%20indoor%20training%20session&width=400&height=260&seq=serv17&orientation=landscape',
  },
  {
    nombre: 'Adiestrador de Perros',
    categoria: 'adiestrador de perros',
    icono: 'ri-footprint-line',
    imagen:
      'https://readdy.ai/api/search-image?query=professional%20dog%20trainer%20training%20obedient%20dog%20outdoor%20park%20leash%20command%20session&width=400&height=260&seq=serv18&orientation=landscape',
  },
  {
    nombre: 'Maestro Particular',
    categoria: 'maestro particular',
    icono: 'ri-book-open-line',
    imagen:
      'https://readdy.ai/api/search-image?query=private%20tutor%20teacher%20teaching%20student%20desk%20books%20notebook%20indoor%20warm%20light%20education%20session&width=400&height=260&seq=serv19&orientation=landscape',
  },
  {
    nombre: 'Cuidador Canino',
    categoria: 'cuidador canino profesional',
    icono: 'ri-heart-pulse-line',
    imagen:
      'https://public.readdy.ai/ai/img_res/edited_81aee2d504b5545fb0951692e26fa9cd_4d001ac4.jpg',
  },
  {
    nombre: 'Limpieza de Autos',
    categoria: 'limpieza de autos',
    icono: 'ri-car-line',
    imagen:
      'https://readdy.ai/api/search-image?query=professional%20car%20detailing%20washing%20cleaning%20shiny%20vehicle%20foam%20soap%20water%20outdoor%20service%20center%20bright%20daylight&width=400&height=260&seq=serv21&orientation=landscape',
  },
  {
    nombre: 'Carpintero',
    categoria: 'carpintero',
    icono: 'ri-hammer-line',
    imagen:
      'https://readdy.ai/api/search-image?query=professional%20carpenter%20woodworking%20workshop%20crafting%20furniture%20wood%20tools%20sawdust%20warm%20light%20close%20up%20hands%20working&width=400&height=260&seq=serv22&orientation=landscape',
  },
  {
    nombre: 'Servicios de Catering',
    categoria: 'servicios de catering',
    icono: 'ri-restaurant-2-line',
    imagen: serviciosDeCateringImg,
  },
  {
    nombre: 'Servicio Técnico Informático',
    categoria: 'Servicio Técnico Informático',
    icono: 'ri-computer-line',
    imagen: servicioTecnicoInformaticoImg,
  },
];

const pasos = [
  {
    numero: '01',
    icono: 'ri-search-eye-line',
    titulo: 'Buscá tu servicio',
    descripcion: 'Explorá las categorías disponibles y encontrá el profesional que necesitás en segundos.',
  },
  {
    numero: '02',
    icono: 'ri-user-star-line',
    titulo: 'Elegí tu prestador',
    descripcion: 'Revisá perfiles, valoraciones y experiencia de cada profesional verificado.',
  },
  {
    numero: '03',
    icono: 'ri-whatsapp-line',
    titulo: 'Contactá por WhatsApp',
    descripcion: 'Coordiná directamente con el prestador de forma rápida y sin intermediarios.',
  },
  {
    numero: '04',
    icono: 'ri-star-smile-line',
    titulo: 'Valorá la experiencia',
    descripcion: 'Dejá tu opinión y ayudá a otros usuarios a elegir el mejor profesional.',
  },
];

const chipsPopulares = [
  { label: 'Jardinero', cat: 'jardinero' },
  { label: 'Plomero', cat: 'plomero' },
  { label: 'Electricista', cat: 'electricista' },
  { label: 'Gasista', cat: 'gasista' },
  { label: 'Pintor', cat: 'pintor' },
  { label: 'Albañil', cat: 'albañil' },
  { label: 'Peluquería Canina', cat: 'peluquería canina' },
];

const aliasesBusqueda: Record<string, string[]> = {
  'limpieza de autos': ['lavado', 'lavadero', 'lavado de autos', 'limpieza auto', 'limpieza de auto', 'car detailing', 'detailing'],
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function servicioCoincideBusqueda(
  servicio: { nombre: string; categoria: string },
  busqueda: string
): boolean {
  const texto = normalizeText(busqueda);
  if (!texto) return false;

  const aliases = aliasesBusqueda[servicio.categoria] || [];
  const haystack = normalizeText([
    servicio.nombre,
    servicio.categoria,
    ...aliases,
  ].join(' '));

  return haystack.includes(texto);
}

export default function Inicio() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const sugerencias = busqueda.trim()
    ? servicios
        .filter((s) => servicioCoincideBusqueda(s, busqueda))
        .slice(0, 5)
    : [];

  useEffect(() => {
    const handleScroll = () => {
      try {
        setScrolled(window.scrollY > 50);
      } catch (e) {
        console.error('Scroll handling error:', e);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleServicioClick = (categoria: string) => {
    if (!categoria) return;
    navigate(`/usuarios?categoria=${encodeURIComponent(categoria)}`);
  };

  const handleBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    if (busqueda.trim()) {
      navigate(`/usuarios?q=${encodeURIComponent(busqueda.trim())}`);
    } else {
      navigate('/usuarios');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      <AppHeader
        transparent
        scrolled={scrolled}
        onQuienesSomos={() => document.getElementById('quienes-somos')?.scrollIntoView({ behavior: 'smooth' })}
      />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <video
            src="https://public.readdy.ai/ai/video_res/6ca4d4bd-47d2-4a18-b5fc-a298faa3b12f.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e]/80 via-[#1a1a2e]/65 to-[#1a1a2e]"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-[#e2b040]/10 via-transparent to-transparent"></div>
        </div>

        <div className="relative w-full max-w-3xl mx-auto text-center px-4 sm:px-6 pt-24 pb-6">
          {/* Badge */}
          <div className="mb-4 sm:mb-5">
            <span className="inline-block px-3 sm:px-4 py-1 bg-[#e2b040]/20 border border-[#e2b040]/40 text-[#e2b040] rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase">
              Prestadores verificados · Córdoba
            </span>
          </div>

          {/* Title — escalado para 320 px → 430 px → desktop */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight">
            ¿Qué servicio<br />
            <span className="text-[#e2b040]">necesitás?</span>
          </h1>

          <p className="text-gray-300 text-sm sm:text-lg max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
            Buscá prestadores verificados en Córdoba y contactalos por WhatsApp.
          </p>

          {/* Search bar — 16 px mínimo para evitar zoom en iOS */}
          <form onSubmit={handleBusqueda} className="flex gap-2 max-w-xl mx-auto mb-4 sm:mb-5">
            <div className="flex-1 relative">
              <i className="ri-search-line absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg pointer-events-none z-10"></i>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setMostrarSugerencias(true); }}
                onFocus={() => setMostrarSugerencias(true)}
                onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
                placeholder="Buscar servicio, prestador, zona..."
                autoComplete="off"
                className="w-full pl-10 sm:pl-11 pr-4 py-3.5 sm:py-4 bg-white/10 backdrop-blur-sm border border-[#e2b040]/40 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#e2b040] transition-colors text-base"
                style={{ fontSize: '16px' /* evita zoom en iOS Safari */ }}
              />
              {/* Sugerencias */}
              {mostrarSugerencias && sugerencias.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#16213e] border border-[#e2b040]/20 rounded-2xl shadow-2xl z-30 overflow-hidden">
                  {sugerencias.map((s) => (
                    <button
                      key={s.categoria}
                      type="button"
                      onMouseDown={() => {
                        navigate(`/usuarios?categoria=${encodeURIComponent(s.categoria)}`);
                        setMostrarSugerencias(false);
                      }}
                      className="w-full text-left px-4 sm:px-5 py-3 text-sm text-gray-300 hover:bg-[#e2b040]/10 hover:text-[#f0d080] transition-colors flex items-center gap-3 cursor-pointer min-h-[48px]"
                    >
                      <div className="w-7 h-7 flex items-center justify-center bg-[#e2b040]/15 rounded-lg shrink-0">
                        <i className={`${s.icono} text-[#e2b040] text-sm`}></i>
                      </div>
                      {s.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Botón: ícono solo en xs, texto en sm+ */}
            <button
              type="submit"
              className="min-w-[48px] min-h-[48px] px-3 sm:px-6 py-3.5 sm:py-4 bg-[#e2b040] text-[#1a1a2e] rounded-2xl font-bold hover:bg-[#f0d080] transition-all shadow-lg shadow-[#e2b040]/30 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              aria-label="Buscar"
            >
              <i className="ri-search-line text-lg sm:hidden"></i>
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </form>

          {/* Quick chips — scroll horizontal en mobile si no caben */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 sm:mb-10 px-1">
            {chipsPopulares.map((chip) => (
              <button
                key={chip.cat}
                onClick={() => navigate(`/usuarios?categoria=${encodeURIComponent(chip.cat)}`)}
                className="min-h-[40px] px-3 sm:px-4 py-2 bg-white/10 border border-white/20 text-white rounded-full text-sm font-medium hover:bg-[#e2b040]/20 hover:border-[#e2b040]/60 hover:text-[#f0d080] transition-all cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Scroll indicator */}
          <div
            className="flex flex-col items-center animate-bounce cursor-pointer"
            onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="text-gray-400 text-xs tracking-widest uppercase mb-2">Todos los servicios</span>
            <div className="w-10 h-10 flex items-center justify-center border border-[#e2b040]/40 rounded-full">
              <i className="ri-arrow-down-line text-[#e2b040] text-xl"></i>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section id="servicios" className="py-10 sm:py-16 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 text-center">
            Nuestros Servicios
          </h2>
          <p className="text-gray-400 text-center text-sm mb-6 sm:mb-10">
            Tocá cualquier servicio para ver los prestadores disponibles
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
            {servicios.map((servicio) => (
              <button
                key={servicio.categoria}
                onClick={() => handleServicioClick(servicio.categoria)}
                className="group relative bg-[#16213e]/60 rounded-2xl border border-[#e2b040]/20 overflow-hidden hover:border-[#e2b040]/60 active:scale-95 transition-all duration-300 hover:shadow-xl hover:shadow-[#e2b040]/10 hover:scale-[1.03] cursor-pointer text-left min-h-[120px]"
              >
                <div className="w-full h-24 sm:h-40 overflow-hidden relative">
                  <img
                    src={servicio.imagen}
                    alt={servicio.nombre}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/80 via-transparent to-transparent"></div>
                </div>
                <div className="p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2 min-h-[44px]">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#e2b040]/20 rounded-lg shrink-0">
                    <i className={`${servicio.icono} text-[#e2b040] text-sm sm:text-base`}></i>
                  </div>
                  <span className="text-white font-semibold text-xs sm:text-sm leading-tight group-hover:text-[#f0d080] transition-colors flex-1 line-clamp-2">
                    {servicio.nombre}
                  </span>
                  <i className="ri-arrow-right-line text-[#e2b040]/50 group-hover:text-[#e2b040] transition-colors text-sm shrink-0 hidden sm:block"></i>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="como-funciona" className="py-12 sm:py-20 px-4 sm:px-6 bg-[#16213e]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <span className="inline-block px-4 py-1 bg-[#e2b040]/15 text-[#e2b040] rounded-full text-xs sm:text-sm font-semibold mb-3 tracking-wide uppercase">
              Simple y rápido
            </span>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
              Un proceso simple y transparente para conectarte con el profesional ideal
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-16">
            {pasos.map((paso, idx) => (
              <div
                key={paso.numero}
                className="relative bg-gradient-to-b from-[#1a1a2e]/90 to-[#16213e]/80 rounded-2xl border border-[#e2b040]/25 p-4 sm:p-7 flex flex-col items-center text-center hover:border-[#e2b040]/70 transition-all duration-300 group"
              >
                {idx < pasos.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-3 z-10">
                    <i className="ri-arrow-right-line text-[#e2b040]/40 text-xl"></i>
                  </div>
                )}
                <span className="text-[#e2b040]/15 text-5xl sm:text-6xl font-black absolute top-2 right-3 sm:top-3 sm:right-4 leading-none select-none">
                  {paso.numero}
                </span>
                <div className="w-11 h-11 sm:w-16 sm:h-16 flex items-center justify-center bg-[#e2b040]/15 border border-[#e2b040]/30 rounded-2xl mb-3 sm:mb-5 group-hover:bg-[#e2b040]/25 transition-colors">
                  <i className={`${paso.icono} text-[#e2b040] text-xl sm:text-3xl`}></i>
                </div>
                <h3 className="text-white font-bold text-xs sm:text-lg mb-1.5 sm:mb-3">{paso.titulo}</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed hidden sm:block">{paso.descripcion}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl overflow-hidden border border-[#e2b040]/20 shadow-2xl shadow-[#e2b040]/10 flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 h-44 sm:h-52 md:h-auto flex-shrink-0 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=diverse%20team%20of%20professional%20service%20workers%20plumber%20electrician%20painter%20gardener%20standing%20together%20smiling%20confident%20uniforms%20tools%20dark%20studio%20background%20warm%20golden%20accent%20lighting%20professional%20corporate%20photography&width=1200&height=480&seq=como_funciona_team_v2&orientation=landscape"
                alt="Equipo de profesionales ServiciosYa"
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            </div>
            <div className="flex-1 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-5 sm:p-10 flex flex-col justify-center">
              <h3 className="text-lg sm:text-3xl font-bold text-white mb-2 sm:mb-3">
                Profesionales <span className="text-[#e2b040]">verificados</span> y confiables
              </h3>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-5">
                Cada prestador pasa por un proceso de verificación para garantizarte calidad y seguridad en cada servicio.
              </p>
              <button
                onClick={() => navigate('/usuarios')}
                className="w-full sm:w-auto sm:self-start min-h-[48px] px-6 py-3 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold text-sm hover:bg-[#f0d080] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <i className="ri-arrow-right-circle-line text-lg"></i>
                Encontrá tu profesional
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── About us ── */}
      <section id="quienes-somos" className="py-12 sm:py-20 px-4 sm:px-6 bg-[#1a1a2e]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden border border-[#e2b040]/30 shadow-2xl shadow-[#e2b040]/10">
                <img
                  src="https://readdy.ai/api/search-image?query=professional%20service%20worker%20in%20uniform%20shaking%20hands%20with%20satisfied%20homeowner%20at%20front%20door%20successful%20job%20completion%20trust%20agreement%20warm%20natural%20light%20residential%20setting%20confident%20smiling%20both%20people&width=700&height=500&seq=quienes_somos_acuerdo_01&orientation=landscape"
                  alt="Profesional y cliente ServiciosYa"
                  className="w-full h-48 sm:h-auto object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>

            <div>
              <span className="inline-block px-4 py-1 bg-[#e2b040]/15 text-[#e2b040] rounded-full text-xs sm:text-sm font-semibold mb-3 tracking-wide uppercase">
                Quiénes somos
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
                Nos encargamos de todo
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4 leading-relaxed">
                Para que vos te enfoques en tu trabajo
              </p>
              <p className="text-gray-300 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
                Nuestra plataforma conecta usuarios con prestadores de servicios, facilitando el contacto y promoviendo transparencia, eficiencia y buenos resultados.
              </p>

              <div className="space-y-3 sm:space-y-6">
                {[
                  { icono: 'ri-user-add-line', titulo: 'Captación de trabajadores', desc: 'Publicidad y marketing constante' },
                  { icono: 'ri-bank-card-line', titulo: 'Gestión de pagos', desc: 'Cobranzas seguras y puntuales' },
                  { icono: 'ri-calendar-check-line', titulo: 'Coordinación', desc: 'Agenda y logística optimizada' },
                  { icono: 'ri-customer-service-2-line', titulo: 'Atención al cliente', desc: 'Soporte profesional 24/7' },
                  { icono: 'ri-megaphone-line', titulo: 'Publicidad del servicio', desc: 'Presencia digital garantizada' },
                ].map((item) => (
                  <div key={item.titulo} className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[#e2b040] rounded-full shrink-0">
                      <i className={`${item.icono} text-[#1a1a2e] text-base sm:text-xl`}></i>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm sm:text-lg mb-0.5">{item.titulo}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0f1628] pt-10 sm:pt-16 pb-0 px-4 sm:px-6 border-t border-[#e2b040]/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 pb-10 sm:pb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src="https://public.readdy.ai/ai/img_res/ebf8ba70-3b01-48d0-b580-89cd2fe53a3e.png"
                  alt="ServiciosYa Logo"
                  className="w-10 h-10 object-contain"
                />
                <span className="text-xl font-bold text-[#e2b040]">ServiciosYa</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Servicios profesionales con garantía
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-10 h-10 flex items-center justify-center bg-[#16213e] border border-[#e2b040]/30 rounded-full text-[#e2b040] hover:bg-[#e2b040] hover:text-[#1a1a2e] transition-all cursor-pointer">
                  <i className="ri-instagram-line text-base"></i>
                </a>
                <a href="#" className="w-10 h-10 flex items-center justify-center bg-[#16213e] border border-[#e2b040]/30 rounded-full text-[#e2b040] hover:bg-[#e2b040] hover:text-[#1a1a2e] transition-all cursor-pointer">
                  <i className="ri-facebook-line text-base"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-[#e2b040] font-bold text-xs uppercase tracking-widest mb-4">Empresa</h4>
              <ul className="space-y-3">
                <li><a href="#quienes-somos" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">Quiénes somos</a></li>
                <li><a href="#como-funciona" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">Cómo funciona</a></li>
                <li><a onClick={() => navigate('/prestadores')} className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">Para profesionales</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[#e2b040] font-bold text-xs uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">Términos y condiciones</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">Política de privacidad</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">Política de pagos</a></li>
              </ul>
            </div>

            <div id="contacto">
              <h4 className="text-[#e2b040] font-bold text-xs uppercase tracking-widest mb-4">Contacto</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <i className="ri-mail-line text-[#e2b040] text-base shrink-0"></i>
                  <a href="mailto:mrsserviciossoluciones@gmail.com" className="text-gray-400 hover:text-[#e2b040] transition-colors text-xs sm:text-sm cursor-pointer break-all">mrsserviciossoluciones@gmail.com</a>
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-phone-line text-[#e2b040] text-base shrink-0"></i>
                  <a href="tel:+543516576801" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">351 657-6801</a>
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-phone-line text-[#e2b040] text-base shrink-0"></i>
                  <a href="tel:+543513227999" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">351 322-7999</a>
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-phone-line text-[#e2b040] text-base shrink-0"></i>
                  <a href="tel:+543512178797" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">351 217-8797</a>
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-map-pin-line text-[#e2b040] text-base shrink-0"></i>
                  <span className="text-gray-400 text-sm">Villa Allende, Córdoba</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#e2b040]/10 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-gray-500 text-xs sm:text-sm text-center">
              © 2026 ServiciosYa. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp flotante — elevado en mobile para no tapar la barra del browser */}
      <a
        href="https://wa.me/543513227999"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 flex items-center justify-center bg-[#25D366] rounded-full shadow-2xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
        title="Contactar por WhatsApp"
        aria-label="Contactar por WhatsApp"
      >
        <i className="ri-whatsapp-line text-white text-2xl"></i>
      </a>
    </div>
  );
}
