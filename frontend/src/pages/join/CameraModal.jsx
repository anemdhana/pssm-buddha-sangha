import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function compressImage(source, { passport, quality }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const w = source.videoWidth || source.naturalWidth || source.width;
  const h = source.videoHeight || source.naturalHeight || source.height;
  if (!w || !h || !ctx) return '';
  if (passport) {
    const ratio = 3 / 4;
    let cw = w;
    let ch = h;
    let sx = 0;
    let sy = 0;
    if (w / h > ratio) {
      cw = h * ratio;
      sx = (w - cw) / 2;
    } else {
      ch = w / ratio;
      sy = (h - ch) / 2;
    }
    canvas.width = 240;
    canvas.height = 320;
    ctx.drawImage(source, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height);
  } else {
    const outW = 420;
    const outH = 280;
    const ratio = outW / outH;
    let cw = w;
    let ch = h;
    let sx = 0;
    let sy = 0;
    if (w / h > ratio) {
      cw = h * ratio;
      sx = (w - cw) / 2;
    } else {
      ch = w / ratio;
      sy = (h - ch) / 2;
    }
    canvas.width = outW;
    canvas.height = outH;
    ctx.drawImage(source, sx, sy, cw, ch, 0, 0, outW, outH);
  }
  return canvas.toDataURL('image/jpeg', quality);
}

async function openStream(isLive) {
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: isLive ? 'user' : { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  });
}

export function CameraModal({ open, slot, onClose, onUse }) {
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const streamRef = useRef(null);
  const [shot, setShot] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const isLive = slot === 'live';

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setReady(false);
  }

  useEffect(() => {
    if (!open) return undefined;

    setShot('');
    setError('');
    setReady(false);
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera not available. Choose a photo from your device instead.');
        return;
      }
      try {
        const stream = await openStream(isLive);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        await video.play();
        if (cancelled) return;

        const markReady = () => {
          if (!cancelled && video.videoWidth > 0) setReady(true);
        };
        markReady();
        if (video.videoWidth === 0) {
          video.addEventListener('loadedmetadata', markReady, { once: true });
          video.addEventListener('playing', markReady, { once: true });
        }
      } catch {
        if (!cancelled) {
          setError('Could not open camera. Choose a photo from your device instead.');
        }
      }
    }

    // Wait one frame so the portal video node is mounted
    const frame = requestAnimationFrame(() => {
      start();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stopStream();
    };
  }, [open, isLive]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  function snap() {
    const video = videoRef.current;
    if (!video || !streamRef.current) {
      setError('Camera is not ready yet.');
      return;
    }
    if (!video.videoWidth) {
      setError('Wait a moment for the camera preview, then try again.');
      return;
    }
    const data = compressImage(video, { passport: isLive, quality: 0.78 });
    if (!data) {
      setError('Could not capture. Try again or choose from device.');
      return;
    }
    setError('');
    setShot(data);
  }

  async function retake() {
    setShot('');
    setError('');
    const video = videoRef.current;
    if (streamRef.current && video) {
      video.srcObject = streamRef.current;
      try {
        await video.play();
        setReady(video.videoWidth > 0);
      } catch {
        setReady(false);
      }
      return;
    }
    setReady(false);
    try {
      const stream = await openStream(isLive);
      streamRef.current = stream;
      if (video) {
        video.srcObject = stream;
        await video.play();
        setReady(video.videoWidth > 0);
      }
    } catch {
      setError('Could not open camera. Choose a photo from your device instead.');
    }
  }

  function useShot() {
    if (!shot) return;
    onUse(shot);
    stopStream();
    setShot('');
    onClose();
  }

  function dismiss() {
    stopStream();
    setShot('');
    setError('');
    onClose();
  }

  function onFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const data = compressImage(img, { passport: isLive, quality: 0.78 }) || String(reader.result);
        setShot(data);
        setError('');
        stopStream();
      };
      img.onerror = () => setError('Could not read that image.');
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  if (!open) return null;

  return createPortal(
    <div className="x-camera-overlay" role="presentation" onClick={dismiss}>
      <div
        className="x-camera-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={isLive ? 'Passport photo' : 'ID proof'}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="x-camera-close" type="button" aria-label="Close" onClick={dismiss}>
          <span uk-icon="icon: close; ratio: 0.9" />
        </button>
        <h3 className="form-title">{isLive ? 'Passport photo' : 'ID proof'}</h3>
        <p className="form-summary">
          {isLive ? 'Keep your face in the oval.' : 'Keep the ID card in the frame.'}
        </p>
        <div className={`x-camera-stage${isLive ? '' : ' is-id'}`}>
          <video
            ref={videoRef}
            className={shot ? 'is-hidden' : undefined}
            autoPlay
            playsInline
            muted
          />
          {shot ? <img src={shot} alt="Captured" /> : null}
          {!shot ? <div className="x-camera-guide" aria-hidden="true" /> : null}
        </div>
        {error ? <p className="x-field-error">{error}</p> : null}
        <div className="x-camera-actions">
          {!shot && !error ? (
            <button
              className="uk-button uk-button-primary uk-width-1-1"
              type="button"
              onClick={snap}
              disabled={!ready}
            >
              {ready ? 'Capture' : 'Starting camera…'}
            </button>
          ) : null}
          {shot ? (
            <>
              <button className="uk-button uk-button-default uk-width-1-1" type="button" onClick={retake}>
                Retake
              </button>
              <button className="uk-button uk-button-primary uk-width-1-1" type="button" onClick={useShot}>
                Use this photo
              </button>
            </>
          ) : null}
        </div>
        <button
          className="uk-button uk-button-text uk-width-1-1 uk-margin-small-top"
          type="button"
          onClick={() => fileRef.current?.click()}
        >
          Choose from device instead
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture={isLive ? 'user' : 'environment'}
          hidden
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
    </div>,
    document.body
  );
}
