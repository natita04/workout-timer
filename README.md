# Workout Timer

A configurable workout timer app designed for circuit training with audio cues and customizable settings.

## Features

- **Configurable Durations**: Set custom workout and break durations
- **Multiple Rounds**: Define the number of workout rounds
- **Audio Cues**: Sound notifications for:
  - 5-second preparation time before workout begins
  - 3-2-1 countdown in final seconds (descending tones for natural buildup)
  - Start and end of each phase
- **Visual Feedback**: 
  - Large countdown timer
  - Progress bar
  - Color-coded phases (blue for prep, green for workout, orange for break)
- **Intuitive Controls**: Start, pause, resume, and reset functionality
- **Accessibility**: Full keyboard navigation and screen reader support

## Default Settings

- Workout Duration: 40 seconds
- Break Duration: 20 seconds
- Rounds: 3

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

1. **Configure Settings**: Adjust workout duration, break duration, and number of rounds using the input fields
2. **Start Workout**: Click the "Start" button to begin your workout session
3. **Follow Audio Cues**: Listen for:
   - 5-second prep countdown before first workout
   - Start tone at the beginning of each phase
   - 3-2-1 countdown with descending tones (high→medium→low) in final seconds
   - End tone when each phase completes
4. **Control Playback**: Use pause/resume and reset buttons as needed
5. **Track Progress**: Monitor your current round and remaining time

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

- Sound customization options
- Preset workout templates
- Vibration support for mobile devices
- Visual progress indicators and animations
- Workout history tracking 