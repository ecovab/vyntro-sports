export interface FcmPushResult {
  success: boolean;
  error?: string;
}

/**
 * Sends a push via FCM's legacy HTTP API. Android/web devices register an
 * FCM token directly; iOS devices that also go through FCM (rather than raw
 * APNs) work the same way.
 */
export async function sendFcmPush(deviceToken: string, title: string, body: string): Promise<FcmPushResult> {
  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey) {
    return { success: false, error: "FCM_SERVER_KEY is not configured" };
  }

  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${serverKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: deviceToken,
      notification: { title, body },
    }),
  });

  if (!response.ok) {
    return { success: false, error: `FCM request failed: ${response.status} ${response.statusText}` };
  }
  return { success: true };
}
