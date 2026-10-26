import type { MetadataRoute } from 'next'

// Lets phones install the app to the home screen and open it without browser chrome.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Workout Timer',
    short_name: 'Workout',
    description: 'Build interval workouts with warm-up, main sets and wind-down',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f9fafb',
    theme_color: '#f9fafb',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Artwork sits inside the central safe zone, so the same files work as maskable icons.
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
