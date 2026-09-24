import { API_URL } from "../config";

export async function getTicketQR(bookingId, token) {
  const response = await fetch(
    `${API_URL}/tickets/${bookingId}/qr`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to generate ticket QR");
  }

  return response.blob();
}