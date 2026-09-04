'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { AdminApi, InternalNote } from '@/lib/api/admin-api';
import { formatDate } from '@/lib/utils';
import { PARTNER_REQUEST_STATUS_MAP } from '@/lib/constants';
import {
  CheckCircle,
  XCircle,
  Phone,
  FileText,
} from 'lucide-react';
import type { PartnerRequest } from '@/types/admin';
import { PartnerTypeDisplay } from '@/components/ui/PartnerTypeDisplay';
import { toast } from 'sonner';

import { useAdminStore } from '@/lib/store';

function isActiveRequest(request: PartnerRequest) {
  return (
    request.status === 'new' ||
    request.status === 'reviewing' ||
    request.status === 'submitted'
  );
}

export default function PartnerRequestsPage() {
  const storeRequests = useAdminStore((s) => s.partnerRequests);
  const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(
    null,
  );
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  // BUG-B01: destructive moderation now requires an explicit confirmation step.
  const [confirmKind, setConfirmKind] = useState<"approve" | "reject" | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");

  const fetchNotes = async (id: string) => {
    try {
      setNotesLoading(true);
      setNotesError(false);
      setNotes(await AdminApi.getPartnerNotes(id));
    } catch {
      setNotesError(true);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedRequest) return;
    const text = noteDraft.trim();
    if (!text) return;
    setNoteSubmitting(true);
    try {
      const created = await AdminApi.addPartnerNote(selectedRequest.id, text);
      setNotes((prev) => [created, ...prev]);
      setNoteDraft("");
      toast.success("Izoh saqlandi");
    } catch (error: any) {
      toast.error(error?.message || "Izohni saqlab bo'lmadi");
    } finally {
      setNoteSubmitting(false);
    }
  };

  const setPartnerRequests = useAdminStore((s) => s.setPartnerRequests);
  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await AdminApi.getPartnerRequests();
        setPartnerRequests(data);
      } catch (error) {
        console.error('Failed to fetch partner requests', error);
      }
    }
    loadRequests();
  }, [setPartnerRequests]);

  const requests = storeRequests.filter(isActiveRequest);

  const handleDecision = async (
    id: string,
    decision: 'approve' | 'reject',
    reason?: string,
  ) => {
    setDecisionId(`${decision}:${id}`);
    try {
      if (decision === 'approve') {
        await AdminApi.approvePartner(id);
        toast.success('Ariza muvaffaqiyatli tasdiqlandi!');
      } else {
        await AdminApi.rejectPartner(id, reason);
        toast.success('Ariza rad etildi!');
      }
      const data = await AdminApi.getPartnerRequests();
      setPartnerRequests(data);
      setConfirmKind(null);
      setRejectReason('');
      setSelectedRequest(null);
    } catch {
      toast.error("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setDecisionId(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
      {/* Header */}

      {/* Requests list */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Kompaniya
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Turi
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Telefon
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Ariza sanasi
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Hujjatlar
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Holat
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]">
            {requests.map((req) => (
              <tr
                key={req.id}
                className="hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                  {req.id}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-[var(--text-primary)]">
                      {req.companyName}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {req.contactPerson}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <PartnerTypeDisplay type={req.type} />
                </td>
                <td className="px-4 py-3 text-sm">{req.phone}</td>
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {formatDate(req.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-sm text-[var(--info)]">
                    <FileText size={14} /> {req.documents.length} ta
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={req.status}
                    statusMap={PARTNER_REQUEST_STATUS_MAP}
                  />
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(req);
                      setNoteDraft("");
                      fetchNotes(req.id);
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
        title={selectedRequest ? `Ariza: ${selectedRequest.companyName}` : ''}
        size="lg"
      >
        {selectedRequest && (
          <div className="flex flex-col gap-5">
            {/* Company info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">
                  Kompaniya nomi
                </p>
                <p className="text-sm font-medium">
                  {selectedRequest.companyName}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Turi</p>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <PartnerTypeDisplay type={selectedRequest.type} />
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">
                  Mas&apos;ul shaxs
                </p>
                <p className="text-sm font-medium">
                  {selectedRequest.contactPerson}
                </p>
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
                <p className="text-sm font-medium">
                  {selectedRequest.city}, {selectedRequest.address}
                </p>
              </div>
            </div>

            {/* Documents */}
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2 uppercase font-semibold tracking-wider">
                Hujjatlar
              </p>
              <div className="flex flex-col gap-2">
                {selectedRequest.documents.map((doc) => (
                  <div
                    key={doc.name}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <FileText
                      size={18}
                      className="text-[var(--info)] shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-[var(--text-muted)] capitalize">
                        {doc.type.replace('_', ' ')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (doc.url) window.open(doc.url, '_blank');
                        else toast.error('Hujjat fayli topilmadi!');
                      }}
                    >
                      Yuklab olish
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            {selectedRequest.note && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2 uppercase font-semibold tracking-wider">
                  Izoh
                </p>
                <Card padding="sm" className="bg-[var(--bg-tertiary)]">
                  <p className="text-sm text-[var(--text-secondary)] italic">
                    &ldquo;{selectedRequest.note}&rdquo;
                  </p>
                </Card>
              </div>
            )}

            {/* Admin izohlari */}
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2 uppercase font-semibold tracking-wider">
                Admin izohlari
              </p>

              {notesLoading ? (
                <p className="text-xs text-[var(--text-muted)] py-2">Yuklanmoqda...</p>
              ) : notesError ? (
                <div className="flex items-center justify-between py-2">
                  <p className="text-xs text-red-500">Izohlarni yuklab bo'lmadi</p>
                  <button
                    onClick={() => fetchNotes(selectedRequest.id)}
                    className="text-xs text-[var(--primary)] hover:underline"
                  >
                    Qayta urinish
                  </button>
                </div>
              ) : notes.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] py-2">Hali izoh yo&apos;q</p>
              ) : (
                <div className="flex flex-col gap-3 mb-3 max-h-48 overflow-y-auto pr-1">
                  {notes.map((note) => (
                    <div key={note.id} className="text-sm border-b border-[var(--border)] pb-2 last:border-0">
                      <p className="text-[var(--text-primary)] whitespace-pre-wrap">{note.body}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {note.authorName} · {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Ariza yuzasidan ichki izoh qoldiring..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all resize-none"
                />
                <Button size="sm" onClick={handleAddNote} disabled={noteSubmitting || !noteDraft.trim()} className="self-end">
                  {noteSubmitting ? "Saqlanmoqda..." : "Qo'shish"}
                </Button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]">
              <Button
                variant="secondary"
                size="sm"
                icon={<Phone size={14} />}
                onClick={() =>
                  window.open(`tel:${selectedRequest.phone}`, '_self')
                }
              >
                Qo&apos;ng&apos;iroq
              </Button>
              {isActiveRequest(selectedRequest) ? (
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<XCircle size={14} />}
                    disabled={decisionId !== null}
                    onClick={() => {
                      setRejectReason('');
                      setConfirmKind('reject');
                    }}
                  >
                    Rad etish
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    icon={<CheckCircle size={14} />}
                    disabled={decisionId !== null}
                    onClick={() => setConfirmKind('approve')}
                  >
                    Tasdiqlash
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </Modal>

      {/* BUG-B01: confirmation step — approve needs an explicit confirm,
          reject needs a written reason. An accidental click never mutates. */}
      <Modal
        open={confirmKind !== null && !!selectedRequest}
        onClose={() => {
          if (decisionId === null) {
            setConfirmKind(null);
            setRejectReason('');
          }
        }}
        title={
          confirmKind === 'approve'
            ? 'Arizani tasdiqlash'
            : 'Arizani rad etish'
        }
        size="sm"
      >
        {selectedRequest && confirmKind && (
          <div className="flex flex-col gap-4">
            {confirmKind === 'approve' ? (
              <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">
                  {selectedRequest.companyName}
                </span>{' '}
                arizasini tasdiqlaysizmi? Hamkor faollashtiriladi.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">
                    {selectedRequest.companyName}
                  </span>{' '}
                  arizasini rad etish sababini kiriting.
                </p>
                <label
                  htmlFor="reject-reason"
                  className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider"
                >
                  Rad etish sababi
                </label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="Masalan: hujjatlar to'liq emas..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all resize-none"
                />
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                disabled={decisionId !== null}
                onClick={() => {
                  setConfirmKind(null);
                  setRejectReason('');
                }}
              >
                Bekor qilish
              </Button>
              <Button
                variant={confirmKind === 'approve' ? 'accent' : 'danger'}
                size="sm"
                loading={decisionId !== null}
                disabled={
                  decisionId !== null ||
                  (confirmKind === 'reject' && !rejectReason.trim())
                }
                onClick={() =>
                  handleDecision(
                    selectedRequest.id,
                    confirmKind,
                    confirmKind === 'reject'
                      ? rejectReason.trim()
                      : undefined,
                  )
                }
              >
                {confirmKind === 'approve' ? 'Tasdiqlash' : 'Rad etish'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
