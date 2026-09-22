/**
 * API client — live auth + feed / groups / events / writings / topics against
 * NEXT_PUBLIC_API_URL. Profile stubs still use mock-data until wired.
 *
 * Base URL: NEXT_PUBLIC_API_URL (default http://127.0.0.1:8001)
 */

import { MOCK_CURRENT_USER, MOCK_USERS } from "./mock-data";
import type {
  AttendeeListVisibility,
  Event,
  EventAttendee,
  EventRsvp,
  Group,
  KinkStance,
  KinkTag,
  DmConversation,
  DmMessage,
  Media,
  ModReport,
  PlaceMode,
  Post,
  RsvpStatus,
  Topic,
  User,
  UserKink,
  Writing,
  WritingVisibility,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8001";

const AUTH_STORAGE_KEY = "cove_auth";

export function getApiBaseUrl(): string {
  return API_BASE;
}

/** Normalize invite code if a caller still sends one (optional / unused). */
export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

// --- Token helpers ---------------------------------------------------------

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return typeof parsed?.token === "string" ? parsed.token : null;
  } catch {
    return null;
  }
}

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user?: User };
    return parsed?.user && typeof parsed.user.id === "string"
      ? parsed.user
      : null;
  } catch {
    return null;
  }
}

/** Persist JWT + user under the shared auth key (used by AuthProvider). */
export function persistAuth(user: User, token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
}

export function clearPersistedAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getStoredToken(): string | null {
  return readStoredToken();
}

// --- Fetch layer -----------------------------------------------------------

type ApiErrorBody = {
  detail?:
    | string
    | { detail?: string; code?: string; msg?: string }
    | Array<{ msg?: string; message?: string }>;
  code?: string;
  message?: string;
};

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    const d = body.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) {
      const first = d[0];
      return first?.msg || first?.message || `API ${res.status}`;
    }
    if (d && typeof d === "object") {
      const code = typeof d.code === "string" ? d.code : undefined;
      const friendly: Record<string, string> = {
        INVITE_REQUIRED: "An invite code is required.",
        INVITE_INVALID: "That invite code is not recognized.",
        INVITE_NOT_FOUND: "That invite code is not recognized.",
        INVITE_EXPIRED: "That invite code has expired.",
        INVITE_EXHAUSTED: "That invite code has no remaining uses.",
        INVITE_REVOKED: "That invite code was revoked.",
        AGE_GATE_REQUIRED: "You must confirm you are 18 or older.",
        EMAIL_TAKEN: "An account with that email already exists.",
      };
      if (code && friendly[code]) return friendly[code];
      if (typeof d.detail === "string") return d.detail;
      if (code) return code;
    }
    if (typeof body.message === "string") return body.message;
    if (typeof body.code === "string") return body.code;
  } catch {
    /* ignore non-JSON */
  }
  return `API ${res.status}`;
}

