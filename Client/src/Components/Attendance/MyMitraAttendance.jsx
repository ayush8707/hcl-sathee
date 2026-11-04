import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Clock, ImageOff, LogIn, LogOut, MapPin } from "lucide-react";
import {
  fetchMitraAttendance,
  uploadMitraAttendancePhoto,
} from "../../services/mitraAttendance";
import { fetchCurrentUser } from "../../services/users";
import { getApiErrorMessage } from "../../utils/apiRequest";
import { getAuthPayload } from "../../utils/authToken";
import { compressImageForUpload } from "../../utils/compressImage";
import { getCentreValueFromPortal } from "../../utils/portalMapping";
import { getCurrentPosition, mapLink } from "../../utils/geolocation";
import LiveCameraCapture from "./LiveCameraCapture";
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

function LockedField({ label, value }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={value || ""}
        readOnly
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 cursor-not-allowed"
      />
    </div>
  );
}

function UploadCard({ title, photoUrl, time, location, uploading, disabled, onCapture, allowUpload }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
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

      <div className="mb-4 flex h-48 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
        {photoUrl ? (
          <img src={photoUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <ImageOff size={28} />
            <span className="text-xs font-medium uppercase tracking-wide">No photo yet</span>
          </div>
        )}
      </div>

      {allowUpload ? (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={onCapture}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Camera size={16} />
          {uploading
            ? "Uploading…"
            : photoUrl
              ? `Retake ${title} photo`
              : `Take ${title} photo`}
        </button>
      ) : null}
    </div>
  );
}

// One big button that does the next step of the day: check in, then check out.
function QuickCheckIn({ record, uploadingType, onStart }) {
  const next = !record?.arrivalTime ? "arrival" : !record?.departureTime ? "departure" : null;

  if (!next) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <CheckCircle2 size={28} className="shrink-0 text-emerald-600" />
        <div>
          <p className="text-base font-semibold text-emerald-800">You're done for today</p>
          <p className="text-sm text-emerald-700">
            Checked in at {formatTime(record.arrivalTime)} · checked out at {formatTime(record.departureTime)}
          </p>
        </div>
      </div>
    );
  }

  const isArrival = next === "arrival";
  const Icon = isArrival ? LogIn : LogOut;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-base font-semibold text-slate-900">
          {isArrival ? "Start your day" : `Checked in at ${formatTime(record.arrivalTime)}`}
        </p>
        <p className="text-sm text-slate-600">
          {isArrival
            ? "Tap once: take a selfie at the Kendra. Time and location are saved automatically."
            : "Leaving the Kendra? Tap to check out."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onStart(next)}
        disabled={Boolean(uploadingType)}
        className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isArrival ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        <Icon size={20} />
        {uploadingType ? "Saving…" : isArrival ? "Check in" : "Check out"}
      </button>
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
  headingDescription = "Take a live arrival and departure photo for",
  isCustomCentre = false,
}) {
  const today = toInputDate();
  const date = selectedDate || today;
  const isToday = date === today;

  const [captureType, setCaptureType] = useState(null); // "arrival" | "departure" | null

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
  const [uploadingType, setUploadingType] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [calendarKey, setCalendarKey] = useState(0);
  // Location is requested when the camera opens, so it is ready by the time
  // the photo is taken.
  const positionRequest = useRef(null);

  const startCapture = (type) => {
    setLocationNote("");
    positionRequest.current = getCurrentPosition();
    setCaptureType(type);
  };

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

  const handleUpload = async (type, file) => {
    if (!isToday) {
      setError("You can only upload photos for today's attendance.");
      return;
    }
    if (!profile.id) {
      setError("Your account id is missing. Please sign out and sign in again.");
      return;
    }
    if (!profile.email) {
      setError("Your account email was not found. Contact admin.");
      return;
    }

    setUploadingType(type);
    setError("");
    setMessage("");
    try {
      const located = (await positionRequest.current) || (await getCurrentPosition());
      if (located.error) setLocationNote(located.error);
      const compressed = await compressImageForUpload(file);
      const saved = await uploadMitraAttendancePhoto({
        userId: profile.id,
        name: profile.name,
        email: profile.email,
        centre: profile.centre,
        centreId: profile.centre,
        date,
        type,
        file: compressed,
        position: located.position || null,
      });
      setRecord(saved);
      setCalendarKey((k) => k + 1);
      setMessage(
        `${type === "arrival" ? "Arrival" : "Departure"} photo uploaded at ${formatTime(
          type === "arrival" ? saved.arrivalTime : saved.departureTime
        )}.`
      );
    } catch (err) {
      console.error("Upload mitra photo error:", err);
      setError(getApiErrorMessage(err, "Unable to upload photo"));
    } finally {
      setUploadingType("");
    }
  };

  return (
    <div className="space-y-5 px-5 py-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">{headingLabel}</p>
        <p className="mt-1 text-xs text-slate-500">
          {headingDescription}{" "}
          <span className="font-medium text-slate-700">{date}</span>.
          {isToday
            ? " Time is recorded automatically when you capture a photo."
            : " Past days are view-only. New captures open again tomorrow."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LockedField label="Name" value={profile.name} />
        <LockedField label="Email" value={profile.email} />
      </div>

      {allowUpload && isToday && !loading ? (
        <QuickCheckIn
          record={record}
          uploadingType={uploadingType}
          onStart={startCapture}
        />
      ) : null}

      {locationNote ? (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <MapPin size={16} className="mt-0.5 shrink-0" />
          {locationNote}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading attendance…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <UploadCard
            title="Arrival"
            photoUrl={record?.arrivalPhotoUrl}
            time={record?.arrivalTime}
            location={record?.arrivalLocation}
            uploading={uploadingType === "arrival"}
            disabled={!isToday || Boolean(uploadingType)}
            onCapture={() => startCapture("arrival")}
            allowUpload={allowUpload}
          />
          <UploadCard
            title="Departure"
            photoUrl={record?.departurePhotoUrl}
            time={record?.departureTime}
            location={record?.departureLocation}
            uploading={uploadingType === "departure"}
            disabled={!isToday || Boolean(uploadingType)}
            onCapture={() => startCapture("departure")}
            allowUpload={allowUpload}
          />
        </div>
      )}

      {allowUpload && !isCustomCentre && profile.id ? (
        <MyMonthCalendar userId={profile.id} availableDays={profile.availableDays} refreshKey={calendarKey} />
      ) : null}

      <LiveCameraCapture
        open={Boolean(captureType)}
        title={captureType === "arrival" ? "Arrival Photo" : "Departure Photo"}
        onClose={() => setCaptureType(null)}
        onCapture={(blob) => {
          const file = new File([blob], `${captureType}-${Date.now()}.jpg`, { type: "image/jpeg" });
          handleUpload(captureType, file);
        }}
      />
    </div>
  );
}