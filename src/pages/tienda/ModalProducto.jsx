import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { X, ChevronLeft, ChevronRight, ZoomIn, Phone } from 'lucide-react';
import ModalYape from './ModalYape';
import { DOMINIO } from '../../utils/constantes';

export default function ModalProducto({ producto, onClose }) {
  const [imagenActual, setImagenActual] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [modalYape, setModalYape] = useState(false);
  const [imagenesLoaded, setImagenesLoaded] = useState({});

  const imagenes = producto.imagenes || [producto.imagen_url];

  useEffect(() => {
    const preloadImages = () => {
      imagenes.forEach((src, index) => {
        const img = new Image();
        img.onload = () => {
          setImagenesLoaded(prev => ({ ...prev, [index]: true }));
        };
        img.src = src;
      });
    };
    preloadImages();
  }, [imagenes]);

  const siguienteImagen = () => {
    setImagenActual((prev) => (prev + 1) % imagenes.length);
    resetZoom();
  };

  const anteriorImagen = () => {
    setImagenActual((prev) => (prev - 1 + imagenes.length) % imagenes.length);
    resetZoom();
  };

  const resetZoom = () => {
    setZoom(false);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setZoomOrigin({ x: 50, y: 50 });
    document.body.style.overflow = 'auto';
  };

  const handleImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (!zoom) {
      setZoom(true);
      setZoomLevel(2);
      setZoomOrigin({ x, y });
      document.body.style.overflow = 'hidden';
    } else if (zoomLevel < 4) {
      setZoomLevel(prev => prev + 1);
      setZoomOrigin({ x, y });
    } else {
      resetZoom();
    }
  };

  const handleMouseDown = (e) => {
    if (zoom && zoomLevel > 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom) {
      e.preventDefault();
      e.stopPropagation();
      setPanPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = (e) => {
    if (isDragging) { e.preventDefault(); e.stopPropagation(); }
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (zoom && zoomLevel > 1) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panPosition.x, y: e.touches[0].clientY - panPosition.y });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && zoom) {
      e.preventDefault();
      e.stopPropagation();
      setPanPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };

  const handleTouchEnd = (e) => {
    if (isDragging) { e.stopPropagation(); }
    setIsDragging(false);
  };

  const handleWhatsApp = () => {
    const mensaje = `Hola, estoy interesado en: ${producto.nombre}`;
    window.open(`https://wa.me/51929505174?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleClose = () => {
    resetZoom();
    onClose();
  };

  const precioMostrar = producto.precio_oferta || producto.precio;
  const hayOferta = producto.precio_oferta && producto.precio_oferta < producto.precio;
  const urlProducto = `${DOMINIO}/producto/${producto.id}`;
  const descripcionSeo = `${producto.nombre}${producto.marca ? ' de ' + producto.marca : ''} a S/ ${precioMostrar.toFixed(2)} en MAX SPORT, Huancavelica.`;

  return (
    <>
      <Helmet>
        <title>{`${producto.nombre} - MAX SPORT`}</title>
        <meta name="description" content={descripcionSeo} />
        <link rel="canonical" href={urlProducto} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={producto.nombre} />
        <meta property="og:description" content={descripcionSeo} />
        <meta property="og:image" content={imagenes[0]} />
        <meta property="og:url" content={urlProducto} />
      </Helmet>

      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={handleClose}>
        <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-red-600" onClick={(e) => e.stopPropagation()}>
          <button onClick={handleClose} className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 z-10">
            <X size={24} />
          </button>

          <div className="grid md:grid-cols-2 gap-6 p-6">
            <div className="relative">
              <div
                className={`aspect-square bg-white rounded-lg overflow-hidden relative ${zoom ? 'cursor-move' : 'cursor-zoom-in'}`}
                onClick={handleImageClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: zoom ? 'none' : 'auto' }}
              >
                {!imagenesLoaded[imagenActual] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                  </div>
                )}
                <img
                  src={imagenes[imagenActual]}
                  alt={producto.nombre}
                  className="w-full h-full object-contain transition-transform duration-300 select-none"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    opacity: imagenesLoaded[imagenActual] ? 1 : 0
                  }}
                  draggable="false"
                />
              </div>

              {imagenes.length > 1 && !zoom && (
                <>
                  <button onClick={anteriorImagen} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2">
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={siguienteImagen} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2">
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {imagenes.length > 1 && !zoom && (
                <div className="flex justify-center gap-2 mt-4">
                  {imagenes.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setImagenActual(idx); resetZoom(); }}
                      className={`w-3 h-3 rounded-full ${idx === imagenActual ? 'bg-red-600' : 'bg-gray-600'}`}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mt-2 text-gray-400 text-sm">
                <ZoomIn size={16} />
                <span>{zoom ? `Zoom ${zoomLevel}x - Arrastra para mover` : 'Click en cualquier parte para zoom'}</span>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white mb-4">{producto.nombre}</h2>

              {producto.marca && (
                <p className="text-gray-400 mb-2">
                  <span className="font-semibold">Marca:</span> {producto.marca}
                </p>
              )}

              {producto.tallas && (
                <div className="mb-4">
                  <p className="font-semibold text-gray-300 mb-2">Tallas Disponibles:</p>
                  {producto.tallas_stock && Object.keys(producto.tallas_stock).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(producto.tallas_stock)
                        .sort((a, b) => Number(a[0]) - Number(b[0]))
                        .map(([talla, unidades]) => (
                          <div key={talla} className={`flex flex-col items-center px-3 py-2 rounded-lg border ${
                            unidades === 0
                              ? 'bg-gray-800 border-gray-700 opacity-50'
                              : unidades <= 2
                              ? 'bg-yellow-900/40 border-yellow-600'
                              : 'bg-gray-800 border-red-600'
                          }`}>
                            <span className="text-white font-bold text-sm">{talla}</span>
                            <span className={`text-xs font-semibold ${
                              unidades === 0 ? 'text-gray-500' :
                              unidades <= 2 ? 'text-yellow-400' : 'text-green-400'
                            }`}>{unidades === 0 ? 'agot.' : `${unidades} ud`}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {producto.tallas.map(talla => (
                        <span key={talla} className="bg-gray-800 text-white px-3 py-1 rounded-lg border border-red-600">
                          {talla}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {producto.stock !== null && (
                <div className="mb-4">
                  {producto.stock === 0 ? (
                    <span className="inline-block bg-red-900 text-red-300 border border-red-600 text-sm font-bold px-3 py-1 rounded-full">
                      Agotado
                    </span>
                  ) : (
                    <span className="inline-block bg-green-900 text-green-300 border border-green-600 text-sm font-bold px-3 py-1 rounded-full">
                      {producto.stock} disponibles
                    </span>
                  )}
                </div>
              )}

              {producto.precio && (
                <div className="mb-6">
                  {hayOferta ? (
                    <div>
                      <p className="text-gray-400 line-through text-xl">S/ {producto.precio.toFixed(2)}</p>
                      <p className="text-4xl font-bold text-yellow-400">S/ {producto.precio_oferta.toFixed(2)}</p>
                      <span className="inline-block bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-sm mt-2">
                        🎁 OFERTA ESPECIAL
                      </span>
                    </div>
                  ) : (
                    <p className="text-4xl font-bold text-green-400">S/ {producto.precio.toFixed(2)}</p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Phone size={20} />
                  Consultar por WhatsApp
                </button>

                {producto.precio && (
                  <button
                    onClick={() => setModalYape(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    💳 Pagar con Yape
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalYape && (
        <ModalYape
          producto={producto}
          precio={precioMostrar}
          onClose={() => setModalYape(false)}
        />
      )}
    </>
  );
}