// El registro de prestadores es gestionado exclusivamente por el administrador.
// Esta pantalla simplemente informa cómo contactarse.

interface RegistroPrestadorProps {
  onVolverLogin: () => void;
}

export default function RegistroPrestador({ onVolverLogin }: RegistroPrestadorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419] flex items-center justify-center p-4">
      <div className="bg-[#16213e]/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#e2b040]/20 text-center">

        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#e2b040] to-[#f0d080] rounded-xl mb-5 mx-auto">
          <i className="ri-user-add-line text-3xl text-[#1a1a2e]"></i>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">¿Querés ser prestador?</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          El registro de nuevos prestadores es gestionado por nuestro equipo.
          Contactanos y nos encargamos de darte de alta en la plataforma.
        </p>

        <a
          href="https://wa.me/543512178797?text=Hola!%20Quiero%20registrarme%20como%20prestador%20en%20MrServicios."
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#25D366] hover:bg-[#1da851] text-white rounded-xl font-bold text-sm transition-colors cursor-pointer mb-3"
        >
          <i className="ri-whatsapp-line text-lg" />
          Contactar por WhatsApp
        </a>

        <a
          href="mailto:mrsserviciossoluciones@gmail.com?subject=Quiero ser prestador en MrServicios"
          className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-colors cursor-pointer mb-6"
        >
          <i className="ri-mail-line" />
          mrsserviciossoluciones@gmail.com
        </a>

        <button
          type="button"
          onClick={onVolverLogin}
          className="text-[#e2b040] hover:text-[#f0d080] text-sm font-semibold cursor-pointer flex items-center gap-1 mx-auto"
        >
          <i className="ri-arrow-left-line" />
          Volver al ingreso
        </button>
      </div>
    </div>
  );
}
