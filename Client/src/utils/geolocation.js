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

const LOCATION_HELP_BLOCKED =
  "Location is turned off for this website. In Chrome: tap the lock icon next to the web address → Permissions → Location → Allow. Then tap Try again.";
const LOCATION_HELP_WEAK =
  "Couldn't find your location. Turn on GPS (Location) on your phone, stand near a window or door, then tap Try again.";

/**
 * Like getCurrentPosition, but listens for a few seconds and keeps the most
 * accurate reading: the first GPS fix indoors is often hundreds of metres
 * off, which would wrongly say "too far from the Kendra". Stops early once a
 * reading is within `goodEnoughM`. Never throws.
 */
export const getBestPosition = ({ timeoutMs = 15000, goodEnoughM = 40 } = {}) =>
  new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ error: "This browser can't share location. Open the website in Chrome." });
      return;
    }
    let best = null;
    let watchId = null;
    let timer = null;
    const finish = (result) => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      resolve(result);
    };
    timer = setTimeout(
      () => finish(best ? { position: best } : { error: LOCATION_HELP_WEAK }),
      timeoutMs
    );
    watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const reading = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy };
        if (!best || reading.accuracy < best.accuracy) best = reading;
        if (best.accuracy <= goodEnoughM) finish({ position: best });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) finish({ error: LOCATION_HELP_BLOCKED, blocked: true });
        // Other errors: keep listening until the timer, a later reading may work.
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs }
    );
  });
