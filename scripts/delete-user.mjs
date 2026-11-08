// Usage: node --env-file=.env.local scripts/delete-user.mjs <email>
// Example: node --env-file=.env.local scripts/delete-user.mjs melirausquin@hotmail.com

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with: node --env-file=.env.local scripts/delete-user.mjs <email>");
  process.exit(1);
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email) { console.error("Usage: node --env-file=.env.local scripts/delete-user.mjs <email>"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { data: user, error } = await supabase
  .from("pr_users")
  .select("id, email")
  .eq("email", email)
  .single();

if (error || !user) { console.error("User not found:", email); process.exit(1); }

const { id: userId } = user;
console.log(`Found user: ${userId} (${user.email})`);
console.log("Deleting...");

await supabase.from("pr_follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);
console.log("✓ follows deleted");

await supabase.from("pr_notifications").delete().eq("user_id", userId);
console.log("✓ notifications deleted");

await Promise.all([
  supabase.from("pr_profiles").delete().eq("user_id", userId),
  supabase.from("pr_usernames").delete().eq("user_id", userId),
]);
console.log("✓ profile and username deleted");

const { data: mediaFiles } = await supabase.storage.from("pr-media").list(`records/${userId}`);
if (mediaFiles && mediaFiles.length > 0) {
  const paths = mediaFiles.map((f) => `records/${userId}/${f.name}`);
  await supabase.storage.from("pr-media").remove(paths);
  console.log(`✓ ${mediaFiles.length} media file(s) deleted from storage`);
} else {
  console.log("✓ no media files to delete");
}

await supabase.storage.from("avatars").remove(["jpg", "png", "webp"].map((ext) => `${userId}.${ext}`));
console.log("✓ avatar deleted from storage");

await supabase.from("pr_users").delete().eq("id", userId);
console.log("✓ user record deleted");

console.log(`\nDone. User ${email} has been permanently deleted.`);
