import { API_URL } from "../config";

export async function createPayment(bookingId, token) {
  const response = await fetch(`${API_URL}/payments/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      booking_id: bookingId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Payment failed");
  }

  return data;
}