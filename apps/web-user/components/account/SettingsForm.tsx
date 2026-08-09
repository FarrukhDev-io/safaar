"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  updateNotificationPreferencesAction,
  requestDataExportAction,
  requestAccountDeletionAction,
} from "@/lib/account/actions";

export function SettingsForm({
  preferences,
}: {
  preferences: { emailAlerts?: boolean; smsAlerts?: boolean } | null;
}) {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handlePreferences = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateNotificationPreferencesAction(formData);
    setLoading(false);
    if (res?.ok) {
      alert("Preferences updated!");
    } else {
      alert(res?.error || "Update failed");
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    const res = await requestDataExportAction();
    setExportLoading(false);
    if (res?.ok) {
      alert("Data export requested!");
    } else {
      alert(res?.error || "Export request failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to request account deletion?")) return;
    setDeleteLoading(true);
    const res = await requestAccountDeletionAction();
    setDeleteLoading(false);
    if (res?.ok) {
      alert("Account deletion requested!");
    } else {
      alert(res?.error || "Deletion request failed");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handlePreferences} className="flex flex-col gap-4">
        <h3 className="text-md font-semibold">Notification Preferences</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="emailAlerts"
            defaultChecked={preferences?.emailAlerts}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm">Email Alerts</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="smsAlerts"
            defaultChecked={preferences?.smsAlerts}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm">SMS Alerts</span>
        </label>
        <div>
          <Button type="submit" size="sm" loading={loading}>
            Save Preferences
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-4 border-t pt-4">
        <h3 className="text-md font-semibold">Data Management</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            onClick={handleExport}
            loading={exportLoading}
          >
            Request Data Export
          </Button>
          <Button
            variant="secondary"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={handleDelete}
            loading={deleteLoading}
          >
            Request Account Deletion
          </Button>
        </div>
      </div>
    </div>
  );
}
