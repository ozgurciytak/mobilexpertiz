/**
 * Türkiye Cumhuriyeti Kimlik Numarası Resmi Doğrulama Algoritması
 * Kurallar:
 * 1. 11 basamaktan oluşmalıdır ve sadece rakam içermelidir.
 * 2. İlk basamak 0 olamaz.
 * 3. 1, 3, 5, 7 ve 9. haneler toplamının 7 katından, 2, 4, 6 ve 8. haneler toplamı çıkarıldığında mod 10, 10. haneyi vermelidir.
 * 4. İlk 10 hanenin toplamının mod 10'u 11. haneyi vermelidir.
 */
export const validateTcKimlikNo = (tcNo: string): boolean => {
  if (!tcNo || typeof tcNo !== 'string') return false;

  const trimmed = tcNo.trim();
  if (trimmed.length !== 11) return false;
  if (!/^\d{11}$/.test(trimmed)) return false;

  // İlk hane 0 olamaz
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