async function request<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  const useAuth = init?.auth !== false;
  if (useAuth && !headers.Authorization) {
    const token = readStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const { auth: _auth, ...fetchInit } = init || {};
  void _auth;

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchInit,
    headers,
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// --- API → frontend user mapping -------------------------------------------

/** Snake_case user payload from Cove FastAPI (UserMe / TokenResponse.user). */
export type ApiUser = {
  id: number | string;
  email: string;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  is_private?: boolean;
  is_18_plus?: boolean;
  birth_year?: number | null;
  created_at?: string;
  is_admin?: boolean;
  jurisdiction?: string;
  age_attested_at?: string;
  accepted_tos_at?: string | null;
};

type TokenResponse = {
  access_token: string;
  token_type?: string;
  user: ApiUser;
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isoFrom(value: string | Date | undefined | null): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  return value.toISOString();
}

export function mapApiUser(u: ApiUser): User {
  const displayName = u.display_name || "";
  return {
    id: String(u.id),
    email: u.email,
    displayName,
    bio: u.bio ?? "",
    avatarInitials: initialsFrom(displayName),
    joinedAt: u.created_at || new Date().toISOString(),
    birth_year: u.birth_year ?? undefined,
    is_18_plus: u.is_18_plus,
    isAdmin: Boolean(u.is_admin),
  };
}

// --- Auth (live) -----------------------------------------------------------

export type LoginPayload = { email: string; password: string };

export type SignupPayload = {
  email: string;
  password: string;
  displayName: string;
  /** Optional — open signup; omit unless a campaign code is provided later */
  invite_code?: string;
  is_18_plus: boolean;
  /** Optional decade display only — never full DOB */
  birth_year?: number;
  age_attestation?: boolean;
  accepted_tos?: boolean;
};

export async function apiLogin(
  payload: LoginPayload
): Promise<{ user: User; token: string }> {
  if (!payload.email || !payload.password) {
    throw new Error("Email and password are required.");
  }
  const data = await request<TokenResponse>("/api/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });
  const user = mapApiUser(data.user);
  const token = data.access_token;
  persistAuth(user, token);
  return { user, token };
}

export async function apiSignup(
  payload: SignupPayload
): Promise<{ user: User; token: string }> {
  if (!payload.is_18_plus) {
    throw new Error("You must confirm you are 18 or older.");
  }
  if (!payload.email || !payload.password || !payload.displayName) {
    throw new Error("All fields are required.");
  }
  if (payload.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const body: Record<string, unknown> = {
    email: payload.email.trim(),
    password: payload.password,
    display_name: payload.displayName.trim(),
    is_18_plus: true,
    age_attestation: payload.age_attestation ?? true,
    accepted_tos: payload.accepted_tos ?? true,
  };
  if (payload.invite_code?.trim()) {
    body.invite_code = normalizeInviteCode(payload.invite_code);
  }
  if (typeof payload.birth_year === "number") {
    body.birth_year = payload.birth_year;
  }

  const data = await request<TokenResponse>("/api/auth/signup", {
    method: "POST",
    auth: false,
    body: JSON.stringify(body),
  });
  const user = mapApiUser(data.user);
  const token = data.access_token;
  persistAuth(user, token);
  return { user, token };
}

export async function apiMe(token?: string): Promise<User> {
  const headers: Record<string, string> = {};
  const bearer = token || readStoredToken();
  if (!bearer) throw new Error("Not authenticated.");
  headers.Authorization = `Bearer ${bearer}`;

  const data = await request<ApiUser>("/api/auth/me", {
    method: "GET",
    headers,
  });
  return mapApiUser(data);
}

export async function apiLogout(): Promise<void> {
  try {
    await request<void>("/api/auth/logout", { method: "POST" });
  } catch {
    /* MVP stub — discard client token regardless */
  } finally {
    clearPersistedAuth();
  }
}

export async function apiValidateInvite(code: string): Promise<{
  code: string;
  redeemable: boolean;
  reason?: string | null;
  remaining_uses?: number | null;
}> {
  const normalized = normalizeInviteCode(code);
  return request(`/api/invites/validate/${encodeURIComponent(normalized)}`, {
    method: "GET",
    auth: false,
  });
}

// --- Profile (mock stubs until profile endpoints are wired) ----------------

export async function apiGetProfile(userId?: string): Promise<User> {
  await delay(150);
  if (!userId || userId === MOCK_CURRENT_USER.id) return { ...MOCK_CURRENT_USER };
  const found = MOCK_USERS.find((u) => u.id === userId);
  if (!found) throw new Error("User not found");
  return { ...found };
}

export async function apiUpdateProfile(
  updates: Partial<Pick<User, "displayName" | "bio" | "birth_year">>
): Promise<User> {
  await delay(220);
  return {
    ...MOCK_CURRENT_USER,
    ...updates,
    avatarInitials: updates.displayName
      ? initialsFrom(updates.displayName)
      : MOCK_CURRENT_USER.avatarInitials,
  };
}

// --- Live API payload types ------------------------------------------------

type ApiPost = {
  id: number | string;
  author_id: number | string;
  group_id?: number | string | null;
  topic_id?: number | string | null;
  body: string;
  created_at: string;
  hidden?: boolean;
  report_count?: number;
  author_display_name?: string | null;
};

type ApiGroup = {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  creator_id: number | string;
  group_type?: string | null;
  created_at: string;
  member_count?: number | null;
};

type ApiWriting = {
  id: number | string;
  author_id: number | string;
  title: string;
  body: string;
  visibility: string;
  created_at: string;
  updated_at?: string;
  hidden?: boolean;
  author_display_name?: string | null;
};

type ApiTopic = {
  id: number | string;
  group_id: number | string;
  author_id: number | string;
  title: string;
  pinned: boolean;
  locked: boolean;
  created_at: string;
};

export function mapApiPost(p: ApiPost): Post {
  const authorName = p.author_display_name?.trim() || "Member";
  return {
    id: String(p.id),
    authorId: String(p.author_id),
    authorName,
    authorInitials: initialsFrom(authorName),
    body: p.body,
    createdAt: isoFrom(p.created_at),
    groupId: p.group_id != null ? String(p.group_id) : undefined,
    topicId: p.topic_id != null ? String(p.topic_id) : undefined,
  };
}

export function mapApiGroup(
  g: ApiGroup,
  opts?: { joined?: boolean }
): Group {
  return {
    id: String(g.id),
    name: g.name,
    description: g.description ?? "",
    memberCount: g.member_count ?? 0,
    joined: opts?.joined ?? false,
    createdAt: isoFrom(g.created_at),
    slug: g.slug,
    groupType: g.group_type ?? null,
    creatorId: String(g.creator_id),
  };
}

export function mapApiWriting(
  w: ApiWriting,
  opts?: { authorName?: string; authorInitials?: string }
): Writing {
  const stored = readStoredUser();
  const authorName =
    opts?.authorName ||
    w.author_display_name?.trim() ||
    (stored && String(w.author_id) === stored.id ? stored.displayName : null) ||
    "Member";
  const authorInitials =
    opts?.authorInitials ||
    (stored && String(w.author_id) === stored.id
      ? stored.avatarInitials
      : initialsFrom(authorName));
  return {
    id: String(w.id),
    authorId: String(w.author_id),
    authorName,
    authorInitials,
    title: w.title,
    body: w.body,
    createdAt: isoFrom(w.created_at),
    updatedAt: w.updated_at ? isoFrom(w.updated_at) : undefined,
    visibility: w.visibility,
  };
}

export function mapApiTopic(t: ApiTopic): Topic {
  return {
    id: String(t.id),
    groupId: String(t.group_id),
    authorId: String(t.author_id),
    title: t.title,
    pinned: !!t.pinned,
    locked: !!t.locked,
    createdAt: isoFrom(t.created_at),
  };
}

// --- Posts (live) ----------------------------------------------------------

export async function apiGetFeed(): Promise<Post[]> {
  const data = await request<ApiPost[]>("/api/posts/feed");
  return data.map(mapApiPost);
}

export async function apiCreatePost(
  body: string,
  opts?: { groupId?: string; topicId?: string }
): Promise<Post> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Post cannot be empty.");
  const payload: Record<string, unknown> = { body: trimmed };
  if (opts?.groupId) payload.group_id = Number(opts.groupId);
  if (opts?.topicId) payload.topic_id = Number(opts.topicId);
  const data = await request<ApiPost>("/api/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapApiPost(data);
}

export async function apiGetPost(id: string): Promise<Post> {
  const data = await request<ApiPost>(`/api/posts/${encodeURIComponent(id)}`);
  return mapApiPost(data);
}

export async function apiGetGroupFeed(groupId: string): Promise<Post[]> {
  const data = await request<ApiPost[]>(
    `/api/groups/${encodeURIComponent(groupId)}/posts`
  );
  return data.map(mapApiPost);
}

// --- Groups (live) ---------------------------------------------------------

export async function apiListGroups(): Promise<Group[]> {
  const data = await request<ApiGroup[]>("/api/groups");
  // API has no `joined` field — infer for creator; else default false.
  const me = readStoredUser();
  return data.map((g) =>
    mapApiGroup(g, {
      joined: !!(me && String(g.creator_id) === me.id),
    })
  );
}

export async function apiGetGroup(id: string): Promise<Group> {
  const data = await request<ApiGroup>(
    `/api/groups/${encodeURIComponent(id)}`
  );
  // Infer joined for creator only — API does not return membership.
  const me = readStoredUser();
  const joined = !!(me && String(data.creator_id) === me.id);
  return mapApiGroup(data, { joined });
}

export async function apiCreateGroup(input: {
  name: string;
  description?: string;
  group_type?: "topic" | "local";
}): Promise<Group> {
  if (!input.name.trim()) throw new Error("Name is required.");
  const body: Record<string, unknown> = {
    name: input.name.trim(),
  };
  if (input.description?.trim()) body.description = input.description.trim();
  if (input.group_type) body.group_type = input.group_type;
  const data = await request<ApiGroup>("/api/groups", {
    method: "POST",
    body: JSON.stringify(body),
  });
  // Creator is auto-joined by the API.
  return mapApiGroup(data, { joined: true });
}

export async function apiJoinGroup(id: string): Promise<Group> {
  const data = await request<ApiGroup>(
    `/api/groups/${encodeURIComponent(id)}/join`,
    { method: "POST" }
  );
  return mapApiGroup(data, { joined: true });
}

export async function apiLeaveGroup(id: string): Promise<Group> {
  const data = await request<ApiGroup>(
    `/api/groups/${encodeURIComponent(id)}/leave`,
    { method: "POST" }
  );
  return mapApiGroup(data, { joined: false });
}

// --- Topics (live) ---------------------------------------------------------

export async function apiCreateTopic(
  groupId: string,
  title: string
): Promise<Topic> {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title is required.");
  const data = await request<ApiTopic>(
    `/api/groups/${encodeURIComponent(groupId)}/topics`,
    { method: "POST", body: JSON.stringify({ title: trimmed }) }
  );
  return mapApiTopic(data);
}

export async function apiListTopics(groupId: string): Promise<Topic[]> {
  const data = await request<ApiTopic[]>(
    `/api/groups/${encodeURIComponent(groupId)}/topics`
  );
  return data.map(mapApiTopic);
}

export async function apiGetTopic(id: string): Promise<Topic> {
  const data = await request<ApiTopic>(
    `/api/topics/${encodeURIComponent(id)}`
  );
  return mapApiTopic(data);
}

export async function apiCreateTopicPost(
  topicId: string,
  body: string
): Promise<Post> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Post cannot be empty.");
  const data = await request<ApiPost>(
    `/api/topics/${encodeURIComponent(topicId)}/posts`,
    { method: "POST", body: JSON.stringify({ body: trimmed }) }
  );
  return mapApiPost(data);
}

export async function apiGetTopicPosts(topicId: string): Promise<Post[]> {
  const data = await request<ApiPost[]>(
    `/api/topics/${encodeURIComponent(topicId)}/posts`
  );
  return data.map(mapApiPost);
}

// --- Writings (live) -------------------------------------------------------

export async function apiListWritings(): Promise<Writing[]> {
  const data = await request<ApiWriting[]>("/api/writings/me");
  return data.map((w) => mapApiWriting(w));
}

export async function apiGetWriting(id: string): Promise<Writing> {
  const data = await request<ApiWriting>(
    `/api/writings/${encodeURIComponent(id)}`
  );
  return mapApiWriting(data);
}

export async function apiCreateWriting(input: {
  title: string;
  body: string;
  visibility?: WritingVisibility;
}): Promise<Writing> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) throw new Error("Title is required.");
  if (!body) throw new Error("Body cannot be empty.");
  const data = await request<ApiWriting>("/api/writings", {
    method: "POST",
    body: JSON.stringify({
      title,
      body,
      visibility: input.visibility ?? "public",
    }),
  });
  return mapApiWriting(data);
}

