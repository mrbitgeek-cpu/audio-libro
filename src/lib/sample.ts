import type { Book, Chapter, Page } from "./types";
import { paginateChapter, type SimpleChapter } from "./text";

interface RawChapter {
  title: string;
  paragraphs: string[];
  footnotes: string[];
}

const RUNNING_HEAD = "El ingenioso hidalgo don Quijote de la Mancha";

const RAW: RawChapter[] = [
  {
    title: "Capítulo I — Que trata de la condición y ejercicio del famoso hidalgo",
    paragraphs: [
      "En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lantejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.",
      "Frisaba la edad de nuestro hidalgo con los cincuenta años; era de complexión recia, seco de carnes, enjuto de rostro, gran madrugador y amigo de la caza. Quieren decir que tenía el sobrenombre de Quijada, o Quesada, que en esto hay alguna diferencia en los autores que deste caso escriben; aunque por conjeturas verosímiles se deja entender que se llamaba Quijana.",
      "Es, pues, de saber que este sobredicho hidalgo, los ratos que estaba ocioso, que eran los más del año, se daba a leer libros de caballerías, con tanta afición y gusto, que olvidó casi de todo punto el ejercicio de la caza, y aun la administración de su hacienda; y llegó a tanto su curiosidad y desatino en esto, que vendió muchas hanegas de tierra de sembradura para comprar libros de caballerías en que leer.",
      "En efecto, rematado ya su juicio, vino a dar en el más extraño pensamiento que jamás dio loco en el mundo, y fue que le pareció convenible y necesario, así para el aumento de su honra como para el servicio de su república, hacerse caballero andante, e irse por todo el mundo con sus armas y caballo a buscar las aventuras.",
      "Y lo primero que hizo fue limpiar unas armas que habían sido de sus bisabuelos, que, tomadas de orín y llenas de moho, luengos siglos había que estaban puestas y olvidadas en un rincón. Limpiólas y aderezólas lo mejor que pudo, pero vio que tenían una gran falta, y era que no tenían celada de encaje, sino morrión simple.",
    ],
    footnotes: [
      "1 Duelos y quebrantos: plato humilde de la época, a base de huevos con torreznos.",
      "2 Hanega: medida castellana de capacidad para áridos, equivalente a unos cincuenta y cinco litros.",
    ],
  },
  {
    title: "Capítulo II — Que trata de la primera salida que de su tierra hizo don Quijote",
    paragraphs: [
      "Hechas, pues, estas prevenciones, no quiso aguardar más tiempo a poner en efecto su pensamiento, apretándole a ello la falta que él pensaba que hacía en el mundo su tardanza, según eran los agravios que pensaba deshacer, tuertos que enderezar, sinrazones que enmendar, y abusos que mejorar y deudas que satisfacer.",
      "Y así, sin dar parte a persona alguna de su intención, y sin que nadie le viese, una mañana, antes del día, que era uno de los calurosos del mes de julio, se armó de todas sus armas, subió sobre Rocinante, puesta su mal compuesta celada, embrazó su adarga, tomó su lanza, y por la puerta falsa de un corral salió al campo con grandísimo contento y alborozo.",
      "Mas apenas se vio en el campo, cuando le asaltó un pensamiento terrible, y tal, que por poco le hiciera dejar la comenzada empresa; y fue que le vino a la memoria que no era armado caballero, y que, conforme a ley de caballería, ni podía ni debía tomar armas con ningún caballero.",
      "Con todo eso, caminó todo aquel día, y al anochecer su rocín y él se hallaron cansados y muertos de hambre; y que, mirando a todas partes por ver si descubriría algún castillo o alguna majada de pastores donde recogerse, vio, no lejos del camino por donde iba, una venta, que fue como si viera una estrella.",
    ],
    footnotes: [
      "3 Tuerto: en castellano antiguo, agravio o injusticia que se hace a alguien.",
    ],
  },
  {
    title: "Capítulo VIII — De los molinos de viento y otros sucesos dignos de felice recordación",
    paragraphs: [
      "En esto, descubrieron treinta o cuarenta molinos de viento que hay en aquel campo, y así como don Quijote los vio, dijo a su escudero: «La ventura va guiando nuestras cosas mejor de lo que acertáramos a desear; porque ves allí, amigo Sancho Panza, donde se descubren treinta o pocos más desaforados gigantes, con quien pienso hacer batalla».",
      "«¿Qué gigantes?», dijo Sancho Panza. «Aquellos que allí ves», respondió su amo, «de los brazos largos, que los suelen tener algunos de casi dos leguas». «Mire vuestra merced», respondió Sancho, «que aquellos que allí se parecen no son gigantes, sino molinos de viento, y lo que en ellos parecen brazos son las aspas, que, volteadas del viento, hacen andar la piedra del molino».",
      "«Bien parece», respondió don Quijote, «que no estás cursado en esto de las aventuras: ellos son gigantes; y si tienes miedo, quítate de ahí, y ponte en oración en el espacio que yo voy a entrar con ellos en fiera y desigual batalla». Y, diciendo esto, dio de espuelas a su caballo Rocinante, sin atender a las voces que su escudero Sancho le daba.",
      "En esto, se levantó un poco de viento, y las grandes aspas comenzaron a moverse, lo cual visto por don Quijote, dijo: «Pues aunque mováis más brazos que los del gigante Briareo, me lo habéis de pagar». Y, encomendándose de todo corazón a su señora Dulcinea, arremetió a todo el galope de Rocinante y embistió con el primer molino que estaba delante.",
      "Pero el aspa le dio en la lanza, y la hizo pedazos, llevándose tras sí al caballo y al caballero, que rodó muy maltrecho por el campo. Acudió Sancho Panza a socorrerle, a todo el correr de su asno, y cuando llegó halló que no se podía mover: tal fue el golpe que dio con él Rocinante.",
      "«¡Válame Dios!», dijo Sancho. «¿No le dije yo a vuestra merced que mirase bien lo que hacía, que no eran sino molinos de viento, y no lo podía ignorar sino quien llevase otros tales en la cabeza?». «Calla, amigo Sancho», respondió don Quijote, «que las cosas de la guerra más que otras están sujetas a continua mudanza».",
    ],
    footnotes: [
      "4 Briareo: gigante de la mitología griega que tenía cien brazos.",
      "5 Felice: forma antigua y culta de la palabra «feliz».",
    ],
  },
];

