import { MessageCircle, MapPin } from 'lucide-react';

export default function BotonWhatsAppFlotante() {
  const handleUbicacion = () => {
    window.open('https://maps.app.goo.gl/W3K9zHsMDkcpLZoJ7');
  };

  const handleWhatsapp = () => {
    window.open('https://wa.me/51929505174', '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      <button
        onClick={handleUbicacion}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition transform hover:scale-110 animate-pulse"
      >
        <MapPin size={32} />
      </button>
      <button
        onClick={handleWhatsapp}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl transition transform hover:scale-110 animate-pulse"
      >
        <MessageCircle size={32} />
      </button>
    </div>
  );
}