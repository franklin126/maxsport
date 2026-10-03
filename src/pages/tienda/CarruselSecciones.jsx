import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CarruselSecciones({ titulo, items, onSelect }) {
  const scrollRef = useRef(null);

  const mover = (direccion) => {
    if (!scrollRef.current) return;
    const ancho = scrollRef.current.clientWidth;
    scrollRef.current.scrollBy({ left: direccion * ancho * 0.85, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl md:text-3xl font-bold text-white">{titulo}</h2>
        <div className="flex gap-2">
          <button onClick={() => mover(-1)} className="w-10 h-10 rounded-full bg-gray-800 hover:bg-red-600 text-white flex items-center justify-center transition">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => mover(1)} className="w-10 h-10 rounded-full bg-gray-800 hover:bg-red-600 text-white flex items-center justify-center transition">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-hide">
        {items.map(item => (
          <button
            key={item.slug}
            onClick={() => onSelect(item.slug)}
            className="relative flex-shrink-0 w-64 md:w-80 aspect-[4/5] rounded-xl overflow-hidden snap-start group text-left"
          >
            {item.imagen_url ? (
              <img src={item.imagen_url} alt={item.nombre} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" />
            ) : (
              <div className="w-full h-full bg-gray-800" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pt-14">
              <span className="inline-block bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-sm">
                {item.nombre}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}