// Fullscreen must be requested from a direct user gesture and doesn't
// persist across reloads, so callers should invoke this on the tap that
// starts play each session (not on initial app load).
export function requestFullscreen(): void {
  if (document.fullscreenElement) return
  document.documentElement.requestFullscreen?.().catch(() => {
    // ignored: unsupported browser or user/OS declined
  })
}
