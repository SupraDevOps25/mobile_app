"use client";

import { useMutation } from "@tanstack/react-query";
import { notificationsService } from "./notifications.service";
import type { SendNotificationInput } from "@/schemas/notifications/send.schema";

export function useSendNotification() {
  return useMutation({
    mutationFn: (input: SendNotificationInput) =>
      notificationsService.send(input),
  });
}
