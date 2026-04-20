import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValidateRequest {
  action: "validate";
  code: string;
  subtotal_cents: number;
  booking_type?: string;
  customer_id?: string | null;
  email?: string | null;
}

interface RedeemRequest {
  action: "redeem";
  code: string;
  booking_id: string;
  customer_id: string;
  subtotal_cents: number;
  booking_type?: string;
  email?: string | null;
}

const normalizeEmail = (email?: string | null) =>
  email ? email.trim().toLowerCase() : null;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

/**
 * Compute the per-booking discount (in cents) given a promo row and
 * the current subtotal. Supports FIXED (flat cents) and PERCENT codes
 * with optional metadata.max_discount_cents ceiling.
 */
function computeDiscountCents(promo: any, subtotal_cents: number): number {
  if (promo.type === "PERCENT" || promo.percent_off) {
    const pct = Number(promo.percent_off ?? 0);
    if (!pct || pct <= 0) return 0;
    const raw = Math.floor((subtotal_cents * pct) / 100);
    const ceiling = Number(promo.metadata?.max_discount_cents ?? 0);
    const capped = ceiling > 0 ? Math.min(raw, ceiling) : raw;
    return Math.min(capped, subtotal_cents);
  }
  return Math.min(Number(promo.amount_cents ?? 0), subtotal_cents);
}

