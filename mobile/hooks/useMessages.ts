import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { messageService } from "@/services/message.service";

export function useConversations() {
  return useQuery({
    queryKey: qk.conversations,
    queryFn: () => messageService.conversations(),
    // Light polling so new messages surface without a manual refresh.
    refetchInterval: 15000,
  });
}

export function useFamilyThread() {
  return useQuery({
    queryKey: qk.familyThread,
    queryFn: () => messageService.familyThread(),
    refetchInterval: 8000,
  });
}

export function useMessageThread(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: qk.messageThread(subscriptionId ?? ""),
    queryFn: () => messageService.thread(subscriptionId as string),
    enabled: !!subscriptionId,
    refetchInterval: 8000,
  });
}

export function useSendMessage(subscriptionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => messageService.send(subscriptionId, body),
    onSuccess: () => {
      // Refetch the open thread + conversation list / family thread previews.
      qc.invalidateQueries({ queryKey: qk.messageThread(subscriptionId) });
      qc.invalidateQueries({ queryKey: qk.familyThread });
      qc.invalidateQueries({ queryKey: qk.conversations });
    },
  });
}
