"use server";

import { api } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { safeAction } from "@/lib/services/safe-action";

type SimpleResult = { ok: boolean; error?: string };

export async function uploadAvatarAction(formData: FormData): Promise<SimpleResult> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file provided" };

  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  return safeAction<SimpleResult>(
    async () => {
      await api.users.uploadAvatar(file, { token: session.accessToken });
      return { ok: true };
    },
    { ok: false, error: "ERROR" },
  );
}

export async function deleteAvatarAction(): Promise<SimpleResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  return safeAction<SimpleResult>(
    async () => {
      await api.users.deleteAvatar({ token: session.accessToken });
      return { ok: true };
    },
    { ok: false, error: "ERROR" },
  );
}

export async function updateNotificationPreferencesAction(formData: FormData): Promise<SimpleResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const data = {
    emailAlerts: formData.get("emailAlerts") === "on",
    smsAlerts: formData.get("smsAlerts") === "on",
  };

  return safeAction<SimpleResult>(
    async () => {
      await api.users.updateNotificationPreferences(data, { token: session.accessToken });
      return { ok: true };
    },
    { ok: false, error: "ERROR" },
  );
}

export async function requestDataExportAction(): Promise<SimpleResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  return safeAction<SimpleResult>(
    async () => {
      await api.users.requestDataExport({ token: session.accessToken });
      return { ok: true };
    },
    { ok: false, error: "ERROR" },
  );
}

export async function requestAccountDeletionAction(): Promise<SimpleResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  return safeAction<SimpleResult>(
    async () => {
      await api.users.requestAccountDeletion({ token: session.accessToken });
      return { ok: true };
    },
    { ok: false, error: "ERROR" },
  );
}
