import type { WasteSlug } from '@/lib/waste-style';

/**
 * Line icon for each waste type. Paths are lifted from the design system files.
 * `abiti` has no icon in the design set yet — a shirt stand-in is used until the
 * official SVG is provided.
 */
const PATHS: Record<WasteSlug, JSX.Element> = {
  umido: <path d="M11 20.5C6 19 3 15 3 10c0-1 .2-2 .5-3 4 0 7 1 9 4 1-4 4-7 9-7 .3 1 .5 2 .5 3 0 7-5 12-11 13.5z" />,
  vetro: <path d="M8 22h8M12 15v7M6 3h12l-1.2 6.5a5 5 0 0 1-9.6 0z" />,
  secco: <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />,
  plastica: (
    <>
      <path d="M9 2h6M10 2v2.5L8.6 7A2.5 2.5 0 0 0 8 8.6V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8.6a2.5 2.5 0 0 0-.6-1.6L14 4.5V2" />
      <path d="M8 13h8" />
    </>
  ),
  lattine: (
    <>
      <ellipse cx="12" cy="5" rx="6" ry="2.2" />
      <path d="M6 5v14c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2V5" />
      <path d="M6 11c0 1.2 2.7 2 6 2s6-.8 6-2" />
    </>
  ),
  carta: (
    <>
      <path d="M3 7l9-4 9 4-9 4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11.2V21" />
    </>
  ),
  abiti: <path d="M16 3l5 3-2 4-2-1v11H7V9L5 10 3 6l5-3 1 2a3 3 0 0 0 6 0z" />,
};

interface WasteIconProps {
  slug: WasteSlug;
  color: string;
  size?: number;
}

export default function WasteIcon({ slug, color, size = 24 }: WasteIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[slug]}
    </svg>
  );
}
