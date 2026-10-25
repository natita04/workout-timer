# Workout Timer

A configurable workout timer app designed for circuit training with audio cues and customizable settings.

## Features

- **Workout builder** with three sections:
  - **Warm-up** (optional): repetitions, length of each, break between
  - **Main workout**: repetitions, length, break between, plus an optional long break after every N reps
  - **Wind-down** (optional): same options as the warm-up
- **Templates**: save workouts and replay them with one tap, or start a workout without saving. Templates are stored in the browser (localStorage), so they stay on the device.
- **Full-screen player**: color-coded intervals, big countdown, "up next" preview, overall progress, pause, skip forward/back
- **Audio and vibration cues**: start/rest tones, 3-2-1 countdown, finish chime; vibration where the device supports it
- **Mobile-first**: large touch targets, safe-area aware layout, and the screen stays awake during a workout (Wake Lock API)

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Usage

1. Tap **New workout**, set up the warm-up, main workout and wind-down
2. Tap **Save template** to keep it, or **Start now** to go straight to the timer
3. From the home screen, tap ▶ on a template to start it, or tap its name to edit it

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Web Audio API** - Sound generation

## Browser Compatibility

The app uses the Web Audio API for sound generation, which is supported in all modern browsers. Audio cues will gracefully fall back if the API is not available.

## Keyboard Accessibility

- All buttons are keyboard accessible using Tab navigation
- Press Enter or Space to activate buttons
- Focus indicators are clearly visible

## Future Enhancements

- Sync templates across devices (would need accounts and a database)
- Workout history tracking
