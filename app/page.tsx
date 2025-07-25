import WorkoutTimer from '@/components/WorkoutTimer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Workout Timer
          </h1>
          <p className="text-gray-600">
            Configurable timer for circuit training
          </p>
        </header>
        <WorkoutTimer />
      </div>
    </main>
  )
} 