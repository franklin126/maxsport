import { MessageCircle } from 'lucide-react';

export default function BotonWhatsAppFlotante() {
  return (
    <button
      onClick={() => window.open('https://wa.me/51929505174', '_blank')}
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl z-50 transition transform hover:scale-110 animate-pulse"
    >
      <MessageCircle size={32} />
    </button>
  );
}