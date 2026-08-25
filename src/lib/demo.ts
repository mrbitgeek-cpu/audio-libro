import type { Book, RawLine } from "./types";
import { uid } from "./book";

const PAGE_H = 800;
const LEFT = 56;
const INDENT = 86;

/** Envuelve un párrafo como si viniera maquetado en líneas de ~96 caracteres. */
function wrap(text: string, width = 96): string[] {
  const words = text.split(" ");
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    if (line && (line + " " + w).length > width) {
      out.push(line);
      line = w;
    } else {
      line = line ? line + " " + w : w;
    }
  }
  if (line) out.push(line);
  return out;
}

interface DemoPage {
  body: string[];
  foot: string[];
  num: string;
}

function makePage({ body, foot, num }: DemoPage): RawLine[] {
  const lines: RawLine[] = [];
  lines.push({ text: "DON QUIJOTE DE LA MANCHA", size: 8, y: 772, x: LEFT, pageH: PAGE_H });

  let y = 726;
  for (const para of body) {
    const wrapped = wrap(para);
    wrapped.forEach((t, i) => {
      lines.push({ text: t, size: 11, y, x: i === 0 ? INDENT : LEFT, pageH: PAGE_H });
      y -= 17;
    });
    y -= 9;
  }

  let fy = 104;
  for (const f of foot) {
    for (const t of wrap(f, 88)) {
      lines.push({ text: t, size: 8, y: fy, x: LEFT, pageH: PAGE_H });
      fy -= 13;
    }
    fy -= 4;
  }

  lines.push({ text: num, size: 9, y: 20, x: 260, pageH: PAGE_H });
  return lines;
}

const P1 = [
  "En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor.",
  "Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lantejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.",
  "El resto della concluían sayo de velarte, calzas de velludo para las fiestas, con sus pantuflos de lo mesmo, y los días de entresemana se honraba con su vellorí de lo más fino.",
  "Frisaba la edad de nuestro hidalgo con los cincuenta años; era de complexión recia, seco de carnes, enjuto de rostro, gran madrugador y amigo de la caza.",
];

const P2 = [
  "Quieren decir que tenía el sobrenombre de Quijada, o Quesada, que en esto hay alguna diferencia en los autores que deste caso escriben; aunque, por conjeturas verosímiles, se deja entender que se llamaba Quijana.",
  "Pero esto importa poco a nuestro cuento; basta que en la narración dél no se salga un punto de la verdad.",
  "Es, pues, de saber que este sobredicho hidalgo, los ratos que estaba ocioso, que eran los más del año, se daba a leer libros de caballerías, con tanta afición y gusto, que olvidó casi de todo punto el ejercicio de la caza, y aun la administración de su hacienda.",
  "Y llegó a tanto su curiosidad y desatino en esto, que vendió muchas hanegas de tierra de sembradura para comprar libros de caballerías en que leer, y así, llevó a su casa todos cuantos pudo haber dellos.",
];

const P3 = [
  "En resolución, él se enfrascó tanto en su lectura, que se le pasaban las noches leyendo de claro en claro, y los días de turbio en turbio; y así, del poco dormir y del mucho leer, se le secó el celebro, de manera que vino a perder el juicio.",
  "Llenósele la fantasía de todo aquello que leía en los libros, así de encantamentos como de pendencias, batallas, desafíos, heridas, requiebros, amores, tormentas y disparates imposibles.",
  "Y asentósele de tal modo en la imaginación que era verdad toda aquella máquina de aquellas soñadas invenciones que leía, que para él no había otra historia más cierta en el mundo.",
];

export function makeDemoBook(): Book {
  const raw: RawLine[][] = [
    makePage({
      body: P1,
      foot: [
        "1. En la edición príncipe de 1605 esta frase aparece sin la coma que hoy la separa del resto del periodo.",
        "Los editores modernos han discutido largamente su puntuación.",
      ],
      num: "— 7 —",
    }),
    makePage({
      body: P2,
      foot: [
        "2. Las hanegas eran medidas de superficie agraria usadas en la España del siglo XVII.",
      ],
      num: "— 8 —",
    }),
    makePage({
      body: P3,
      foot: [
        "3. «De claro en claro»: de madrugada a madrugada, sin que llegue a apagarse la luz.",
      ],
      num: "— 9 —",
    }),
  ];

  return {
    id: uid(),
    title: "Don Quijote de la Mancha · Capítulo I",
    author: "Miguel de Cervantes",
    source: "demo",
    raw,
    pages: null,
  };
}
