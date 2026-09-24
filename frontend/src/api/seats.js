import { API_URL } from "../config";

export async function getShowSeats(showId) {
  const response = await fetch(`${API_URL}/show-seats/${showId}/seats`);

  if (!response.ok) {
    throw new Error("Failed to fetch seats");
  }

  return response.json();
}