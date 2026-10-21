import api from "./apiClient";

// Public: the notice shown on the login page, or null.
export const fetchLoginNotice = async () => {
  const response = await api.get("/api/site-notice");
  return response.data?.notice ?? null;
};

// Admin only: an empty message removes the notice.
export const saveLoginNotice = async ({ message, level }) => {
  const response = await api.put("/api/site-notice", { message, level });
  return response.data?.notice ?? null;
};
