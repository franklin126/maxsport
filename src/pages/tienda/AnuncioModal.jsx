import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Phone } from 'lucide-react';
import { supabase } from '../../services/supabase';

const CLAVE_ULTIMO_AVISO = 'maxsport_ultimo_aviso';
const ESPERA_ENTRE_AVISOS = 10 * 60 * 1000;

export default function AnuncioModal() {
  const location = useLocation();
  const esAdmin = location.pathname.startsWith('/admin');
  const [anuncio, setAnuncio] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (esAdmin) return;

    const ultimaVez = Number(localStorage.getItem(CLAVE_ULTIMO_AVISO) || 0);
    if (Date.now() - ultimaVez < ESPERA_ENTRE_AVISOS) return;

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
          localStorage.setItem(CLAVE_ULTIMO_AVISO, String(Date.now()));
        }
      });
    return () => { vivo = false; };
  }, [esAdmin]);

  if (esAdmin) return null;
  if (!visible || !anuncio) return null;

  const hayOferta = anuncio.precio_oferta && anuncio.precio && anuncio.precio_oferta < anuncio.precio;
  const precioMostrar = hayOferta ? anuncio.precio_oferta : anuncio.precio;

  const handleComprar = () => {
    const mensaje = `Hola, me interesa: ${anuncio.nombre}${precioMostrar ? ` (S/ ${Number(precioMostrar).toFixed(2)})` : ''}`;
    window.open(`https://wa.me/51929505174?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4" onClick={() => setVisible(false)}>
      <div
        className="relative bg-black border-2 border-red-600 rounded-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] overflow-y-auto flex flex-col md:flex-row-reverse"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 bg-black/60 hover:bg-red-600 text-white rounded-full p-2 z-20 transition"
        >
          <X size={20} />
        </button>

        <div className="md:w-1/2 flex-shrink-0 bg-gray-950">
          {anuncio.imagen_url ? (
            <img src={anuncio.imagen_url} alt={anuncio.nombre} className="w-full h-56 md:h-full object-cover" />
          ) : (
            <div className="w-full h-56 md:h-full bg-gray-800" />
          )}
        </div>

        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center bg-gradient-to-b from-gray-900 to-black">
          <h3 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight">{anuncio.nombre}</h3>

          {anuncio.descripcion && (
            <p className="text-gray-400 text-sm mb-4">{anuncio.descripcion}</p>
          )}

          {anuncio.precio && (
            <div className="mb-5">
              {hayOferta ? (
                <div className="flex items-baseline gap-3">
                  <p className="text-gray-500 line-through text-sm">S/ {Number(anuncio.precio).toFixed(2)}</p>
                  <p className="text-4xl font-black text-yellow-400">S/ {Number(anuncio.precio_oferta).toFixed(2)}</p>
                </div>
              ) : (
                <p className="text-4xl font-black text-yellow-400">S/ {Number(anuncio.precio).toFixed(2)}</p>
              )}
            </div>
          )}

          {anuncio.tallas && anuncio.tallas.length > 0 && (
            <div className="mb-6">
              <p className="text-red-500 text-xs font-bold tracking-widest mb-2">TALLAS DISPONIBLES</p>
              <div className="flex flex-wrap gap-2">
                {anuncio.tallas.map(talla => (
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
            COMPRAR AHORA
          </button>
        </div>
      </div>
    </div>
  );
}