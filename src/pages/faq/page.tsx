import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';

const faqs = [
  {
    pregunta: '¿Cómo contrato un prestador?',
    respuesta:
      'Buscá el servicio que necesitás en la página de inicio o en el listado, hacé clic en la tarjeta para ver el perfil completo y luego tocá "Contactar por WhatsApp" para comunicarte directamente con el profesional.',
  },
  {
    pregunta: '¿Los prestadores están verificados?',
    respuesta:
      'Sí. Todos los profesionales pasan por un proceso de verificación de identidad antes de ser publicados. Podés reconocerlos por el badge verde "Verificado" en su tarjeta.',
  },
  {
    pregunta: '¿Cuánto cuesta usar ServiciosYa?',
    respuesta:
      'Para los clientes, el uso de la plataforma es completamente gratuito. Solo pagás el servicio acordado directamente con el prestador.',
  },
  {
    pregunta: '¿Cómo dejo una valoración?',
    respuesta:
      'Una vez que hayas reservado y recibido el servicio, podés dejar una valoración desde la tarjeta del prestador. Solo pueden valorar quienes hayan reservado previamente.',
  },
  {
    pregunta: '¿Qué hago si el prestador no responde?',
    respuesta:
      'Si el prestador no responde en un plazo razonable, podés contactar a otro profesional de la misma categoría o comunicarte con nosotros por email o teléfono.',
  },
  {
    pregunta: '¿Cómo me registro como prestador de servicios?',
    respuesta:
      'Ingresá a la sección "Para profesionales" desde el menú o el footer y completá el formulario de registro. El equipo de ServiciosYa revisará tu solicitud y te contactará.',
  },
  {
    pregunta: '¿En qué zonas opera ServiciosYa?',
    respuesta:
      'Actualmente operamos en Córdoba y zona metropolitana: Villa Allende, Mendiolaza, Río Ceballos, Unquillo, Saldán, La Calera y Córdoba Capital. Estamos en constante expansión.',
  },
  {
    pregunta: '¿Cómo se maneja mi información personal?',
    respuesta:
      'Tus datos se usan exclusivamente para brindarte el servicio. No compartimos tu información con terceros sin tu consentimiento. El contacto por WhatsApp es directo entre vos y el prestador.',
  },
  {
    pregunta: '¿Puedo cancelar una reserva?',
    respuesta:
      'Las condiciones de cancelación dependen de cada prestador. Te recomendamos consultarlo directamente antes de confirmar para evitar inconvenientes.',
  },
  {
    pregunta: '¿Cómo contacto al soporte de ServiciosYa?',
    respuesta:
      'Podés escribirnos a mrsserviciossoluciones@gmail.com o llamarnos al 351 657-6801. También encontrás nuestros datos de contacto en el footer de la página de inicio.',
  },
];

function FaqItem({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        abierto ? 'border-[#e2b040]/40 bg-[#16213e]/80' : 'border-[#e2b040]/15 bg-[#16213e]/40'
      }`}
    >
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left cursor-pointer"
      >
        <span className="text-white text-sm font-semibold leading-snug">{pregunta}</span>
        <i
          className={`ri-arrow-down-s-line text-[#e2b040] text-xl shrink-0 transition-transform duration-200 ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>
      {abierto && (
        <div className="px-4 pb-4">
          <p className="text-gray-400 text-sm leading-relaxed">{respuesta}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 py-10 pt-28">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-[#e2b040] transition-colors mb-6 text-sm cursor-pointer"
        >
          <i className="ri-arrow-left-line" />
          Volver
        </button>

        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#e2b040]/15 border border-[#e2b040]/30 mb-4">
            <i className="ri-question-answer-line text-2xl text-[#e2b040]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Preguntas frecuentes</h1>
          <p className="text-gray-400 text-sm">Todo lo que necesitás saber sobre ServiciosYa</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem key={i} pregunta={faq.pregunta} respuesta={faq.respuesta} />
          ))}
        </div>

        <div className="mt-10 p-5 rounded-2xl bg-[#16213e]/60 border border-[#e2b040]/20 text-center">
          <p className="text-gray-300 text-sm mb-4">¿No encontraste lo que buscabas? Contactanos directamente.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:mrsserviciossoluciones@gmail.com"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#e2b040]/15 border border-[#e2b040]/40 text-[#e2b040] rounded-xl text-sm hover:bg-[#e2b040]/25 transition-colors"
            >
              <i className="ri-mail-line" />
              Enviar email
            </a>
            <a
              href="tel:+543516576801"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#e2b040]/15 border border-[#e2b040]/40 text-[#e2b040] rounded-xl text-sm hover:bg-[#e2b040]/25 transition-colors"
            >
              <i className="ri-phone-line" />
              Llamar: 351 657-6801
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
