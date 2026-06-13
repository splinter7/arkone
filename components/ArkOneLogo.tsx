import { useId } from "react";

export type ArkOneMarkVariant = "brand" | "mono";

interface ArkOneMarkProps {
  size?: number;
  className?: string;
  variant?: ArkOneMarkVariant;
}

/** Symmetric bold "A" ring — evenodd cutout for clean negative space */
const A_CUTOUT =
  "M16 8.5L23.75 26H21.25L18.75 20.5H13.25L10.75 26H8.25L16 8.5Z" +
  "M16 12.75L19.1 19.5H12.9L16 12.75Z";

export function ArkOneMark({
  size = 28,
  className,
  variant = "brand",
}: ArkOneMarkProps) {
  const maskId = `arkone-mark-${useId().replace(/:/g, "")}`;
  const isBrand = variant === "brand";
  const fill = isBrand ? "var(--arkone-navy)" : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <defs>
        <mask id={maskId}>
          <rect width="32" height="32" fill="white" />
          <path d={A_CUTOUT} fill="black" fillRule="evenodd" />
        </mask>
      </defs>
      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        rx="6"
        fill={fill}
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

interface ArkOneWordmarkProps {
  className?: string;
  variant?: ArkOneMarkVariant;
  size?: "sm" | "md" | "lg";
}

const WORDMARK_SIZE = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
} as const;

export function ArkOneWordmark({
  className,
  variant = "brand",
  size = "md",
}: ArkOneWordmarkProps) {
  const sizeClass = WORDMARK_SIZE[size];

  if (variant === "mono") {
    return (
      <span
        className={`font-semibold tracking-[-0.03em] ${sizeClass} ${className ?? ""}`}
      >
        ArkOne
      </span>
    );
  }

  return (
    <span
      className={`font-semibold tracking-[-0.03em] ${sizeClass} ${className ?? ""}`}
    >
      <span className="text-arkone-navy">Ark</span>
      <span className="text-arkone-accent">One</span>
    </span>
  );
}

interface ArkOneLogoProps {
  className?: string;
  markSize?: number;
  variant?: ArkOneMarkVariant;
  size?: "sm" | "md" | "lg";
  /** @deprecated Use `size` instead */
  wordmarkClassName?: string;
}

const MARK_SIZE = { sm: 24, md: 28, lg: 36 } as const;

export function ArkOneLogo({
  className,
  markSize,
  variant = "brand",
  size = "md",
  wordmarkClassName,
}: ArkOneLogoProps) {
  const resolvedMarkSize = markSize ?? MARK_SIZE[size];

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <ArkOneMark size={resolvedMarkSize} variant={variant} />
      {wordmarkClassName ? (
        <span className={wordmarkClassName}>ArkOne</span>
      ) : (
        <ArkOneWordmark variant={variant} size={size} />
      )}
    </div>
  );
}
