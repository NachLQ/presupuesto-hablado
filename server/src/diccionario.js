// Diccionario inicial del tarifario por oficio.
// Cada concepto: { nombre, sinonimos, precio_unitario, unidad }
// Los sinonimos son las formas en que un tecnico podria "decir" el concepto al dictar.

const TARIFARIO = {
  fontaneria: [
    { nombre: 'Desplazamiento a obra', sinonimos: ['desplazamiento', 'desplazamiento a obra', 'visita', 'salida'], precio_unitario: 15, unidad: 'visita' },
    { nombre: 'Hora mano de obra fontaneria', sinonimos: ['mano de obra', 'hora mano de obra', 'hora de mano de obra', 'horas de mano de obra', 'mano de obra fontaneria'], precio_unitario: 35, unidad: 'hora' },
    { nombre: 'Cambio grifo monomando', sinonimos: ['grifo monomando', 'cambio grifo monomando', 'cambio de grifo monomando', 'grifo de cocina monomando', 'grifo cocina', 'grifo'], precio_unitario: 45, unidad: 'unidad' },
    { nombre: 'Cambio grifo termostatico', sinonimos: ['grifo termostatico', 'cambio grifo termostatico', 'grifo termostatico ducha'], precio_unitario: 95, unidad: 'unidad' },
    { nombre: 'Cambio sifon fregadero', sinonimos: ['sifon', 'cambio sifon', 'sifon fregadero', 'cambio de sifon'], precio_unitario: 30, unidad: 'unidad' },
    { nombre: 'Sustitucion WC completo', sinonimos: ['wc', 'cambio wc', 'sustitucion wc', 'inodoro', 'cambio de wc', 'retrete', 'cambiar wc'], precio_unitario: 180, unidad: 'unidad' },
    { nombre: 'Cambio calentador electrico 50L', sinonimos: ['calentador', 'calentador electrico', 'cambio calentador', 'calentador electrico 50 litros', 'termo electrico', 'cambio calentador electrico 50 litros'], precio_unitario: 220, unidad: 'unidad' },
    { nombre: 'Revision caldera gas', sinonimos: ['revision caldera', 'caldera', 'revision de caldera', 'mantenimiento caldera', 'caldera gas'], precio_unitario: 80, unidad: 'visita' },
    { nombre: 'Cambio valvula de paso', sinonimos: ['valvula de paso', 'cambio valvula', 'llave de paso', 'cambio de valvula'], precio_unitario: 35, unidad: 'unidad' },
    { nombre: 'Instalacion lavadora (conexion)', sinonimos: ['instalacion lavadora', 'conexion lavadora', 'conectar lavadora', 'instalar lavadora'], precio_unitario: 50, unidad: 'unidad' },
    { nombre: 'Cambio ducha completa', sinonimos: ['ducha', 'cambio ducha', 'plato de ducha', 'cambio de ducha', 'cambiar ducha', 'cambio plato ducha'], precio_unitario: 250, unidad: 'unidad' },
    { nombre: 'Desatasco mecanico', sinonimos: ['desatasco', 'desatasco mecanico', 'desatascar', 'atasco'], precio_unitario: 90, unidad: 'visita' },
    { nombre: 'Revision instalacion general', sinonimos: ['revision instalacion', 'revision general', 'revision instalacion general'], precio_unitario: 60, unidad: 'visita' },
    { nombre: 'Cambio contador agua', sinonimos: ['contador agua', 'cambio contador', 'contador de agua'], precio_unitario: 70, unidad: 'unidad' },
    { nombre: 'Instalacion grifo jardin', sinonimos: ['grifo jardin', 'instalacion grifo jardin', 'grifo de jardin'], precio_unitario: 40, unidad: 'unidad' },
  ],
  electricidad: [
    { nombre: 'Desplazamiento a obra', sinonimos: ['desplazamiento', 'desplazamiento a obra', 'visita', 'salida'], precio_unitario: 15, unidad: 'visita' },
    { nombre: 'Hora mano de obra electricidad', sinonimos: ['mano de obra electricidad', 'hora mano de obra electricidad', 'mano de obra electrica'], precio_unitario: 35, unidad: 'hora' },
    { nombre: 'Punto de luz (enchufe)', sinonimos: ['punto de luz', 'puntos de luz', 'enchufe', 'enchufes', 'punto de luz enchufe', 'instalacion enchufe', 'instalacion de enchufe', 'toma de corriente'], precio_unitario: 35, unidad: 'unidad' },
    { nombre: 'Punto de luz (interruptor)', sinonimos: ['interruptor', 'interruptores', 'punto de luz interruptor', 'instalacion interruptor', 'conmutador'], precio_unitario: 35, unidad: 'unidad' },
    { nombre: 'Instalacion luminaria', sinonimos: ['luminaria', 'instalacion luminaria', 'lampara', 'instalacion lampara', 'foco', 'plafon'], precio_unitario: 40, unidad: 'unidad' },
    { nombre: 'Cuadro electrico (revision)', sinonimos: ['cuadro electrico revision', 'revision cuadro electrico', 'revision cuadro', 'cuadro electrico', 'revisar cuadro'], precio_unitario: 60, unidad: 'visita' },
    { nombre: 'Cuadro electrico (sustitucion)', sinonimos: ['cuadro electrico sustitucion', 'sustitucion cuadro electrico', 'cambio cuadro electrico', 'cambiar cuadro electrico'], precio_unitario: 280, unidad: 'unidad' },
    { nombre: 'Instalacion diferencial', sinonimos: ['diferencial', 'instalacion diferencial', 'cambio diferencial'], precio_unitario: 55, unidad: 'unidad' },
    { nombre: 'Instalacion magnetotermico', sinonimos: ['magnetotermico', 'instalacion magnetotermico', 'automatico', 'cambio magnetotermico'], precio_unitario: 35, unidad: 'unidad' },
    { nombre: 'Cableado por metro', sinonimos: ['cableado', 'cableado por metro', 'cable', 'metro de cable', 'tirar cable'], precio_unitario: 8, unidad: 'metro' },
    { nombre: 'Instalacion SAI/protector', sinonimos: ['sai', 'protector', 'instalacion sai', 'protector de sobretension'], precio_unitario: 90, unidad: 'unidad' },
    { nombre: 'Instalacion domotica basica', sinonimos: ['domotica', 'instalacion domotica', 'domotica basica'], precio_unitario: 150, unidad: 'unidad' },
    { nombre: 'Instalacion timbre', sinonimos: ['timbre', 'instalacion timbre', 'cambio timbre'], precio_unitario: 40, unidad: 'unidad' },
    { nombre: 'Instalacion extractor bano', sinonimos: ['extractor', 'instalacion extractor', 'extractor bano', 'extractor de bano'], precio_unitario: 75, unidad: 'unidad' },
    { nombre: 'Certificado instalacion electrica', sinonimos: ['certificado', 'certificado instalacion electrica', 'boletin', 'boletin electrico'], precio_unitario: 120, unidad: 'unidad' },
  ],
  reformas: [
    { nombre: 'Desplazamiento a obra', sinonimos: ['desplazamiento', 'desplazamiento a obra', 'visita', 'salida'], precio_unitario: 15, unidad: 'visita' },
    { nombre: 'Hora oficial de obra', sinonimos: ['oficial', 'hora oficial', 'hora oficial de obra', 'horas de oficial', 'mano de obra oficial'], precio_unitario: 28, unidad: 'hora' },
    { nombre: 'Hora peon', sinonimos: ['peon', 'hora peon', 'hora de peon', 'horas de peon', 'horas peon'], precio_unitario: 20, unidad: 'hora' },
    { nombre: 'Metro cuadrado alicatado', sinonimos: ['alicatado', 'alicatar', 'metro cuadrado alicatado', 'azulejo', 'alicatado bano'], precio_unitario: 35, unidad: 'm2' },
    { nombre: 'Metro cuadrado pintura', sinonimos: ['pintura', 'pintar', 'metro cuadrado pintura', 'pintura pared'], precio_unitario: 12, unidad: 'm2' },
    { nombre: 'Metro lineal rodapie', sinonimos: ['rodapie', 'metro lineal rodapie', 'rodapies'], precio_unitario: 9, unidad: 'ml' },
    { nombre: 'Instalacion puerta interior', sinonimos: ['puerta interior', 'instalacion puerta', 'puerta', 'colocar puerta', 'montar puerta'], precio_unitario: 120, unidad: 'unidad' },
    { nombre: 'Instalacion ventana PVC', sinonimos: ['ventana pvc', 'instalacion ventana', 'ventana', 'colocar ventana'], precio_unitario: 280, unidad: 'unidad' },
    { nombre: 'Metro cuadrado suelo laminado', sinonimos: ['suelo laminado', 'laminado', 'metro cuadrado suelo laminado', 'tarima', 'suelo'], precio_unitario: 22, unidad: 'm2' },
    { nombre: 'Demolicion tabique (m2)', sinonimos: ['demolicion tabique', 'demolicion', 'tirar tabique', 'derribo tabique'], precio_unitario: 18, unidad: 'm2' },
    { nombre: 'Tabique pladur (m2)', sinonimos: ['pladur', 'tabique pladur', 'tabique de pladur', 'montar pladur'], precio_unitario: 38, unidad: 'm2' },
    { nombre: 'Metro cuadrado enfoscado', sinonimos: ['enfoscado', 'enfoscar', 'metro cuadrado enfoscado'], precio_unitario: 16, unidad: 'm2' },
    { nombre: 'Instalacion falso techo (m2)', sinonimos: ['falso techo', 'instalacion falso techo', 'techo pladur'], precio_unitario: 30, unidad: 'm2' },
    { nombre: 'Metro cuadrado impermeabilizacion', sinonimos: ['impermeabilizacion', 'impermeabilizar', 'tela asfaltica'], precio_unitario: 25, unidad: 'm2' },
    { nombre: 'Revision y sellado juntas', sinonimos: ['sellado juntas', 'revision juntas', 'sellado de juntas', 'sellar juntas', 'silicona juntas'], precio_unitario: 45, unidad: 'visita' },
  ],
};

module.exports = { TARIFARIO };
