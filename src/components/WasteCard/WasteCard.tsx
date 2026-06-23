'use client';

import type { WasteType, Locale } from '@/types';
import { getWasteTypeName } from '@/lib/utils';
import { wasteVisual } from '@/lib/waste-style';
import WasteIcon from '@/components/WasteIcon/WasteIcon';
import styles from './WasteCard.module.css';

interface WasteCardProps {
  wasteType: WasteType;
  locale: Locale;
  size?: 'sm' | 'md' | 'lg';
}

const ICON_SIZE: Record<NonNullable<WasteCardProps['size']>, number> = {
  sm: 20,
  md: 24,
  lg: 30,
};

export default function WasteCard({ wasteType, locale, size = 'md' }: WasteCardProps) {
  const name = getWasteTypeName(wasteType, locale);
  const { slug, color, ink } = wasteVisual(wasteType);

  return (
    <div className={`${styles.card} ${styles[size]}`} style={{ backgroundColor: color, color: ink }}>
      <WasteIcon slug={slug} color={ink} size={ICON_SIZE[size]} />
      <span className={styles.name}>{name}</span>
    </div>
  );
}
