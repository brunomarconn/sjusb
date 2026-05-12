import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';

const secciones = [
  {
    titulo: '1. Aceptación de los términos',
    contenido: `Al acceder o utilizar la plataforma MrServicios, el usuario acepta estar sujeto a estos Términos y Condiciones de Uso y a la Política de Privacidad. Si no estás de acuerdo, debés abstenerte de usar el servicio.`,
  },
  {
    titulo: '2. Definiciones',
    contenido: `• Plataforma: el sitio web y cualquier interfaz proporcionada por MrServicios para facilitar la conexión entre usuarios y prestadores.
• Usuario: persona física que busca contratar un servicio mediante la plataforma.
• Prestador: persona física o jurídica que ofrece servicios profesionales a través de la plataforma, habiéndose registrado y suministrado sus datos.
• Contenido: textos, imágenes, videos, reseñas y cualquier material que los usuarios o la plataforma publiquen.`,
  },
  {
    titulo: '3. Objeto del servicio',
    contenido: `MrServicios actúa como intermediario digital que conecta a usuarios con prestadores de servicios verificados. El sitio permite buscar categorías de servicios, revisar perfiles de prestadores, contactarlos mediante WhatsApp y dejar valoraciones sobre la calidad del servicio. La plataforma no presta los servicios ofrecidos por los prestadores ni participa de la relación contractual entre ambas partes.`,
  },
  {
    titulo: '4. Registro y cuentas',
    contenido: `Usuarios: deben registrarse proporcionando su número de DNI, crear una contraseña y, opcionalmente, un correo electrónico para recuperar la cuenta. La información suministrada debe ser veraz.

Prestadores: al registrarse deben cargar una foto de perfil, indicar nombre y apellido, proporcionar su número de DNI (que funcionará como usuario y contraseña), número de WhatsApp, correo electrónico opcional, categoría, zonas de trabajo, descripción del servicio y fotografías o videos de trabajos. Los prestadores declaran que la información es auténtica y que cumplen con todas las licencias que exija la ley.

Responsabilidad de las credenciales: el titular de la cuenta es responsable de mantener en secreto su contraseña. Cualquier actividad realizada desde la cuenta se presumirá realizada por su titular.

Edad mínima: al usar la plataforma, usuarios y prestadores manifiestan ser mayores de 18 años.`,
  },
  {
    titulo: '5. Obligaciones de los usuarios y prestadores',
    contenido: `• Uso correcto: el sitio debe utilizarse de manera lícita, respetando las leyes vigentes y estos términos.
• Veracidad de los datos: comprometerse a proporcionar datos veraces y mantenerlos actualizados.
• Prohibiciones: no se permite publicar contenido ilegal, ofensivo, difamatorio, discriminatorio, sexualmente explícito, engañoso o que viole derechos de terceros. Se prohíben actividades que dañen, inutilicen o deterioren la plataforma.
• Propiedad intelectual: el contenido subido por los prestadores debe ser de su propiedad o contar con autorización. El usuario otorga a MrServicios una licencia no exclusiva para mostrar ese contenido dentro de la plataforma.
• Comentarios y valoraciones: los comentarios deben ser veraces y respetuosos. MrServicios podrá moderar o eliminar valoraciones que infrinjan estas reglas.`,
  },
  {
    titulo: '6. Contratación y responsabilidad',
    contenido: `Relación entre usuario y prestador: MrServicios no forma parte del contrato de prestación de servicios. La responsabilidad por el cumplimiento del servicio, su calidad y los términos pactados recae exclusivamente en las partes involucradas.

Verificación de prestadores: la plataforma realiza un proceso de verificación básico para garantizar que los prestadores sean reales, pero no garantiza la idoneidad ni la solvencia de los prestadores. El usuario debe evaluar la conveniencia de contratar.

Responsabilidad de la plataforma: MrServicios no se responsabiliza por daños directos o indirectos derivados de la relación entre usuario y prestador, ni por pérdidas de datos u otros perjuicios derivados del uso de la plataforma.

Exclusión de garantías: el sitio se ofrece "tal como está" y "según disponibilidad". MrServicios no garantiza la ausencia de errores o interrupciones.`,
  },
  {
    titulo: '7. Gestión de pagos y cobros',
    contenido: `En caso de que la plataforma habilite la gestión de pagos, los cobros se realizarán a través de proveedores externos. La plataforma podrá retener comisiones o tarifas por el uso del servicio. Los detalles de tarifas, comisiones, plazos de pago y reembolsos se establecerán en una Política de Pagos independiente.`,
  },
  {
    titulo: '8. Política de cancelaciones y reembolsos',
    contenido: `Si el usuario decide cancelar un servicio contratado con un prestador, deberá pactarlo directamente con éste, ya que la plataforma no interviene en la ejecución ni en la política de cancelaciones. En caso de desacuerdo, la plataforma podrá mediar informalmente pero no está obligada a emitir reembolsos.`,
  },
  {
    titulo: '9. Enlaces a sitios de terceros',
    contenido: `El sitio puede incluir enlaces (por ejemplo, a WhatsApp o redes sociales) a otras páginas web o servicios de terceros. MrServicios no controla ni garantiza el contenido, las políticas de privacidad o las prácticas de esos sitios. El acceso a sitios de terceros será bajo responsabilidad del usuario.`,
  },
  {
    titulo: '10. Modificaciones de los términos',
    contenido: `MrServicios podrá modificar estos Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigencia a partir de su publicación en el sitio web o de su comunicación al correo electrónico registrado. El uso continuado de la plataforma después de la modificación implicará la aceptación de los nuevos términos.`,
  },
  {
    titulo: '11. Duración y terminación',
    contenido: `Los presentes términos tienen vigencia indefinida. Cualquier usuario o prestador puede dar de baja su cuenta enviando un correo a la dirección de contacto. MrServicios podrá suspender o cancelar cuentas que incumplan estos términos. Asimismo, MrServicios podrá interrumpir el servicio en cualquier momento comunicándolo con antelación razonable, salvo causas de fuerza mayor.`,
  },
  {
    titulo: '12. Legislación aplicable y jurisdicción',
    contenido: `Estos términos se regirán por las leyes de la República Argentina. En caso de controversias derivadas del uso de la plataforma, las partes se someten a la jurisdicción de los tribunales ordinarios de la provincia de Córdoba, renunciando a cualquier otro fuero que pudiera corresponderles.`,
  },
];

export default function Terminos() {
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
            <i className="ri-file-text-line text-2xl text-[#e2b040]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Términos y Condiciones</h1>
          <p className="text-gray-500 text-xs">Última actualización: 29 de abril de 2026</p>
        </div>

        <div className="bg-[#16213e]/40 border border-[#e2b040]/15 rounded-2xl p-4 mb-6 text-sm text-gray-400 leading-relaxed">
          Al acceder o utilizar MrServicios aceptás estos Términos y Condiciones. Leelos con atención antes de registrarte o contratar un servicio.
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
          <p className="text-gray-300 text-sm mb-4">¿Tenés dudas sobre los términos o tu cuenta?</p>
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
