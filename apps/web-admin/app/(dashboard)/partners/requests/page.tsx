"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import { MockApi } from "@/lib/api/mock-api";
import { formatDate } from "@/lib/utils";
import { PARTNER_REQUEST_STATUS_MAP } from "@/lib/constants";
import { CheckCircle, XCircle, Phone, FileText } from "lucide-react";
import type { PartnerRequest } from "@/types/admin";
import { PartnerTypeDisplay } from "@/components/ui/PartnerTypeDisplay";
import { toast } from "sonner";

import { useAdminStore } from "@/lib/store";

function isActiveRequest(request: PartnerRequest) {
  return request.status === "new" || request.status === "reviewing" || request.status === "submitted";
}

export default function PartnerRequestsPage() {
  const storeRequests = useAdminStore((s) => s.partnerRequests);
  const approvePartnerRequest = useAdminStore((s) => s.approvePartnerRequest);
  const rejectPartnerRequest = useAdminStore((s) => s.rejectPartnerRequest);
  const setPartnerRequestNote = useAdminStore((s) => s.setPartnerRequestNote);
  const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState("");

  const setPartnerRequests = useAdminStore((s) => s.setPartnerRequests);
  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await MockApi.getPartnerRequests();
        setPartnerRequests(data);
      } catch (error) {
        console.error("Failed to fetch partner requests", error);
      }
    }
    loadRequests();
  }, [setPartnerRequests]);

  const requests = storeRequests.filter(isActiveRequest);

  const handleDecision = async (id: string, decision: "approve" | "reject") => {
    try {
      if (decision === "approve") {
        await MockApi.approvePartner(id);
        approvePartnerRequest(id);
        toast.success("Ariza muvaffaqiyatli tasdiqlandi!");
      } else {
        await MockApi.rejectPartner(id, "");
        rejectPartnerRequest(id);
        toast.success("Ariza rad etildi!");
      }
      setSelectedRequest(null);
    } catch {
      toast.error("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
      {/* Header */}
      

      {/* Requests list */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Kompaniya</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Turi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Telefon</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Ariza sanasi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Hujjatlar</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Holat</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{req.id}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-[var(--text-primary)]">{req.companyName}</span>
                    <span className="text-xs text-[var(--text-muted)]">{req.contactPerson}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <PartnerTypeDisplay type={req.type} />
                </td>
                <td className="px-4 py-3 text-sm">{req.phone}</td>
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{formatDate(req.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-sm text-[var(--info)]">
                    <FileText size={14} /> {req.documents.length} ta
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={req.status} statusMap={PARTNER_REQUEST_STATUS_MAP} />
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(req);
                      setAdminNoteDraft(req.adminNote ?? "");
                    }}
                  >
                    Ko&apos;rish
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      <Modal
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={selectedRequest ? `Ariza: ${selectedRequest.companyName}` : ""}
        size="lg"
        footer={
          selectedRequest && isActiveRequest(selectedRequest) ? (
            <>
              <Button variant="danger" size="sm" icon={<XCircle size={14} />} onClick={() => handleDecision(selectedRequest.id, "reject")}>
                Rad etish
              </Button>
              <Button variant="accent" size="sm" icon={<CheckCircle size={14} />} onClick={() => handleDecision(selectedRequest.id, "approve")}>
                Tasdiqlash
              </Button>
            </>
          ) : undefined
        }
      >
        {selectedRequest && (
          <div className="flex flex-col gap-5">
            {/* Company info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Kompaniya nomi</p>
                <p className="text-sm font-medium">{selectedRequest.companyName}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Turi</p>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <PartnerTypeDisplay type={selectedRequest.type} />
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Mas&apos;ul shaxs</p>
                <p className="text-sm font-medium">{selectedRequest.contactPerson}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Telefon</p>
                <p className="text-sm font-medium">{selectedRequest.phone}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Email</p>
                <p className="text-sm font-medium">{selectedRequest.email}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Manzil</p>
                <p className="text-sm font-medium">{selectedRequest.city}, {selectedRequest.address}</p>
              </div>
            </div>

            {/* Documents */}
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2 uppercase font-semibold tracking-wider">Hujjatlar</p>
              <div className="flex flex-col gap-2">
                {selectedRequest.documents.map((doc) => (
                  <div key={doc.name} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors">
                    <FileText size={18} className="text-[var(--info)] shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-[var(--text-muted)] capitalize">{doc.type.replace("_", " ")}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (doc.url) window.open(doc.url, "_blank");
                      else toast.error("Hujjat fayli topilmadi!");
                    }}>Yuklab olish</Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            {selectedRequest.note && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2 uppercase font-semibold tracking-wider">Izoh</p>
                <Card padding="sm" className="bg-[var(--bg-tertiary)]">
                  <p className="text-sm text-[var(--text-secondary)] italic">&ldquo;{selectedRequest.note}&rdquo;</p>
                </Card>
              </div>
            )}

            {/* Admin izohi */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[var(--text-muted)] uppercase font-semibold tracking-wider">Admin izohi</p>
                {adminNoteDraft !== (selectedRequest.adminNote ?? "") && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setPartnerRequestNote(selectedRequest.id, adminNoteDraft);
                      toast.success("Izoh saqlandi");
                    }}
                  >
                    Saqlash
                  </Button>
                )}
              </div>
              <textarea
                value={adminNoteDraft}
                onChange={(e) => setAdminNoteDraft(e.target.value)}
                placeholder="Ariza yuzasidan ichki izoh qoldiring..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all resize-none"
              />
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="secondary" size="sm" icon={<Phone size={14} />} onClick={() => window.open(`tel:${selectedRequest.phone}`, "_self")}>Qo&apos;ng&apos;iroq</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
