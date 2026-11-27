import api from "./apiClient";

export const fetchVishistAttendance = async (date, centre, status) => {
  const response = await api.get("/api/vishist-attendance", {
    params: { date, ...(centre ? { centre } : {}), ...(status ? { status } : {}) },
  });
  return response.data.records ?? [];
};

export const fetchVishistAttendanceRange = async (from, to, centre) => {
  const response = await api.get("/api/vishist-attendance", {
    params: { from, to, ...(centre ? { centre } : {}) },
  });
  return response.data.records ?? [];
};

export const markVishistAttendance = async ({ vishistUserId, subject, topicTaught, date, photoFile }) => {
  const formData = new FormData();
  formData.append("vishistUserId", vishistUserId);
  formData.append("subject", subject);
  formData.append("topicTaught", topicTaught);
  formData.append("date", date);
  if (photoFile) formData.append("photo", photoFile);
  const response = await api.post("/api/vishist-attendance", formData);
  return response.data.record;
};

export const approveVishistAttendance = async (id) => {
  const response = await api.patch(`/api/vishist-attendance/${id}/approve`);
  return response.data.record;
};
/** Vishist visit days from the last week that nobody has answered yet. */
export const fetchDueVisits = async (centre) => {
  const response = await api.get("/api/vishist-attendance/due", {
    params: centre ? { centre } : {},
  });
  return response.data.visits ?? [];
};

/** Answers "Did they come?" for one visit day. */
export const recordVishistVisit = async ({ vishistUserId, date, came, topicTaught = "", photoFile = null }) => {
  const formData = new FormData();
  formData.append("vishistUserId", vishistUserId);
  formData.append("date", date);
  formData.append("came", came ? "true" : "false");
  if (came && topicTaught.trim()) formData.append("topicTaught", topicTaught.trim());
  if (came && photoFile) formData.append("photo", photoFile);
  const response = await api.post("/api/vishist-attendance", formData);
  return response.data.record;
};
