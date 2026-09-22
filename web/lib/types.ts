export type User = {
  id: string;
  email: string;
  displayName: string;
  bio: string;
  avatarInitials: string;
  joinedAt: string;
  /** Optional decade-style display later (e.g. “40s”). Never full DOB. */
  birth_year?: number;
  is_18_plus?: boolean;
  /** Site admin — shows cock badge */
  isAdmin?: boolean;
};

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  body: string;
  createdAt: string;
  groupId?: string;
  groupName?: string;
  topicId?: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  /** API has no joined field — true after create/join; else default false. */
  joined: boolean;
  createdAt: string;
  slug?: string;
  groupType?: string | null;
  creatorId?: string;
};

export type WritingVisibility = "public" | "friends" | "private";

export type Writing = {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  visibility?: WritingVisibility | string;
};

export type Topic = {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  pinned: boolean;
  locked: boolean;
  createdAt: string;
};

export type PlaceMode = "metro" | "virtual";
export type RsvpStatus = "going" | "interested" | "declined";
export type AttendeeListVisibility = "public" | "going_only" | "host_only";

export type EventRsvp = {
  id: string;
  eventId: string;
  userId: string;
  status: RsvpStatus | string;
  showOnList: boolean;
  createdAt: string;
};

export type Event = {
  id: string;
  hostId: string;
  hostDisplayName?: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  timezone: string;
  placeMode: PlaceMode | string;
  metroArea?: string;
  virtualUrl?: string | null;
  attendeeListVisibility: AttendeeListVisibility | string;
  capacity?: number | null;
  cancelled: boolean;
  createdAt: string;
  goingCount?: number;
  myRsvp?: EventRsvp | null;
};

export type EventAttendee = {
  userId: string;
  displayName: string;
  status: RsvpStatus | string;
};
