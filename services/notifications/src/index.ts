export interface PushTarget {
  userId: string;
  deviceToken: string;
  platform: "ios" | "android" | "web";
}

/**
 * Implemented in Phase 7: dispatch via FCM/APNs, respecting per-user
 * notification_preferences before sending.
 */
export async function dispatchPush(_target: PushTarget, _title: string, _body: string): Promise<void> {
  throw new Error("Not implemented");
}
