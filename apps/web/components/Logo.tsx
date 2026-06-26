// apps/web/components/Logo.tsx
//
// XPRESS CARGO brand mark: amber "express" speed chevrons + an isometric
// cargo cube in brand blues. The SVG is transparent (no plate) so it sits
// cleanly on the navy headers and anywhere else.

export function LogoMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="XPRESS CARGO"
    >
      {/* express speed chevrons */}
      <path d="M3 11 L8 16 L3 21" stroke="#F59E0B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 11 L14 16 L9 21" stroke="#F59E0B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      {/* isometric cargo cube */}
      <path d="M28 5 L38 10 L28 15 L18 10 Z" fill="#60A5FA" />
      <path d="M18 10 L28 15 L28 27 L18 22 Z" fill="#1A56DB" />
      <path d="M38 10 L28 15 L28 27 L38 22 Z" fill="#2546A8" />
    </svg>
  );
}

/**
 * Full lockup: mark + two-tone wordmark. `tone` controls the wordmark colour
 * for dark (navy header) vs light backgrounds.
 */
export function Logo({
  className = "",
  markClassName = "h-8 w-auto",
  tone = "dark",
  withText = true,
}: {
  className?: string;
  markClassName?: string;
  tone?: "dark" | "light";
  withText?: boolean;
}) {
  const primary = tone === "dark" ? "text-white" : "text-brand-navy";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClassName} />
      {withText && (
        <span className={`font-bold tracking-tight leading-none ${primary}`}>
          XPRESS<span className="text-brand-sky"> CARGO</span>
        </span>
      )}
    </span>
  );
}
