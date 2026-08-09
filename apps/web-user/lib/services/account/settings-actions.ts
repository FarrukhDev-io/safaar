"use server";

import { api, ApiRequestError } from "@/lib/api";
import { getSession } from "@/lib/auth/session";

export async function uploadAvatarAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file provided" };

  try {
    await api.users.uploadAvatar(file, { token: session.accessToken });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof ApiRequestError ? error.message : "ERROR" };
  }
}

export async function deleteAvatarAction() {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  try {
    await api.users.deleteAvatar({ token: session.accessToken });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof ApiRequestError ? error.message : "ERROR" };
  }
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  
  const data = {
    emailAlerts: formData.get("emailAlerts") === "on",
    smsAlerts: formData.get("smsAlerts") === "on",
  };

  try {
    await api.users.updateNotificationPreferences(data, { token: session.accessToken });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof ApiRequestError ? error.message : "ERROR" };
  }
}

export async function requestDataExportAction() {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  try {
    await api.users.requestDataExport({ token: session.accessToken });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof ApiRequestError ? error.message : "ERROR" };
  }
}

export async function requestAccountDeletionAction() {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  try {
    await api.users.requestAccountDeletion({ token: session.accessToken });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof ApiRequestError ? error.message : "ERROR" };
  }
}
