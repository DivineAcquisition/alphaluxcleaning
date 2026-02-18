

# Install New Meta Pixel

## What's Changing

Replace the existing Meta Pixel (ID `795901793381387`) with the new one (ID `683996898113618`) in two places:

### 1. `index.html`
- Update the pixel `init` call from `'795901793381387'` to `'683996898113618'`
- Update the noscript fallback image URL from `id=795901793381387` to `id=683996898113618`

### 2. No other changes needed
- The `useFacebookPixel.ts` hook uses `window.fbq` which is pixel-ID-agnostic -- it will automatically fire events to whichever pixel is initialized
- All existing event tracking (ViewContent, AddToCart, Purchase, Lead, etc.) continues working as-is

## Summary

| File | Change |
|------|--------|
| `index.html` | Swap pixel ID in 2 places (script init + noscript img) |

Two-line change total.

