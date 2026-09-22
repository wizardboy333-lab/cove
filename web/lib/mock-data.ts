import type { Group, Post, User, Writing } from "./types";

export const MOCK_CURRENT_USER: User = {
  id: "u1",
  email: "you@cove.local",
  displayName: "Harbor",
  bio: "Quiet nights, good conversation, and well-lit rooms. Exploring connection without the circus.",
  avatarInitials: "HB",
  joinedAt: "2025-11-02T18:00:00.000Z",
  is_18_plus: true,
  birth_year: 1988,
};

export const MOCK_USERS: User[] = [
  MOCK_CURRENT_USER,
  {
    id: "u2",
    email: "mira@cove.local",
    displayName: "Mira",
    bio: "Writer. Soft leather, softer words.",
    avatarInitials: "MR",
    joinedAt: "2025-08-14T12:00:00.000Z",
  },
  {
    id: "u3",
    email: "julian@cove.local",
    displayName: "Julian",
    bio: "Hosts small gatherings. Tea first, everything else second.",
    avatarInitials: "JL",
    joinedAt: "2025-06-01T09:30:00.000Z",
  },
  {
    id: "u4",
    email: "nova@cove.local",
    displayName: "Nova",
    bio: "Photography, playlists, and permission culture.",
    avatarInitials: "NV",
    joinedAt: "2026-01-20T16:45:00.000Z",
  },
];

export const MOCK_GROUPS: Group[] = [
  {
    id: "g1",
    name: "After Hours Essays",
    description:
      "Long-form reflections on desire, consent, and the ordinary rituals that make intimacy feel safe.",
    memberCount: 1284,
    joined: true,
    createdAt: "2025-05-10T00:00:00.000Z",
  },
  {
    id: "g2",
    name: "City Quiet Rooms",
    description:
      "Local hosts sharing low-key spaces, etiquette, and how to leave a place better than you found it.",
    memberCount: 642,
    joined: false,
    createdAt: "2025-09-03T00:00:00.000Z",
  },
  {
    id: "g3",
    name: "Signal & Soft Limits",
    description:
      "Practical talk about negotiation, safewords, aftercare, and checking in without killing the mood.",
    memberCount: 2109,
    joined: true,
    createdAt: "2025-03-22T00:00:00.000Z",
  },
  {
    id: "g4",
    name: "Midnight Playlists",
    description:
      "Share the tracks that set a room. No gatekeeping — just taste and context.",
    memberCount: 891,
    joined: false,
    createdAt: "2026-02-11T00:00:00.000Z",
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: "p1",
    authorId: "u2",
    authorName: "Mira",
    authorInitials: "MR",
    body: "Small reminder: enthusiasm is a better signal than silence. Ask, listen, adjust. The night gets better when everyone feels chosen.",
    createdAt: "2026-09-21T22:14:00.000Z",
    groupId: "g3",
    groupName: "Signal & Soft Limits",
  },
  {
    id: "p2",
    authorId: "u3",
    authorName: "Julian",
    authorInitials: "JL",
    body: "Hosting tip from last weekend — leave a written house map by the door. Guests relax faster when they know where coats, water, and quiet corners live.",
    createdAt: "2026-09-21T18:40:00.000Z",
    groupId: "g2",
    groupName: "City Quiet Rooms",
  },
  {
    id: "p3",
    authorId: "u4",
    authorName: "Nova",
    authorInitials: "NV",
    body: "New mix: low pulse, warm vocals, nothing that demands attention. Perfect for conversations that wander.",
    createdAt: "2026-09-21T15:05:00.000Z",
    groupId: "g4",
    groupName: "Midnight Playlists",
  },
  {
    id: "p4",
    authorId: "u1",
    authorName: "Harbor",
    authorInitials: "HB",
    body: "Trying Cove for the first time. Looking for thoughtful people who care about tone as much as chemistry.",
    createdAt: "2026-09-20T21:30:00.000Z",
  },
  {
    id: "p5",
    authorId: "u2",
    authorName: "Mira",
    authorInitials: "MR",
    body: "Essay draft: why aftercare is not optional logistics — it's the story you tell yourselves afterward.",
    createdAt: "2026-09-20T12:10:00.000Z",
    groupId: "g1",
    groupName: "After Hours Essays",
  },
  {
    id: "p6",
    authorId: "u3",
    authorName: "Julian",
    authorInitials: "JL",
    body: "Anyone else prefer shorter gatherings that end cleanly? Quality over marathon.",
    createdAt: "2026-09-19T23:55:00.000Z",
  },
];


export const MOCK_WRITINGS: Writing[] = [
  {
    id: "w1",
    authorId: "u2",
    authorName: "Mira",
    authorInitials: "MR",
    title: "Aftercare as storytelling",
    body: `We talk about aftercare like it's a checklist: water, blanket, check-in questions. Useful, yes — but incomplete.

The quieter truth is that aftercare is the story you tell yourselves when the rush fades. Who were we tonight? What did we risk? What do we still want tomorrow?

I keep a short note after scenes that matter. Not a diary for public consumption — a private caption. "We slowed down when I asked. The room felt kind." Those sentences become the memory that survives the adrenaline.

If you host, leave space for this. If you visit, ask for it. The night is not over when the play is over; it is over when everyone can name what happened with warmth.`,
    createdAt: "2026-09-18T20:00:00.000Z",
  },
  {
    id: "w2",
    authorId: "u3",
    authorName: "Julian",
    authorInitials: "JL",
    title: "Why I prefer short gatherings",
    body: `I used to chase marathon evenings. Somewhere around hour five the room always got thinner: people tired, boundaries softer, exits awkward.

Now I host for three hours with a clear end. Guests arrive knowing when the lights come up. Quality rises. Consent conversations stay sharp. People leave wanting more instead of needing recovery.

If your city has a culture of endless hangouts, try one deliberate short night. Put the end time on the invite. Watch how the tone changes.`,
    createdAt: "2026-09-15T14:30:00.000Z",
  },
  {
    id: "w3",
    authorId: "u1",
    authorName: "Harbor",
    authorInitials: "HB",
    title: "First week in Cove",
    body: `I came looking for a place that felt adult without being loud. So far: soft dark UI, a real 18+ gate, and people who write in full sentences.

Hoping this stays a cove — sheltered, intentional — and not another feed that rewards the sharpest take.`,
    createdAt: "2026-09-20T10:00:00.000Z",
  },
];

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
