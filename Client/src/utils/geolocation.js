// The phone's current position for attendance check-in. Never throws: resolves
// to { position } or { error } with a message a Mitra can act on.
export const getCurrentPosition = ({ timeoutMs = 15000 } = {}) =>
  new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ error: "This browser can't share location." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          position: { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy },
        }),
      (err) =>
        resolve({
          error:
            err.code === err.PERMISSION_DENIED
              ? "Location is blocked. Allow location for this website in your browser settings."
              : "Couldn't get your location. Move near a window or turn on GPS and try again.",
        }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 }
    );
  });

export const mapLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;
