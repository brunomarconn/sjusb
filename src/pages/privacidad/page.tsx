import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';

const secciones = [
  {
    titulo: '1. Responsable del tratamiento',
    contenido: `El responsable del tratamiento de los datos personales es MrServicios con domicilio en Villa Allende, provincia de Córdoba, Argentina. Para cualquier consulta sobre privacidad podés contactarte al correo electrónico mrsserviciossoluciones@gmail.com o a los teléfonos publicados en el sitio.`,
  },
  {
    titulo: '2. Datos personales que recopilamos',
    contenido: `La plataforma recopila los siguientes datos según el tipo de usuario:

• Datos de identificación: número de DNI (usuarios y prestadores).
• Datos de contacto: nombre y apellido, correo electrónico (opcional), número de teléfono/WhatsApp.
• Datos de perfil profesional: foto de perfil, descripción del servicio, categoría, zona de trabajo, fotos o videos de trabajos anteriores (prestadores).
• Credenciales de acceso: contraseña creada por el usuario o DNI utilizado como contraseña (prestadores).
• Datos de navegación: dirección IP, tipo de dispositivo, navegador, idioma, cookies y registros de actividad.
• Valoraciones y comentarios: opiniones dejadas por los usuarios sobre los prestadores.
• Información transaccional: datos relacionados con pagos y cobros en caso de utilizar el servicio de gestión de pagos.`,
  },
  {
    titulo: '3. Finalidad y bases legales',
    contenido: `La información se utiliza para:

• Registro y autenticación: crear y gestionar cuentas, verificar identidad y gestionar credenciales. Base legal: consentimiento al registrarse.
• Prestación del servicio: conectar usuarios con prestadores, mostrar perfiles y facilitar el contacto por WhatsApp. Base legal: ejecución de contrato.
• Comunicación: responder consultas, enviar notificaciones y comunicaciones sobre cambios de términos. Base legal: interés legítimo y consentimiento para comunicaciones comerciales.
• Gestión de pagos: procesar cobros a través de proveedores externos. Base legal: ejecución de contrato y obligaciones legales.
• Mejoras y seguridad: analizar datos de navegación para mejorar la experiencia y proteger la plataforma. Base legal: interés legítimo.`,
  },
  {
    titulo: '4. Uso de WhatsApp y comunicaciones externas',
    contenido: `La plataforma no intermedia en el contacto entre usuarios y prestadores; el contacto se realiza directamente por WhatsApp. Al hacerlo, el usuario comparte su número de teléfono con el prestador y con Meta Platforms, Inc. (empresa propietaria de WhatsApp). Esta Política no regula el uso de datos realizado por WhatsApp ni por el prestador. MrServicios no se responsabiliza por el uso de los datos una vez que el contacto se realiza fuera de la plataforma.`,
  },
  {
    titulo: '5. Cookies y tecnologías similares',
    contenido: `El sitio puede usar cookies propias y de terceros para:

• Autenticación y seguridad: mantener la sesión iniciada y proteger contra uso fraudulento.
• Preferencias y configuración: recordar la zona de trabajo u otras preferencias.
• Estadísticas y análisis: obtener datos agregados de uso mediante servicios de análisis de terceros.
• Publicidad: en caso de implementar campañas de marketing.

Podés configurar tu navegador para rechazar cookies no esenciales; algunas funcionalidades podrían verse afectadas.`,
  },
  {
    titulo: '6. Cesión y tratamiento por terceros',
    contenido: `Los datos personales podrán ser compartidos con:

• Prestadores de servicios: datos de contacto y perfil para atender las solicitudes del usuario.
• Proveedores tecnológicos: empresas de alojamiento (Cloudflare Workers), almacenamiento de imágenes y herramientas de mensajería. Estas empresas actúan como encargados del tratamiento.
• Autoridades: ante requerimientos legales o administrativos.
• Procesadores de pago: para gestionar cobros y transferencias.

En ningún caso la plataforma venderá datos personales a terceros.`,
  },
  {
    titulo: '7. Transferencias internacionales',
    contenido: `Algunos proveedores tecnológicos pueden estar ubicados fuera de Argentina. MrServicios garantiza que se aplicarán medidas adecuadas de protección (contratos de protección de datos, cláusulas modelo o adhesión al RGPD si aplica). Al usar la plataforma, el usuario consiente que sus datos puedan transferirse a otros países para cumplir las finalidades descritas.`,
  },
  {
    titulo: '8. Seguridad de los datos',
    contenido: `MrServicios aplica medidas de seguridad técnicas y organizativas para proteger los datos contra accesos no autorizados, pérdidas o modificaciones: cifrado HTTPS, mecanismos de autenticación, almacenamiento seguro de contraseñas y controles de acceso. Ningún sistema es completamente seguro; los usuarios deben utilizar contraseñas seguras y mantener la confidencialidad de sus credenciales.`,
  },
  {
    titulo: '9. Plazo de conservación',
    contenido: `Los datos se conservarán el tiempo necesario:

• Cuentas de usuario y prestador: mientras la cuenta esté activa y un plazo razonable posterior para resolver disputas.
• Información de contacto y facturación: según exijan las leyes fiscales y contables.
• Comentarios y valoraciones: de forma indefinida para preservar la transparencia, salvo solicitud de eliminación.
• Copias de seguridad: períodos limitados para garantizar la continuidad del servicio.

Una vez cumplidas las finalidades, los datos serán anonimizados o eliminados de forma segura.`,
  },
  {
    titulo: '10. Derechos de los titulares de datos',
    contenido: `De acuerdo con la Ley Argentina 25.326 de Protección de Datos Personales, los usuarios tienen los siguientes derechos:

• Acceso: conocer qué datos personales poseemos.
• Rectificación: corregir datos incorrectos o incompletos.
• Supresión: solicitar la eliminación cuando hayan dejado de ser necesarios.
• Oposición: oponerse al tratamiento por motivos legítimos.
• Portabilidad: recibir los datos en formato estructurado (cuando corresponda).
• Revocación del consentimiento: retirar el consentimiento para fines comerciales en cualquier momento.

Para ejercer estos derechos, escribí a mrsserviciossoluciones@gmail.com adjuntando copia de tu documento de identidad. También podés presentar reclamaciones ante la Agencia de Acceso a la Información Pública.`,
  },
  {
    titulo: '11. Actualizaciones de esta política',
    contenido: `MrServicios podrá modificar esta Política para adaptarla a cambios legislativos o mejoras en el servicio. La fecha de última actualización estará indicada al inicio. Los cambios significativos se comunicarán a través del sitio web o por correo electrónico. El uso continuado de la plataforma implica la aceptación de la política modificada.`,
  },
];