export async function apiUpdateWriting(
  id: string,
  updates: {
    title?: string;
    body?: string;
    visibility?: WritingVisibility;
  }
): Promise<Writing> {
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.body !== undefined) payload.body = updates.body.trim();
  if (updates.visibility !== undefined) payload.visibility = updates.visibility;
  const data = await request<ApiWriting>(
    `/api/writings/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
  return mapApiWriting(data);
}

export async function apiDeleteWriting(id: string): Promise<void> {
  await request<void>(`/api/writings/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}


// --- Events (live) ---------------------------------------------------------

type ApiRsvp = {
  id: number | string;
  event_id: number | string;
  user_id: number | string;
  status: string;
  show_on_list: boolean;
  created_at: string;
};

type ApiEvent = {
  id: number | string;
  host_id: number | string;
  host_display_name?: string | null;
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at?: string | null;
  timezone: string;
  place_mode: string;
  metro_area?: string | null;
  virtual_url?: string | null;
  attendee_list_visibility: string;
  capacity?: number | null;
  cancelled: boolean;
  created_at: string;
  going_count?: number | null;
  my_rsvp?: ApiRsvp | null;
};

type ApiAttendee = {
  user_id: number | string;
  display_name: string;
  status: string;
};

export function mapApiRsvp(r: ApiRsvp): EventRsvp {
  return {
    id: String(r.id),
    eventId: String(r.event_id),
    userId: String(r.user_id),
    status: r.status,
    showOnList: !!r.show_on_list,
    createdAt: isoFrom(r.created_at),
  };
}

