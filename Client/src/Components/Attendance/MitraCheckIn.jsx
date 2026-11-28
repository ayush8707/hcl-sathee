import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, LogIn, LogOut, MapPin, RotateCcw } from "lucide-react";
import { uploadMitraAttendancePhoto } from "../../services/mitraAttendance";
import { getApiErrorMessage } from "../../utils/apiRequest";
import { compressImageForUpload } from "../../utils/compressImage";
import { getBestPosition, getCurrentPosition } from "../../utils/geolocation";
import SelfieCamera from "./SelfieCamera";

const formatTime = (value) =>
  value ? new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) : "—";

/**
 * The SATHEE MITRA's own check-in, made as simple as possible:
 *  1. one big button (Check in, later Check out);
 *  2. it opens a selfie camera inside the app (no switching to the camera app,
 *     which low-memory phones answer by closing the installed app), with
 *     the phone's own camera app as a backup;
 *  3. the selfie saves straight away with time and location;
 *  4. if anything fails the photo is kept, so "Try again" doesn't need a new one.
 */
export default function MitraCheckIn({ profile, date, record, onSaved }) {
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null); // { type, file, url }
  const [step, setStep] = useState(""); // "" | "locating" | "saving"
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  const next = !record?.arrivalTime ? "arrival" : !record?.departureTime ? "departure" : null;
  const isArrival = next === "arrival";

  // Ask for location as soon as the page opens, so the "Allow location?"
  // question comes now (not in the middle of checking in) and GPS warms up.
  useEffect(() => {
    if (next) getCurrentPosition({ timeoutMs: 10000 });
  }, [next]);

  useEffect(() => () => pending?.url && URL.revokeObjectURL(pending.url), [pending]);

  const send = async (item) => {
    setError("");
    setDone("");
    try {
      setStep("locating");
      const located = await getBestPosition();
      setStep("saving");
      const file = await compressImageForUpload(item.file);
      const saved = await uploadMitraAttendancePhoto({
        userId: profile.id,
        name: profile.name,
        email: profile.email,
        centre: profile.centre,
        centreId: profile.centre,
        date,
        type: item.type,
        file,
        position: located.position || null,
      });
      setPending(null);
      setDone(
        item.type === "arrival"
          ? `Checked in at ${formatTime(saved.arrivalTime)}. Have a good day!`
          : `Checked out at ${formatTime(saved.departureTime)}. Your day is complete.`
      );
      onSaved?.(saved);
    } catch (err) {
      const status = err?.response?.status;
      setError(
        status === 400 || status === 403
          ? getApiErrorMessage(err, "Check-in was not accepted.")
          : !navigator.onLine
            ? "No internet right now. Your photo is kept: tap Try again when you're back online."
            : getApiErrorMessage(err, "Your photo didn't save. It's kept here: tap Try again.")
      );
    } finally {
      setStep("");
    }
  };

  const takePhoto = (file) => {
    if (!file || !next) return;
    const item = { type: next, file, url: URL.createObjectURL(file) };
    setPending(item);
    send(item);
  };

  const onPhoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    takePhoto(file);
  };

  // The phone's own camera app: the backup when the in-app camera can't start.
  const openPhoneCamera = () => fileRef.current?.click();

  const openCamera = () => {
    setError("");
    setDone("");
    setCameraOpen(true);
  };

  if (!next && !pending) {
    return (
      <div className="flex items-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-5">
        <CheckCircle2 size={40} className="shrink-0 text-emerald-600" />
        <div>
          <p className="text-lg font-bold text-emerald-900">You&apos;re done for today</p>
          <p className="text-sm text-emerald-800">
            In {formatTime(record.arrivalTime)} · Out {formatTime(record.departureTime)}
          </p>
          <p className="mt-0.5 text-sm font-medium text-emerald-800">
            {record.approved ? "✅ Approved by admin" : "⏳ Waiting for admin approval"}
          </p>
        </div>
      </div>
    );
  }

  const busy = Boolean(step);
  const Icon = isArrival ? LogIn : LogOut;

  return (
    <div className="rounded-3xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-5 text-center sm:p-6">
      <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onPhoto} />
      <SelfieCamera
        open={cameraOpen}
        title={isArrival ? "Check-in selfie" : "Check-out selfie"}
        onPhoto={takePhoto}
        onClose={() => setCameraOpen(false)}
        onUsePhoneCamera={openPhoneCamera}
      />

      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        {isArrival ? "Step 1 of 2" : "Step 2 of 2"}
      </p>
      <h3 className="mt-1 text-xl font-bold text-slate-900">
        {isArrival ? "Arrived at the Kendra?" : `Checked in at ${formatTime(record?.arrivalTime)}. Leaving?`}
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Tap the button and take a selfie. Time and location are saved automatically.
      </p>

      {pending ? (
        <img
          src={pending.url}
          alt="Your selfie"
          className="mx-auto mt-4 h-40 w-40 rounded-2xl object-cover ring-4 ring-white shadow"
        />
      ) : null}

      {busy ? (
        <p className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-blue-700">
          <Loader2 size={20} className="animate-spin" />
          {step === "locating" ? "Finding your location…" : "Saving your photo…"}
        </p>
      ) : pending && error ? (
        <div className="mt-5 grid gap-2 sm:flex sm:justify-center">
          <button
            type="button"
            onClick={() => send(pending)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <RotateCcw size={22} /> Try again
          </button>
          <button
            type="button"
            onClick={openCamera}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Camera size={20} /> New photo
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openCamera}
          className={`mt-5 inline-flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-5 text-xl font-bold text-white shadow-md transition sm:w-auto sm:min-w-[18rem] ${
            isArrival ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <Icon size={26} />
          {isArrival ? "Check in" : "Check out"}
        </button>
      )}

      {error ? (
        <p className="mx-auto mt-4 flex max-w-md items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
          <MapPin size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="mx-auto mt-4 max-w-md rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {done}
        </p>
      ) : null}
    </div>
  );
}
