import { X, Phone } from 'lucide-react';

export default function ModalProductoDestacado({ producto, onClose }) {
  const handleComprar = () => {
    const mensaje = `Hola, estoy interesado en ${producto.nombre}`;
    window.open(`https://wa.me/51929505174?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div
        className="relative bg-black border-2 border-red-600 rounded-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] overflow-y-auto flex flex-col md:flex-row-reverse"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/60 hover:bg-red-600 text-white rounded-full p-2 z-20 transition"
        >
          <X size={20} />
        </button>

        <div className="md:w-1/2 flex-shrink-0 bg-white flex items-center justify-center">
          {producto.imagen_url ? (
            <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-64 md:h-full md:min-h-[380px] object-contain p-2" />
          ) : (
            <div className="w-full h-64 md:h-full bg-gray-800" />
          )}
        </div>

        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center bg-gradient-to-b from-gray-900 to-black">
          <h3 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight pr-8 md:pr-0">{producto.nombre}</h3>

          {producto.precio != null && (
            <p className="text-4xl font-black text-yellow-400 mb-5">S/ {Number(producto.precio).toFixed(2)}</p>
          )}

          {producto.tallas && producto.tallas.length > 0 && (
            <div className="mb-6">
              <p className="text-red-500 text-xs font-bold tracking-widest mb-2">TALLAS DISPONIBLES</p>
              <div className="flex flex-wrap gap-2">
                {producto.tallas.map(talla => (
                  <span key={talla} className="bg-gray-900 text-white w-11 text-center py-1.5 rounded-md border border-red-600 text-sm font-semibold">
                    {talla}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleComprar}
            className="w-full bg-white hover:bg-gray-200 text-black font-black py-4 rounded-lg transition flex items-center justify-center gap-2 tracking-wide"
          >
            <Phone size={20} />
            COMPRAR POR WHATSAPP
          </button>
        </div>
      </div>
    </div>
  );
}