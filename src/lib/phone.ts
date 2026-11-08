// O'zbekiston telefon raqami: +998 XX XXX XX XX (backenddagi UZ_PHONE_REGEX bilan bir xil)
export const UZ_PREFIX = '+998'
export const UZ_OPERATOR_CODES = ['20', '33', '50', '55', '70', '77', '88', '90', '91', '93', '94', '95', '97', '98', '99']
const LOCAL_LENGTH = 9

/** Kiritilgan matndan faqat +998 dan keyingi raqamlarni ajratadi */
export function toLocalDigits(input: string): string {
  let digits = input.replace(/\D/g, '')
  // "+998 90..." yoki "99890..." ko'rinishida yopishtirilsa prefiksni olib tashlaymiz
  if (digits.startsWith('998') && digits.length > LOCAL_LENGTH) digits = digits.slice(3)
  return digits.slice(0, 15) // juda uzun kiritishni ham ko'rsatib xato chiqarish uchun
}

/** "901234567" → "90 123 45 67" (ortiqcha raqamlar oxiriga qo'shiladi) */
export function formatLocal(digits: string): string {
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean)
  const extra = digits.slice(9)
  return parts.join(' ') + (extra ? ` ${extra}` : '')
}

export type PhoneError = 'validation.phoneIncomplete' | 'validation.phoneTooLong' | 'validation.phoneOperator'

/** Bo'sh bo'lsa xato yo'q (telefon ixtiyoriy) */
export function validateLocal(digits: string): PhoneError | null {
  if (!digits) return null
  if (digits.length >= 2 && !UZ_OPERATOR_CODES.includes(digits.slice(0, 2))) return 'validation.phoneOperator'
  if (digits.length > LOCAL_LENGTH) return 'validation.phoneTooLong'
  if (digits.length < LOCAL_LENGTH) return 'validation.phoneIncomplete'
  return null
}

export const toE164 = (digits: string) => `${UZ_PREFIX}${digits}`
