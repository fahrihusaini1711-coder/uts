const MONTHS_ID_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const MONTHS_ID_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function formatRupiah(amount: number, showSign = false): string {
  const abs = Math.round(Math.abs(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (amount < 0) {
    return `-Rp ${formatted}`;
  }
  if (showSign && amount > 0) {
    return `+Rp ${formatted}`;
  }
  return `Rp ${formatted}`;
}

export function formatCompactRupiah(amount: number): string {
  const abs = Math.abs(amount);
  const prefix = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${prefix}Rp ${(abs / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (abs >= 1_000_000) {
    const val = abs / 1_000_000;
    return `${prefix}Rp ${Number.isInteger(val) ? val : val.toFixed(1).replace('.', ',')} jt`;
  }
  if (abs >= 1_000) {
    return `${prefix}Rp ${Math.round(abs / 1_000)} rb`;
  }
  return `${prefix}Rp ${abs}`;
}

export function formatDateID(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const monthIdx = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (Number.isNaN(year) || Number.isNaN(monthIdx) || Number.isNaN(day)) return dateStr;
  return `${day} ${MONTHS_ID_SHORT[monthIdx] ?? ''} ${year}`;
}

export function formatDateLongID(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const monthIdx = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  return `${day} ${MONTHS_ID_LONG[monthIdx] ?? ''} ${year}`;
}

export function formatMonthYearID(monthKey: string): string {
  if (!monthKey) return '-';
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = Number(monthStr) - 1;
  return `${MONTHS_ID_LONG[monthIdx] ?? monthStr} ${yearStr}`;
}

export function formatMonthShortID(monthKey: string): string {
  if (!monthKey) return '-';
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = Number(monthStr) - 1;
  return `${MONTHS_ID_SHORT[monthIdx] ?? monthStr} ${yearStr.slice(2)}`;
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getLastNMonthKeys(count: number, endMonthKey = getCurrentMonthKey()): string[] {
  const [yearStr, monthStr] = endMonthKey.split('-');
  const endYear = Number(yearStr);
  const endMonth = Number(monthStr) - 1;
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(endYear, endMonth - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    keys.push(`${y}-${m}`);
  }
  return keys;
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const d = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
