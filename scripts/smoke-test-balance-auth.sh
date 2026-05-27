#!/usr/bin/env bash
# Smoke test for the balance pre-authorization flow.
#
# Run this once Lovable / Supabase has deployed:
#   - migration 20260527_balance_preauth_columns.sql
#   - edge functions:
#       authorize-booking-balance
#       retry-balance-authorizations
#       capture-booking-balance
#       cancel-booking-for-auth-failure
#   - modified confirm-booking-payment (functionVersion =
#     "2026-05-27-balance-auth")
#
# Usage:
#   ./scripts/smoke-test-balance-auth.sh                  # uses the anon key from .env
#   ./scripts/smoke-test-balance-auth.sh <BEARER_TOKEN>   # override the bearer
#
# Exits non-zero on any failure; pretty-prints each step's outcome.

set -u
set -o pipefail

# ------------------------------------------------------------------
# 0. Config
# ------------------------------------------------------------------

REF="yltvknkqnzdeiqckqjha"
PROJECT_URL="https://${REF}.supabase.co"
FUNCTIONS_URL="https://${REF}.functions.supabase.co"

if [[ -n "${1:-}" ]]; then
  TOKEN="$1"
elif [[ -f .env ]]; then
  TOKEN="$(grep -E '^VITE_SUPABASE_PUBLISHABLE_KEY=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
else
  TOKEN="${SUPABASE_ANON_KEY:-}"
fi

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: no token. Pass as first arg, set SUPABASE_ANON_KEY, or run from repo root with .env present."
  exit 1
fi

BLUE="\033[1;34m"
GREEN="\033[1;32m"
RED="\033[1;31m"
YELLOW="\033[1;33m"
RESET="\033[0m"

step() { echo -e "\n${BLUE}━━━ $1 ━━━${RESET}"; }
ok()   { echo -e "${GREEN}✓${RESET} $1"; }
fail() { echo -e "${RED}✗${RESET} $1"; exit 1; }
warn() { echo -e "${YELLOW}!${RESET} $1"; }