export function mapApiEvent(e: ApiEvent): Event {
  return {
    id: String(e.id),
    hostId: String(e.host_id),
    hostDisplayName: e.host_display_name ?? undefined,
    title: e.title,
    description: e.description ?? "",
    startsAt: isoFrom(e.starts_at),
    endsAt: e.ends_at ? isoFrom(e.ends_at) : undefined,
    timezone: e.timezone,
    placeMode: e.place_mode,
    metroArea: e.metro_area ?? undefined,
    virtualUrl: e.virtual_url ?? null,
    attendeeListVisibility: e.attendee_list_visibility,
    capacity: e.capacity ?? null,
    cancelled: !!e.cancelled,
    createdAt: isoFrom(e.created_at),
    goingCount: e.going_count ?? undefined,
    myRsvp: e.my_rsvp ? mapApiRsvp(e.my_rsvp) : null,
  };
}

export function mapApiAttendee(a: ApiAttendee): EventAttendee {
  return {
    userId: String(a.user_id),
    displayName: a.display_name,
    status: a.status,
  };
}

export async function apiListEvents(opts?: {
  metro?: string;
}): Promise<Event[]> {
  const q = opts?.metro?.trim()
    ? `?metro=${encodeURIComponent(opts.metro.trim())}`
    : "";
  const data = await request<ApiEvent[]>(`/api/events${q}`);
  return data.map(mapApiEvent);
}

