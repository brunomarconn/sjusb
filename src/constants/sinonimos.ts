/**
 * Mapa de sinónimos por profesión.
 * Las claves son el resultado de normalizeText(categoria) — sin acentos, minúsculas.
 * Agregar entradas aquí para que la búsqueda inteligente las encuentre.
 */
export const SINONIMOS_PROFESIONES: Record<string, string[]> = {

  piletero: [
    // términos directos
    'piscina', 'pileta', 'alberca', 'natacion', 'pileta de natacion',
    // problemas típicos
    'agua verde', 'agua turbia', 'agua sucia', 'algas en pileta', 'pileta sucia',
    'pileta con algas', 'agua amarilla pileta', 'agua nublada',
    // tareas
    'limpieza de pileta', 'mantenimiento pileta', 'limpieza piscina',
    'mantenimiento piscina', 'tratamiento de agua', 'balance de ph',
    'cloracion', 'cloro pileta', 'dosificacion cloro',
    // equipos
    'filtro pileta', 'bomba de pileta', 'filtro de arena', 'skimmer',
    'boquilla pileta', 'limpiafondos', 'robot limpiafondos', 'aspiradora pileta',
    'equipo de pileta', 'bomba filtrante', 'clorador automatico',
    // construccion
    'construccion de pileta', 'pileta nueva', 'reparacion pileta',
    'revestimiento pileta', 'azulejo pileta', 'membrana pileta',
    'pileta de hormigon', 'pileta de fibra', 'reforma pileta',
    // temporada
    'apertura pileta', 'cierre de pileta', 'winterizacion',
    'preparar pileta verano', 'temporada pileta',
  ],

  carpintero: [
    // materiales
    'madera', 'mdf', 'melamina', 'playwood', 'aglomerado', 'pino', 'roble',
    'cedro', 'madera maciza', 'fenolico',
    // muebles
    'mueble', 'muebles', 'mueble a medida', 'mueble de cocina', 'mueble de bano',
    'amoblamiento', 'amoblar', 'muebleria',
    // guardarropas y almacenamiento
    'placard', 'placard a medida', 'ropero', 'armario', 'vestidor', 'vestidor a medida',
    'cajonera', 'cajones', 'organizador de ropa',
    // cocina
    'bajo mesada', 'alacena', 'mueble de cocina', 'cocina integral',
    'mesada de madera', 'isla de cocina', 'estante de cocina',
    // living y comedor
    'mesa', 'mesa de comedor', 'mesa ratona', 'silla', 'sillas de madera',
    'biblioteca', 'estante', 'estanteria', 'repisa', 'repisa de madera',
    'rack tv', 'mueble tv', 'aparador',
    // puertas y aberturas
    'puerta', 'puerta de madera', 'puerta interior', 'puerta a medida',
    'marco de puerta', 'portezuela', 'cancel', 'biombo', 'persiana de madera',
    // reparaciones
    'reparacion de mueble', 'restauracion de muebles', 'arreglo de mueble',
    'lijar mueble', 'barnizar', 'lustrar mueble', 'pintar mueble',
    'mueble roto', 'cajón que no cierra', 'puerta que no cierra',
    // jardín y exterior
    'deck de madera', 'deck', 'pergola', 'galeria de madera', 'banco de jardin',
    'mesa de jardin',
    // oficina
    'escritorio', 'escritorio a medida', 'biblioteca de oficina', 'archivero',
    'mueble de oficina',
  ],

  electricista: [
    // general
    'electricidad', 'electrico', 'instalacion electrica', 'electricista matriculado',
    'matriculado', 'habilitacion electrica',
    // problemas comunes
    'luz', 'sin luz', 'se fue la luz', 'corte de luz', 'no hay luz',
    'cortocircuito', 'chispa', 'fundio un fusible', 'salto la termica',
    'se cayo la termica', 'termicas', 'disyuntor', 'llave termica',
    // componentes
    'enchufe', 'toma corriente', 'tomacorriente', 'enchufe roto', 'enchufe sin tension',
    'cable', 'cables', 'cableado', 'cableado de baja tension', 'cableado estructurado',
    'interruptor', 'llave de luz', 'apagador', 'dimmer', 'regulador de luz',
    'tablero', 'tablero electrico', 'tablero de distribucion', 'caja de luz',
    // luminarias
    'lampara', 'luminaria', 'led', 'foco', 'spot', 'downlight', 'aplique',
    'luz de emergencia', 'reflector', 'dicroica', 'tira led',
    'luminaria exterior', 'poste de luz', 'farol',
    // instalaciones
    'ventilador de techo', 'extractor', 'campana extractora',
    'aire acondicionado electrico', 'calefactor electrico', 'panel solar',
    'puesta a tierra', 'jabalina', 'instalacion trifasica',
    // deteccion y reparacion
    'falla electrica', 'perdida electrica', 'detector de fallas',
    'medicion electrica', 'voltimetro', 'tension', 'amperaje',
    // servicios especificos
    'luces navidad', 'iluminacion exterior', 'iluminacion interior',
    'domótica', 'domotica', 'smart home', 'automatizacion electrica',
    'portero electrico', 'videoportero', 'citofono', 'alarma electrica',
  ],

  plomero: [
    // general
    'plomeria', 'gasista y plomero', 'instalaciones sanitarias', 'sanitaria',
    // cañería
    'cano', 'canos', 'cañeria', 'tuberia', 'caño roto', 'caño perdiendo',
    'caño reventado', 'caño tapado', 'caño de agua', 'caño de desague',
    'caño de cloaca', 'caño de pvc', 'caño de cobre', 'caño de hierro',
    // agua
    'agua corriente', 'perdida de agua', 'gotera', 'goteo', 'perdida',
    'agua que gotea', 'humedad por perdida', 'perdida en pared',
    'agua en el techo', 'perdida en el techo', 'no sale agua',
    'baja presion de agua', 'presion de agua',
    // canillas y griferia
    'canilla', 'canilla que gotea', 'canilla rota', 'canilla que pierde',
    'canilla de cocina', 'monocomando', 'griferia', 'llave de paso',
    'llave de cierre', 'valvula de paso',
    // bano
    'bano', 'bano tapado', 'inodoro', 'inodoro tapado', 'inodoro roto',
    'inodoro que pierde', 'mochila de inodoro', 'bidet', 'ducha', 'duchador',
    'banadera', 'jacuzzi', 'pileta de lavar', 'pileta de cocina',
    // desagotes y cloacas
    'destapacion', 'destapar', 'destapador', 'cloaca', 'pileta tapada',
    'desbloqueador de canos', 'desague tapado', 'sifon', 'trampa de piso',
    'sumidero', 'camara septica', 'pozo negro', 'pozo ciego',
    // calefaccion de agua
    'calefon', 'calefon roto', 'calefon que no enciende', 'termotanque',
    'termotanque electrico', 'termotanque a gas', 'caldera', 'agua caliente',
    'sin agua caliente', 'agua fria solo',
    // cisterna y tanque
    'cisterna', 'tanque de agua', 'tanque elevado', 'flotante de tanque',
    'valvula flotante', 'flotador', 'bomba de agua',
    // instalaciones
    'instalacion de lavatorio', 'instalacion lavarropas', 'instalacion lavavajillas',
    'instalacion termotanque', 'instalacion calefon',
  ],

  gasista: [
    // general
    'gas', 'gas natural', 'gas de red', 'instalacion de gas', 'instalaciones a gas',
    'gasista matriculado', 'matriculado gas', 'habilitacion gas',
    // artefactos
    'calefon', 'calefon a gas', 'estufa', 'estufa a gas', 'estufa de tiro',
    'estufa de tiro balanceado', 'estufa catalítica', 'estufa catalitica',
    'caldera', 'caldera de gas', 'caldera central', 'radiador', 'losa radiante',
    'cocina', 'cocina a gas', 'hornalla', 'horno a gas',
    // problemas de gas
    'fuga de gas', 'perdida de gas', 'olor a gas', 'huele a gas',
    'gas que pierde', 'deteccion de fugas', 'detector de gas',
    // conexiones
    'conexion gas', 'reconexion gas', 'llave de gas', 'llave de corte',
    'medidor de gas', 'garrafa', 'garrafa de 10 kg', 'garrafa de 45 kg',
    'gas envasado', 'red de gas', 'bajada de gas',
    // tramites
    'certificado de gas', 'inspeccion de gas', 'habilitacion municipio',
    'instalacion nueva de gas', 'plano de gas', 'aprobacion de gas',
    // calefaccion central
    'calefaccion central', 'losa radiante a gas', 'piso radiante',
    'expansion de gas', 'valvula de gas',
  ],

  pintor: [
    // general
    'pintura', 'pintar', 'pintado', 'trabajo de pintura', 'pinturas',
    // interior
    'pintura interior', 'pintar habitacion', 'pintar cuarto', 'pintar casa',
    'pintar departamento', 'pintar living', 'pintar cocina', 'pintar bano',
    'pintar techo', 'cielo raso', 'pintar cielorraso',
    // exterior
    'pintura exterior', 'pintar fachada', 'pintar frente', 'pintar pared exterior',
    'pintar garage', 'pintar medianera',
    // materiales
    'latex', 'esmalte', 'esmalte sintetico', 'pintura al agua', 'barniz',
    'sellador', 'fijador', 'imprimacion', 'anticorrosivo', 'antioxido',
    'enduido', 'enduido plastico', 'masilla',
    // acabados
    'pared', 'paredes', 'revoque', 'revestimiento', 'empapelar', 'papel de pared',
    'textura', 'textura plastica', 'veneciano', 'microcemento', 'stucco',
    // impermeabilizacion
    'impermeabilizacion', 'membrana liquida', 'impermeabilizante',
    'hidrofugar', 'hidrofugo', 'impermeabilizar pared', 'pintura impermeabilizante',
    // problemas
    'mancha de humedad', 'eflorescencia', 'pintura descascarada', 'pintura que salta',
    'burbuja en pintura', 'pared manchada', 'grasa en pared',
    // especialidades
    'pintura de decoracion', 'pintor decorador', 'estencil', 'efecto madera',
    'efecto oxidado', 'pintura mate', 'pintura satinada', 'pintura brillante',
    'pintura de pisos', 'pintar piso de cemento', 'pintura epoxi',
    // mantenimiento
    'repintar', 'segunda mano de pintura', 'preparar pared para pintar',
    'lijar pared', 'reparar pared antes de pintar',
  ],

  albanil: [
    // general
    'albanileria', 'construccion', 'obra', 'obra civil', 'constructor',
    // materiales
    'ladrillo', 'cemento', 'hormigon', 'mortero', 'arena', 'cal',
    'hierro', 'hierro de construccion', 'malla sima',
    // trabajos de pared
    'pared', 'levantar pared', 'medianera', 'pared divisoria', 'tabique',
    'revoque', 'revoque fino', 'revoque grueso', 'jaharro', 'enlucido',
    'mamposteria', 'ladrillo a la vista',
    // pisos y bases
    'contrapiso', 'contrapiso de cemento', 'nivelacion de piso', 'piso',
    'porcelanato', 'ceramica', 'colocacion de porcelanato', 'colocacion ceramica',
    'junta', 'fragüe', 'fragüe de ceramica', 'piso flotante', 'piso laminado',
    'carpeta niveladora', 'autonivelante',
    // estructura
    'fundacion', 'cimientos', 'encadenado', 'columna', 'viga', 'losa',
    'techo de losa', 'losa de hormigon',
    // ampliaciones y reformas
    'ampliacion', 'ampliacion de casa', 'reforma', 'remodelacion', 'refaccion',
    'reforma de cocina', 'reforma de bano', 'tirar pared', 'abrir pared',
    'cerrar pared', 'aberturas en pared',
    // banos y cocinas
    'revestimiento bano', 'revestimiento cocina', 'azulejo', 'colocacion azulejo',
    'colocacion revestimiento',
    // techos y losas
    'techo de losa', 'azotea', 'terraza', 'impermeabilizacion de azotea',
    'reparacion de losa', 'grieta en pared', 'rajadura', 'fisura',
    // varios
    'galpón', 'galpon', 'garage', 'quincho', 'quincho nuevo', 'pileta de albanileria',
    'muro de contencion', 'escalera de hormigon', 'vereda', 'hormigon veredas',
  ],

  cerrajero: [
    // general
    'cerrajeria', 'cerrajero urgente', 'cerrajero de urgencia',
    // cerraduras y llaves
    'cerradura', 'cerradura rota', 'cambio de cerradura', 'cerradura de seguridad',
    'cerradura doble paleta', 'cerradura de embutir', 'cerradura de sobreponer',
    'llave', 'llave perdida', 'me quede sin llave', 'se me olvido la llave',
    'duplicado de llave', 'copia de llave', 'llave maestra',
    'candado', 'candado roto', 'cerrojo', 'pasador', 'falleba',
    // puertas bloqueadas
    'puerta trabada', 'puerta bloqueada', 'me encerre', 'no puedo abrir la puerta',
    'puerta que no abre', 'apertura de puerta', 'abrir puerta sin llave',
    'apertura de emergencia', 'puerta bloqueda por dentro',
    // seguridad
    'caja fuerte', 'caja de seguridad', 'abrir caja fuerte', 'combinacion caja fuerte',
    'portero electrico', 'citofono', 'cerradura electronica', 'cerradura biometrica',
    'cerradura digital', 'smart lock', 'cerradura con codigo',
    // vehiculos
    'cerradura de auto', 'llave de auto', 'me quede afuera del auto',
    'duplicado llave de auto', 'transponder', 'llave con chip',
    // rejas y portones
    'cerradura de porton', 'cerradura de reja', 'traba de porton',
    'motor de porton', 'porton automatico',
  ],

  vidriero: [
    // general
    'vidrieria', 'vidrio', 'cristal', 'vidrios',
    // roturas
    'vidrio roto', 'vidrio quebrado', 'ventana rota', 'cambio de vidrio',
    'reemplazo de vidrio', 'vidrio quebrado por granizo',
    // ventanas
    'ventana', 'ventana de aluminio', 'ventana de pvc', 'marco de aluminio',
    'aberturas', 'ventana corrediza', 'ventana de guillotina', 'ventana batiente',
    // tipos de vidrio
    'dvh', 'doble vidriado hermetico', 'vidrio termico', 'vidrio insulado',
    'vidrio templado', 'vidrio laminado', 'vidrio de seguridad',
    'vidrio esmerilado', 'vidrio satinado', 'vidrio opaco',
    'vidrio de colores', 'vitraux',
    // bano
    'box de bano', 'mampara de ducha', 'mampara', 'vidrio de ducha',
    'box de vidrio', 'divisor de vidrio',
    // espejos
    'espejo', 'espejo de bano', 'espejo de cuerpo entero', 'colocacion espejo',
    'espejo roto', 'espejo con luz',
    // otros
    'pano fijo', 'panel de vidrio', 'balcón de vidrio', 'baranda de vidrio',
    'mosquitero', 'mosquitera', 'tela mosquitera', 'reja de ventana',
    'cubierta de vidrio', 'galeria de vidrio', 'invernadero',
  ],

  techista: [
    // general
    'techo', 'techado', 'techos', 'cubierta', 'cubierta de techo',
    // problemas
    'gotera', 'gotera en el techo', 'filtracion', 'filtra agua por el techo',
    'humedad en techo', 'mancha de humedad en techo', 'llueve adentro',
    'techo que pierde', 'perdida en el techo',
    // materiales
    'chapa', 'chapa de zinc', 'chapa trapezoidal', 'chapa ondulada', 'chapa ternium',
    'teja', 'teja colonial', 'teja ceramica', 'teja francesa',
    'pizarra', 'chapa con teja', 'policarbonato', 'techo de policarbonato',
    // impermeabilizacion
    'membrana', 'membrana asfaltica', 'membrana liquida', 'impermeabilizacion de techo',
    'impermeabilizar techo', 'membrana de poliuretano', 'techo asfaltado',
    // estructuras
    'azotea', 'terraza', 'canaleta', 'canaleta de agua', 'bajada de agua',
    'caballete', 'cumbre de techo', 'hastial', 'alero', 'goterón',
    // instalaciones
    'techo a dos aguas', 'techo a cuatro aguas', 'techo inclinado', 'techo plano',
    'techo de madera', 'estructura de techo', 'cercha', 'viga de techo',
    // mantenimiento
    'limpieza de canaleta', 'limpieza de techo', 'reparacion de techo',
    'techo roto', 'reparar gotera', 'sellar techo',
    // especiales
    'techo de galería', 'techo de quincho', 'techo de terraza', 'deck en terraza',
    'cenefa', 'alero de techo',
  ],

  herrero: [
    // general
    'herreria', 'herrero', 'metalúrgica', 'metalurgica', 'soldadura', 'soldar',
    'hierro', 'acero', 'metal', 'acero inoxidable',
    // rejas
    'reja', 'rejas', 'reja de ventana', 'reja de puerta', 'reja de seguridad',
    'reja artistica', 'reja con lanza', 'reja de jardin',
    // portones
    'porton', 'portones', 'porton de hierro', 'porton corredizo', 'porton batiente',
    'porton de garaje', 'porton automatico', 'motor de porton',
    // barandas
    'baranda', 'barandas', 'baranda de escalera', 'baranda de balcon',
    'baranda de hierro', 'baranda de acero inoxidable', 'baranda de vidrio y hierro',
    'pasamano', 'pasamanos',
    // escaleras y estructuras
    'escalera de hierro', 'escalera caracol', 'escalera exterior',
    'estructura metalica', 'estructura de hierro', 'columna de hierro',
    'viga de hierro', 'soporte metalico', 'soporte de hierro',
    // muebles y accesorios
    'mesa de hierro', 'silla de hierro', 'banco de jardin de hierro',
    'macetero de hierro', 'canasto de hierro',
    // puertas
    'puerta de hierro', 'puerta blindada', 'porton de chapa',
    // forja
    'forja', 'hierro forjado', 'forja artistica', 'hierro decorativo',
    // varios
    'soldadura autogena', 'soldadura electrica', 'mig tig', 'soldador',
    'contenedor de basura de hierro', 'arco de jardin',
  ],

  jardinero: [
    // general
    'jardineria', 'paisajismo', 'paisajista', 'jardin', 'parque',
    // pasto y cesped
    'pasto', 'cesped', 'cortar el pasto', 'cortada de pasto', 'corte de pasto',
    'cesped natural', 'cesped artificial', 'colocacion cesped artificial',
    'siembra de cesped', 'semilla de pasto', 'pasto bermuda', 'pasto kikuyo',
    'pasto seco', 'pasto amarillo',
    // poda
    'poda', 'poda de arboles', 'poda de arbustos', 'poda de setos', 'seto',
    'recorte de plantas', 'talar arbol', 'extraccion de arbol',
    'poda formativa', 'poda sanitaria', 'poda de rosales',
    // plantas
    'plantas', 'plantas de jardin', 'plantas de interior', 'trasplante de plantas',
    'plantacion', 'enripiado', 'cantero', 'rosal', 'flor', 'flores', 'bulbos',
    'arbol', 'arboles', 'arbustos', 'palmera', 'yuca', 'bambu',
    // riego
    'riego', 'sistema de riego', 'riego automatico', 'riego por goteo',
    'aspersor', 'manguera', 'programador de riego',
    // limpieza y mantenimiento
    'desmalezado', 'deshierbe', 'maleza', 'yuyo', 'yuyos', 'quitar yuyos',
    'limpieza de jardin', 'rastrillado', 'hojas secas', 'compost',
    'abono', 'fertilizante', 'control de plagas jardin',
    // construccion de jardín
    'parquizacion', 'diseno de jardin', 'diseño jardin', 'jardin nuevo',
    'caminos de jardin', 'adoquin', 'piedra en jardin', 'churrasquera',
    'estanque de jardin', 'fuente de agua',
    // herramientas
    'cortacesped', 'bordeadora', 'desmalezadora', 'motosierra',
  ],

  fumigador: [
    // general
    'fumigacion', 'desinfeccion', 'control de plagas', 'exterminacion',
    'desratizacion', 'desinsectacion', 'saneamiento',
    // insectos voladores
    'mosquito', 'mosquitos', 'dengue', 'aedes aegypti', 'mosca', 'moscas',
    'abeja', 'abejas', 'avispa', 'avispas', 'panal de avispas',
    'mariposa nocturna', 'polilla',
    // insectos rastreros
    'cucaracha', 'cucarachas', 'blattodea', 'cucaracha alemana',
    'hormiga', 'hormigas', 'nido de hormigas', 'hormiguero',
    'hormiga colorada', 'hormiga negra', 'hormiga argentina',
    'pulga', 'pulgas', 'chinche', 'chinches', 'piojo', 'piojos',
    'arania', 'arañas', 'vinchuca', 'vinchucas', 'garrapata', 'garrapatas',
    // roedores
    'rata', 'ratas', 'raton', 'ratones', 'laucha', 'lauchas',
    'murcielago', 'murcielagos', 'nido de ratas',
    // plagas de madera e infestaciones
    'termita', 'termitas', 'polilla de madera', 'carcoma',
    'pulgon', 'escarabajo de la madera',
    // servicios
    'fumigacion de casa', 'fumigacion de departamento', 'fumigacion de oficina',
    'fumigacion de local', 'fumigacion perimetral', 'barrera quimica',
    'certificado de fumigacion', 'libre de plagas',
    // productos
    'insecticida', 'raticida', 'cebo para ratas', 'trampa para ratones',
    'repelente', 'biocida',
  ],

  'aire acondicionado': [
    // general
    'aire acondicionado', 'ac', 'clima', 'climatizacion', 'climatizar',
    // tipos
    'split', 'split de pared', 'split de piso techo', 'split cassette',
    'split inverter', 'equipo inverter', 'minisplit', 'monosplit', 'multisplit',
    'aire portatil', 'aire de ventana', 'equipo de ventana',
    // marcas comunes para búsqueda
    'carrier', 'samsung', 'lg', 'tcl', 'midea', 'philco', 'bg', 'electra',
    // funcion
    'frio', 'calor', 'frio calor', 'solo frio', 'bomba de calor',
    'refrigeracion', 'refrigerar', 'enfriamiento', 'climatizacion',
    // instalacion
    'instalacion split', 'instalacion de aire', 'colocacion split',
    'montaje de aire acondicionado', 'instalar aire', 'pasaje de canos',
    'canos de aire acondicionado', 'soporte de split',
    // mantenimiento
    'mantenimiento aire', 'limpieza de filtros', 'limpieza de split',
    'servicio de aire acondicionado', 'mantenimiento anual',
    'desengrase split', 'limpieza de evaporador',
    // reparacion
    'aire que no enfria', 'aire que no funciona', 'aire que pierde agua',
    'gotea aire', 'ruido en split', 'aire que hace ruido', 'falla split',
    'aire apagado', 'error en pantalla split',
    // refrigerante
    'carga de gas', 'carga de gas refrigerante', 'recarga de gas',
    'refrigerante', 'r22', 'r410', 'r32', 'falta de gas',
  ],

  mudanza: [
    // general
    'mudanza', 'mudarse', 'mudanza completa', 'traslado', 'traslado de muebles',
    // vehiculos
    'flete', 'fletes', 'camion', 'camioneta', 'camioneta de flete',
    'camion chico', 'camion grande', 'pick up',
    // tareas
    'carga', 'descarga', 'porteo', 'subir muebles', 'bajar muebles',
    'acarreo', 'transporte de cosas', 'transporte de muebles',
    'embalaje', 'embalar', 'embalaje de muebles', 'cajones de mudanza',
    // tipos de mudanza
    'mudanza chica', 'mudanza grande', 'mudanza de departamento', 'mudanza de casa',
    'mudanza de oficina', 'mudanza de local comercial',
    'mudanza urgente', 'mudanza el mismo dia',
    // distancias
    'mudanza local', 'mudanza dentro de cordoba', 'mudanza interurbana',
    'mudanza interprovincial',
    // artículos especiales
    'transporte de piano', 'transporte de caja fuerte', 'transporte de heladera',
    'transporte de maquinaria',
    // almacenaje
    'deposito de muebles', 'guardamuebles', 'almacenaje temporal',
    'trastero', 'bodega',
  ],

  limpieza: [
    // general
    'limpieza', 'limpiar', 'servicio de limpieza', 'servicio domestico',
    'empleada domestica', 'empleada de limpieza', 'mucama', 'mucamas',
    // tipos de limpieza
    'limpieza de casa', 'limpieza de departamento', 'limpieza de hogar',
    'limpieza de oficina', 'limpieza de local', 'limpieza de negocio',
    'limpieza de escalera', 'limpieza de edificio',
    'limpieza profunda', 'limpieza a fondo', 'limpieza integral',
    'limpieza de fin de obra', 'limpieza post obra', 'limpieza de obra',
    // periodicidad
    'limpieza diaria', 'limpieza semanal', 'limpieza quincenal', 'limpieza mensual',
    'jornada de limpieza', 'media jornada',
    // tareas especificas
    'barrer', 'trapear', 'aspirar', 'pulir pisos', 'encerar pisos',
    'lustrar pisos', 'limpiar ventanas', 'limpiar vidrios',
    'ordenar', 'organizar', 'desinfectar', 'higienizar',
    'lavar bano', 'limpiar bano', 'limpiar cocina',
    // especiales
    'limpieza de post mudanza', 'limpieza antes de mudarse',
    'limpieza de cochera', 'limpieza de terraza',
    // productos
    'limpieza con productos propios', 'limpieza ecologica',
  ],

  'limpieza de tapizados': [
    // sofas y sillones
    'sofa', 'sillon', 'sillones', 'juego de living', 'tapizado',
    'sofa de tela', 'sofa de cuero', 'sillon de cuero', 'sillon de tela',
    'sofa esquinero', 'sofa tres cuerpos', 'loveseat',
    // camas
    'colchon', 'limpieza de colchon', 'cabecera', 'sommier',
    // alfombras y pisos textiles
    'alfombra', 'alfombras', 'alfombra persa', 'alfombra de bano',
    'alfombra de pelo largo', 'lavado de alfombra',
    // autos
    'butaca de auto', 'tapizado de auto', 'asiento de auto',
    // tareas
    'lavado de tapizado', 'limpieza de sofa', 'limpieza de sillon',
    'manchas en sofa', 'quitar manchas de sofa', 'desmanchar sillon',
    'olor en tapizado', 'desodorizar sofa', 'higienizar tapizado',
    // técnicas
    'lavado en seco', 'extraccion de manchas', 'vapor de agua',
    'shampo de tapizado', 'empresa de tapizados',
    // sillas y comedores
    'silla tapizada', 'sillas de comedor tapizadas', 'tapizado de silla',
    // cortinas y textiles
    'cortina', 'cortinas', 'lavado de cortinas', 'limpieza de cortinas',
  ],

  'limpieza de autos': [
    // general
    'lavado de auto', 'lavado de coche', 'limpieza de auto', 'limpieza de vehiculo',
    'lavado de camioneta', 'lavado de auto a domicilio',
    // tipos
    'lavado completo', 'lavado basico', 'lavado exterior', 'lavado interior',
    'lavado a mano', 'lavado con espuma',
    // interior
    'limpieza de interior', 'aspirado de auto', 'limpiar tablero',
    'limpiar alfombra de auto', 'eliminar mal olor del auto',
    'desodorizacion', 'ozonizacion', 'limpieza de tapizados de auto',
    // exterior
    'encerado', 'encerado de auto', 'pulido de auto', 'pulido de pintura',
    'pulido y encerado', 'lustrado de auto', 'brillo de auto',
    'tratamiento de pintura', 'ceramizado de auto', 'nano ceramica',
    // vidrios y gomas
    'limpiar vidrios de auto', 'limpiar parabrisas', 'tratamiento de gomas',
    // detailing
    'detailing', 'detailing de auto', 'auto detailing', 'full detailing',
    'descontaminacion de pintura', 'correcion de pintura',
  ],

  bicicletero: [
    // general
    'taller de bicicletas', 'reparacion de bicicletas', 'bicicleteria', 'bici',
    // tipos de bici
    'bicicleta', 'bicicleta de ruta', 'bicicleta de montana', 'bicicleta playera',
    'bicicleta electrica', 'bicicleta de paseo', 'rodado', 'rodado 29', 'rodado 26',
    // problemas comunes
    'pinchadura', 'goma pinchada', 'camara de bici', 'parche de bici',
    'bicicleta que no frena', 'frenos de bici', 'freno de disco bici',
    'cadena de bici', 'cadena que salta', 'cadena rota',
    'cambios de bici', 'velocidades de bici', 'descarrilador',
    // componentes
    'rueda', 'rueda de bici', 'llanta', 'rayos', 'cubierta de bici',
    'manubrio', 'asiento de bici', 'sillín', 'sillin', 'pedal', 'pedales',
    'biela', 'plato', 'cassette', 'piñon',
    // mantenimiento
    'lubricacion de bici', 'aceite de cadena', 'mantenimiento de bici',
    'ajuste de bici', 'limpieza de bici',
  ],

  modista: [
    // general
    'costura', 'costurera', 'taller de costura', 'confeccion de ropa', 'modista',
    // arreglos
    'arreglo de ropa', 'arreglos de ropa', 'achique de ropa', 'entallar ropa',
    'acortar pantalon', 'orlar pantalon', 'poner ruedo', 'ruedo de pantalon',
    'arreglo de vestido', 'arreglo de traje', 'arreglo de terno',
    'arreglo de ropa de novios', 'arreglo de saco',
    'meter de talle', 'sacar de talle', 'cambiar cierre', 'poner cierre',
    'coser boton', 'coser un desgarron',
    // confección a medida
    'ropa a medida', 'vestido a medida', 'traje a medida', 'ropa personalizada',
    'disfraz a medida', 'uniforme a medida', 'delantal',
    // especialidades
    'tela', 'vestido de novia', 'vestido de fiesta', 'vestido de egresada',
    'alteraciones de novias', 'calzas', 'ropa deportiva',
    'cortinas a medida', 'almohadon a medida', 'mantel a medida',
  ],

  'peluqueria canina': [
    // general
    'peluquero de perros', 'peluqueria canina', 'groomer', 'grooming canino',
    'estetica canina', 'bano y corte perro',
    // tareas
    'bano de perro', 'corte de pelo de perro', 'corte de uas de perro',
    'limpieza de oidos de perro', 'cepillado de perro', 'desenredado',
    'perfumado de perro', 'sacado de pelo muerto',
    // razas más buscadas
    'perro poodle', 'perro caniche', 'perro bichon', 'perro shih tzu',
    'perro schnauzer', 'perro yorkie', 'perro maltés', 'perro maltes',
    'perro labrador', 'perro golden', 'perro cocker',
    // otros animales
    'gato', 'bano de gato', 'corte de gato', 'grooming de gato',
    'mascota', 'mascotas',
    // servicios adicionales
    'spa canino', 'antipulgas', 'garrapaticida', 'desparasitacion externa',
    'a domicilio peluqueria', 'peluqueria canina a domicilio',
  ],

  'adiestrador de perros': [
    // general
    'adiestramiento canino', 'entrenamiento canino', 'educacion canina',
    'adiestrador profesional', 'entrenador de perros', 'comportamiento canino',
    // problemas de conducta
    'perro agresivo', 'perro que muerde', 'perro que ladra mucho', 'perro ansioso',
    'perro que jala la correa', 'perro que se fuga', 'perro miedoso',
    'perro que destruye todo', 'perro que salta a las personas',
    'perro que no obedece', 'perro travieso',
    // tipos de adiestramiento
    'obediencia basica', 'obediencia avanzada', 'adiestramiento de cachorros',
    'correccion de conducta', 'manejo de correa', 'comando basico',
    'perro guardián', 'perro guardian',
    // modalidades
    'clases de adiestramiento', 'adiestramiento a domicilio', 'internado canino',
    'adiestramiento grupal', 'adiestramiento individual',
  ],

  'cuidador canino profesional': [
    // paseos
    'paseador de perros', 'paseo de perros', 'paseo canino', 'dog walking',
    'dog walker', 'paseo grupal de perros', 'paseo individual de perros',
    // cuidado
    'cuidado de perros', 'cuidado de mascotas', 'pet sitter', 'petsitter',
    'cuidador de mascotas', 'niñero de perros',
    // guardería
    'guarderia canina', 'guarderia de perros', 'pensionado canino',
    'cuidado de perros mientras viajo', 'cuidar mi perro', 'perro en casa ajena',
    // especificos
    'visitas a domicilio para mascotas', 'alimentar mi perro', 'dar de comer al perro',
    'visitas a mi mascota', 'compania para mi perro',
  ],

  'personal trainer': [
    // general
    'entrenador personal', 'entrenador deportivo', 'profesor de educacion fisica',
    'coach deportivo', 'personal trainer a domicilio',
    // modalidades
    'entrenamiento a domicilio', 'entrenamiento en parque', 'entrenamiento online',
    'clases de gimnasia', 'clases particulares de gym',
    // tipos de entrenamiento
    'fuerza', 'musculacion', 'hipertrofia', 'bajar de peso', 'adelgazar',
    'tonificar', 'definir', 'cardio', 'aeróbico', 'funcional',
    'entrenamiento funcional', 'crossfit', 'pilates', 'yoga',
    'entrenamiento para adultos mayores', 'rehabilitacion deportiva',
    // ejercicios
    'pesas', 'pesas a domicilio', 'gym en casa', 'rutina de ejercicios',
    'planificacion de entrenamiento', 'plan de entrenamiento', 'tabla de ejercicios',
    // alimentacion
    'nutricion deportiva', 'plan nutricional', 'dieta', 'habitos saludables',
  ],

  'maestro particular': [
    // general
    'clase particular', 'clases particulares', 'tutor', 'tutoria', 'apoyo escolar',
    'refuerzo escolar', 'profesor particular', 'maestra particular',
    // materiales
    'matematica', 'fisica', 'quimica', 'biologia', 'historia', 'geografia',
    'lengua', 'literatura', 'filosofia', 'economia', 'contabilidad',
    'estadistica', 'calculo', 'algebra', 'trigonometria',
    // idiomas
    'ingles', 'frances', 'aleman', 'portugues', 'italiano', 'chino',
    'clases de idioma', 'aprender ingles', 'conversacion en ingles',
    // nivel
    'primaria', 'secundaria', 'preparatoria', 'facultad', 'universidad',
    'CBC', 'ingreso universitario', 'aplazo', 'previas',
    // otros
    'musica', 'guitarra', 'piano', 'canto', 'dibujo', 'pintura artistica',
    'computacion', 'programacion para ninos',
  ],

  'servicios de catering': [
    // general
    'catering', 'servicio de catering', 'cocinero', 'chef', 'chef a domicilio',
    'servicio de comida', 'banquete',
    // eventos
    'catering para eventos', 'catering para fiestas', 'catering para cumpleanos',
    'catering para casamiento', 'catering para empresas', 'catering corporativo',
    'catering para baby shower', 'catering para 15 años', 'catering para 15 anos',
    // tipos de servicio
    'buffet', 'mesa dulce', 'brunch', 'desayuno de trabajo', 'almuerzo de trabajo',
    'coffee break', 'copetín', 'cena de gala', 'asado con servicio',
    // comidas
    'empanadas', 'sandwiches', 'sanguches', 'tapas', 'finger food',
    'asado', 'parrilla', 'pizza para eventos', 'sushi para eventos',
    // mozos y personal
    'mozo', 'mozos', 'servicio de mozos', 'personal de eventos', 'bartender',
    'barman', 'cocteleria',
  ],

  pasteleria: [
    // general
    'pasteleria', 'reposteria', 'pastelero', 'repostero', 'panaderia artesanal',
    // tortas
    'torta', 'tortas', 'torta de cumpleanos', 'torta decorada', 'torta a pedido',
    'torta infantil', 'torta de casamiento', 'wedding cake', 'torta de novios',
    'torta de egresados', 'naked cake', 'drip cake', 'torta fondant',
    // cupcakes y masas
    'cupcake', 'cupcakes', 'muffin', 'magdalena', 'alfajor', 'alfajores',
    'brownie', 'brownies', 'cookies', 'galletas', 'macarons', 'facturas',
    // para eventos
    'mesa dulce', 'candy bar', 'recuerditos', 'souvenirs comestibles',
    'sorpresitas', 'golosinas personalizadas', 'chocolates personalizados',
    // panaderia
    'pan artesanal', 'pan casero', 'masa madre', 'medialunas', 'pan de campo',
    'pan dulce', 'pan de pascua',
    // especialidades
    'postre', 'postres', 'flan', 'tiramisu', 'cheesecake', 'budin',
    'mousse', 'panna cotta', 'gelato', 'helado artesanal',
  ],

  'alquiler vajilla': [
    // vajilla y servicio
    'vajilla', 'alquiler de vajilla', 'platos', 'vasos', 'cubiertos', 'copas',
    'tazas', 'platitos', 'fuentes', 'bandejas', 'cristaleria',
    // menaje
    'mantel', 'servilleta', 'individual', 'centro de mesa', 'candelabro',
    // mobiliario de eventos
    'mesa plegable', 'silla plegable', 'sillas para eventos', 'mesa para eventos',
    'mesa redonda', 'mesa rectangular', 'mesa coctel', 'posapie',
    // decoracion
    'arco de globos', 'decoracion de evento', 'centros de mesa',
    'sabanas', 'tela para mesa',
    // para que evento
    'alquiler para cumpleanos', 'alquiler para casamiento', 'alquiler para quinceañera',
    'alquiler para baby shower', 'alquiler para evento empresarial',
    // otros
    'paellera', 'asadera', 'olla grande', 'hielera', 'dispensador de bebidas',
  ],

  'impermeabilizador hogar': [
    // general
    'impermeabilizacion', 'impermeabilizar', 'impermeabilizante',
    'tratamiento de humedad', 'control de humedad',
    // problemas
    'humedad', 'mancha de humedad', 'pared humeda', 'humedad en pared',
    'humedad en techo', 'humedad en sotano', 'humedad en garage',
    'eflorescencia', 'salitre', 'hongos por humedad', 'moho',
    // sectores
    'gotera', 'gotera en techo', 'filtracion', 'filtración de agua',
    'impermeabilizar azotea', 'impermeabilizar terraza', 'impermeabilizar losa',
    'impermeabilizar sotano', 'impermeabilizar paredes',
    // productos y tecnicas
    'membrana', 'membrana asfaltica', 'membrana liquida', 'manto asfaltico',
    'sikaflex', 'hidrofugo', 'hidrofugar', 'cristalizacion',
    'inyeccion de silicona', 'drenaje frances',
    // edificios
    'impermeabilizar edificio', 'frente de edificio', 'balcón',
    'cubierta plana',
  ],

  'cambio de baterias': [
    // batería de auto
    'bateria auto', 'bateria de auto', 'cambio de bateria de auto',
    'bateria muerta', 'auto que no arranca', 'no arranca el auto',
    'bateria descargada', 'bateria agotada', 'chequeo de bateria',
    'pasacorriente', 'pasa corriente',
    // marcas
    'bateria moura', 'bateria bosch', 'bateria tudor', 'bateria optima',
    // otros vehiculos
    'bateria de moto', 'bateria de camioneta', 'bateria de camion',
    // baterias en general
    'cambio de bateria de reloj', 'bateria de control remoto',
    'bateria de laptop', 'bateria de celular',
  ],

  'servicio tecnico de electrodomesticos': [
    // general
    'reparacion de electrodomesticos', 'tecnico de electrodomesticos',
    'servicio tecnico', 'arreglo de electrodomestico',
    // lavado
    'lavarropas', 'lavarropas roto', 'lavarropas que no centrifuga',
    'lavarropas que no drena', 'lavarropas que pierde agua', 'lavarropas que no enciende',
    'lavavajillas', 'lavavajillas roto', 'lavadora',
    // frio
    'heladera', 'heladera rota', 'heladera que no enfria', 'heladera que congela todo',
    'freezer', 'freezer que no enfria', 'heladera con escarcha',
    'heladera que hace ruido', 'no congela',
    // coccion
    'horno', 'horno que no calienta', 'horno roto', 'microondas', 'microondas roto',
    'cocina electrica', 'anafe', 'horno electrico', 'hornito',
    'secarropas', 'secarropas roto',
    // pequeños electrodomesticos
    'aspiradora', 'aspiradora rota', 'plancha', 'plancha rota',
    'cafetera', 'licuadora', 'procesadora', 'tostadora',
    // servicio
    'reparacion a domicilio', 'tecnico a domicilio', 'servicio a domicilio',
    'garantia de reparacion', 'presupuesto sin cargo',
  ],

  'servicio tecnico informatico': [
    // dispositivos
    'computadora', 'pc', 'laptop', 'notebook', 'netbook', 'mac', 'imac', 'macbook',
    'tablet', 'ipad', 'celular', 'smartphone', 'impresora', 'escaner',
    // problemas de software
    'virus', 'virus en pc', 'malware', 'spyware', 'ransomware', 'pc lenta',
    'formateo', 'reinstalacion de windows', 'windows', 'linux', 'macos',
    'actualizacion de sistema', 'drivers', 'controladores',
    // problemas de hardware
    'pantalla rota', 'pantalla que no enciende', 'teclado roto',
    'mouse roto', 'disco rigido', 'disco ssd', 'memoria ram',
    'fuente de alimentacion', 'placa de video', 'placa madre',
    'ventilador de pc', 'pc que se calienta', 'pc que se apaga sola',
    // redes
    'internet', 'wifi', 'red', 'redes', 'no tengo internet', 'wifi lento',
    'configuracion de red', 'router', 'switch', 'cableado de red',
    'fibra optica', 'configuracion de wifi',
    // recuperacion de datos
    'recuperacion de datos', 'recuperar archivos borrados',
    'disco rigido roto', 'backup', 'copia de seguridad',
    // otros servicios
    'soporte informatico', 'soporte tecnico', 'asistencia remota',
    'instalacion de programas', 'configuracion de email', 'outlook',
    'criptomineria', 'servidor', 'nas', 'camara de seguridad', 'cctv',
  ],
};
