import { connect } from "node:http2";
import jwt from "jsonwebtoken";

export interface ApnsPushResult {
  success: boolean;
  error?: string;
}

let cachedProviderToken: { token: string; issuedAt: number } | undefined;

function getProviderToken(): string {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const privateKey = process.env.APNS_PRIVATE_KEY;
  if (!keyId || !teamId || !privateKey) {
    throw new Error("APNS_KEY_ID, APNS_TEAM_ID, and APNS_PRIVATE_KEY must be configured");
  }

  const now = Date.now();
  if (cachedProviderToken && now - cachedProviderToken.issuedAt < 50 * 60 * 1000) {
    return cachedProviderToken.token;
  }

  const token = jwt.sign({ iss: teamId, iat: Math.floor(now / 1000) }, privateKey, {
    algorithm: "ES256",
    keyid: keyId,
  });
  cachedProviderToken = { token, issuedAt: now };
  return token;
}

/**
 * Sends a push via Apple's HTTP/2 provider API directly (no third-party APNs
 * library), using a JWT provider token signed with the .p8 key — the
 * standard token-based auth flow Apple requires for HTTP/2 APNs.
 */
export async function sendApnsPush(deviceToken: string, title: string, body: string): Promise<ApnsPushResult> {
  const bundleId = process.env.APNS_BUNDLE_ID;
  if (!bundleId) {
    return { success: false, error: "APNS_BUNDLE_ID is not configured" };
  }

  let providerToken: string;
  try {
    providerToken = getProviderToken();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to sign APNs provider token" };
  }

  const host = process.env.APNS_HOST ?? "https://api.push.apple.com";
  const payload = JSON.stringify({ aps: { alert: { title, body } } });

  return new Promise((resolve) => {
    const client = connect(host);
    client.on("error", (err) => resolve({ success: false, error: err.message }));

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${providerToken}`,
      "apns-topic": bundleId,
      "content-type": "application/json",
    });

    let status = 0;
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.on("end", () => {
      client.close();
      if (status === 200) {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: `APNs request failed with status ${status}` });
      }
    });
    req.on("error", (err) => {
      client.close();
      resolve({ success: false, error: err.message });
    });

    req.end(payload);
  });
}
