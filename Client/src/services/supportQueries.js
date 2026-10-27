import api from "./apiClient";

// Pass the portal's centre to get only that platform's queries (SATHEE Barmer
// vs HCL SATHEE); leave it out to get every query.
export const fetchSupportQueries = async (centre) => {
  const response = await api.get("/api/support-queries", {
    params: centre ? { centre } : undefined,
  });
  return response.data.queries ?? [];
};

export const replyToSupportQuery = async (id, message) => {
  const response = await api.post(`/api/support-queries/${id}/reply`, { message });
  return response.data.query;
};
