import { AuthStorage } from "../../userData/AuthStorage";
import { apiUrl } from "../../config/api";
import type { Profile } from "./types";

function buildAuthHeaders() {
  const token = AuthStorage.getValidToken();

  if (!token) {
    throw new Error("You need to sign in to manage your profile.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function throwApiError(
  response: Response,
  error?: string,
  fallback = "Request failed.",
): never {
  if (response.status === 401) {
    AuthStorage.clear();
    throw new Error("Your session expired. Please sign in again.");
  }

  throw new Error(error || fallback);
}

export async function fetchProfile() {
  const response = await fetch(apiUrl("/profile"), {
    headers: buildAuthHeaders(),
  });

  const data = await readJson<{
    ok?: boolean;
    error?: string;
    profile?: Profile;
  }>(response);

  if (!response.ok || !data.profile) {
    throwApiError(response, data.error, "Could not load profile.");
  }

  return data.profile;
}

export async function updateProfile(input: {
  fullName: string;
  avatarUrl: string;
}) {
  const response = await fetch(apiUrl("/profile"), {
    method: "PATCH",
    headers: buildAuthHeaders(),
    body: JSON.stringify(input),
  });

  const data = await readJson<{
    ok?: boolean;
    error?: string;
    profile?: Profile;
  }>(response);

  if (!response.ok || !data.profile) {
    throwApiError(response, data.error, "Could not update profile.");
  }

  return data.profile;
}
