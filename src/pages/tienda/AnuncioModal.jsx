import { useState, useEffect } from 'react';
import { X, Phone } from 'lucide-react';
import { supabase } from '../../services/supabase';

export default function AnuncioModal() {
  const [anuncio, setAnuncio] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let vivo = true;
    supabase
      .from('anuncios')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error('Error cargando anuncio:', error); return; }
        if (vivo && data) {
          setAnuncio(data);
          setVisible(true);
        }
      });
    return () => { vivo = false; };
  }, []);

  if (!visible || !anuncio) return null;

  const hayOferta = anuncio.precio_oferta && anuncio.precio && anuncio.precio_oferta < anuncio.precio;
  const precioMostrar = hayOferta ? anuncio.precio_oferta : anuncio.precio;

  const handleComprar = () => {
    const mensaje = `Hola, me interesa: ${anuncio.nombre}${precioMostrar ? ` (S/ ${Number(precioMostrar).toFixed(2)})` : ''}`;
    window.open(`https://wa.me/51929505174?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4" onClick={() => setVisible(false)}>
      <div className="bg-gray-900 rounded-xl max-w-md w-full border-2 border-red-600 overflow-hidden max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button
            onClick={() => setVisible(false)}
            className="absolute top-3 right-3 bg-black/60 hover:bg-red-600 text-white rounded-full p-2 z-10"
          >
            <X size={20} />
          </button>
          {anuncio.imagen_url && (
            <div className="aspect-square bg-white">
              <img src={anuncio.imagen_url} alt={anuncio.nombre} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-2">{anuncio.nombre}</h3>

          {anuncio.descripcion && (
            <p className="text-gray-400 text-sm mb-4">{anuncio.descripcion}</p>
          )}

          {anuncio.tallas && anuncio.tallas.length > 0 && (
            <div className="mb-4">
              <p className="text-gray-300 text-sm font-semibold mb-2">Tallas disponibles:</p>
              <div className="flex flex-wrap gap-2">
                {anuncio.tallas.map(talla => (
                  <span key={talla} className="bg-gray-800 text-white px-3 py-1 rounded-lg border border-red-600 text-sm">
                    {talla}
                  </span>
                ))}
              </div>
            </div>
          )}

          {anuncio.precio && (
            <div className="mb-5">
              {hayOferta ? (
                <div>
                  <p className="text-gray-500 line-through">S/ {Number(anuncio.precio).toFixed(2)}</p>
                  <p className="text-3xl font-black text-yellow-400">S/ {Number(anuncio.precio_oferta).toFixed(2)}</p>
                </div>
              ) : (
                <p className="text-3xl font-black text-green-400">S/ {Number(anuncio.precio).toFixed(2)}</p>
              )}
            </div>
          )}

          <button
            onClick={handleComprar}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Phone size={20} />
            Comprar ahora
          </button>
        </div>
      </div>
    </div>
  );
}