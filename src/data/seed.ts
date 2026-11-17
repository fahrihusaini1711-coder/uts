import { FinanceStoreData } from '../types';
import { getCurrentMonthKey, shiftMonthKey, toDateInputValue } from '../utils/format';

function dateInMonth(monthKey: string, day: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const maxDay = new Date(y, m, 0).getDate();
  const safeDay = Math.min(day, maxDay);
  return `${monthKey}-${String(safeDay).padStart(2, '0')}`;
}

export function createSeedData(): FinanceStoreData {
  const currentMonth = getCurrentMonthKey();
  const mMinus1 = shiftMonthKey(currentMonth, -1);
  const mMinus2 = shiftMonthKey(currentMonth, -2);
  const mMinus3 = shiftMonthKey(currentMonth, -3);
  const mMinus4 = shiftMonthKey(currentMonth, -4);
  const mMinus5 = shiftMonthKey(currentMonth, -5);

  const now = new Date();
  const todayDay = now.getDate();

  const dToday = toDateInputValue(now);
  const dRecent1 = dateInMonth(currentMonth, Math.max(1, todayDay - 1));
  const dRecent2 = dateInMonth(currentMonth, Math.max(1, todayDay - 3));
  const dRecent3 = dateInMonth(currentMonth, Math.max(1, todayDay - 5));
  const dRecent4 = dateInMonth(currentMonth, Math.max(1, todayDay - 7));
  const dRecent5 = dateInMonth(currentMonth, Math.max(1, todayDay - 9));
  const dEarly1 = dateInMonth(currentMonth, 2);
  const dEarly2 = dateInMonth(currentMonth, 4);

  const dueNextWeek = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6));
  const dueOverdue = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4));
  const dueLater = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 18));

  return {
    settings: {
      businessName: 'Kedai & Toko Nusantara',
      mode: 'umkm',
      darkMode: false,
    },
    accounts: [
      {
        id: 'acc_kas',
        name: 'Kas Tunai',
        type: 'cash',
        initialBalance: 3500000,
        color: '#059669',
        notes: 'Laci kasir harian & uang tunai',
      },
      {
        id: 'acc_bca',
        name: 'Bank BCA',
        type: 'bank',
        initialBalance: 18500000,
        color: '#0284C7',
        notes: 'Rekening operasional utama',
      },
      {
        id: 'acc_mandiri',
        name: 'Bank Mandiri',
        type: 'bank',
        initialBalance: 9200000,
        color: '#2563EB',
        notes: 'Tabungan cadangan usaha',
      },
      {
        id: 'acc_gopay',
        name: 'GoPay / QRIS',
        type: 'ewallet',
        initialBalance: 2450000,
        color: '#0D9488',
        notes: 'Penerimaan pembayaran QRIS toko',
      },
    ],
    categories: [
      { id: 'cat_penjualan', name: 'Penjualan Produk', type: 'income', color: '#059669', icon: 'shopping-bag' },
      { id: 'cat_jasa', name: 'Jasa & Layanan', type: 'income', color: '#0284C7', icon: 'briefcase' },
      { id: 'cat_gaji', name: 'Gaji / Honor', type: 'income', color: '#0D9488', icon: 'wallet' },
      { id: 'cat_bonus', name: 'Komisi & Bonus', type: 'income', color: '#16A34A', icon: 'award' },

      { id: 'cat_bahan', name: 'Bahan Baku & Stok', type: 'expense', color: '#EA580C', icon: 'package' },
      { id: 'cat_makan', name: 'Makanan & Minuman', type: 'expense', color: '#D97706', icon: 'utensils' },
      { id: 'cat_transport', name: 'Transportasi & BBM', type: 'expense', color: '#2563EB', icon: 'car' },
      { id: 'cat_tagihan', name: 'Tagihan & Listrik', type: 'expense', color: '#DC2626', icon: 'zap' },
      { id: 'cat_sewa', name: 'Operasional & Sewa', type: 'expense', color: '#7C3AED', icon: 'home' },
      { id: 'cat_iklan', name: 'Pemasaran & Iklan', type: 'expense', color: '#E11D48', icon: 'megaphone' },
      { id: 'cat_perlengkapan', name: 'Perlengkapan', type: 'expense', color: '#475569', icon: 'wrench' },
    ],
    transactions: [
      // Bulan ini
      {
        id: 'tx_cur_1',
        type: 'income',
        date: dToday,
        amount: 2850000,
        categoryId: 'cat_penjualan',
        accountId: 'acc_gopay',
        note: 'Rekap penjualan QRIS harian toko',
        createdAt: `${dToday}T10:15:00Z`,
      },
      {
        id: 'tx_cur_2',
        type: 'expense',
        date: dRecent1,
        amount: 1450000,
        categoryId: 'cat_bahan',
        accountId: 'acc_bca',
        note: 'Restok kemasan & bahan baku mingguan',
        createdAt: `${dRecent1}T14:20:00Z`,
      },
      {
        id: 'tx_cur_3',
        type: 'income',
        date: dRecent2,
        amount: 4200000,
        categoryId: 'cat_penjualan',
        accountId: 'acc_bca',
        note: 'Pesanan paket katering kantor',
        createdAt: `${dRecent2}T11:00:00Z`,
      },
      {
        id: 'tx_cur_4',
        type: 'expense',
        date: dRecent3,
        amount: 685000,
        categoryId: 'cat_tagihan',
        accountId: 'acc_bca',
        note: 'Token listrik & tagihan internet WiFi',
        createdAt: `${dRecent3}T09:30:00Z`,
      },
      {
        id: 'tx_cur_5',
        type: 'transfer',
        date: dRecent4,
        amount: 2000000,
        accountId: 'acc_gopay',
        toAccountId: 'acc_bca',
        note: 'Pencairan saldo QRIS ke rekening BCA',
        createdAt: `${dRecent4}T16:45:00Z`,
      },
      {
        id: 'tx_cur_6',
        type: 'expense',
        date: dRecent4,
        amount: 420000,
        categoryId: 'cat_makan',
        accountId: 'acc_kas',
        note: 'Konsumsi tim & makan siang',
        createdAt: `${dRecent4}T12:30:00Z`,
      },
      {
        id: 'tx_cur_7',
        type: 'expense',
        date: dRecent5,
        amount: 310000,
        categoryId: 'cat_transport',
        accountId: 'acc_kas',
        note: 'BBM kurir & ongkos kirim ekspedisi',
        createdAt: `${dRecent5}T15:10:00Z`,
      },
      {
        id: 'tx_cur_8',
        type: 'income',
        date: dEarly1,
        amount: 3650000,
        categoryId: 'cat_jasa',
        accountId: 'acc_bca',
        note: 'Pembayaran kontrak layanan bulanan klien',
        createdAt: `${dEarly1}T10:00:00Z`,
      },
      {
        id: 'tx_cur_9',
        type: 'expense',
        date: dEarly2,
        amount: 2250000,
        categoryId: 'cat_sewa',
        accountId: 'acc_bca',
        note: 'Biaya sewa kios & kebersihan lingkungan',
        createdAt: `${dEarly2}T08:30:00Z`,
      },
      {
        id: 'tx_cur_10',
        type: 'expense',
        date: dEarly2,
        amount: 550000,
        categoryId: 'cat_iklan',
        accountId: 'acc_gopay',
        note: 'Promosi media sosial & katalog promo',
        createdAt: `${dEarly2}T13:15:00Z`,
      },

      // Bulan -1
      {
        id: 'tx_m1_1',
        type: 'income',
        date: dateInMonth(mMinus1, 6),
        amount: 5400000,
        categoryId: 'cat_penjualan',
        accountId: 'acc_bca',
        note: 'Penjualan ritel minggu pertama',
        createdAt: `${dateInMonth(mMinus1, 6)}T10:00:00Z`,
      },
      {
        id: 'tx_m1_2',
        type: 'income',
        date: dateInMonth(mMinus1, 18),
        amount: 4100000,
        categoryId: 'cat_jasa',
        accountId: 'acc_mandiri',
        note: 'Pendapatan proyek desain & kemasan',
        createdAt: `${dateInMonth(mMinus1, 18)}T14:00:00Z`,
      },
      {
        id: 'tx_m1_3',
        type: 'expense',
        date: dateInMonth(mMinus1, 8),
        amount: 2350000,
        categoryId: 'cat_bahan',
        accountId: 'acc_bca',
        note: 'Pembelian stok grosir supplier',
        createdAt: `${dateInMonth(mMinus1, 8)}T11:00:00Z`,
      },
      {
        id: 'tx_m1_4',
        type: 'expense',
        date: dateInMonth(mMinus1, 12),
        amount: 2250000,
        categoryId: 'cat_sewa',
        accountId: 'acc_bca',
        note: 'Sewa tempat usaha',
        createdAt: `${dateInMonth(mMinus1, 12)}T09:00:00Z`,
      },
      {
        id: 'tx_m1_5',
        type: 'expense',
        date: dateInMonth(mMinus1, 22),
        amount: 890000,
        categoryId: 'cat_tagihan',
        accountId: 'acc_kas',
        note: 'Listrik, air PDAM & internet',
        createdAt: `${dateInMonth(mMinus1, 22)}T16:00:00Z`,
      },

      // Bulan -2
      {
        id: 'tx_m2_1',
        type: 'income',
        date: dateInMonth(mMinus2, 9),
        amount: 6200000,
        categoryId: 'cat_penjualan',
        accountId: 'acc_bca',
        note: 'Penjualan produk unggulan & reseller',
        createdAt: `${dateInMonth(mMinus2, 9)}T10:00:00Z`,
      },
      {
        id: 'tx_m2_2',
        type: 'income',
        date: dateInMonth(mMinus2, 21),
        amount: 2900000,
        categoryId: 'cat_penjualan',
        accountId: 'acc_gopay',
        note: 'Penerimaan QRIS & pesan antar',
        createdAt: `${dateInMonth(mMinus2, 21)}T18:00:00Z`,
      },
      {
        id: 'tx_m2_3',
        type: 'expense',
        date: dateInMonth(mMinus2, 11),
        amount: 2800000,
        categoryId: 'cat_bahan',
        accountId: 'acc_bca',
        note: 'Belanja stok bahan baku bulanan',
        createdAt: `${dateInMonth(mMinus2, 11)}T10:30:00Z`,
      },
      {
        id: 'tx_m2_4',
        type: 'expense',
        date: dateInMonth(mMinus2, 15),
        amount: 2250000,
        categoryId: 'cat_sewa',
        accountId: 'acc_bca',
        note: 'Sewa kios bulanan',
        createdAt: `${dateInMonth(mMinus2, 15)}T09:00:00Z`,
      },
      {
        id: 'tx_m2_5',
        type: 'expense',
        date: dateInMonth(mMinus2, 24),
        amount: 640000,
        categoryId: 'cat_transport',
        accountId: 'acc_kas',
        note: 'Logistik pengiriman luar kota',
        createdAt: `${dateInMonth(mMinus2, 24)}T14:20:00Z`,
      },

      // Bulan -3
      {
        id: 'tx_m3_1',
        type: 'income',
        date: dateInMonth(mMinus3, 7),
        amount: 5100000,
        categoryId: 'cat_penjualan',
        accountId: 'acc_bca',
        note: 'Penjualan retail & marketplace',
        createdAt: `${dateInMonth(mMinus3, 7)}T12:00:00Z`,
      },
      {
        id: 'tx_m3_2',
        type: 'income',
        date: dateInMonth(mMinus3, 19),
        amount: 2450000,
        categoryId: 'cat_gaji',
        accountId: 'acc_mandiri',
        note: 'Honor konsultasi mitra UMKM',
        createdAt: `${dateInMonth(mMinus3, 19)}T15:00:00Z`,
      },
      {
        id: 'tx_m3_3',
        type: 'expense',
        date: dateInMonth(mMinus3, 10),
        amount: 3100000,
        categoryId: 'cat_bahan',
        accountId: 'acc_bca',
        note: 'Pengadaan stok awal kuartal',
        createdAt: `${dateInMonth(mMinus3, 10)}T11:00:00Z`,
      },
      {
        id: 'tx_m3_4',
        type: 'expense',
        date: dateInMonth(mMinus3, 16),
        amount: 2250000,
        categoryId: 'cat_sewa',
        accountId: 'acc_bca',
        note: 'Sewa tempat usaha',
        createdAt: `${dateInMonth(mMinus3, 16)}T09:00:00Z`,
      },

      // Bulan -4
      {
        id: 'tx_m4_1',
        type: 'income',
        date: dateInMonth(mMinus4, 14),
        amount: 6850000,
        categoryId: 'cat_penjualan',
        accountId: 'acc_bca',
        note: 'Penjualan event pameran produk lokal',
        createdAt: `${dateInMonth(mMinus4, 14)}T17:00:00Z`,
      },
      {
        id: 'tx_m4_2',
        type: 'income',
        date: dateInMonth(mMinus4, 25),
        amount: 1850000,
        categoryId: 'cat_bonus',
        accountId: 'acc_gopay',
        note: 'Insentif mitra merchant',
        createdAt: `${dateInMonth(mMinus4, 25)}T13:00:00Z`,
      },
      {
        id: 'tx_m4_3',
        type: 'expense',
        date: dateInMonth(mMinus4, 12),
        amount: 2650000,
        categoryId: 'cat_bahan',
        accountId: 'acc_bca',
        note: 'Bahan baku produksi event',
        createdAt: `${dateInMonth(mMinus4, 12)}T10:00:00Z`,
      },
      {
        id: 'tx_m4_4',
        type: 'expense',
        date: dateInMonth(mMinus4, 20),
        amount: 1450000,
        categoryId: 'cat_perlengkapan',
        accountId: 'acc_kas',
        note: 'Pembelian etalase & timbangan digital',
        createdAt: `${dateInMonth(mMinus4, 20)}T15:30:00Z`,
      },

      // Bulan -5
      {
        id: 'tx_m5_1',
        type: 'income',
        date: dateInMonth(mMinus5, 10),
        amount: 5750000,
        categoryId: 'cat_penjualan',
        accountId: 'acc_bca',
        note: 'Penjualan bulanan reguler',
        createdAt: `${dateInMonth(mMinus5, 10)}T11:00:00Z`,
      },
      {
        id: 'tx_m5_2',
        type: 'expense',
        date: dateInMonth(mMinus5, 14),
        amount: 2100000,
        categoryId: 'cat_bahan',
        accountId: 'acc_bca',
        note: 'Restok bahan baku bulanan',
        createdAt: `${dateInMonth(mMinus5, 14)}T13:00:00Z`,
      },
      {
        id: 'tx_m5_3',
        type: 'expense',
        date: dateInMonth(mMinus5, 18),
        amount: 1950000,
        categoryId: 'cat_sewa',
        accountId: 'acc_bca',
        note: 'Sewa & utilitas bulanan',
        createdAt: `${dateInMonth(mMinus5, 18)}T09:00:00Z`,
      },
    ],
    budgets: [
      {
        id: 'bdg_bahan',
        categoryId: 'cat_bahan',
        month: currentMonth,
        limit: 2500000,
      },
      {
        id: 'bdg_makan',
        categoryId: 'cat_makan',
        month: currentMonth,
        limit: 500000, // 420rb / 500rb = 84% -> Mendekati Batas!
      },
      {
        id: 'bdg_tagihan',
        categoryId: 'cat_tagihan',
        month: currentMonth,
        limit: 800000, // 685rb / 800rb = 85.6% -> Mendekati Batas!
      },
      {
        id: 'bdg_iklan',
        categoryId: 'cat_iklan',
        month: currentMonth,
        limit: 500000, // 550rb / 500rb = 110% -> Melebihi Batas!
      },
      {
        id: 'bdg_transport',
        categoryId: 'cat_transport',
        month: currentMonth,
        limit: 650000,
      },
    ],
    debts: [
      {
        id: 'debt_1',
        type: 'receivable',
        personName: 'CV Maju Jaya (Klien Katering)',
        amount: 1850000,
        date: dRecent3,
        dueDate: dueNextWeek,
        note: 'Sisa pelunasan invoice #INV-204',
        status: 'unpaid',
      },
      {
        id: 'debt_2',
        type: 'debt',
        personName: 'Supplier Kopi & Kemasan Sentosa',
        amount: 1200000,
        date: dRecent5,
        dueDate: dueOverdue,
        note: 'Tempo pembelian karton kemasan',
        status: 'unpaid',
      },
      {
        id: 'debt_3',
        type: 'receivable',
        personName: 'Toko Berkah Cabang Barat',
        amount: 950000,
        date: dateInMonth(mMinus1, 20),
        dueDate: dueLater,
        note: 'Konsinyasi batch Oktober',
        status: 'unpaid',
      },
      {
        id: 'debt_4',
        type: 'debt',
        personName: 'Percetakan Grafika',
        amount: 480000,
        date: dateInMonth(mMinus1, 15),
        dueDate: dateInMonth(mMinus1, 28),
        note: 'Cetak stiker label & brosur',
        status: 'paid',
        paidAt: dateInMonth(mMinus1, 27),
      },
    ],
  };
}
