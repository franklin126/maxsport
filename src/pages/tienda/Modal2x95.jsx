import { useState } from 'react';
import { X, Phone } from 'lucide-react';
import ModalYape from './ModalYape';

export default function Modal2x95({ productosSeleccionados, onClose, productos }) {
  const [modalYape, setModalYape] = useState(false);

  const producto1 = productos.find(p => p.id === productosSeleccionados[0]);
  const producto2 = productos.find(p => p.id === productosSeleccionados[1]);

  const precioOriginal = (producto1?.precio || 0) + (producto2?.precio || 0);
  const precioOferta = 95;

  const handleWhatsApp = () => {
    const mensaje = `Hola, quiero la oferta 2x95:
    
Producto 1: ${producto1.nombre}
Precio: S/ ${producto1.precio.toFixed(2)}

Producto 2: ${producto2.nombre}
Precio: S/ ${producto2.precio.toFixed(2)}

Total original: S/ ${precioOriginal.toFixed(2)}
OFERTA 2x95: S/ 95.00`;
    window.open(`https://wa.me/51929505174?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-yellow-500 p-6" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full p-2">
            <X size={24} />
          </button>

          <h2 className="text-3xl font-bold text-center mb-6">
            <span className="text-yellow-400">🎉 Oferta 2 x S/ 95 🎉</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[producto1, producto2].map((producto) => (
              <div key={producto.id} className="bg-gray-800 rounded-lg p-4 border-2 border-yellow-500">
                <img
                  src={producto.imagenes?.[0] || producto.imagen_url}
                  alt={producto.nombre}
                  loading="lazy"
                  className="w-full aspect-square object-cover rounded-lg mb-3"
                />
                <h3 className="font-bold text-white mb-2">{producto.nombre}</h3>
                {producto.marca && <p className="text-sm text-gray-400">Marca: {producto.marca}</p>}
                {producto.tallas && <p className="text-sm text-gray-400 mb-2">Tallas: {producto.tallas.join(', ')}</p>}
                <p className="text-lg font-bold text-green-400">S/ {producto.precio.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-yellow-900 to-orange-900 rounded-lg p-6 mb-6 border-2 border-yellow-500">
            <div className="text-center">
              <p className="text-gray-300 mb-2">Precio Original Total:</p>
              <p className="text-2xl text-gray-400 line-through mb-3">S/ {precioOriginal.toFixed(2)}</p>
              <p className="text-gray-300 mb-2">🎁 PRECIO OFERTA 2x95:</p>
              <p className="text-5xl font-bold text-yellow-400 mb-2">S/ 95.00</p>
              <div className="inline-block bg-green-600 text-white px-4 py-2 rounded-full font-bold">
                ¡Ahorras S/ {(precioOriginal - precioOferta).toFixed(2)}!
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Phone size={20} />
              Confirmar por WhatsApp
            </button>
            <button
              onClick={() => setModalYape(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              💳 Pagar con Yape - S/ 95.00
            </button>
          </div>
        </div>
      </div>
      {modalYape && (
        <ModalYape
          producto={{ nombre: `Oferta 2x95: ${producto1.nombre} + ${producto2.nombre}` }}
          precio={95}
          onClose={() => setModalYape(false)}
        />
      )}
    </>
  );
}