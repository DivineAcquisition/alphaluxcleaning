/**
 * AlphaLux Cleaning — Bookings tracker (Google Apps Script web app).
 *
 * Drop-in receiver for the `notify-booking` Supabase edge function's
 * `BOOKING_TRACKER_WEBHOOK_URL` destination. When deployed as a web
 * app, every paid booking from the customer-web flow lands as a new
 * row at the top of the active sheet, with idempotent updates if
 * the same booking_id is re-sent (e.g. after a manual replay or a
 * status change).
 *
 * Setup (3 minutes):
 *   1. Create a new Google Sheet (any name). The script auto-creates
 *      the header row on first run; you don't have to pre-format
 *      anything.
 *   2. Extensions → Apps Script. Replace the file contents with this
 *      file's contents and click Save.
 *   3. (Optional) Deploy → Project Settings → Script Properties →
 *      Add a `SHARED_SECRET` property and set it to a random string;
 *      then set the same value as `BOOKING_TRACKER_SECRET` in the
 *      Supabase Edge Function secrets so this script will reject
 *      requests that don't include it as a Bearer token.
 *   4. Deploy → New deployment → "Web app". Set:
 *        - Description: "AlphaLux Bookings tracker"
 *        - Execute as: Me
 *        - Who has access: Anyone (this allows the Supabase function
 *          to POST to the URL — the SHARED_SECRET above gates real
 *          authorization).
 *      Copy the resulting "/exec" URL.
 *   5. In Supabase Edge Function Secrets, set:
 *        - BOOKING_TRACKER_WEBHOOK_URL = <the /exec URL>
 *        - BOOKING_TRACKER_SECRET = <the secret you picked, optional>
 *
 *   That's it. The next paid booking on alphaluxcleaning.com appends
 *   a row here.
 *
 * Adding columns:
 *   Append new field names to COLUMNS at the bottom of the file and
 *   redeploy. New columns auto-fill on subsequent rows; older rows
 *   stay blank in the new column. Don't reorder; the script tracks
 *   columns by header name, not position.
 */

const COLUMNS = [
  "received_at",
  "event",
  "booking_id",
  "paid_at",
  "created_at",
  "customer_name",
  "customer_email",
  "customer_phone",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "zip",
  "service_label",
  "service_type",
  "frequency",
  "sqft_or_bedrooms",
  "home_size",
  "service_date",
  "time_slot",
  "arrival_window",
  "total_paid",
  "promo_code",
  "promo_discount",
  "rush_upcharge",
  "rush_booking",
  "payment_status",
  "stripe_payment_intent_id",
  "stripe_subscription_id",
  "hcp_customer_id",
  "hcp_job_id",
  "source",
  "special_instructions",
];

function doPost(e) {
  try {
    const expected = (PropertiesService.getScriptProperties().getProperty("SHARED_SECRET") || "").trim();
    if (expected) {
      const auth = (e.parameter.token || _readBearer_(e)) || "";
      if (auth !== expected) {
        return _json_({ ok: false, error: "Unauthorized" }, 401);
      }
    }

    const payload = JSON.parse(e.postData.contents || "{}");
    const sheet = _ensureSheet_();
    _ensureHeaders_(sheet);

    const rowIndex = _findRowByBookingId_(sheet, payload.booking_id);
    const values = _flattenPayload_(payload);
    if (rowIndex > 0) {
      // Update in place to keep the sheet idempotent.
      sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
    } else {
      // Newest at the top — insert above existing data rows so the
      // sheet reads chronologically without sorting.
      sheet.insertRowBefore(2);
      sheet.getRange(2, 1, 1, values.length).setValues([values]);
    }

    return _json_({ ok: true, mode: rowIndex > 0 ? "updated" : "appended", row: rowIndex > 0 ? rowIndex : 2 });
  } catch (err) {
    return _json_({ ok: false, error: String(err) }, 500);
  }
}

function doGet() {
  // Browser smoke test — confirms the deployment URL is reachable.
  return _json_({ ok: true, service: "alphalux-bookings-tracker" });
}

function _ensureSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName("Bookings") || ss.insertSheet("Bookings");
}

function _ensureHeaders_(sheet) {
  const expected = ["received_at"].concat(COLUMNS.slice(1));
  const headerRange = sheet.getRange(1, 1, 1, expected.length);
  const current = headerRange.getValues()[0];
  const matches = expected.every((h, i) => current[i] === h);
  if (!matches) {
    headerRange.setValues([expected]);
    sheet.setFrozenRows(1);
    headerRange.setFontWeight("bold");
  }
}

function _findRowByBookingId_(sheet, bookingId) {
  if (!bookingId) return -1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const idColIdx = COLUMNS.indexOf("booking_id") + 1;
  const range = sheet.getRange(2, idColIdx, lastRow - 1, 1).getValues();
  for (let i = 0; i < range.length; i++) {
    if (range[i][0] === bookingId) return i + 2;
  }
  return -1;
}

function _flattenPayload_(payload) {
  const now = new Date().toISOString();
  return COLUMNS.map((c) => {
    if (c === "received_at") return now;
    const v = payload[c];
    if (v == null) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return v;
  });
}

function _readBearer_(e) {
  const header = (e && e.headers && (e.headers.Authorization || e.headers.authorization)) || "";
  const m = String(header).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

function _json_(obj, status) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
