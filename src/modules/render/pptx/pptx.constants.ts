// pptx.constants.ts
// Central numeric constants for all 3 PPTX render modes (pixelPerfect,
// editable, hybrid) — single source of truth so canvas size and screenshot
// resolution are never hand-typed differently in different files.

/** PowerPoint widescreen canvas, in inches (16:9 — matches the 1280x720 /
 *  1920x1080 HTML canvases' aspect ratio exactly). */
export const PPTX_CANVAS = {
  width: 13.333,
  height: 7.5,
} as const;

/** Default screenshot resolution for image-based modes (pixelPerfect/hybrid
 *  background). 2560x1440 = 1280x720 (legacy HTML canvas) at
 *  deviceScaleFactor 2 — this is why deviceScaleFactor defaults to 1 here:
 *  the *2 is already applied via viewport math in browser.service.ts, not by
 *  stacking an extra device-scale multiplier on top. See pptx.pixel-perfect.ts. */
export const PPTX_SCREENSHOT = {
  width: 2560,
  height: 1440,
  deviceScaleFactor: 1,
} as const;

/** Safety ceiling on generated PPTX file size before we log a size warning
 *  (large embedded PNGs across ~20 slides can add up) — informational only,
 *  never blocks export. */
export const PPTX_SIZE_WARNING_BYTES = 45 * 1024 * 1024; // Telegram bot doc cap is 50MB
