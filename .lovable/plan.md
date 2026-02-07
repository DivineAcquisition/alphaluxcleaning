
# Comprehensive Printable Pricing Sheet

## Overview

You already have a `/pricing-sheet` page at `src/pages/PricingSheet.tsx` that can be printed/saved as PDF using the browser's print function. However, the current page has **hardcoded pricing data** that's outdated and doesn't reflect your actual pricing from `new-pricing-system.ts`.

I'll update this page to dynamically pull pricing from your actual pricing configuration, showing comprehensive tables for all states, home sizes, and service types.

## What Will Be Included

### 1. **Branded Header**
- AlphaLux Clean logo area
- Contact info: phone, website, email
- "Professional Cleaning Services - Pricing Guide"

### 2. **Service Pricing Tables (Per State)**
Tables for **Texas, California, and New York** showing:

| Home Size | Deep Clean | Maintenance | 90-Day Plan | Move-In/Out |
|-----------|------------|-------------|-------------|-------------|
| 1,000-1,499 sqft | $250 | $170 | $699 | $315 |
| 1,500-1,999 sqft | $300 | $195 | $799 | $385 |
| ... | ... | ... | ... | ... |
| 5,000+ sqft | Custom Quote | Custom Quote | Custom Quote | Custom Quote |

With state multipliers applied:
- **Texas**: Base (1.0×)
- **California**: +10% (1.10×)
- **New York**: +15% (1.15×)

### 3. **Recurring Service Discounts**
| Frequency | Discount |
|-----------|----------|
| Weekly (4×/mo) | 15% off |
| Bi-Weekly (2×/mo) | 10% off |
| Monthly (1×/mo) | 5% off |
| One-Time | $50 flat |

### 4. **Service Descriptions**
- **Tester Deep Clean**: Initial deep cleaning, 4-hour service, 40-point checklist
- **Standard Maintenance**: Regular upkeep, 2-hour service
- **90-Day Reset Plan**: 1 deep + 3 maintenance visits, bundled pricing
- **Move-In/Out**: Comprehensive top-to-bottom clean

### 5. **Payment Structure**
- 25% deposit at booking
- 75% balance invoiced after service
- 90-Day Plan: Starter deposit + 3 monthly payments

### 6. **Footer**
- Contact information
- "Prices effective as of [date]"
- Call for custom quotes

## Technical Approach

### File Changes

| File | Action |
|------|--------|
| `src/pages/PricingSheet.tsx` | **Update** - Refactor to use dynamic pricing data |

### Key Implementation Details

1. **Dynamic Data**: Import `HOME_SIZE_RANGES` and `DEFAULT_PRICING_CONFIG` from `new-pricing-system.ts`

2. **State-Specific Tables**: Generate pricing tables for each state by applying the state multiplier

3. **Print Optimization**: 
   - Use CSS `@media print` rules
   - Ensure page breaks don't split tables
   - Hide non-essential UI elements when printing

4. **PDF Download**: The browser's native "Print → Save as PDF" provides excellent quality. Alternatively, I can add a "Download PDF" button using a library if preferred.

## How to Use

1. Navigate to `/pricing-sheet` in your browser
2. Click "Print Pricing Sheet" button
3. In the print dialog, select "Save as PDF" as the destination
4. Save the PDF to your device

## Sample Output Structure

```text
┌──────────────────────────────────────────────────────────────┐
│                      ALPHA LUX CLEAN                         │
│           Professional Cleaning Services - Pricing Guide      │
│              972-559-0223 | alphaluxclean.com                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  TEXAS PRICING                                               │
│  ┌────────────────┬───────────┬─────────────┬────────────┐  │
│  │ Home Size      │ Deep Clean│ Maintenance │ 90-Day     │  │
│  ├────────────────┼───────────┼─────────────┼────────────┤  │
│  │ 1,000-1,499    │ $250      │ $170        │ $699       │  │
│  │ 1,500-1,999    │ $300      │ $195        │ $799       │  │
│  │ ...            │ ...       │ ...         │ ...        │  │
│  └────────────────┴───────────┴─────────────┴────────────┘  │
│                                                              │
│  CALIFORNIA PRICING (+10%)                                   │
│  ┌────────────────┬───────────┬─────────────┬────────────┐  │
│  │ Home Size      │ Deep Clean│ Maintenance │ 90-Day     │  │
│  │ 1,000-1,499    │ $275      │ $187        │ $769       │  │
│  │ ...            │ ...       │ ...         │ ...        │  │
│  └────────────────┴───────────┴─────────────┴────────────┘  │
│                                                              │
│  RECURRING DISCOUNTS          SERVICE DESCRIPTIONS           │
│  • Weekly: 15% off            • Deep Clean: 4-hour service   │
│  • Bi-Weekly: 10% off         • Maintenance: 2-hour service  │
│  • Monthly: 5% off            • 90-Day: Bundle savings       │
│                                                              │
│  PAYMENT: 25% deposit + 75% after service                    │
│                                                              │
│  ────────────────────────────────────────────────────────    │
│  Questions? Call 972-559-0223 | support@alphaluxclean.com    │
│  Prices effective: February 7, 2026                          │
└──────────────────────────────────────────────────────────────┘
```
