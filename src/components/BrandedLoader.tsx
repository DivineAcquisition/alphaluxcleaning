import { CSSProperties } from 'react';

/**
 * Branded full-page loading screen.
 *
 * The user-visible loader shown during route-level `<Suspense>`
 * fallbacks and any other "page is mounting" moment. Renders the
 * AlphaLux Clean square brand mark on a navy background with a
 * subtle pulsing animation and a small "Loading…" caption — so
 * customers see the brand instead of a blank white screen during
 * lazy-loaded route transitions.
 */
export function BrandedLoader({
  caption = 'Loading…',
  fullScreen = true,
}: {
  caption?: string;
  fullScreen?: boolean;
}) {
  const wrapper: CSSProperties = fullScreen
    ? {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at center, hsl(212 47% 20%) 0%, hsl(214 56% 12%) 70%, hsl(220 62% 8%) 100%)',
        zIndex: 9999,
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1rem',
        background: 'transparent',
      };

  return (
    <div style={wrapper} role="status" aria-live="polite" aria-label={caption}>
      <div style={inner}>
        <div style={markRing}>
          <img
            src="/brand/alphalux-mark.png"
            alt="AlphaLux Clean"
            style={mark}
            width={96}
            height={96}
          />
        </div>
        <p style={captionStyle}>{caption}</p>
      </div>
      <style>
        {`@keyframes alxPulse {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50%      { transform: scale(1.04); opacity: 1; }
        }
        @keyframes alxRing {
          0%   { transform: rotate(0deg);   opacity: 0.6; }
          50%  { opacity: 1; }
          100% { transform: rotate(360deg); opacity: 0.6; }
        }`}
      </style>
    </div>
  );
}

const inner: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.25rem',
  textAlign: 'center',
};

const markRing: CSSProperties = {
  position: 'relative',
  width: 132,
  height: 132,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.04)',
  boxShadow:
    '0 0 0 1px rgba(15, 119, 204, 0.30), 0 0 60px rgba(15, 119, 204, 0.35)',
  animation: 'alxRing 2.4s linear infinite',
};

const mark: CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: '18px',
  objectFit: 'cover',
  boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
  animation: 'alxPulse 1.8s ease-in-out infinite',
};

const captionStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.875rem',
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(215, 236, 250, 0.92)',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};
