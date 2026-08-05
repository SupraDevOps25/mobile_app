"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { ChevronLeftIcon, ExternalLinkIcon } from "@/components/icons";
import {
  useCaregiver,
  useSetVerification,
} from "@/services/caregivers/caregivers.queries";
import type { CaregiverDocument } from "@/services/caregivers/caregivers.types";
import {
  verificationSchema,
  type VerificationInput,
} from "@/schemas/caregivers/verification.schema";
import { formatDate } from "@/lib/format";

const DOC_LABELS: Record<CaregiverDocument["type"], string> = {
  GHANA_CARD: "Ghana Card",
  PIN_CARD: "Nursing PIN Card",
};

export default function CaregiverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: caregiver, isLoading, isError, error } = useCaregiver(id);
  const setVerification = useSetVerification(id);

  const [rejecting, setRejecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Pick<VerificationInput, "note">>({
    resolver: zodResolver(verificationSchema.pick({ note: true })),
    defaultValues: { note: "" },
  });

  function approve() {
    setVerification.mutate({ status: "VERIFIED" });
  }

  const confirmReject = handleSubmit(({ note }) => {
    setVerification.mutate(
      { status: "REJECTED", note: note || undefined },
      { onSuccess: () => setRejecting(false) },
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-brand">
        <Spinner size={28} />
      </div>
    );
  }

  if (isError || !caregiver) {
    return (
      <Card className="text-center">
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Caregiver not found."}
        </p>
        <Link href="/caregivers" className="mt-3 inline-block text-sm text-brand">
          ← Back to caregivers
        </Link>
      </Card>
    );
  }

  const isVerified = caregiver.verificationStatus === "VERIFIED";
  const isRejected = caregiver.verificationStatus === "REJECTED";

  return (
    <>
      <Link
        href="/caregivers"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ChevronLeftIcon size={16} />
        Caregivers
      </Link>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={caregiver.name} photoUrl={caregiver.photoUrl} size="lg" />
            <h2 className="mt-3 text-lg font-bold text-ink">{caregiver.name}</h2>
            <div className="mt-2">
              <StatusBadge status={caregiver.verificationStatus} />
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Email" value={caregiver.email} />
            <Row label="Phone" value={caregiver.phone} />
            <Row
              label="Experience"
              value={`${caregiver.yearsExperience} yr${
                caregiver.yearsExperience === 1 ? "" : "s"
              }${caregiver.hasHomecareExp ? " · homecare" : ""}`}
            />
            <Row
              label="Service areas"
              value={caregiver.serviceAreas.join(", ") || "—"}
            />
            <Row
              label="Languages"
              value={caregiver.languages.join(", ") || "—"}
            />
            <Row label="Joined" value={formatDate(caregiver.createdAt)} />
          </dl>

          {caregiver.bio && (
            <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
              {caregiver.bio}
            </p>
          )}
        </Card>

        {/* Documents + decision */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Uploaded credentials" />
            {caregiver.documents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                This nurse hasn’t uploaded any credentials yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {caregiver.documents.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Verification decision" />
            <p className="text-sm text-muted">
              Approving marks the nurse verified and makes them matchable to
              families. Rejecting notifies them with your reason.
            </p>

            {setVerification.isError && (
              <p className="mt-3 rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
                {setVerification.error.message}
              </p>
            )}

            {rejecting ? (
              <form onSubmit={confirmReject} className="mt-4 space-y-3">
                <textarea
                  {...register("note")}
                  rows={3}
                  placeholder="Reason for rejection (shown to the nurse)…"
                  className="w-full rounded-field bg-field px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
                {errors.note && (
                  <p className="text-sm text-red-600">{errors.note.message}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="danger"
                    loading={setVerification.isPending}
                  >
                    Confirm rejection
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setRejecting(false)}
                    disabled={setVerification.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={approve}
                  loading={setVerification.isPending}
                  disabled={isVerified}
                >
                  {isVerified ? "Verified ✓" : "Approve & verify"}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setRejecting(true)}
                  disabled={setVerification.isPending || isRejected}
                >
                  {isRejected ? "Rejected" : "Reject"}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

function DocumentCard({ doc }: { doc: CaregiverDocument }) {
  return (
    <div className="overflow-hidden rounded-field border border-line">
      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block">
        {/* Cloudinary image; plain <img> is fine for admin review */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={doc.url}
          alt={DOC_LABELS[doc.type]}
          className="h-40 w-full bg-page object-cover"
        />
      </a>
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{DOC_LABELS[doc.type]}</p>
          {doc.idNumber && (
            <p className="truncate text-xs text-muted">{doc.idNumber}</p>
          )}
        </div>
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-brand"
          title="Open full image"
        >
          <ExternalLinkIcon size={16} />
        </a>
      </div>
    </div>
  );
}
