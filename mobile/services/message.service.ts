import { api } from "@/lib/api";

export interface ApiMessage {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
}

export interface ApiMessagePeer {
  name: string;
  initials: string;
  role: string;
  photoUrl: string | null;
}

export interface ApiMessageThread {
  subscriptionId: string;
  peer: ApiMessagePeer | null;
  messages: ApiMessage[];
}

export interface ApiConversation {
  subscriptionId: string;
  family: { name: string; initials: string; photoUrl: string | null };
  recipientName: string;
  lastMessage: string | null;
  lastAt: string | null;
  unread: number;
}

export const messageService = {
  conversations: () =>
    api.get<ApiConversation[]>("/messages/conversations"),
  familyThread: () => api.get<ApiMessageThread | null>("/messages/family"),
  thread: (subscriptionId: string) =>
    api.get<ApiMessageThread>(`/messages/thread/${subscriptionId}`),
  send: (subscriptionId: string, body: string) =>
    api.post<ApiMessage>(`/messages/thread/${subscriptionId}`, { body }),
};
