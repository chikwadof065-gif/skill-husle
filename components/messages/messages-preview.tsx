"use client";

import {
  collection,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { signInWithCustomToken, signOut } from "firebase/auth";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FiArrowUpRight, FiSearch, FiSend } from "react-icons/fi";
import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import Button from "@/components/ui/button";
import type { auth as FirebaseAuth, db as Firestore } from "@/lib/firebase";

type FirebaseClient = {
  auth: typeof FirebaseAuth;
  db: typeof Firestore;
};

type Conversation = {
  id: string;
  participantProfiles: Array<{
    uid: string;
    name: string;
    photoURL: string | null;
  }>;
  lastMessageText: string;
  lastMessageAt: Timestamp | null;
  lastMessageSenderUid: string | null;
  readAtByUid: Record<string, Timestamp | null>;
};

type Message = {
  id: string;
  senderUid: string;
  body: string;
  createdAt: Timestamp | null;
};

type MessagesProps = {
  initialRecipientUid?: string;
};

type ApiResponse = {
  error?: string;
  firebaseToken?: string;
  uid?: string;
  conversationId?: string;
};

function isTimestamp(value: unknown): value is Timestamp {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  );
}

function parseConversation(
  snapshot: QueryDocumentSnapshot<DocumentData>
): Conversation {
  const data = snapshot.data();
  if (
    !Array.isArray(data.participantProfiles) ||
    !data.participantProfiles.every(
      (profile: unknown) =>
        typeof profile === "object" &&
        profile !== null &&
        "uid" in profile &&
        typeof profile.uid === "string" &&
        "name" in profile &&
        typeof profile.name === "string" &&
        "photoURL" in profile &&
        (profile.photoURL === null || typeof profile.photoURL === "string")
    ) ||
    typeof data.lastMessageText !== "string" ||
    (data.lastMessageAt !== null && !isTimestamp(data.lastMessageAt)) ||
    (data.lastMessageSenderUid !== null &&
      typeof data.lastMessageSenderUid !== "string") ||
    typeof data.readAtByUid !== "object" ||
    data.readAtByUid === null ||
    !Object.values(data.readAtByUid).every(
      (readAt: unknown) => readAt === null || isTimestamp(readAt)
    ) ||
    !Array.isArray(data.participantUids) ||
    data.participantUids.length !== 2 ||
    !data.participantUids.every(
      (participantUid: unknown) => typeof participantUid === "string"
    ) ||
    (data.lastMessageSenderUid !== null &&
      !data.participantUids.includes(data.lastMessageSenderUid))
  ) {
    throw new Error("A conversation record has an invalid format.");
  }

  return {
    id: snapshot.id,
    participantProfiles: data.participantProfiles,
    lastMessageText: data.lastMessageText,
    lastMessageAt: data.lastMessageAt,
    lastMessageSenderUid: data.lastMessageSenderUid,
    readAtByUid: data.readAtByUid,
  };
}

function parseMessage(
  snapshot: QueryDocumentSnapshot<DocumentData>
): Message {
  const data = snapshot.data();
  if (
    typeof data.senderUid !== "string" ||
    typeof data.body !== "string" ||
    (data.createdAt !== null && !isTimestamp(data.createdAt))
  ) {
    throw new Error("A message record has an invalid format.");
  }

  return {
    id: snapshot.id,
    senderUid: data.senderUid,
    body: data.body,
    createdAt: data.createdAt,
  };
}

function formatTime(timestamp: Timestamp | null) {
  if (!timestamp) {
    return "";
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp.toDate());
}

function formatConversationTime(timestamp: Timestamp | null) {
  if (!timestamp) {
    return "";
  }
  const date = timestamp.toDate();
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return formatTime(timestamp);
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

async function readApiResponse(response: Response): Promise<ApiResponse> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null) {
      return body as ApiResponse;
    }
  } catch {
    throw new Error("The server returned an invalid response.");
  }
  throw new Error("The server returned an invalid response.");
}

async function postJson(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-skill-hustle-request": "1",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
  });
  const payload = await readApiResponse(response);
  if (!response.ok) {
    throw new Error(payload.error ?? "The request could not be completed.");
  }
  return payload;
}

