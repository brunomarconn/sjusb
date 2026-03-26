import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

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
    nombre: 'Forrajería',
    categoria: 'forrajería',
    icono: 'ri-seedling-line',
    imagen:
      'https://readdy.ai/api/search-image?query=animal%20feed%20store%20hay%20bales%20grain%20sacks%20farm%20supply%20shop%20rustic%20warm%20light&width=400&height=260&seq=serv09&orientation=landscape',
  },
  {
    nombre: 'Peluquería Canina',
    categoria: 'peluquería canina',
    icono: 'ri-scissors-line',
    imagen:
      'https://readdy.ai/api/search-image?query=professional%20dog%20groomer%20grooming%20cute%20dog%20scissors%20comb%20pet%20salon%20clean%20background&width=400&height=260&seq=serv10&orientation=landscape',
  },
  {
    nombre: 'Aire Acondicionado',
    categoria: 'mantenimiento aire acondicionado',
    icono: 'ri-temp-cold-line',
    imagen:
      'https://readdy.ai/api/search-image?query=technician%20installing%20air%20conditioner%20unit%20wall%20indoor%20professional%20tools%20uniform%20maintenance&width=400&height=260&seq=serv11&orientation=landscape',
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
    nombre: 'Cambio de Baterías',
    categoria: 'cambio de baterías',
    icono: 'ri-battery-charge-line',
    imagen:
      'https://readdy.ai/api/search-image?query=mechanic%20replacing%20car%20battery%20automotive%20workshop%20tools%20professional%20work%20engine%20close%20up&width=400&height=260&seq=serv15&orientation=landscape',
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
    icono: 'ri-car-wash-line',
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
    imagen:
      'https://media.discordapp.net/attachments/1486195971116503110/1486564093354573944/content.png?ex=69c5f632&is=69c4a4b2&hm=faa3f8e45399dffa5bf4c70bc4598252246c535f7e9b800283c1043448a7ef34&=&format=webp&quality=lossless&width=1240&height=826',
  },
];

const pasos = [
  {
    numero: '01',
    icono: 'ri-search-eye-line',
    titulo: 'Buscá tu servicio',
    descripcion:
      'Explorá las categorías disponibles y encontrá el profesional que necesitás en segundos.',
    color: 'from-[#e2b040]/20 to-[#e2b040]/5',
  },
  {
    numero: '02',
    icono: 'ri-user-star-line',
    titulo: 'Elegí tu prestador',
    descripcion:
      'Revisá perfiles, valoraciones y experiencia de cada profesional verificado.',
    color: 'from-[#e2b040]/20 to-[#e2b040]/5',
  },
  {
    numero: '03',
    icono: 'ri-whatsapp-line',
    titulo: 'Contactá por WhatsApp',
    descripcion:
      'Coordiná directamente con el prestador de forma rápida y sin intermediarios.',
    color: 'from-[#e2b040]/20 to-[#e2b040]/5',
  },
  {
    numero: '04',
    icono: 'ri-star-smile-line',
    titulo: 'Valorá la experiencia',
    descripcion:
      'Dejá tu opinión y ayudá a otros usuarios a elegir el mejor profesional.',
    color: 'from-[#e2b040]/20 to-[#e2b040]/5',
  },
];

