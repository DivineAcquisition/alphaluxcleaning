
# Update Pricing Sheet: Replace 90-Day Plan with Recurring Service Pricing

## Overview

Remove the deprecated 90-Day Reset Plan and replace it with comprehensive recurring service pricing tables showing Weekly, Bi-Weekly, and Monthly rates with discounts applied.

## Changes Summary

### What Gets Removed
- 90-Day Plan column from all state pricing tables
- 90-Day Plan service description
- 90-Day Plan payment structure section
- 90-Day Plan deposit examples

### What Gets Added
- **Recurring Maintenance Pricing Tables** for each state showing:
  - Per-clean price for Weekly (15% off), Bi-Weekly (10% off), Monthly (5% off)
  - Monthly total cost for each frequency
- Updated service descriptions (removing 90-Day references)
- Simplified payment structure

## New Table Structure

### Main Service Pricing (Per State)
| Home Size | Deep Clean | Maintenance | Move-In/Out |
|-----------|------------|-------------|-------------|
| 1,000-1,499 sqft | $250 | $170 | $315 |
| ... | ... | ... | ... |

### NEW: Recurring Maintenance Pricing (Per State)
| Home Size | Weekly (15% off) | Bi-Weekly (10% off) | Monthly (5% off) |
|-----------|------------------|---------------------|------------------|
| 1,000-1,499 sqft | $145/clean ($580/mo) | $153/clean ($306/mo) | $162/clean |
| 1,500-1,999 sqft | $166/clean ($664/mo) | $176/clean ($352/mo) | $185/clean |
| ... | ... | ... | ... |

## File Changes

| File | Action |
|------|--------|
| `src/pages/PricingSheet.tsx` | Update - Remove 90-Day, add recurring tables |

## Technical Details

### Pricing Calculations
Using `maintenancePrice` as the base for recurring:
- **Weekly**: `maintenancePrice × 0.85` (15% discount) × 4 cleans/month
- **Bi-Weekly**: `maintenancePrice × 0.90` (10% discount) × 2 cleans/month  
- **Monthly**: `maintenancePrice × 0.95` (5% discount) × 1 clean/month

### Updated Sections
1. **Main Tables**: Remove 90-Day column, keep Deep Clean, Maintenance, Move-In/Out
2. **NEW Recurring Section**: Dedicated table showing discounted recurring rates with monthly totals
3. **Service Descriptions**: Remove 90-Day, update descriptions for remaining services
4. **Payment Structure**: Simplify to just Standard & Deep Clean deposit info
5. **Quick Reference**: Update to show recurring deposit examples instead of 90-Day