export default function MessagesPreview({
  initialRecipientUid,
}: MessagesProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [firebaseClient, setFirebaseClient] = useState<FirebaseClient | null>(null);
  const [uid, setUid] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");
  const pendingRecipient = useRef("");

  useEffect(() => {
    let cancelled = false;
    setError("");

    if (sessionStatus === "loading") {
      return () => {
        cancelled = true;
      };
    }

    if (!session) {
      setIsConnecting(false);
      setUid("");
      setFirebaseClient(null);
      void import("@/lib/firebase")
        .then(({ auth: firebaseAuth }) => signOut(firebaseAuth))
        .catch((cause: unknown) => {
          if (
            cause instanceof Error &&
            !cause.message.includes("Firebase browser configuration is incomplete")
          ) {
            console.error("Could not clear Firebase messaging session.", cause);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    setIsConnecting(true);
    setUid("");
    setConversations([]);
    setMessages([]);
    setSelectedConversationId("");

    void (async () => {
      try {
        const tokenResult = await postJson("/api/firebase/token");
        if (!tokenResult.firebaseToken || !tokenResult.uid) {
          throw new Error("Firebase sign-in could not be completed.");
        }

        const firebaseModule = await import("@/lib/firebase");
        const signedIn = await signInWithCustomToken(
          firebaseModule.auth,
          tokenResult.firebaseToken
        );
        if (signedIn.user.uid !== tokenResult.uid) {
          await signOut(firebaseModule.auth);
          throw new Error("Firebase account identity did not match.");
        }

        if (!cancelled) {
          setFirebaseClient(firebaseModule);
          setUid(signedIn.user.uid);
          setError("");
        }
      } catch (cause) {
        if (!cancelled) {
          setFirebaseClient(null);
          setError(
            cause instanceof Error
              ? cause.message
              : "Messaging could not be connected."
          );
        }
      } finally {
        if (!cancelled) {
          setIsConnecting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, sessionStatus]);

  useEffect(() => {
    if (!firebaseClient || !uid) {
      return;
    }

    const conversationsQuery = query(
      collection(firebaseClient.db, "conversations"),
      where("participantUids", "array-contains", uid),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    return onSnapshot(
      conversationsQuery,
      (snapshot) => {
        try {
          const nextConversations = snapshot.docs.map(parseConversation);
          setConversations(nextConversations);
          setError("");
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Conversation data could not be read."
          );
        }
      },
      (cause) => {
        console.error("Realtime conversation listener failed.", cause);
        setError(
          "Conversations could not be loaded. Check your connection and account access."
        );
      }
    );
  }, [firebaseClient, uid]);

  useEffect(() => {
    if (!firebaseClient || !uid || !selectedConversationId) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(
        firebaseClient.db,
        "conversations",
        selectedConversationId,
        "messages"
      ),
      orderBy("createdAt", "asc"),
      limitToLast(100)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        try {
          setMessages(snapshot.docs.map(parseMessage));
          setMessageError("");
        } catch (cause) {
          setMessageError(
            cause instanceof Error ? cause.message : "Messages could not be read."
          );
        }
      },
      (cause) => {
        console.error("Realtime message listener failed.", cause);
        setMessageError(
          "Messages could not be loaded. Check your connection and conversation access."
        );
      }
    );

    void postJson(
      `/api/conversations/${encodeURIComponent(selectedConversationId)}/read`
    ).catch((cause: unknown) => {
      console.error("Could not update conversation read status.", cause);
    });

    return unsubscribe;
  }, [firebaseClient, selectedConversationId, uid]);

  useEffect(() => {
    if (!uid || !initialRecipientUid || pendingRecipient.current === uid) {
      return;
    }
    pendingRecipient.current = uid;
    void postJson("/api/conversations", {
      recipientUid: initialRecipientUid,
    })
      .then((response) => {
        if (response.conversationId) {
          setSelectedConversationId(response.conversationId);
          setError("");
        } else {
          throw new Error("The conversation could not be opened.");
        }
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error
            ? cause.message
            : "The conversation could not be opened."
        );
      });
  }, [initialRecipientUid, uid]);

  const filteredConversations = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return conversations.filter((conversation) => {
      const other = conversation.participantProfiles.find(
        (participant) => participant.uid !== uid
      );
      return (
        !normalizedSearch ||
        `${other?.name ?? ""} ${conversation.lastMessageText}`
          .toLocaleLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [conversations, search, uid]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId
  );
  const otherParticipant = selectedConversation?.participantProfiles.find(
    (participant) => participant.uid !== uid
  );

  const sendMessage = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const body = draft.trim();
      if (!body || !selectedConversationId || isSending) {
        return;
      }

      setIsSending(true);
      setMessageError("");
      try {
        await postJson(
          `/api/conversations/${encodeURIComponent(selectedConversationId)}/messages`,
          { body }
        );
        setDraft("");
      } catch (cause) {
        setMessageError(
          cause instanceof Error
            ? cause.message
            : "The message could not be sent."
        );
      } finally {
        setIsSending(false);
      }
    },
    [draft, isSending, selectedConversationId]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-6">
          <p className="eyebrow">Workspace</p>
          <h1 className="display-heading mt-3 text-4xl sm:text-5xl">
            Messages
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Private conversations between members, delivered in real time.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
          >
            {error}
          </p>
        )}

        <section
          aria-label="Messages"
          className="surface-card grid min-h-[620px] overflow-hidden md:grid-cols-[320px_minmax(0,1fr)]"
        >
          <aside className="border-b border-border md:border-r md:border-b-0">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold">Conversations</h2>
              <label className="relative mt-3 block">
                <span className="sr-only">Search conversations</span>
                <FiSearch
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations"
                  className="field py-2.5 pl-9 pr-3 text-sm"
                />
              </label>
            </div>

            {isConnecting ? (
              <p className="p-5 text-sm text-muted" role="status">
                Connecting to your inbox…
              </p>
            ) : sessionStatus === "unauthenticated" ? (
              <div className="p-5">
                <p className="text-sm leading-6 text-muted">
                  Sign in to view and send private messages.
                </p>
                <Link href="/sign-in" className="button button-primary mt-4">
                  Sign in
                </Link>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-5">
                <p className="text-sm font-semibold">
                  {conversations.length > 0
                    ? "No conversations match that search."
                    : "Your inbox is quiet."}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {conversations.length > 0
                    ? "Try another name or message."
                    : "Start a conversation from a member profile."}
                </p>
                {conversations.length === 0 && (
                  <Link
                    href="/find-freelancers"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
                  >
                    Browse talent <FiArrowUpRight aria-hidden="true" />
                  </Link>
                )}
              </div>
            ) : (
              <ul className="max-h-[520px] overflow-y-auto p-2">
                {filteredConversations.map((conversation) => {
                  const participant = conversation.participantProfiles.find(
                    (profile) => profile.uid !== uid
                  );
                  if (!participant) {
                    return null;
                  }
                  const readAt =
                    conversation.readAtByUid[uid]?.toMillis() ?? 0;
                  const isUnread =
                    conversation.lastMessageSenderUid !== uid &&
                    (conversation.lastMessageAt?.toMillis() ?? 0) > readAt;

                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedConversationId(conversation.id)
                        }
                        aria-current={
                          selectedConversationId === conversation.id
                            ? "true"
                            : undefined
                        }
                        className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                          selectedConversationId === conversation.id
                            ? "bg-accent-soft"
                            : "hover:bg-background"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
                        >
                          {initials(participant.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold">
                              {participant.name}
                            </span>
                            <span className="shrink-0 text-[11px] text-muted">
                              {formatConversationTime(
                                conversation.lastMessageAt
                              )}
                            </span>
                          </span>
                          <span className="mt-1 flex items-center justify-between gap-2">
                            <span className="truncate text-xs text-muted">
                              {conversation.lastMessageText || "Conversation started"}
                            </span>
                            {isUnread && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-accent">
                                <span className="sr-only">Unread message</span>
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <div className="flex min-h-[500px] min-w-0 flex-col">
            {selectedConversation && otherParticipant ? (
              <>
                <header className="flex items-center gap-3 border-b border-border p-4">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
                  >
                    {initials(otherParticipant.name)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                      {otherParticipant.name}
                    </h2>
                    <p className="text-xs text-muted">Skill Hustle member</p>
                  </div>
                </header>

                <div
                  aria-live="polite"
                  aria-relevant="additions text"
                  className="flex-1 space-y-3 overflow-y-auto bg-background p-4 sm:p-6"
                >
                  {messageError && (
                    <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-900">
                      {messageError}
                    </p>
                  )}
                  {messages.length === 0 ? (
                    <p className="mx-auto mt-10 max-w-sm text-center text-sm leading-6 text-muted">
                      This conversation is ready. Send a message to get started.
                    </p>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.senderUid === uid;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <article
                            className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                              isOwnMessage
                                ? "rounded-br-sm bg-accent text-accent-foreground"
                                : "rounded-bl-sm border border-border bg-surface"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {message.body}
                            </p>
                            <time
                              className={`mt-1 block text-right text-[11px] ${
                                isOwnMessage ? "text-white/75" : "text-muted"
                              }`}
                              dateTime={
                                message.createdAt?.toDate().toISOString()
                              }
                            >
                              {formatTime(message.createdAt)}
                            </time>
                          </article>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={sendMessage}
                  className="border-t border-border p-3 sm:p-4"
                >
                  <label htmlFor="message-input" className="sr-only">
                    Write a message
                  </label>
                  <div className="flex items-end gap-2">
                    <textarea
                      id="message-input"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      maxLength={4000}
                      rows={1}
                      placeholder="Write a message"
                      className="field max-h-32 min-h-11 flex-1 resize-y px-4 py-3 text-sm"
                      disabled={!uid || isSending}
                    />
                    <Button
                      type="submit"
                      disabled={!draft.trim() || !uid || isSending}
                      aria-label={isSending ? "Sending message" : "Send message"}
                      className="h-11 w-11 shrink-0 p-0"
                    >
                      <FiSend aria-hidden="true" />
                    </Button>
                  </div>
                  <p className="mt-2 text-right text-[11px] text-muted">
                    {draft.length}/4000
                  </p>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                <div
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent"
                >
                  <FiSend />
                </div>
                <h2 className="mt-4 text-lg font-semibold">
                  Choose a conversation
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                  Select a conversation from your inbox or open a member profile
                  to start a new one.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
