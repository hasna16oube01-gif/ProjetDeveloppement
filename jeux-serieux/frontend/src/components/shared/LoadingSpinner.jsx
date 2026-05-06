export default function LoadingSpinner({ message = 'Chargement...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-6xl mb-4 animate-bounce">🎮</div>
      <div className="text-2xl font-fredoka text-blue-600 font-bold">{message}</div>
      <div className="mt-4 flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
