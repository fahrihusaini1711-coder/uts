import React from 'react';
import {
  Award,
  Briefcase,
  Car,
  Coffee,
  Gift,
  Heart,
  Home,
  Megaphone,
  Package,
  Receipt,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Utensils,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react';

export const CATEGORY_ICON_OPTIONS: { key: string; label: string }[] = [
  { key: 'shopping-bag', label: 'Penjualan' },
  { key: 'briefcase', label: 'Jasa / Bisnis' },
  { key: 'wallet', label: 'Gaji / Kas' },
  { key: 'award', label: 'Bonus' },
  { key: 'trending-up', label: 'Investasi' },
  { key: 'package', label: 'Bahan Baku' },
  { key: 'utensils', label: 'Makanan' },
  { key: 'coffee', label: 'Minuman' },
  { key: 'car', label: 'Transportasi' },
  { key: 'zap', label: 'Listrik & Air' },
  { key: 'home', label: 'Sewa & Tempat' },
  { key: 'wrench', label: 'Perlengkapan' },
  { key: 'megaphone', label: 'Pemasaran' },
  { key: 'smartphone', label: 'Internet & Pulsa' },
  { key: 'heart', label: 'Kesehatan' },
  { key: 'gift', label: 'Hadiah' },
  { key: 'receipt', label: 'Lainnya' },
];

export const CATEGORY_COLOR_OPTIONS: string[] = [
  '#059669', // Emerald
  '#0284C7', // Sky Blue
  '#0D9488', // Teal
  '#2563EB', // Blue
  '#D97706', // Amber
  '#DC2626', // Red
  '#E11D48', // Rose
  '#7C3AED', // Violet
  '#EA580C', // Orange
  '#475569', // Slate
];

interface CategoryIconProps {
  icon: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ icon, className = 'w-4 h-4', style }) => {
  switch (icon) {
    case 'shopping-bag':
      return <ShoppingBag className={className} style={style} />;
    case 'briefcase':
      return <Briefcase className={className} style={style} />;
    case 'wallet':
      return <Wallet className={className} style={style} />;
    case 'award':
      return <Award className={className} style={style} />;
    case 'trending-up':
      return <TrendingUp className={className} style={style} />;
    case 'package':
      return <Package className={className} style={style} />;
    case 'utensils':
      return <Utensils className={className} style={style} />;
    case 'coffee':
      return <Coffee className={className} style={style} />;
    case 'car':
      return <Car className={className} style={style} />;
    case 'zap':
      return <Zap className={className} style={style} />;
    case 'home':
      return <Home className={className} style={style} />;
    case 'wrench':
      return <Wrench className={className} style={style} />;
    case 'megaphone':
      return <Megaphone className={className} style={style} />;
    case 'smartphone':
      return <Smartphone className={className} style={style} />;
    case 'heart':
      return <Heart className={className} style={style} />;
    case 'gift':
      return <Gift className={className} style={style} />;
    case 'receipt':
    default:
      return <Receipt className={className} style={style} />;
  }
};
