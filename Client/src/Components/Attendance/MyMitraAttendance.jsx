import { useCallback, useEffect, useState } from "react";
import { Camera, Clock, ImageOff, MapPin } from "lucide-react";
import { fetchMitraAttendance } from "../../services/mitraAttendance";
import { fetchCurrentUser } from "../../services/users";
import { getApiErrorMessage } from "../../utils/apiRequest";
import { getAuthPayload } from "../../utils/authToken";
import { getCentreValueFromPortal } from "../../utils/portalMapping";
import { mapLink } from "../../utils/geolocation";
import MitraCheckIn from "./MitraCheckIn";
import MyMonthCalendar from "./MyMonthCalendar";

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const toInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Today's arrival or departure photo (view only; check-in is in MitraCheckIn).
function PhotoCard({ title, photoUrl, time, location }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <Clock size={12} />
            Uploaded at:{" "}
            <span className="font-medium tabular-nums text-slate-700">
              {formatTime(time)}
            </span>
          </p>
          {time ? (
            location ? (
              <a
                href={mapLink(location.lat, location.lng)}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
              >
                <MapPin size={12} />
                Location saved{location.accuracyM ? ` (±${location.accuracyM} m)` : ""}
                {location.distanceM != null ? ` · ${location.distanceM} m from Kendra` : ""}
              </a>
            ) : (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                <MapPin size={12} />
                No location saved
              </p>
            )
          ) : null}
        </div>
        <Camera size={18} className="text-blue-500" />
      </div>

      <div className="flex h-32 items-center sm:h-48 justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
        {photoUrl ? (
          <img src={photoUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <ImageOff size={28} />
            <span className="text-xs font-medium uppercase tracking-wide">No photo yet</span>
          </div>
        )}
      </div>

    </div>
  );
}

export default function MyMitraAttendance({
  userId: sessionUserId,
  userName: sessionUserName,
  userEmail: sessionUserEmail,
  userCentre: sessionUserCentre,
  portalName,
  selectedDate,
  allowUpload = true,
  headingLabel = "My Attendance",
  headingDescription = "Your arrival and departure selfies for",
  isCustomCentre = false,
}) {
  const today = toInputDate();
  const date = selectedDate || today;
  const isToday = date === today;

  const [profile, setProfile] = useState(() => {
    const tokenUser = getAuthPayload();
    return {
      id: sessionUserId ?? tokenUser?.id ?? null,
      name: sessionUserName || "",
      email: sessionUserEmail || tokenUser?.email || "",
      centre:
        sessionUserCentre ||
        tokenUser?.centre ||
        getCentreValueFromPortal(portalName) ||
        null,
    };
  });
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarKey, setCalendarKey] = useState(0);

  const resolveFromToken = useCallback(() => {
    const tokenUser = getAuthPayload();
    return {
      id: sessionUserId ?? tokenUser?.id ?? null,
      name: sessionUserName || "",
      email: sessionUserEmail || tokenUser?.email || "",
      centre:
        sessionUserCentre ||
        tokenUser?.centre ||
        getCentreValueFromPortal(portalName) ||
        null,
    };
  }, [
    sessionUserId,
    sessionUserName,
    sessionUserEmail,
    sessionUserCentre,
    portalName,
  ]);

  const loadProfile = useCallback(async () => {
    if (isCustomCentre) {
      setProfile(resolveFromToken());
      return;
    }

    const fallback = resolveFromToken();
    try {
      const user = await fetchCurrentUser();
      setProfile({
        id: user?.id ?? fallback.id,
        name: user?.name || fallback.name,
        email: user?.email || fallback.email,
        centre: user?.centre || fallback.centre,
        availableDays: user?.availableDays || [],
      });
    } catch (err) {
      console.warn("Load current user failed, using session/token:", err?.message || err);
      setProfile(fallback);
    }
  }, [resolveFromToken, isCustomCentre]);

  const loadRecord = useCallback(async () => {
    const uid = profile.id;
    if (isCustomCentre || !date || !uid) {
      setRecord(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const records = await fetchMitraAttendance(date);
      const mine = records.find((r) => String(r.userId) === String(uid)) || null;
      setRecord(mine);
    } catch (err) {
      console.error("Load own mitra attendance error:", err);
      setError(getApiErrorMessage(err, "Unable to load your attendance"));
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [isCustomCentre, date, profile.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  return (
    <div className="space-y-5 px-5 py-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">{headingLabel}</p>
        <p className="mt-1 text-xs text-slate-500">
          {headingDescription}{" "}
          <span className="font-medium text-slate-700">{date}</span>.
          {isToday
            ? ""
            : " Past days are view-only. New captures open again tomorrow."}
        </p>
      </div>

      {allowUpload && isToday && !loading && !isCustomCentre ? (
        <MitraCheckIn
          profile={profile}
          date={date}
          record={record}
          onSaved={(saved) => {
            setRecord(saved);
            setCalendarKey((k) => k + 1);
          }}
        />
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading attendance…</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          <PhotoCard
            title="Arrival"
            photoUrl={record?.arrivalPhotoUrl}
            time={record?.arrivalTime}
            location={record?.arrivalLocation}
          />
          <PhotoCard
            title="Departure"
            photoUrl={record?.departurePhotoUrl}
            time={record?.departureTime}
            location={record?.departureLocation}
          />
        </div>
      )}

      {allowUpload && !isCustomCentre && profile.id ? (
        <MyMonthCalendar userId={profile.id} availableDays={profile.availableDays} refreshKey={calendarKey} />
      ) : null}
    </div>
  );
}