probe_fn() {
  local fn="$1"
  local code
  code=$(curl -s -o /tmp/probe-${fn}.json -w '%{http_code}' \
    -X POST "${FUNCTIONS_URL}/${fn}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H 'Content-Type: application/json' \
    -d '{}')
  if [[ "$code" == "404" ]]; then
    fail "${fn} is not deployed (HTTP 404)"
  fi
  ok "${fn} reachable (HTTP ${code})"
}

# ------------------------------------------------------------------
# 1. Deployment readiness
# ------------------------------------------------------------------

step "1. Deployment readiness — are the new functions live?"

probe_fn authorize-booking-balance
probe_fn retry-balance-authorizations
probe_fn capture-booking-balance
probe_fn cancel-booking-for-auth-failure

# ------------------------------------------------------------------
# 2. Migration check — balance_auth_* columns exist
# ------------------------------------------------------------------

step "2. Migration check — balance_auth_* columns on bookings"

RESP=$(curl -s "${PROJECT_URL}/rest/v1/bookings?select=id,balance_auth_status,balance_auth_payment_intent_id,balance_auth_attempts,balance_auth_expires_at,balance_auth_next_retry_at,cancelled_at&limit=1" \
  -H "apikey: ${TOKEN}" -H "Authorization: Bearer ${TOKEN}")

if echo "$RESP" | grep -q '"code":"42703"'; then
  fail "balance_auth_* columns missing — migration not applied yet"
fi
ok "balance_auth_* columns exist"

# ------------------------------------------------------------------
# 3. confirm-booking-payment new code is live
# ------------------------------------------------------------------

step "3. confirm-booking-payment functionVersion check"

BOOKING_ID=$(curl -s "${PROJECT_URL}/rest/v1/bookings?select=id&payment_status=eq.deposit_paid&order=paid_at.desc.nullslast&limit=1" \
  -H "apikey: ${TOKEN}" -H "Authorization: Bearer ${TOKEN}" \
  | grep -oE '"id":"[^"]+"' | head -1 | cut -d\" -f4)
if [[ -z "$BOOKING_ID" ]]; then
  fail "No deposit_paid booking available to test against"
fi
ok "Using booking $BOOKING_ID"

PI_ID=$(curl -s "${PROJECT_URL}/rest/v1/bookings?select=stripe_payment_intent_id&id=eq.${BOOKING_ID}" \
  -H "apikey: ${TOKEN}" -H "Authorization: Bearer ${TOKEN}" \
  | grep -oE '"stripe_payment_intent_id":"[^"]+"' | cut -d\" -f4)

CBP_RESP=$(curl -s -X POST "${FUNCTIONS_URL}/confirm-booking-payment" \
  -H "Authorization: Bearer ${TOKEN}" -H 'Content-Type: application/json' \
  -d "{\"bookingId\":\"${BOOKING_ID}\",\"paymentIntentId\":\"${PI_ID}\",\"paymentStatus\":\"deposit_paid\"}")

VERSION=$(echo "$CBP_RESP" | grep -oE '"functionVersion":"[^"]+"' | cut -d\" -f4)
if [[ "$VERSION" == "2026-05-27-balance-auth" ]]; then
  ok "confirm-booking-payment is on version ${VERSION}"
else
  fail "confirm-booking-payment functionVersion is '${VERSION:-<missing>}', expected '2026-05-27-balance-auth' — redeploy needed"
fi

if echo "$CBP_RESP" | grep -q '"balanceAuthTriggered":true'; then
  ok "confirm-booking-payment now triggers authorize-booking-balance"
elif echo "$CBP_RESP" | grep -q '"balanceAuthTriggered":false'; then
  warn "balanceAuthTriggered=false on this booking (zero balance or already captured)"
else
  fail "confirm-booking-payment response missing balanceAuthTriggered field"
fi

# ------------------------------------------------------------------
# 4. retry-balance-authorizations dry-run
# ------------------------------------------------------------------

step "4. retry-balance-authorizations dry-run sweep"

SWEEP=$(curl -s -X POST "${FUNCTIONS_URL}/retry-balance-authorizations" \
  -H "Authorization: Bearer ${TOKEN}" -H 'Content-Type: application/json' \
  -d '{"dry_run":true,"limit":50}')

if echo "$SWEEP" | grep -q '"success":true'; then
  ok "Sweep ran cleanly in dry-run mode"
  echo "$SWEEP" | python3 -c 'import json,sys; r=json.load(sys.stdin); print("    summary:", r.get("summary"))' 2>/dev/null \
    || echo "    raw: $SWEEP"
else
  fail "Sweep failed: $SWEEP"
fi

# ------------------------------------------------------------------
# 5. authorize-booking-balance on the test booking
# ------------------------------------------------------------------

step "5. authorize-booking-balance against the test booking"

warn "This will attempt a REAL Stripe authorization-only hold on the customer's saved card."
warn "Booking ${BOOKING_ID} — abort within 10s if you don't want this."
sleep 10

AUTH=$(curl -s -X POST "${FUNCTIONS_URL}/authorize-booking-balance" \
  -H "Authorization: Bearer ${TOKEN}" -H 'Content-Type: application/json' \
  -d "{\"booking_id\":\"${BOOKING_ID}\",\"reason\":\"manual\"}")

if echo "$AUTH" | grep -q '"success":true' && echo "$AUTH" | grep -q '"status":"authorized"'; then
  ok "Hold placed — booking now has an authorization on file"
  echo "$AUTH" | python3 -c 'import json,sys; r=json.load(sys.stdin); print("    pi:", r.get("payment_intent_id")); print("    amount_cents:", r.get("amount_cents")); print("    expires_at:", r.get("expires_at"))' 2>/dev/null
elif echo "$AUTH" | grep -q '"status":"failed"'; then
  warn "Hold attempt FAILED (this is expected behavior to test — verify ops sees the failed row)"
  echo "$AUTH" | python3 -c 'import json,sys; r=json.load(sys.stdin); print("    error:", r.get("error")); print("    code:", r.get("code")); print("    attempts:", r.get("attempts")); print("    next_retry_at:", r.get("next_retry_at"))' 2>/dev/null
else
  fail "Unexpected response: $AUTH"
fi

# ------------------------------------------------------------------
# 6. Verify the booking row reflects the auth state
# ------------------------------------------------------------------

step "6. Verify bookings row was updated"

ROW=$(curl -s "${PROJECT_URL}/rest/v1/bookings?select=balance_auth_status,balance_auth_payment_intent_id,balance_auth_attempts,balance_auth_last_error,balance_auth_authorized_at,balance_auth_expires_at,balance_auth_next_retry_at&id=eq.${BOOKING_ID}" \
  -H "apikey: ${TOKEN}" -H "Authorization: Bearer ${TOKEN}")
echo "    $ROW"

if echo "$ROW" | grep -qE '"balance_auth_status":"(authorized|failed)"'; then
  ok "Booking row reflects auth lifecycle"
else
  fail "Booking row didn't update — investigate"
fi

# ------------------------------------------------------------------
# 7. Release the hold so the customer's card isn't held
# ------------------------------------------------------------------

step "7. Release the test hold (if authorized)"

if echo "$ROW" | grep -q '"balance_auth_status":"authorized"'; then
  CAP=$(curl -s -X POST "${FUNCTIONS_URL}/cancel-booking-for-auth-failure" \
    -H "Authorization: Bearer ${TOKEN}" -H 'Content-Type: application/json' \
    -d "{\"booking_id\":\"__no_op__release_test\",\"reason\":\"smoke-test only — should fail booking-not-found\"}")
  # We don't actually cancel the booking — just confirm the function is callable.
  if echo "$CAP" | grep -qE '"(Booking not found|booking_id)"'; then
    ok "cancel-booking-for-auth-failure is reachable and validates input"
  else
    warn "cancel-booking-for-auth-failure returned unexpected: $CAP"
  fi
  warn "Hold on booking $BOOKING_ID is still active. To release, run:"
  warn "  curl -X POST '$FUNCTIONS_URL/capture-booking-balance' -H \"Authorization: Bearer \$TOKEN\" -H 'Content-Type: application/json' -d '{\"booking_id\":\"$BOOKING_ID\"}'"
  warn "  (this will CAPTURE — turning the hold into a real charge)"
  warn "  OR manually cancel the PI in the Stripe dashboard."
fi

echo
echo -e "${GREEN}━━━ Smoke test complete ━━━${RESET}"
