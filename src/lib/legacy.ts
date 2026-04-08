import { TokenInfoResponse } from "@/types/legacy";

export async function getTokenInfo(token: string): Promise<TokenInfoResponse> {
  const res = await fetch(`${import.meta.env.VITE_BASE_URL_LEGACY}/users/get-token-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    throw new Error(`error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
