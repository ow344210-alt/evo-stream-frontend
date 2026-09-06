import Hls from "hls.js";

/**
 * Thin, isolated wrapper around HLS engine selection + setup for a <video>.
 *
 * - Native HLS (Safari/iOS) -> set video.src directly, no hls.js instance.
 * - Other modern browsers   -> hls.js instance attached to the video.
 * - Unsupported             -> return null and let the caller show an error.
 *
 * The React component owns rendering/lifecycle; this module owns the engine
 * details so they can be unit-tested with a mocked hls.js.
 */

export type EngineSetupResult =
  | { kind: "native"; hls: Hls | null }
  | { kind: "hls"; hls: Hls | null }
  | { kind: "unsupported"; hls: null };

/** True when hls.js reports it can play MSE-based HLS in this environment. */
export function isHlsJsSupported(): boolean {
  return typeof window !== "undefined" && Boolean(Hls.isSupported());
}

/** True when the browser can play HLS natively (e.g. Safari). */
export function canPlayNativeHls(video: HTMLVideoElement | null): boolean {
  if (!video) return false;
  try {
    return Boolean(video.canPlayType && video.canPlayType("application/vnd.apple.mpegurl"));
  } catch {
    return false;
  }
}

/**
 * Attach HLS to the video and start loading the master URL.
 *
 * @param onFatal invoked with a user-safe message when a fatal HLS error occurs.
 * @returns the engine setup result; `hls` is non-null only for the "hls" kind.
 */
export function setupHlsEngine(
  video: HTMLVideoElement | null,
  hlsUrl: string,
  onFatal: () => void,
): EngineSetupResult {
  if (!video || !hlsUrl) {
    return { kind: "unsupported", hls: null };
  }

  // 1) Native HLS (Safari / iOS).
  if (canPlayNativeHls(video)) {
    try {
      video.src = hlsUrl;
    } catch {
      return { kind: "unsupported", hls: null };
    }
    return { kind: "native", hls: null };
  }

  // 2) hls.js for everything else.
  if (!isHlsJsSupported()) {
    return { kind: "unsupported", hls: null };
  }

  try {
    const hls = new Hls();
    // Fatal errors -> surface a user-facing error (never raw internals).
    hls.on(Hls.Events.ERROR, (_evt, data) => {
      if (data?.fatal) {
        onFatal();
      }
    });
    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    return { kind: "hls", hls };
  } catch {
    return { kind: "unsupported", hls: null };
  }
}
