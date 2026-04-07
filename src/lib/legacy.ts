import { TokenInfoResponse } from "@/types/legacy";

const BASE_URL_LEGACY = "http://localhost:3000";

export async function getTokenInfo(token: string): Promise<TokenInfoResponse> {
  const res = await fetch(`${BASE_URL_LEGACY}/users/get-token-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    throw new Error(`error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