export async function apiGetEvent(id: string): Promise<Event> {
  const data = await request<ApiEvent>(
    `/api/events/${encodeURIComponent(id)}`
  );
  return mapApiEvent(data);
}

export async function apiCreateEvent(input: {
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string | null;
  timezone?: string;
  place_mode: PlaceMode;
  metro_area?: string;
  virtual_url?: string;
  attendee_list_visibility?: AttendeeListVisibility;
  capacity?: number | null;
}): Promise<Event> {
  if (!input.title.trim()) throw new Error("Title is required.");
  if (!input.starts_at) throw new Error("Start time is required.");
  if (input.place_mode === "metro" && !input.metro_area?.trim()) {
    throw new Error("Metro area is required for metro events.");
  }
  const body: Record<string, unknown> = {
    title: input.title.trim(),
    starts_at: input.starts_at,
    timezone: input.timezone || "America/New_York",
    place_mode: input.place_mode,
    attendee_list_visibility:
      input.attendee_list_visibility ?? "going_only",
  };
  if (input.description?.trim()) body.description = input.description.trim();
  if (input.ends_at) body.ends_at = input.ends_at;
  if (input.metro_area?.trim()) body.metro_area = input.metro_area.trim();
  if (input.virtual_url?.trim()) body.virtual_url = input.virtual_url.trim();
  if (input.capacity != null && input.capacity > 0) body.capacity = input.capacity;
  const data = await request<ApiEvent>("/api/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapApiEvent(data);
}

export async function apiUpdateEvent(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    starts_at: string;
    ends_at: string | null;
    timezone: string;
    place_mode: PlaceMode;
    metro_area: string;
    virtual_url: string;
    attendee_list_visibility: AttendeeListVisibility;
    capacity: number | null;
  }>
): Promise<Event> {
  const data = await request<ApiEvent>(
    `/api/events/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(updates) }
  );
  return mapApiEvent(data);
}

export async function apiCancelEvent(id: string): Promise<Event> {
  const data = await request<ApiEvent>(
    `/api/events/${encodeURIComponent(id)}/cancel`,
    { method: "POST" }
  );
  return mapApiEvent(data);
}

export async function apiUpsertRsvp(
  id: string,
  input: { status: RsvpStatus; show_on_list?: boolean }
): Promise<EventRsvp> {
  const data = await request<ApiRsvp>(
    `/api/events/${encodeURIComponent(id)}/rsvp`,
    {
      method: "PUT",
      body: JSON.stringify({
        status: input.status,
        show_on_list: input.show_on_list ?? true,
      }),
    }
  );
  return mapApiRsvp(data);
}

export async function apiClearRsvp(id: string): Promise<void> {
  await request<void>(`/api/events/${encodeURIComponent(id)}/rsvp`, {
    method: "DELETE",
  });
}

export async function apiListAttendees(id: string): Promise<EventAttendee[]> {
  const data = await request<ApiAttendee[]>(
    `/api/events/${encodeURIComponent(id)}/attendees`
  );
  return data.map(mapApiAttendee);
}


// --- Kinks (live) ----------------------------------------------------------

type ApiKinkTag = {
  id: number | string;
  slug: string;
  name: string;
  parent_id?: number | string | null;
  category?: string | null;
};

type ApiUserKink = {
  kink_id: number | string;
  slug: string;
  name: string;
  category?: string | null;
  stance: string;
  parent_id?: number | string | null;
};

export function mapApiKinkTag(k: ApiKinkTag): KinkTag {
  return {
    id: String(k.id),
    slug: k.slug,
    name: k.name,
    parentId: k.parent_id != null ? String(k.parent_id) : null,
    category: k.category ?? null,
  };
}

export function mapApiUserKink(k: ApiUserKink): UserKink {
  return {
    kinkId: String(k.kink_id),
    slug: k.slug,
    name: k.name,
    category: k.category ?? null,
    stance: k.stance,
    parentId: k.parent_id != null ? String(k.parent_id) : null,
  };
}

export async function apiListKinks(opts?: {
  q?: string;
  category?: string;
}): Promise<KinkTag[]> {
  const params = new URLSearchParams();
  if (opts?.q?.trim()) params.set("q", opts.q.trim());
  if (opts?.category?.trim()) params.set("category", opts.category.trim());
  const qs = params.toString() ? `?${params}` : "";
  const data = await request<ApiKinkTag[]>(`/api/kinks${qs}`);
  return data.map(mapApiKinkTag);
}

export async function apiGetMyKinks(): Promise<UserKink[]> {
  const data = await request<ApiUserKink[]>("/api/profiles/me/kinks");
  return data.map(mapApiUserKink);
}

export async function apiPutMyKinks(
  kinks: Array<{ kink_id: number; stance: KinkStance }>
): Promise<UserKink[]> {
  const data = await request<ApiUserKink[]>("/api/profiles/me/kinks", {
    method: "PUT",
    body: JSON.stringify({ kinks }),
  });
  return data.map(mapApiUserKink);
}

export async function apiGetUserKinks(userId: string): Promise<UserKink[]> {
  const data = await request<ApiUserKink[]>(
    `/api/profiles/${encodeURIComponent(userId)}/kinks`
  );
  return data.map(mapApiUserKink);
}


// --- Media (live) ----------------------------------------------------------

type ApiMedia = {
  id: number | string;
  owner_id: number | string;
  content_type: string;
  original_filename?: string | null;
  nsfw?: boolean;
  blurhash?: string | null;
  writing_id?: number | string | null;
  is_avatar?: boolean;
  created_at: string;
  url?: string | null;
};

export function mapApiMedia(m: ApiMedia): Media {
  return {
    id: String(m.id),
    ownerId: String(m.owner_id),
    contentType: m.content_type,
    originalFilename: m.original_filename ?? null,
    nsfw: m.nsfw !== false,
    blurhash: m.blurhash ?? null,
    writingId: m.writing_id != null ? String(m.writing_id) : null,
    isAvatar: !!m.is_avatar,
    createdAt: isoFrom(m.created_at),
    url: m.url ?? `/api/media/${m.id}/file`,
  };
}

export async function apiUploadMedia(input: {
  file: File;
  nsfw?: boolean;
  writingId?: string;
  isAvatar?: boolean;
}): Promise<Media> {
  const token = readStoredToken();
  if (!token) throw new Error("Sign in required.");
  const form = new FormData();
  form.append("file", input.file);
  form.append("nsfw", String(input.nsfw !== false));
  if (input.writingId) form.append("writing_id", input.writingId);
  if (input.isAvatar) form.append("is_avatar", "true");
  const res = await fetch(`${API_BASE}/api/media/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const data = (await res.json()) as ApiMedia;
  return mapApiMedia(data);
}

export async function apiListWritingMedia(writingId: string): Promise<Media[]> {
  const data = await request<ApiMedia[]>(
    `/api/media/writing/${encodeURIComponent(writingId)}`
  );
  return data.map(mapApiMedia);
}

export async function apiDeleteMedia(id: string): Promise<void> {
  await request<void>(`/api/media/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}


// --- DMs (live) ------------------------------------------------------------

type ApiDmConversation = {
  id: number | string;
  other_user_id: number | string;
  other_display_name: string;
  created_at: string;
  last_message_preview?: string | null;
  last_message_at?: string | null;
};

type ApiDmMessage = {
  id: number | string;
  conversation_id: number | string;
  sender_id: number | string;
  body: string;
  created_at: string;
};

type ApiReport = {
  id: number | string;
  reporter_id: number | string;
  target_type: string;
  target_id: number | string;
  reason: string;
  created_at: string;
  status: string;
};

export function mapApiDmConversation(c: ApiDmConversation): DmConversation {
  return {
    id: String(c.id),
    otherUserId: String(c.other_user_id),
    otherDisplayName: c.other_display_name,
    createdAt: isoFrom(c.created_at),
    lastMessagePreview: c.last_message_preview ?? null,
    lastMessageAt: c.last_message_at ? isoFrom(c.last_message_at) : null,
  };
}

export function mapApiDmMessage(m: ApiDmMessage): DmMessage {
  return {
    id: String(m.id),
    conversationId: String(m.conversation_id),
    senderId: String(m.sender_id),
    body: m.body,
    createdAt: isoFrom(m.created_at),
  };
}

export function mapApiReport(r: ApiReport): ModReport {
  return {
    id: String(r.id),
    reporterId: String(r.reporter_id),
    targetType: r.target_type,
    targetId: String(r.target_id),
    reason: r.reason,
    createdAt: isoFrom(r.created_at),
    status: r.status,
  };
}

export async function apiListDmConversations(): Promise<DmConversation[]> {
  const data = await request<ApiDmConversation[]>("/api/dms/conversations");
  return data.map(mapApiDmConversation);
}

export async function apiStartDm(userId: string): Promise<DmConversation> {
  const data = await request<ApiDmConversation>("/api/dms/conversations", {
    method: "POST",
    body: JSON.stringify({ user_id: Number(userId) }),
  });
  return mapApiDmConversation(data);
}

export async function apiListDmMessages(
  conversationId: string
): Promise<DmMessage[]> {
  const data = await request<ApiDmMessage[]>(
    `/api/dms/conversations/${encodeURIComponent(conversationId)}/messages`
  );
  return data.map(mapApiDmMessage);
}

export async function apiSendDmMessage(
  conversationId: string,
  body: string
): Promise<DmMessage> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message cannot be empty.");
  const data = await request<ApiDmMessage>(
    `/api/dms/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: "POST", body: JSON.stringify({ body: trimmed }) }
  );
  return mapApiDmMessage(data);
}

export async function apiAdminListReports(): Promise<ModReport[]> {
  const data = await request<ApiReport[]>("/api/admin/reports");
  return data.map(mapApiReport);
}

export async function apiAdminResolveReport(id: string): Promise<ModReport> {
  const data = await request<ApiReport>(
    `/api/admin/reports/${encodeURIComponent(id)}/resolve`,
    { method: "POST" }
  );
  return mapApiReport(data);
}

export async function apiAdminDismissReport(id: string): Promise<ModReport> {
  const data = await request<ApiReport>(
    `/api/admin/reports/${encodeURIComponent(id)}/dismiss`,
    { method: "POST" }
  );
  return mapApiReport(data);
}

// --- helpers ---------------------------------------------------------------

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Live client entry points. */
export const liveApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
