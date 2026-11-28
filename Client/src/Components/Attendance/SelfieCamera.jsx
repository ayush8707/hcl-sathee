import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, RotateCcw, X } from "lucide-react";

const PERMISSION_HELP =
  "Camera is blocked for this app. Open your phone's Settings → Apps → SATHEE (or Chrome) → Permissions → Camera → Allow. Then try again.";

/**
 * Full-screen selfie camera inside the app. Taking the photo here (instead of
 * jumping to the phone's camera app) matters for the installed app: on
 * low-memory phones Android closes the app while the camera app is open, so
 * the photo never comes back. If the in-app camera can't start, the SATHEE
 * MITRA can still use the phone's camera app (`onUsePhoneCamera`).
 */
export default function SelfieCamera({ open, title, onPhoto, onClose, onUsePhoneCamera }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [shot, setShot] = useState(null); // { blob, url }
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const canUseCamera = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Opens the front camera; messages are cleared by `restart` and `close`.
  const openStream = () =>
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
      audio: false,
    });
  const onStream = (stream) => {
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
  };
  const onFail = (err) =>
    setError(
      err?.name === "NotAllowedError" || err?.name === "SecurityError"
        ? PERMISSION_HELP
        : "The camera couldn't start. Close other apps using the camera, or use the phone's camera app below."
    );

  useEffect(() => {
    if (!open || !canUseCamera) return undefined;
    let cancelled = false;
    openStream().then(
      (stream) => (cancelled ? stream.getTracks().forEach((t) => t.stop()) : onStream(stream)),
      (err) => !cancelled && onFail(err)
    );
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, canUseCamera]);

  useEffect(() => () => shot?.url && URL.revokeObjectURL(shot.url), [shot]);

  if (!open) return null;
  const message = canUseCamera ? error : "This phone can't open the camera inside the app.";

  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setShot({ blob, url: URL.createObjectURL(blob) });
        stop();
      },
      "image/jpeg",
      0.85
    );
  };

  const restart = () => {
    setError("");
    setReady(false);
    setShot(null);
    if (canUseCamera) openStream().then(onStream, onFail);
  };

  const close = () => {
    stop();
    setShot(null);
    setError("");
    setReady(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black text-white" role="dialog" aria-label={title}>
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-base font-semibold">{title}</p>
        <button type="button" onClick={close} aria-label="Close camera" className="rounded-full p-2 hover:bg-white/10">
          <X size={24} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {shot ? (
          <img src={shot.url} alt="Your selfie" className="max-h-full max-w-full object-contain" />
        ) : message ? (
          <div className="mx-6 max-w-sm space-y-4 text-center">
            <Camera size={40} className="mx-auto text-white/60" />
            <p className="text-sm leading-relaxed text-white/90">{message}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedData={() => setReady(true)}
            className="h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        )}
      </div>

      <div className="space-y-3 px-4 pb-6 pt-4">
        {shot ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-4 py-4 text-base font-semibold"
            >
              <RotateCcw size={20} /> Retake
            </button>
            <button
              type="button"
              onClick={() => {
                onPhoto(new File([shot.blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" }));
                close();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-base font-bold"
            >
              <Check size={20} /> Use photo
            </button>
          </div>
        ) : message ? (
          <div className="grid gap-3">
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-base font-bold text-slate-900"
            >
              <RotateCcw size={20} /> Try the camera again
            </button>
            <button
              type="button"
              onClick={() => {
                close();
                onUsePhoneCamera();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-4 py-4 text-base font-semibold"
            >
              <ImagePlus size={20} /> Use the phone&apos;s camera app
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={capture}
              disabled={!ready}
              aria-label="Take photo"
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
            >
              <span className="h-14 w-14 rounded-full bg-white" />
            </button>
            <button
              type="button"
              onClick={() => {
                close();
                onUsePhoneCamera();
              }}
              className="mx-auto block text-sm text-white/70 underline"
            >
              Camera not working? Use the phone&apos;s camera app
            </button>
          </>
        )}
      </div>
    </div>
  );
}