export default function Privacidad() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 py-10 pt-28 pb-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-[#e2b040] transition-colors mb-6 text-sm cursor-pointer"
        >
          <i className="ri-arrow-left-line" />
          Volver
        </button>

        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#e2b040]/15 border border-[#e2b040]/30 mb-4">
            <i className="ri-shield-check-line text-2xl text-[#e2b040]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Política de Privacidad</h1>
          <p className="text-gray-500 text-xs">Última actualización: 29 de abril de 2026</p>
        </div>

        <div className="bg-[#16213e]/40 border border-[#e2b040]/15 rounded-2xl p-4 mb-6 text-sm text-gray-400 leading-relaxed">
          Este documento describe cómo MrServicios recopila, usa y protege tu información personal en la plataforma. Al usar el sitio, aceptás los términos aquí descritos.
        </div>

        <div className="space-y-4">
          {secciones.map((s, i) => (
            <div key={i} className="bg-[#16213e]/40 border border-[#e2b040]/10 rounded-xl p-5">
              <h2 className="text-[#e2b040] font-bold text-sm mb-3">{s.titulo}</h2>
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{s.contenido}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 rounded-2xl bg-[#16213e]/60 border border-[#e2b040]/20 text-center">
          <p className="text-gray-300 text-sm mb-4">¿Querés ejercer tus derechos o tenés consultas sobre privacidad?</p>
          <a
            href="mailto:mrsserviciossoluciones@gmail.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e2b040]/15 border border-[#e2b040]/40 text-[#e2b040] rounded-xl text-sm hover:bg-[#e2b040]/25 transition-colors"
          >
            <i className="ri-mail-line" />
            mrsserviciossoluciones@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