function formatDiscountDisplay(promo: any, discount_cents: number) {
  if (promo.type === "PERCENT" || promo.percent_off) {
    const pct = Number(promo.percent_off ?? 0);
    const dollars = (discount_cents / 100).toFixed(2);
    return `${pct}% off applied (−$${dollars})`;
  }
  const dollars = (discount_cents / 100).toFixed(2);
  return `$${dollars} off applied`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await req.json();
    const { action } = body;

    console.log(
      "🎟️ [promo-system] Action:",
      action,
      "Body:",
      JSON.stringify(body),
    );

    // -----------------------------------------------------------------
    // VALIDATE (stateless preview) — checks whether the code is usable
    // by this customer/email before they finish checkout.
    // -----------------------------------------------------------------
    if (action === "validate") {
      const {
        code,
        subtotal_cents,
        booking_type = "ONE_TIME",
        customer_id,
        email,
      } = body as ValidateRequest;

      const normalizedCode = code.trim().toUpperCase();
      const normalizedEmail = normalizeEmail(email);
      console.log("🔍 [promo-system] Validating code:", normalizedCode);

      const { data: promo, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", normalizedCode)
        .eq("active", true)
        .single();

      if (error || !promo) {
        return jsonResponse({
          valid: false,
          reason: "Invalid or expired promo code",
        });
      }

      if (promo.starts_at && new Date(promo.starts_at) > new Date()) {
        return jsonResponse({
          valid: false,
          reason: "This promo code is not yet active",
        });
      }

      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return jsonResponse({
          valid: false,
          reason: "This promo code has expired",
        });
      }

      if (promo.redemptions >= promo.max_redemptions) {
        return jsonResponse({
          valid: false,
          reason: "This promo code has been fully redeemed",
        });
      }

      if (promo.applies_to !== "ANY" && promo.applies_to !== booking_type) {
        return jsonResponse({
          valid: false,
          reason: "This promo code is not valid for this booking type",
        });
      }

      if (subtotal_cents < (promo.min_subtotal_cents ?? 0)) {
        const minAmount = ((promo.min_subtotal_cents ?? 0) / 100).toFixed(2);
        return jsonResponse({
          valid: false,
          reason: `Minimum order of $${minAmount} required`,
        });
      }

      // --- Once-per-customer enforcement (also enforced by DB trigger) ---
      if (promo.once_per_customer) {
        const lookups: Array<{ column: string; value: string }> = [];
        if (customer_id) lookups.push({ column: "customer_id", value: customer_id });
        if (normalizedEmail) {
          lookups.push({ column: "customer_email", value: normalizedEmail });
        }

        for (const l of lookups) {
          const q = supabase
            .from("promo_redemptions")
            .select("id", { count: "exact", head: true })
            .eq("code", normalizedCode);
          const { count } =
            l.column === "customer_email"
              ? await q.eq("customer_email", l.value)
              : await q.eq(l.column, l.value);
          if ((count ?? 0) > 0) {
            return jsonResponse({
              valid: false,
              reason:
                "This promo code has already been used on your account. It can only be used once per customer.",
              already_redeemed: true,
            });
          }
        }

        // Also treat "new customers only" as a prior-booking check.
        if (promo.new_customers_only && (customer_id || normalizedEmail)) {
          const prior = customer_id
            ? await supabase
                .from("bookings")
                .select("id", { count: "exact", head: true })
                .eq("customer_id", customer_id)
                .in("status", ["confirmed", "completed", "in_progress"])
            : { count: 0 };

          if ((prior.count ?? 0) > 0) {
            return jsonResponse({
              valid: false,
              reason:
                "This offer is for new customers only — we see a prior booking on your account.",
              already_redeemed: true,
            });
          }
        }
      }

      const discount_cents = computeDiscountCents(promo, subtotal_cents);

      console.log(
        "✅ [promo-system] Code valid:",
        normalizedCode,
        "Discount cents:",
        discount_cents,
      );

      return jsonResponse({
        valid: true,
        discount_cents,
        display: formatDiscountDisplay(promo, discount_cents),
        code: normalizedCode,
        type: promo.type,
        percent_off: promo.percent_off ?? null,
        once_per_customer: !!promo.once_per_customer,
        new_customers_only: !!promo.new_customers_only,
      });
    }

    // -----------------------------------------------------------------
    // REDEEM (atomic) — called at the moment the booking is created.
    // -----------------------------------------------------------------
    if (action === "redeem") {
      const {
        code,
        booking_id,
        customer_id,
        subtotal_cents,
        booking_type = "ONE_TIME",
        email,
      } = body as RedeemRequest;

      const normalizedCode = code.trim().toUpperCase();
      let normalizedEmail = normalizeEmail(email);

      console.log(
        "💳 [promo-system] Redeeming code:",
        normalizedCode,
        "for booking:",
        booking_id,
      );

      // Re-validate promo row
      const { data: promo, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", normalizedCode)
        .eq("active", true)
        .single();

      if (promoError || !promo) {
        return jsonResponse(
          { success: false, error: "Invalid or expired promo code" },
          400,
        );
      }

      if (promo.starts_at && new Date(promo.starts_at) > new Date()) {
        return jsonResponse(
          { success: false, error: "This promo code is not yet active" },
          400,
        );
      }

      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return jsonResponse(
          { success: false, error: "This promo code has expired" },
          400,
        );
      }

      if (promo.redemptions >= promo.max_redemptions) {
        return jsonResponse(
          { success: false, error: "This promo code has been fully redeemed" },
          400,
        );
      }

      if (promo.applies_to !== "ANY" && promo.applies_to !== booking_type) {
        return jsonResponse(
          {
            success: false,
            error: "This promo code is not valid for this booking type",
          },
          400,
        );
      }

      if (subtotal_cents < (promo.min_subtotal_cents ?? 0)) {
        return jsonResponse(
          { success: false, error: "Minimum order requirement not met" },
          400,
        );
      }

      // Resolve email if the caller didn't provide one
      if (!normalizedEmail && customer_id) {
        const { data: cust } = await supabase
          .from("customers")
          .select("email")
          .eq("id", customer_id)
          .single();
        if (cust?.email) normalizedEmail = normalizeEmail(cust.email);
      }

      // --- App-layer once-per-customer check (DB trigger is the final guard) ---
      if (promo.once_per_customer) {
        const duplicateChecks = [];
        if (customer_id) {
          duplicateChecks.push(
            supabase
              .from("promo_redemptions")
              .select("id", { count: "exact", head: true })
              .eq("code", normalizedCode)
              .eq("customer_id", customer_id),
          );
        }
        if (normalizedEmail) {
          duplicateChecks.push(
            supabase
              .from("promo_redemptions")
              .select("id", { count: "exact", head: true })
              .eq("code", normalizedCode)
              .eq("customer_email", normalizedEmail),
          );
        }

        for (const check of duplicateChecks) {
          const { count } = await check;
          if ((count ?? 0) > 0) {
            return jsonResponse(
              {
                success: false,
                error:
                  "This promo code has already been used on your account. It can only be used once per customer.",
                already_redeemed: true,
              },
              409,
            );
          }
        }

        if (promo.new_customers_only && customer_id) {
          const { count } = await supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", customer_id)
            .in("status", ["confirmed", "completed", "in_progress"])
            .neq("id", booking_id);
          if ((count ?? 0) > 0) {
            return jsonResponse(
              {
                success: false,
                error:
                  "This offer is for new customers only — we see a prior booking on your account.",
                already_redeemed: true,
              },
              409,
            );
          }
        }
      }

      const discount_cents = computeDiscountCents(promo, subtotal_cents);

      // Insert redemption (this will hit both the partial unique indexes
      // and the trg_promo_once_per_customer trigger if a race allowed a
      // duplicate past the preflight checks above).
      const { data: redemption, error: redemptionError } = await supabase
        .from("promo_redemptions")
        .insert({
          code: normalizedCode,
          booking_id,
          customer_id,
          customer_email: normalizedEmail,
          discount_cents: Math.max(1, discount_cents),
        })
        .select()
        .single();

      if (redemptionError) {
        console.error(
          "❌ [promo-system] Redemption insert failed:",
          redemptionError,
        );
        // 23505 = unique_violation, P0001 = our trigger
        if (
          redemptionError.code === "23505" ||
          redemptionError.code === "P0001" ||
          /already been used/i.test(redemptionError.message || "") ||
          /promo_once_per_customer_violation/.test(
            redemptionError.hint || "",
          )
        ) {
          return jsonResponse(
            {
              success: false,
              error:
                "This promo code has already been used on your account. It can only be used once per customer.",
              already_redeemed: true,
            },
            409,
          );
        }
        return jsonResponse(
          { success: false, error: "Failed to redeem promo code" },
          500,
        );
      }

      // Increment global redemption counter atomically
      const { data: updatedPromo, error: updateError } = await supabase
        .from("promo_codes")
        .update({ redemptions: promo.redemptions + 1 })
        .eq("id", promo.id)
        .lt("redemptions", promo.max_redemptions)
        .select()
        .single();

      if (updateError || !updatedPromo) {
        console.error(
          "❌ [promo-system] Counter increment failed:",
          updateError,
        );
        await supabase
          .from("promo_redemptions")
          .delete()
          .eq("id", redemption.id);
        return jsonResponse(
          { success: false, error: "Promo code redemption limit reached" },
          400,
        );
      }

      // Stamp booking
      await supabase
        .from("bookings")
        .update({
          promo_code: normalizedCode,
          promo_discount_cents: discount_cents,
        })
        .eq("id", booking_id);

      console.log(
        "✅ [promo-system] Code redeemed successfully:",
        normalizedCode,
      );

      // Fire-and-forget confirmation email (legacy system-email template)
      try {
        const { data: customer } = await supabase
          .from("customers")
          .select("email, name")
          .eq("id", customer_id)
          .single();

        const { data: booking } = await supabase
          .from("bookings")
          .select("est_price, service_date, time_slot")
          .eq("id", booking_id)
          .single();

        if (customer && booking) {
          const discountAmount = (discount_cents / 100).toFixed(2);
          const originalTotal = booking.est_price ?? 0;
          const newTotal = Math.max(
            0,
            originalTotal - discount_cents / 100,
          ).toFixed(2);

          await supabase.functions.invoke("send-system-email", {
            body: {
              companyId: "550e8400-e29b-41d4-a716-446655440000",
              to: customer.email,
              templateKey: "promo_applied",
              variables: {
                customer_name: customer.name,
                promo_code: normalizedCode,
                discount_amount: discountAmount,
                original_total: originalTotal.toFixed(2),
                new_total: newTotal,
                service_date: booking.service_date || "TBD",
                service_time: booking.time_slot || "TBD",
              },
            },
          });
          console.log(
            "📧 [promo-system] Confirmation email sent to:",
            customer.email,
          );
        }
      } catch (emailError) {
        console.error("❌ [promo-system] Email sending failed:", emailError);
      }

      return jsonResponse({
        success: true,
        discount_cents,
        display: formatDiscountDisplay(promo, discount_cents),
        code: normalizedCode,
      });
    }

    // -----------------------------------------------------------------
    // Admin listing of redemptions per customer (useful for
    // AdminPromos / support workflows).
    // -----------------------------------------------------------------
    if (action === "list-redemptions") {
      const { code } = body as { code: string };
      const normalizedCode = code.trim().toUpperCase();

      const { data, error } = await supabase
        .from("promo_redemptions_by_customer")
        .select("*")
        .eq("code", normalizedCode)
        .order("last_redeemed_at", { ascending: false })
        .limit(500);

      if (error) {
        return jsonResponse(
          { success: false, error: error.message },
          500,
        );
      }
      return jsonResponse({ success: true, redemptions: data });
    }

    if (
      action === "create" ||
      action === "bulk-create" ||
      action === "disable" ||
      action === "list"
    ) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      return jsonResponse(
        { error: "Admin actions not yet implemented" },
        501,
      );
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("❌ [promo-system] Error:", error);
    return jsonResponse(
      { error: (error as Error).message ?? "Unknown error" },
      500,
    );
  }
});
