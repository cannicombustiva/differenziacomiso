'use client';

import type { WasteType, Locale } from '@/types';
import { getWasteTypeName } from '@/lib/utils';
import styles from './WasteCard.module.css';

interface WasteCardProps {
  wasteType: WasteType;
  locale: Locale;
  size?: 'sm' | 'md' | 'lg';
}

export default function WasteCard({ wasteType, locale, size = 'md' }: WasteCardProps) {
  const name = getWasteTypeName(wasteType, locale);

  return (
    <div
      className={`${styles.card} ${styles[size]}`}
      style={{ backgroundColor: wasteType.color_hex }}
    >
      <span className={styles.name}>{name}</span>
    </div>
  );
}
