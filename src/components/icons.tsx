import type { SVGProps } from 'react';

/**
 * Jeu d'icônes maison — trait de 1.2 px, angles nets, aucune icône pleine.
 * Dessinées à la main plutôt qu'importées : une bibliothèque d'icônes pèse
 * plusieurs dizaines de kilo-octets pour une quinzaine de symboles utilisés,
 * et son style ne correspondrait pas exactement à la charte.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.4 15.4 4.1 4.1" />
  </Icon>
);

export const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20.2 4.9 13.3a4.3 4.3 0 0 1 0-6.2 4.5 4.5 0 0 1 6.3 0l.8.8.8-.8a4.5 4.5 0 0 1 6.3 0 4.3 4.3 0 0 1 0 6.2Z" />
  </Icon>
);

export const BagIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.6 7.5h14.8l1 12.5H3.6Z" />
    <path d="M8.8 10V6.6a3.2 3.2 0 0 1 6.4 0V10" />
  </Icon>
);

export const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8.3" r="3.8" />
    <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
  </Icon>
);

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 8h17M3.5 16h17" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 5 14 14M19 5 5 19" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </Icon>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 12H4M10 6l-6 6 6 6" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 9 7 7 7-7" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const MinusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Icon>
);

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
  </Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z" />
  </Icon>
);

export const TruckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 6.5h11v10h-11z" />
    <path d="M13.5 10h4l3 3v3.5h-7z" />
    <circle cx="6.8" cy="18.2" r="1.8" />
    <circle cx="16.8" cy="18.2" r="1.8" />
  </Icon>
);

export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.2 4.8 6v5.6c0 4.2 2.9 7.6 7.2 9.2 4.3-1.6 7.2-5 7.2-9.2V6Z" />
    <path d="m9.2 12 2 2 3.6-4" />
  </Icon>
);

export const ExchangeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 8.5h13l-3-3M20.5 15.5h-13l3 3" />
  </Icon>
);

export const StarIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 3.8 2.5 5.3 5.6.8-4 4 1 5.7-5.1-2.8-5.1 2.8 1-5.7-4-4 5.6-.8Z" />
  </Icon>
);

export const PrintIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 9V3.5h10V9" />
    <path d="M5 9h14a1.5 1.5 0 0 1 1.5 1.5v6H3.5v-6A1.5 1.5 0 0 1 5 9Z" />
    <path d="M7 14h10v6.5H7z" />
  </Icon>
);

export const PhoneIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8.4 3.8 10.2 8 8.3 9.9a11 11 0 0 0 5.8 5.8l1.9-1.9 4.2 1.8v3.6a1.5 1.5 0 0 1-1.7 1.5C10.6 20 4 13.4 3.2 5.5A1.5 1.5 0 0 1 4.7 3.8Z" />
  </Icon>
);

export const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 6h17v12h-17z" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </Icon>
);

export const InstagramIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="4.6" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="16.9" cy="7.1" r="0.9" fill="currentColor" stroke="none" />
  </Icon>
);

export const FacebookIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.8 7.6h2.3V4.2h-2.7c-2.4 0-4 1.6-4 4.1v2.1H8v3.4h2.4v6.6h3.5v-6.6h2.5l.5-3.4h-3V8.6c0-.6.4-1 .9-1Z" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M6.3 6.5 7.2 19a1.6 1.6 0 0 0 1.6 1.5h6.4a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" />
    <path d="M10.3 10v6.5M13.7 10v6.5" />
  </Icon>
);

export const CopyIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="1.6" />
    <path d="M15.5 8.5v-3a1.6 1.6 0 0 0-1.6-1.6H6a1.6 1.6 0 0 0-1.6 1.6v8a1.6 1.6 0 0 0 1.6 1.6h3" />
  </Icon>
);

export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.9" />
  </Icon>
);

export const EyeOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.6 6.2A8.9 8.9 0 0 1 12 5.8c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-2.9 3.6M6.4 7.8A16.6 16.6 0 0 0 2.5 12s3.5 6.2 9.5 6.2a9.4 9.4 0 0 0 3.4-.6" />
    <path d="M10 10a2.9 2.9 0 0 0 4 4M4 4l16 16" />
  </Icon>
);

export const PencilIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16.4 4.6a1.9 1.9 0 0 1 2.7 0l.3.3a1.9 1.9 0 0 1 0 2.7L8.6 18.4l-3.9 1 1-3.9Z" />
    <path d="m14.8 6.2 3 3" />
  </Icon>
);

export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 11.5A8 8 0 0 0 6.3 6.3L4 8.5" />
    <path d="M4 12.5a8 8 0 0 0 13.7 5.2L20 15.5" />
    <path d="M4 4.5v4h4M20 19.5v-4h-4" />
  </Icon>
);

export const TikTokIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.6 3.2v10.9a3.3 3.3 0 1 1-3.3-3.3h.6" />
    <path d="M14.6 3.2a4.9 4.9 0 0 0 4.7 4.5" />
  </Icon>
);