export default function Inicio() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#16213e]/95 backdrop-blur-sm shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo + nombre */}
          <div
            className="flex flex-col items-center cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img
              src="https://public.readdy.ai/ai/img_res/ebf8ba70-3b01-48d0-b580-89cd2fe53a3e.png"
              alt="MServicios Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-xs font-bold text-[#e2b040] leading-tight mt-0.5">
              MServicios
            </span>
          </div>

          {/* Botones de sesión — arriba a la derecha */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => document.getElementById('quienes-somos')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-1.5 bg-transparent text-gray-300 rounded-full text-xs font-semibold hover:text-[#e2b040] transition-all duration-300 whitespace-nowrap cursor-pointer hidden sm:block"
            >
              Quiénes Somos
            </button>
            <button
              onClick={() => navigate('/mi-cuenta')}
              className="px-3 py-1.5 bg-transparent border border-[#e2b040] text-[#e2b040] rounded-full text-xs font-semibold hover:bg-[#e2b040] hover:text-[#1a1a2e] transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-user-line text-xs"></i>
              Soy Usuario
            </button>
            <button
              onClick={() => navigate('/prestadores')}
              className="px-3 py-1.5 bg-[#e2b040] text-[#1a1a2e] rounded-full text-xs font-semibold hover:bg-[#f0d080] transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 shadow-md shadow-[#e2b040]/30 cursor-pointer"
            >
              <i className="ri-briefcase-line text-xs"></i>
              Soy Prestador
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
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

        <div className="relative w-full max-w-5xl mx-auto text-center px-6 pt-24 pb-6">
          <div className="mb-4">
            <span className="inline-block px-4 py-1 bg-[#e2b040]/20 border border-[#e2b040]/40 text-[#e2b040] rounded-full text-sm font-semibold tracking-widest uppercase">
              Plataforma de Servicios
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Conectamos servicios<br />
            <span className="text-[#e2b040]">con quienes los necesitan</span>
          </h1>

          <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Nuestra plataforma conecta usuarios con prestadores de servicios, facilitando el contacto y promoviendo transparencia, eficiencia y buenos resultados.
          </p>

          {/* Call‑to‑action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <button
              onClick={() => navigate('/mi-cuenta')}
              className="px-8 py-3.5 bg-[#e2b040] text-[#1a1a2e] rounded-full font-bold text-base hover:bg-[#f0d080] transition-all duration-300 whitespace-nowrap flex items-center gap-2 shadow-lg shadow-[#e2b040]/30 cursor-pointer"
            >
              <i className="ri-user-line"></i>
              Soy Usuario
            </button>
            <button
              onClick={() => navigate('/prestadores')}
              className="px-8 py-3.5 bg-transparent border-2 border-[#e2b040] text-[#e2b040] rounded-full font-bold text-base hover:bg-[#e2b040] hover:text-[#1a1a2e] transition-all duration-300 whitespace-nowrap flex items-center gap-2 cursor-pointer"
            >
              <i className="ri-briefcase-line"></i>
              Soy Prestador de Servicios
            </button>
          </div>

          {/* Points banner */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e2b040]/10 border border-[#e2b040]/30 rounded-full text-sm text-[#f0d080] mb-4">
            <i className="ri-medal-line text-[#e2b040]"></i>
            <span>Acumulá puntos y obtené un <strong>10% de descuento</strong> en tus servicios</span>
          </div>

          {/* Scroll indicator */}
          <div className="mt-4 flex flex-col items-center animate-bounce cursor-pointer" onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}>
            <span className="text-gray-300 text-xs tracking-widest uppercase mb-2">Descubrí los servicios</span>
            <div className="w-10 h-10 flex items-center justify-center border border-[#e2b040]/40 rounded-full">
              <i className="ri-arrow-down-line text-[#e2b040] text-xl"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="servicios" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">
            Nuestros Servicios
          </h2>
          <p className="text-gray-400 text-center mb-10">
            Hacé clic en cualquier servicio para ver los prestadores disponibles
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {servicios.map((servicio) => (
              <button
                key={servicio.categoria}
                onClick={() => handleServicioClick(servicio.categoria)}
                className="group relative bg-[#16213e]/60 rounded-2xl border border-[#e2b040]/20 overflow-hidden hover:border-[#e2b040]/60 transition-all duration-300 hover:shadow-xl hover:shadow-[#e2b040]/10 hover:scale-[1.03] cursor-pointer text-left"
              >
                <div className="w-full h-40 overflow-hidden relative">
                  <img
                    src={servicio.imagen}
                    alt={servicio.nombre}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 h-40 bg-gradient-to-t from-[#1a1a2e]/80 via-transparent to-transparent"></div>
                </div>
                <div className="p-3 flex items-center gap-2 min-h-[60px]">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#e2b040]/20 rounded-lg shrink-0">
                    <i className={`${servicio.icono} text-[#e2b040] text-base`}></i>
                  </div>
                  <span className="text-white font-semibold text-xs sm:text-sm leading-tight group-hover:text-[#f0d080] transition-colors flex-1 line-clamp-2">
                    {servicio.nombre}
                  </span>
                  <i className="ri-arrow-right-line text-[#e2b040]/50 group-hover:text-[#e2b040] transition-colors text-sm shrink-0"></i>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — rediseñado */}
      <section id="como-funciona" className="py-20 px-6 bg-[#16213e]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1 bg-[#e2b040]/15 text-[#e2b040] rounded-full text-sm font-semibold mb-4 tracking-wide uppercase">
              Simple y rápido
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-base">
              Un proceso simple y transparente para conectarte con el profesional ideal
            </p>
          </div>

          {/* Pasos en grid responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {pasos.map((paso, idx) => (
              <div
                key={paso.numero}
                className="relative bg-gradient-to-b from-[#1a1a2e]/90 to-[#16213e]/80 rounded-2xl border border-[#e2b040]/25 p-7 flex flex-col items-center text-center hover:border-[#e2b040]/70 hover:scale-[1.03] transition-all duration-300 group"
              >
                {/* Conector entre pasos (solo desktop) */}
                {idx < pasos.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-3 z-10">
                    <i className="ri-arrow-right-line text-[#e2b040]/40 text-xl"></i>
                  </div>
                )}
                {/* Número */}
                <span className="text-[#e2b040]/20 text-6xl font-black absolute top-3 right-4 leading-none select-none">
                  {paso.numero}
                </span>
                {/* Ícono */}
                <div className="w-16 h-16 flex items-center justify-center bg-[#e2b040]/15 border border-[#e2b040]/30 rounded-2xl mb-5 group-hover:bg-[#e2b040]/25 transition-colors">
                  <i className={`${paso.icono} text-[#e2b040] text-3xl`}></i>
                </div>
                <h3 className="text-white font-bold text-lg mb-3">{paso.titulo}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{paso.descripcion}</p>
              </div>
            ))}
          </div>

          {/* Imagen ilustrativa mejorada */}
          <div className="relative rounded-3xl overflow-hidden border border-[#e2b040]/20 shadow-2xl shadow-[#e2b040]/10">
            <img
              src="https://readdy.ai/api/search-image?query=diverse%20team%20of%20professional%20service%20workers%20plumber%20electrician%20painter%20gardener%20standing%20together%20smiling%20confident%20uniforms%20tools%20dark%20studio%20background%20warm%20golden%20accent%20lighting%20professional%20corporate%20photography&width=1200&height=480&seq=como_funciona_team_v2&orientation=landscape"
              alt="Equipo de profesionales MServicios"
              className="w-full object-cover object-top"
              style={{ maxHeight: '380px' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e]/80 via-[#1a1a2e]/30 to-transparent"></div>
            <div className="absolute inset-0 flex items-center px-8 md:px-16">
              <div className="max-w-md">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Profesionales <span className="text-[#e2b040]">verificados</span> y confiables
                </h3>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6">
                  Cada prestador pasa por un proceso de verificación para garantizarte calidad y seguridad en cada servicio.
                </p>
                <button
                  onClick={() => navigate('/usuarios')}
                  className="px-6 py-3 bg-[#e2b040] text-[#1a1a2e] rounded-full font-bold text-sm hover:bg-[#f0d080] transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-2"
                >
                  <i className="ri-arrow-right-circle-line text-lg"></i>
                  Encontrá tu profesional
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About us */}
      <section id="quienes-somos" className="py-20 px-6 bg-[#1a1a2e]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden border border-[#e2b040]/30 shadow-2xl shadow-[#e2b040]/10">
                <img
                  src="https://readdy.ai/api/search-image?query=professional%20service%20worker%20in%20uniform%20shaking%20hands%20with%20satisfied%20homeowner%20at%20front%20door%20successful%20job%20completion%20trust%20agreement%20warm%20natural%20light%20residential%20setting%20confident%20smiling%20both%20people&width=700&height=500&seq=quienes_somos_acuerdo_01&orientation=landscape"
                  alt="Profesional y cliente MServicios"
                  className="w-full h-full object-cover object-top"
                  style={{ minHeight: '380px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/50 via-transparent to-transparent rounded-3xl"></div>
              </div>
            </div>

            <div>
              <span className="inline-block px-4 py-1 bg-[#e2b040]/15 text-[#e2b040] rounded-full text-sm font-semibold mb-4 tracking-wide uppercase">
                Quiénes somos
              </span>
              <h2 className="text-4xl font-bold text-white mb-4">
                Nos encargamos de todo
              </h2>
              <p className="text-gray-400 text-base mb-4 leading-relaxed">
                Para que vos te enfoques en tu trabajo
              </p>
              <p className="text-gray-300 text-base mb-8 leading-relaxed">
                Nuestra plataforma conecta usuarios con prestadores de
                servicios, facilitando el contacto y promoviendo
                transparencia, eficiencia y buenos resultados.
              </p>

              <div className="space-y-6">
                {[
                  { icono: 'ri-user-add-line', titulo: 'Captación de trabajadores', desc: 'Publicidad y marketing constante' },
                  { icono: 'ri-bank-card-line', titulo: 'Gestión de pagos', desc: 'Cobranzas seguras y puntuales' },
                  { icono: 'ri-calendar-check-line', titulo: 'Coordinación', desc: 'Agenda y logística optimizada' },
                  { icono: 'ri-customer-service-2-line', titulo: 'Atención al cliente', desc: 'Soporte profesional 24/7' },
                  { icono: 'ri-megaphone-line', titulo: 'Publicidad del servicio', desc: 'Presencia digital garantizada' },
                ].map((item) => (
                  <div key={item.titulo} className="flex items-start gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-[#e2b040] rounded-full shrink-0">
                      <i className={`${item.icono} text-[#1a1a2e] text-xl`}></i>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{item.titulo}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1628] pt-16 pb-0 px-6 border-t border-[#e2b040]/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="https://public.readdy.ai/ai/img_res/ebf8ba70-3b01-48d0-b580-89cd2fe53a3e.png"
                  alt="MServicios Logo"
                  className="w-10 h-10 object-contain"
                />
                <span className="text-xl font-bold text-[#e2b040]">MServicios</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Servicios profesionales con garantía
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-9 h-9 flex items-center justify-center bg-[#16213e] border border-[#e2b040]/30 rounded-full text-[#e2b040] hover:bg-[#e2b040] hover:text-[#1a1a2e] transition-all cursor-pointer">
                  <i className="ri-instagram-line text-base"></i>
                </a>
                <a href="#" className="w-9 h-9 flex items-center justify-center bg-[#16213e] border border-[#e2b040]/30 rounded-full text-[#e2b040] hover:bg-[#e2b040] hover:text-[#1a1a2e] transition-all cursor-pointer">
                  <i className="ri-facebook-line text-base"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-[#e2b040] font-bold text-sm uppercase tracking-widest mb-5">Empresa</h4>
              <ul className="space-y-3">
                <li><a href="#quienes-somos" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">Quiénes somos</a></li>
                <li><a href="#como-funciona" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">Cómo funciona</a></li>
                <li><a onClick={() => navigate('/prestadores')} className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">Para profesionales</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[#e2b040] font-bold text-sm uppercase tracking-widest mb-5">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">Términos y condiciones</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">Política de privacidad</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">Política de pagos</a></li>
              </ul>
            </div>

            <div id="contacto">
              <h4 className="text-[#e2b040] font-bold text-sm uppercase tracking-widest mb-5">Contacto</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <i className="ri-mail-line text-[#e2b040] text-base"></i>
                  </div>
                  <a href="mailto:marconsoliservicios@gmail.com" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">marconsoliservicios@gmail.com</a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <i className="ri-phone-line text-[#e2b040] text-base"></i>
                  </div>
                  <a href="tel:+543516576801" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">351 657-6801</a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <i className="ri-phone-line text-[#e2b040] text-base"></i>
                  </div>
                  <a href="tel:+543513227999" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">351 322-7999</a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <i className="ri-phone-line text-[#e2b040] text-base"></i>
                  </div>
                  <a href="tel:+543512178797" className="text-gray-400 hover:text-[#e2b040] transition-colors text-sm cursor-pointer">351 217-8797</a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <i className="ri-map-pin-line text-[#e2b040] text-base"></i>
                  </div>
                  <span className="text-gray-400 text-sm">Villa Allende, Córdoba, Argentina</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#e2b040]/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-500 text-sm">
              © 2025 MServicios. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp button */}
      <a
        href="https://wa.me/543513227999"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center bg-[#25D366] rounded-full shadow-2xl shadow-[#25D366]/40 hover:scale-110 transition-transform cursor-pointer"
        title="Contactar por WhatsApp"
      >
        <i className="ri-whatsapp-line text-white text-2xl"></i>
      </a>
    </div>
  );
}
