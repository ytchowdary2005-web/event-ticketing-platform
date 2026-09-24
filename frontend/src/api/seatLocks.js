import { API_URL } from "../config";

export async function lockSeat(showSeatId, token) {
  const response = await fetch(`${API_URL}/seat-locks/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      show_seat_id: showSeatId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to lock seat");
  }

  return data;
}

export async function unlockSeat(showSeatId, token) {
  const response = await fetch(
    `${API_URL}/seat-locks/${showSeatId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to release seat lock");
  }

  return data;
}