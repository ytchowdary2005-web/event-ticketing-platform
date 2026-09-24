import { API_URL } from "../config";

export async function createBooking(showId, showSeatIds, token) {
  const response = await fetch(`${API_URL}/bookings/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      show_id: showId,
      show_seat_ids: showSeatIds,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to create booking");
  }

  return data;
}

export async function cancelBooking(bookingId, token) {
  const response = await fetch(
    `${API_URL}/bookings/${bookingId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to cancel booking");
  }

  return data;
}

export async function getMyBookings(token) {
  const response = await fetch(`${API_URL}/bookings/my-bookings`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load bookings");
  }

  return data;
}