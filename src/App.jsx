import {useEffect, useRef, useState} from "react";
import "./App.css"; // ✅ Import custom CSS

/**
 * Screen Recorder App — Step 1 (Frontend only)
 * With Custom CSS Styling (no Tailwind needed)
 */

export default function ScreenRecorderApp() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [previewURL, setPreviewURL] = useState("");
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const displayStreamRef = useRef(null);
  const micStreamRef = useRef(null);
  const mixedStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const tickRef = useRef(null);
  const startTimeRef = useRef(0);

  const MAX_DURATION_MS = 3 * 60 * 1000;

  useEffect(() => {
    const supported = !!(
      navigator?.mediaDevices?.getDisplayMedia &&
      window?.MediaRecorder
    );
    setIsSupported(supported);
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
      if (previewURL) URL.revokeObjectURL(previewURL);
    };
  }, []);

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startTimer = () => {
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    tickRef.current = window.setInterval(() => {
      const now = Date.now();
      const ms = now - startTimeRef.current;
      setElapsedMs(ms);
      if (ms >= MAX_DURATION_MS) {
        stopRecording();
      }
    }, 250);
  };

  const stopTimer = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const pickMimeType = () => {
    const cand = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    return cand.find((c) => MediaRecorder.isTypeSupported(c)) || "";
  };

  const startRecording = async () => {
    setError("");
    if (!isSupported || isRecording) return;

    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      setPreviewURL("");
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const systemAudio = audioCtx.createMediaStreamSource(displayStream);
      const micAudio = audioCtx.createMediaStreamSource(micStream);
      const dest = audioCtx.createMediaStreamDestination();
      systemAudio.connect(dest);
      micAudio.connect(dest);

      const combined = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stopTimer();
        const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewURL(url);
        setIsRecording(false);
        cleanupStreams();
      };

      const [videoTrack] = displayStream.getVideoTracks();
      if (videoTrack) {
        videoTrack.addEventListener("ended", () => {
          stopRecording();
        });
      }

      mediaRecorderRef.current = recorder;
      displayStreamRef.current = displayStream;
      micStreamRef.current = micStream;
      mixedStreamRef.current = combined;
      audioCtxRef.current = audioCtx;

      recorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to start recording. Use Chrome & allow permissions.");
      cleanupStreams();
      stopTimer();
      setIsRecording(false);
    }
  };

  const cleanupStreams = () => {
    const stopTracks = (s) => s?.getTracks?.().forEach((t) => t.stop());
    stopTracks(displayStreamRef.current);
    stopTracks(micStreamRef.current);
    stopTracks(mixedStreamRef.current);
    displayStreamRef.current = null;
    micStreamRef.current = null;
    mixedStreamRef.current = null;

    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch {}
    stopTimer();
  };

  const handleDownload = () => {
    if (!previewURL || !chunksRef.current?.length) return;
    const mimeType = pickMimeType() || "video/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });

    const a = document.createElement("a");
    const ts = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
    a.href = URL.createObjectURL(blob);
    a.download = `recording_${ts}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const progress = Math.min(1, elapsedMs / MAX_DURATION_MS);

  return (
    <div className="app-container">
      <div className="app-card">
        <header>
          <h1>🎥 Screen Recorder App</h1>
          <p>Record your current tab/window with microphone audio (Max 3 mins).</p>
        </header>

        {!isSupported && (
          <div className="error-box">Your browser doesn’t support screen recording.</div>
        )}
        {error && <div className="warn-box">{error}</div>}

        <div className="controls">
          <button onClick={startRecording} disabled={!isSupported || isRecording} className="btn start">
            ▶ Start
          </button>
          <button onClick={stopRecording} disabled={!isRecording} className="btn stop">
            ⏹ Stop
          </button>
          <span className="timer">⏱ {formatTime(elapsedMs)}</span>
        </div>

        <div className="progress-bar">
          <div style={{ width: `${progress * 100}%` }} />
        </div>

        <div className="preview">
          <h2>Preview</h2>
          {!previewURL ? (
            <p>No recording yet. Start and stop to preview here.</p>
          ) : (
            <>
              <video src={previewURL} controls />
              <button onClick={handleDownload} className="btn download">⬇ Download</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

