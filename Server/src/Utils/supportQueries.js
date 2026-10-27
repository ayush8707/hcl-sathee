const { isStandaloneCentre, platformNameForCentre } = require("./centreMatch");

const buildSupportQueryNotificationPayload = ({ title, description, user }) => {
  const trimmedTitle = String(title || "").trim();
  const trimmedDescription = String(description || "").trim();
  const submitterName = String(user?.name || user?.email || "A user").trim();

  return {
    // Standalone Kendras (e.g. SATHEE Barmer) are named so admins can tell
    // their queries apart from HCL SATHEE ones.
    title: isStandaloneCentre(user?.centre)
      ? `New Query from ${platformNameForCentre(user?.centre)}`
      : "New Query from Partner Portal",
    body: `${submitterName} submitted a new query: ${trimmedTitle || "Untitled query"}. ${trimmedDescription || "No description provided."}`,
    data: {
      type: "support-query",
      queryTitle: trimmedTitle || "Untitled query",
      queryDescription: trimmedDescription || "No description provided.",
      submittedBy: submitterName,
    },
  };
};

module.exports = { buildSupportQueryNotificationPayload };
