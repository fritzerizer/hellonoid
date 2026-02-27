import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNewspaper } from '@fortawesome/free-solid-svg-icons';

export default function AdminNews() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FontAwesomeIcon icon={faNewspaper} className="text-[#239eab]" />
          News
        </h1>
        <p className="mt-1 text-gray-400">
          Publish and manage news articles
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
        <FontAwesomeIcon icon={faNewspaper} className="text-gray-600 text-5xl mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">
          Coming soon
        </h3>
        <p className="text-gray-400 max-w-md mx-auto">
          News management will be available here. Create, edit and publish news articles for the site.
        </p>
      </div>
    </div>
  );
}
