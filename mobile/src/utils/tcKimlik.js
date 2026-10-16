/**
 * Türkiye Cumhuriyeti Kimlik Numarası Resmi Doğrulama Algoritması (Mobil)
 */
export const validateTcKimlikNo = (tcNo) => {
  if (!tcNo || typeof tcNo !== 'string') return false;

  const trimmed = tcNo.trim();
  if (trimmed.length !== 11) return false;
  if (!/^\d{11}$/.test(trimmed)) return false;

  if (trimmed.charAt(0) === '0') return false;

  const digits = trimmed.split('').map(Number);

  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  const rule10 = ((oddSum * 7 - evenSum) % 10 + 10) % 10;
  if (rule10 !== digits[9]) return false;

  const totalFirst10 = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
  const rule11 = totalFirst10 % 10;
  if (rule11 !== digits[10]) return false;

  return true;
};
