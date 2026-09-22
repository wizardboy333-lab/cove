/**
 * Smoke-test the same live paths the web client uses.
 * Usage: node scripts/e2e-live-api.mjs
 */
const API = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/$/, "");
const email = `wire_${Date.now()}@example.com`;
const password = "TestPass123!";

function initialsFrom(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function mapPost(p) {
  const authorName = p.author_display_name?.trim() || "Member";
  return {
    id: String(p.id),
    authorId: String(p.author_id),
    authorName,
    authorInitials: initialsFrom(authorName),
    body: p.body,
    createdAt: p.created_at,
    groupId: p.group_id != null ? String(p.group_id) : undefined,
    topicId: p.topic_id != null ? String(p.topic_id) : undefined,
  };
}

function mapGroup(g, joined = false) {
  return {
    id: String(g.id),
    name: g.name,
    description: g.description ?? "",
    memberCount: g.member_count ?? 0,
    joined,
    createdAt: g.created_at,
    slug: g.slug,
    groupType: g.group_type ?? null,
    creatorId: String(g.creator_id),
  };
}

function mapWriting(w, authorName = "Member") {
  return {
    id: String(w.id),
    authorId: String(w.author_id),
    authorName,
    authorInitials: initialsFrom(authorName),
    title: w.title,
    body: w.body,
    createdAt: w.created_at,
    visibility: w.visibility,
  };
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return data;
}

async function main() {
  console.log("API", API);
  const signup = await request("/api/auth/signup", {
    method: "POST",
    body: {
      email,
      password,
      display_name: "WireBot",
      is_18_plus: true,
      age_attestation: true,
      accepted_tos: true,
    },
  });
  const token = signup.access_token;
  console.log("signup ok", signup.user.id, signup.user.display_name);

  const post = mapPost(
    await request("/api/posts", {
      method: "POST",
      token,
      body: { body: "Node smoke post" },
    })
  );
  console.log("create post", post.id, post.body);

  const feed = (await request("/api/posts/feed", { token })).map(mapPost);
  if (!feed.some((p) => p.id === post.id)) throw new Error("post missing from feed");
  console.log("feed ok", feed.length);

  const group = mapGroup(
    await request("/api/groups", {
      method: "POST",
      token,
      body: { name: `Wire Group ${Date.now()}`, description: "smoke", group_type: "topic" },
    }),
    true
  );
  console.log("create group", group.id, group.slug, group.memberCount);

  const groups = (await request("/api/groups", { token })).map((g) =>
    mapGroup(g, String(g.creator_id) === String(signup.user.id))
  );
  if (!groups.some((g) => g.id === group.id)) throw new Error("group missing");
  console.log("list groups ok", groups.length);

  const writing = mapWriting(
    await request("/api/writings", {
      method: "POST",
      token,
      body: { title: "Smoke writing", body: "Body text.", visibility: "public" },
    }),
    signup.user.display_name
  );
  console.log("create writing", writing.id, writing.title);

  const mine = (await request("/api/writings/me", { token })).map((w) =>
    mapWriting(w, signup.user.display_name)
  );
  if (!mine.some((w) => w.id === writing.id)) throw new Error("writing missing from /me");
  console.log("writings/me ok", mine.length);

  console.log("ALL_OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
