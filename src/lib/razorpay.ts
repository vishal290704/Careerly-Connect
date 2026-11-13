import crypto from "node:crypto";

const razorpayBaseUrl = "https://api.razorpay.com/v1";

function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay credentials are not configured.");
  return { keyId, keySecret };
}

async function razorpayRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { keyId, keySecret } = getCredentials();
  const response = await fetch(`${razorpayBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    console.error("Razorpay request failed", response.status, body);
    throw new Error("RAZORPAY_REQUEST_FAILED");
  }
  return response.json() as Promise<T>;
}

export function getRazorpayKeyId() {
  return getCredentials().keyId;
}

export function createRazorpayOrder(amount: number, receipt: string) {
  return razorpayRequest<{ id: string; amount: number; currency: string }>("/orders", {
    method: "POST",
    body: JSON.stringify({ amount: amount * 100, currency: "INR", receipt, payment_capture: 1 }),
  });
}

export function getRazorpayOrder(orderId: string) {
  return razorpayRequest<{ id: string; amount: number; currency: string }>(`/orders/${encodeURIComponent(orderId)}`);
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac("sha256", getCredentials().keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
