import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  accentColor?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export default function Card({
  children,
  accentColor,
  padding = 'md',
  className,
  style,
  ...props
}: CardProps) {
  return (
    <div
      className={`${styles.card} ${styles[padding]} ${className || ''}`}
      style={{
        ...(accentColor ? { borderLeftColor: accentColor } : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
