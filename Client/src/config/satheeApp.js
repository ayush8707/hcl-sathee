// Official SATHEE learning portal. Swap for the real URL after deployment/domain.
export const SATHEE_APP_URL = "http://localhost:5174/";

/** Opens the SATHEE learning portal in a new tab, passing the user's role and centre. */
export const openSatheeApp = ({ userRole, userCentre } = {}) => {
  const url = new URL(SATHEE_APP_URL);
  if (userRole) url.searchParams.set("role", userRole);
  if (userCentre) url.searchParams.set("centre", userCentre);
  window.open(url.toString(), "_blank", "noopener,noreferrer");
};
