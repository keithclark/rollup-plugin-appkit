export const createManifest = (opts) => {
  return JSON.stringify({
    "name": opts.name,
    "short_name": opts.name,
    "icons": [
      {
        "src": opts.icon,
        "sizes": "512x512",
        "type": "image/png"
      },
      {
        "src": opts.icon,
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable"
      }
    ],
    "start_url": opts.url,
    "background_color": "#000000",
    "display": "standalone"
  }, null, 2)
}