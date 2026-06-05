const BELOW_TWENTY = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigitsToWords(n: number): string {
  if (n < 20) return BELOW_TWENTY[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones ? `${TENS[tens]} ${BELOW_TWENTY[ones]}` : TENS[tens];
}

function threeDigitsToWords(n: number): string {
  if (n === 0) return "";
  if (n < 100) return twoDigitsToWords(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const hundredPart = `${BELOW_TWENTY[hundreds]} Hundred`;
  return rest ? `${hundredPart} ${twoDigitsToWords(rest)}` : hundredPart;
}

function integerToWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitsToWords(hundred));

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** e.g. "Rupees One Thousand Four Hundred Forty Nine Only" */
export function amountInWordsINR(amount: number): string {
  const rupees = Math.floor(Math.round(amount * 100) / 100);
  const paise = Math.round((Math.round(amount * 100) / 100 - rupees) * 100);

  let words = integerToWords(rupees);
  if (paise > 0) {
    words += ` and ${integerToWords(paise)} Paise`;
  }
  return `Rupees ${words} Only`;
}
