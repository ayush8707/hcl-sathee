const { getSupabase, assertNoError } = require("../config/supabase");
const { toDate } = require("../Utils/firestoreHelpers");

// One row holds the notice shown on the login page; it is replaced on save.
const TABLE = "site_settings";
const KEY = "login_notice";

const LEVELS = ["info", "warning"];
const MAX_MESSAGE_LENGTH = 300;

const toApiNotice = (row) => {
  const value = row?.value;
  if (!value || !String(value.message || "").trim()) return null;
  return {
    message: String(value.message),
    level: LEVELS.includes(value.level) ? value.level : "info",
    updatedBy: value.updatedBy || null,
    updatedAt: toDate(row.updated_at),
  };
};

const get = async () => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("value, updated_at")
    .eq("key", KEY)
    .maybeSingle();
  assertNoError(error, "Failed to load login notice");
  return toApiNotice(data);
};

/** Saves the notice; an empty message clears it. */
const set = async ({ message, level, updatedBy }) => {
  const value = {
    message: String(message || "").trim(),
    level: LEVELS.includes(level) ? level : "info",
    updatedBy: updatedBy || null,
  };
  const { data, error } = await getSupabase()
    .from(TABLE)
    .upsert({ key: KEY, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
    .select("value, updated_at")
    .single();
  assertNoError(error, "Failed to save login notice");
  return toApiNotice(data);
};

module.exports = { get, set, LEVELS, MAX_MESSAGE_LENGTH };
