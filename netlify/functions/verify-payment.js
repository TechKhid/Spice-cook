/* Verifies a Paystack payment on the server, where the secret key is safe.
   Deploy on Netlify, set PAYSTACK_SECRET_KEY in Site settings → Environment
   variables, then set payments.verifyUrl in js/menu.js to
   "/.netlify/functions/verify-payment".

   GET /.netlify/functions/verify-payment?reference=SNC-1008-1234
   → { status: "success" | "failed" | ..., amount, currency, reference } */

exports.handler = async (event) => {
  const reference = (event.queryStringParameters || {}).reference;
  if (!reference || !/^[\w-]{4,64}$/.test(reference)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing or invalid reference" }) };
  }
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return { statusCode: 500, body: JSON.stringify({ error: "PAYSTACK_SECRET_KEY is not set" }) };

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const json = await res.json().catch(() => ({}));
  const tx = json.data || {};
  return {
    statusCode: res.ok ? 200 : 502,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ status: tx.status || "unknown", amount: tx.amount, currency: tx.currency, reference: tx.reference }),
  };
};
