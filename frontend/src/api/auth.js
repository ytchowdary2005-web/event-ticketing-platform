import { API_URL } from "../config";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { detail: text } : {};
}

export async function login(email, password) {
  const formData = new URLSearchParams();

  formData.append("username", email.trim());
  formData.append("password", password);

  let response;
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });
  } catch {
    throw new Error(
      `Cannot connect to the backend at ${API_URL}. Make sure FastAPI is running.`
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }

  if (!data.access_token) {
    throw new Error("Login succeeded but no access token was returned.");
  }

  return data;
}

export async function register(name, email, password) {
  let response;
  try {
    response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password,
      }),
    });
  } catch {
    throw new Error(
      `Cannot connect to the backend at ${API_URL}. Make sure FastAPI is running.`
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data.detail || "Registration failed");
  }

  return data;
}
