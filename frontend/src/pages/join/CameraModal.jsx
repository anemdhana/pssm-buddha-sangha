import { useEffect, useRef, useState } from 'react';

function compressImage(source, { passport, quality }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const w = source.videoWidth || source.naturalWidth || source.width;
  const h = source.videoHeight || source.naturalHeight || source.height;
  if (!w || !h) return '';
  if (passport) {
    const ratio = 240 / 320;
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

export function CameraModal({ open, slot, onClose, onUse }) {
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const streamRef = useRef(null);
  const [shot, setShot] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    setShot('');
    setError('');
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: slot === 'live' ? 'user' : 'environment' },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.hidden = false;
        }
      } catch {
        setError('Camera not available. Choose a photo from your device instead.');
      }
    }
    start();
    if (window.UIkit) {
      window.UIkit.modal('#camera-modal').show();
    }
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (window.UIkit) {
        try {
          window.UIkit.modal('#camera-modal').hide();
        } catch {
          /* ignore */
        }
      }
    };
  }, [open, slot]);

  function stop() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function snap() {
    const video = videoRef.current;
    if (!video || !video.srcObject) return;
    const data = compressImage(video, { passport: slot === 'live', quality: 0.78 });
    if (!data) return;
    setShot(data);
    video.hidden = true;
  }

  function retake() {
    setShot('');
    if (videoRef.current) videoRef.current.hidden = false;
  }

  function useShot() {
    if (!shot) return;
    onUse(shot);
    stop();
    onClose();
  }

  function onFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const data = compressImage(img, { passport: slot === 'live', quality: 0.78 }) || reader.result;
        setShot(data);
        if (videoRef.current) videoRef.current.hidden = true;
        stop();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  if (!open) return null;

  return (
    <div id="camera-modal" className="uk-modal-container uk-open" uk-modal="" style={{ display: 'block' }}>
      <div className="uk-modal-dialog uk-modal-body x-camera-dialog">
        <button
          className="uk-modal-close-default"
          type="button"
          uk-close=""
          onClick={() => {
            stop();
            onClose();
          }}
        />
        <h3 className="form-title">{slot === 'live' ? 'Take photo' : 'Take ID proof'}</h3>
        <p className="form-summary">
          {slot === 'live' ? 'Keep your face in the frame.' : 'Keep the ID card in the frame.'}
        </p>
        <div className="x-camera-stage" data-camera-stage="">
          <video ref={videoRef} id="camera-video" autoPlay playsInline muted />
          {shot ? <img id="camera-shot" src={shot} alt="Captured" /> : null}
          <div className="x-camera-guide" aria-hidden="true" />
        </div>
        {error ? <p className="hint">{error}</p> : null}
        <div className="uk-grid-small uk-child-width-1-2 uk-margin-small-top" uk-grid="">
          <div>
            {!shot ? (
              <button className="uk-button uk-button-primary uk-width-1-1" type="button" onClick={snap}>
                Capture
              </button>
            ) : null}
            {shot ? (
              <button className="uk-button uk-button-default uk-width-1-1" type="button" onClick={retake}>
                Retake
              </button>
            ) : null}
          </div>
          <div>
            {shot ? (
              <button className="uk-button uk-button-primary uk-width-1-1" type="button" onClick={useShot}>
                Use this photo
              </button>
            ) : null}
          </div>
        </div>
        <button
          className="uk-button uk-button-text uk-width-1-1 uk-margin-small-top"
          type="button"
          onClick={() => fileRef.current && fileRef.current.click()}
        >
          Choose from device instead
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => onFile(e.target.files && e.target.files[0])}
        />
      </div>
    </div>
  );
}
