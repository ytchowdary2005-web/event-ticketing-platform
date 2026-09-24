import { API_URL } from "../config";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { detail: text } : {};
}

export async function getEvents() {
  let response;
  try {
    response = await fetch(`${API_URL}/events/`);
  } catch {
    throw new Error(
      `Cannot connect to the backend at ${API_URL}. Make sure FastAPI is running.`
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch events");
  }

  return data;
}

export async function getEvent(eventId) {
  let response;
  try {
    response = await fetch(`${API_URL}/events/${eventId}`);
  } catch {
    throw new Error(
      `Cannot connect to the backend at ${API_URL}. Make sure FastAPI is running.`
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch event details");
  }

  return data;
}
