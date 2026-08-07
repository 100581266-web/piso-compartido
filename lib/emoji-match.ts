const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(text: string): string {
  return text.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

function matchEmoji(text: string, dictionary: [string[], string][], fallback: string): string {
  const normalized = normalize(text);
  for (const [keywords, emoji] of dictionary) {
    if (keywords.some((k) => normalized.includes(k))) {
      return emoji;
    }
  }
  return fallback;
}

const CHORE_DICTIONARY: [string[], string][] = [
  [["basura", "reciclaje", "reciclar", "contenedor"], "🗑️"],
  [["cocina", "fogones", "horno"], "🍳"],
  [["bano", "wc", "retrete", "inodoro"], "🚽"],
  [["plato", "vajilla", "fregar", "lavavajillas"], "🍽️"],
  [["barrer", "escoba", "recoger"], "🧹"],
  [["aspirar", "aspiradora"], "🌀"],
  [["polvo", "limpiar", "limpieza"], "🧼"],
  [["ropa", "colada", "lavadora", "tender", "planchar"], "🧺"],
  [["planta", "regar", "jardin", "terraza"], "🪴"],
  [["ventana", "cristal", "espejo"], "🪟"],
  [["nevera", "frigorifico", "congelador"], "🧊"],
  [["compra", "supermercado"], "🛒"],
  [["mascota", "perro", "gato"], "🐾"],
];

const GROCERY_DICTIONARY: [string[], string][] = [
  [["leche"], "🥛"],
  [["yogur", "yogures"], "🍮"],
  [["queso"], "🧀"],
  [["huevo"], "🥚"],
  [["mantequilla", "margarina"], "🧈"],
  [["pan", "baguette", "barra"], "🍞"],
  [["galleta"], "🍪"],
  [["chocolate", "cacao"], "🍫"],
  [["manzana"], "🍎"],
  [["platano", "banana"], "🍌"],
  [["naranja", "mandarina"], "🍊"],
  [["limon"], "🍋"],
  [["fresa"], "🍓"],
  [["uva"], "🍇"],
  [["tomate"], "🍅"],
  [["patata", "papa"], "🥔"],
  [["cebolla"], "🧅"],
  [["ajo"], "🧄"],
  [["zanahoria"], "🥕"],
  [["lechuga", "ensalada", "verdura"], "🥬"],
  [["pimiento"], "🫑"],
  [["fruta"], "🍎"],
  [["pollo"], "🍗"],
  [["carne", "ternera", "filete"], "🥩"],
  [["pescado", "salmon", "atun", "merluza"], "🐟"],
  [["marisco", "gamba"], "🦐"],
  [["arroz"], "🍚"],
  [["pasta", "macarron", "espagueti"], "🍝"],
  [["pizza"], "🍕"],
  [["agua"], "💧"],
  [["zumo"], "🧃"],
  [["cafe"], "☕"],
  [["te ", "infusion"], "🍵"],
  [["cerveza", "birra"], "🍺"],
  [["vino"], "🍷"],
  [["papel higienico", "papel de bano"], "🧻"],
  [["papel de cocina", "servilleta"], "🧻"],
  [["detergente", "jabon", "lavavajillas", "suavizante"], "🧴"],
  [["aceite"], "🫒"],
  [["sal"], "🧂"],
  [["azucar"], "🍬"],
  [["cereales"], "🥣"],
  [["congelado"], "🧊"],
  [["snack", "patatas fritas", "chips"], "🍟"],
  [["chuche", "golosina", "caramelo"], "🍬"],
];

export function choreEmoji(name: string): string {
  return matchEmoji(name, CHORE_DICTIONARY, "🧹");
}

export function groceryEmoji(name: string): string {
  return matchEmoji(name, GROCERY_DICTIONARY, "🛒");
}
