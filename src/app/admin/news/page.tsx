export default function AdminNews() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Nyhetshantering</h1>
        <p className="mt-2 text-gray-400">
          Publicera och hantera nyhetsartiklar
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📰</span>
          <h3 className="text-xl font-medium text-white mb-2">
            Nyhetshantering kommer snart
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Här kommer du kunna skapa, redigera och publicera nyhetsartiklar för webbplatsen.
          </p>
        </div>
      </div>
    </div>
  );
}