/** Construye el libro de ejemplo aplicando la misma limpieza que a los EPUB. */
export function buildSampleBook(): Book {
  // líneas repetidas entre capítulos (encabezados) + números sueltos
  const freq = new Map<string, number>();
  const allLines: string[] = [RUNNING_HEAD, RUNNING_HEAD, RUNNING_HEAD];
  for (const ch of RAW) {
    allLines.push(ch.title);
    for (const p of ch.paragraphs) if (p.length <= 90) allLines.push(p);
  }
  for (const l of allLines) {
    const k = l.toLowerCase().replace(/\s+/g, " ");
    freq.set(k, (freq.get(k) ?? 0) + 1);
  }

  const pages: Page[] = [];
  const chapters: Chapter[] = [];
  let removedCount = 0;

  RAW.forEach((raw, ci) => {
    const removed: string[] = [];
    const headKey = RUNNING_HEAD.toLowerCase();
    if ((freq.get(headKey) ?? 0) >= 3) {
      removed.push(`Encabezado repetido: «${RUNNING_HEAD}»`);
      removedCount += 1;
    }
    removed.push(`${raw.footnotes.length} nota(s) al pie omitida(s)`);
    removedCount += raw.footnotes.length;

    const chapter: SimpleChapter = {
      title: raw.title,
      paragraphs: [
        { text: raw.title, heading: true },
        ...raw.paragraphs.map((t) => ({ text: t })),
      ],
    };
    const chPages = paginateChapter(chapter, ci, removed);
    chapters.push({
      title: raw.title,
      startPage: pages.length,
      endPage: pages.length + Math.max(0, chPages.length - 1),
    });
    pages.push(...chPages);
  });

  return {
    title: "Don Quijote de la Mancha (fragmento)",
    author: "Miguel de Cervantes",
    source: "sample",
    fileName: "muestra · dominio público",
    pages,
    chapters,
    removedCount,
    totalWords: pages.reduce((a, p) => a + p.words, 0),
  };
}
