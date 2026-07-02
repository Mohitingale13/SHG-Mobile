const MARATHI_DIGIT_MAP: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
};

const ONES: string[] = [
  "", "एक", "दोन", "तीन", "चार", "पाच", "सहा", "सात", "आठ", "नऊ",
  "दहा", "अकरा", "बारा", "तेरा", "चौदा", "पंधरा", "सोळा", "सतरा", "अठरा", "एकोणीस",
  "वीस", "एकवीस", "बावीस", "तेवीस", "चोवीस", "पंचवीस", "सव्वीस", "सत्तावीस", "अठ्ठावीस", "एकोणतीस",
  "तीस", "एकतीस", "बत्तीस", "तेहतीस", "चौतीस", "पस्तीस", "छत्तीस", "सदतीस", "अडतीस", "एकोणचाळीस",
  "चाळीस", "एकेचाळीस", "बेचाळीस", "त्रेचाळीस", "चव्वेचाळीस", "पंचेचाळीस", "सेहेचाळीस", "सत्तेचाळीस", "अठ्ठेचाळीस", "एकोणपन्नास",
  "पन्नास", "एक्कावन्न", "बावन्न", "त्रेपन्न", "चोपन्न", "पंचावन्न", "छप्पन्न", "सत्तावन्न", "अठ्ठावन्न", "एकोणसाठ",
  "साठ", "एकसष्ट", "बासष्ट", "त्रेसष्ट", "चौसष्ट", "पासष्ट", "सहासष्ट", "सदुसष्ट", "अडुसष्ट", "एकोणसत्तर",
  "सत्तर", "एक्काहत्तर", "बाहत्तर", "त्र्याहत्तर", "चौर्‍याहत्तर", "पंचाहत्तर", "शहात्तर", "सत्याहत्तर", "अठ्ठ्याहत्तर", "एकोणऐंशी",
  "ऐंशी", "एक्क्याऐंशी", "ब्याऐंशी", "त्र्याऐंशी", "चौऱ्याऐंशी", "पंच्याऐंशी", "शहाऐंशी", "सत्त्याऐंशी", "अठ्ठ्याऐंशी", "एकोणनव्वद",
  "नव्वद", "एक्क्याण्णव", "ब्याण्णव", "त्र्याण्णव", "चौऱ्याण्णव", "पंच्याण्णव", "शहाण्णव", "सत्त्याण्णव", "अठ्ठ्याण्णव", "नव्व्याण्णव",
];

function twoDigit(n: number): string {
  if (n <= 0) return "";
  return ONES[n] || "";
}

function threeDigit(n: number): string {
  if (n <= 0) return "";
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds > 0) {
    parts.push(hundreds === 1 ? "एकशे" : `${ONES[hundreds]}शे`);
  }
  if (rest > 0) parts.push(twoDigit(rest));
  return parts.join(" ");
}

export function normalizeDigits(input: string): string {
  return input.replace(/[०-९]/g, (d) => MARATHI_DIGIT_MAP[d] ?? d);
}

export function numberToMarathiWords(input: string | number): string {
  if (input === null || input === undefined || input === "") return "";

  const raw = typeof input === "number" ? String(input) : input;
  const normalized = normalizeDigits(raw).replace(/[^\d]/g, "");
  if (!normalized) return "";

  let n = parseInt(normalized, 10);
  if (!Number.isFinite(n) || n < 0) return "";
  if (n === 0) return "शून्य रुपये";

  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n = n % 10000000;
  const lakh = Math.floor(n / 100000);
  n = n % 100000;
  const thousand = Math.floor(n / 1000);
  n = n % 1000;
  const hundredsAndRest = n;

  if (crore > 0) {
    const w = crore < 100 ? twoDigit(crore) : threeDigit(crore);
    parts.push(`${w} कोटी`);
  }
  if (lakh > 0) {
    parts.push(`${twoDigit(lakh)} लाख`);
  }
  if (thousand > 0) {
    parts.push(`${twoDigit(thousand)} हजार`);
  }
  if (hundredsAndRest > 0) {
    parts.push(threeDigit(hundredsAndRest));
  }

  return `${parts.join(" ").replace(/\s+/g, " ").trim()} रुपये`;
}
