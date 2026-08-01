"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardHeader, Field, Input, PageHeader } from "@/components/ui";
import { RecipientPicker } from "@/components/RecipientPicker";
import { useSendNotification } from "@/services/notifications/notifications.queries";
import type { AdminUserResult } from "@/services/users/users.types";
import {
  NOTIFICATION_TYPES,
  sendNotificationSchema,
  type SendNotificationInput,
} from "@/schemas/notifications/send.schema";

const selectClass =
  "w-full rounded-field bg-field px-3.5 py-2.5 text-sm text-ink border border-transparent transition-colors focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15";

const textareaClass =
  "w-full rounded-field bg-field px-3.5 py-2.5 text-sm text-ink placeholder:text-faint border border-transparent transition-colors focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15";

export default function NotificationsPage() {
  const send = useSendNotification();
  const [recipient, setRecipient] = useState<AdminUserResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SendNotificationInput>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: { userId: "", type: "GENERAL", title: "", body: "" },
  });

  const onSubmit = handleSubmit((values) => {
    send.mutate(values, {
      // Keep the recipient + type so several messages can go to the same person;
      // just clear the title and body.
      onSuccess: () => reset({ ...values, title: "", body: "" }),
    });
  });

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Send a direct message to any user. It's delivered as a push and saved to their in-app inbox."
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader title="Send a notification" />

          {send.isSuccess && (
            <p className="mb-4 rounded-field bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Notification sent.
            </p>
          )}
          {send.isError && (
            <p className="mb-4 rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">
              {send.error instanceof Error
                ? send.error.message
                : "Couldn't send the notification."}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Recipient" error={errors.userId?.message}>
              <RecipientPicker
                value={recipient}
                onSelect={(user) => {
                  setRecipient(user);
                  setValue("userId", user?.id ?? "", { shouldValidate: true });
                }}
              />
            </Field>

            <Field label="Type" htmlFor="type" error={errors.type?.message}>
              <select id="type" className={selectClass} {...register("type")}>
                {NOTIFICATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "GENERAL" ? "General (recommended)" : t}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Title" htmlFor="title" error={errors.title?.message}>
              <Input
                id="title"
                placeholder="Short headline"
                {...register("title")}
              />
            </Field>

            <Field label="Message" htmlFor="body" error={errors.body?.message}>
              <textarea
                id="body"
                rows={4}
                placeholder="What do you want to tell this user?"
                className={textareaClass}
                {...register("body")}
              />
            </Field>

            <Button type="submit" loading={send.isPending}>
              Send notification
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
