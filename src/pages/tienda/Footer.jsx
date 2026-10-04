import { MapPin } from 'lucide-react';

function IconoFacebook(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconoTiktok(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export default function Footer({ variante }) {
  const esInicio = variante === 'inicio';

  return (
    <footer className="bg-gradient-to-r from-black via-red-900 to-green-900 border-t border-red-600 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        {esInicio && (
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex items-center gap-5">
              <a
                href="https://www.facebook.com/Mypaliz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-red-500 transition"
              >
                <IconoFacebook className="w-6 h-6" />
              </a>
              <a
                href="https://www.tiktok.com/@maxsport_2?_r=1&_t=ZS-9AGLm7x2Od0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-red-500 transition"
              >
                <IconoTiktok className="w-6 h-6" />
              </a>
            </div>
            <p className="text-gray-400 text-sm flex items-center gap-1">
              <MapPin size={14} />
              131 Sebastian Barranca
            </p>
          </div>
        )}
        <p className="text-gray-400">&copy; 2026 MAX SPORT. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}