import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Search, Menu, X, Phone, MessageCircle, ChevronLeft, ChevronRight, ZoomIn, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from './services/supabase';

// Páginas Admin
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import AgregarProducto from './pages/admin/AgregarProducto';
import ListaProductos from './pages/admin/ListaProductos';
import ProtectedRoute from './components/admin/ProtectedRoute';

const marcasPorCategoria = {
  'Niños': ['Punto original', 'Vady', 'Air running', 'Adidas', 'Ivano', 'Nacionales', 'V dariens'],
  'Hombre': ['Adidas', 'Nike', 'Puma', 'Brixton', 'Walon', 'Punto original', 'I cax', 'Ivano', 'Anda', 'Réplicas A1', 'New atletic'],
  'Mujer': ['Punto original', 'Punto v dariens', 'Ultralong', 'Estilo coreano', 'Adidas', 'Puma', 'Reebok', 'Nike']
};

const tallas = Array.from({ length: 22 }, (_, i) => (i + 22).toString());

const subcategoriasDeportivas = [
  'Pelotas Fútbol',
  'Pelotas Vóley',
  'Pelotas Basket',
  'Productos para entrenamiento',
  'Medallas',
  'Trofeos',
  'Medias deportivas'
];

// Modal de Producto con Zoom Mejorado
function ModalProducto({ producto, onClose }) {
  const [imagenActual, setImagenActual] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [modalYape, setModalYape] = useState(false);
  const imageContainerRef = useState(null);

  const imagenes = producto.imagenes || [producto.imagen_url];

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
      setDragStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom) {
      e.preventDefault();
      e.stopPropagation();
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (zoom && zoomLevel > 1) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panPosition.x,
        y: e.touches[0].clientY - panPosition.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && zoom) {
      e.preventDefault();
      e.stopPropagation();
      setPanPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (isDragging) {
      e.stopPropagation();
    }
    setIsDragging(false);
  };

  const handleWhatsApp = () => {
    const mensaje = `Hola, estoy interesado en: ${producto.nombre}`;
    window.open(`https://wa.me/51929505174?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const precioMostrar = producto.precio_oferta || producto.precio;
  const hayOferta = producto.precio_oferta && producto.precio_oferta < producto.precio;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-red-600" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 z-10">
            <X size={24} />
          </button>

          <div className="grid md:grid-cols-2 gap-6 p-6">
            <div className="relative">
              <div 
                className={`aspect-square bg-white rounded-lg overflow-hidden ${zoom ? 'cursor-move' : 'cursor-zoom-in'}`}
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
                <img 
                  src={imagenes[imagenActual]} 
                  alt={producto.nombre}
                  className="w-full h-full object-cover transition-transform duration-300 select-none"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
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
                  <div className="flex flex-wrap gap-2">
                    {producto.tallas.map(talla => (
                      <span key={talla} className="bg-gray-800 text-white px-3 py-1 rounded-lg border border-red-600">
                        {talla}
                      </span>
                    ))}
                  </div>
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

// Modal 2x95 - Confirmación de compra
function Modal2x95({ productosSeleccionados, onClose, productos }) {
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
            {[producto1, producto2].map((producto, idx) => (
              <div key={producto.id} className="bg-gray-800 rounded-lg p-4 border-2 border-yellow-500">
                <img 
                  src={producto.imagenes?.[0] || producto.imagen_url} 
                  alt={producto.nombre}
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
              💳 Pagar con Yape (S/ 95.00)
            </button>
          </div>
        </div>
      </div>

      {modalYape && (
        <ModalYape 
          producto={{
            nombre: `2x95: ${producto1.nombre} + ${producto2.nombre}`,
            ...producto1
          }}
          precio={95}
          onClose={() => setModalYape(false)} 
        />
      )}
    </>
  );
}

// Modal de Yape
function ModalYape({ producto, precio, onClose }) {
  const handleYaPague = () => {
    const mensaje = `Hola, ya completé el pago por Yape de: ${producto.nombre} (S/ ${precio.toFixed(2)}). Adjunto captura de pantalla.`;
    window.open(`https://wa.me/51929505174?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl max-w-md w-full border-2 border-purple-600 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2">
          <X size={20} />
        </button>

        <h3 className="text-2xl font-bold text-white mb-4 text-center">💳 Pago con Yape</h3>

        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-gray-400 text-sm">Producto:</p>
          <p className="text-white font-bold">{producto.nombre}</p>
          <p className="text-green-400 text-2xl font-bold mt-2">S/ {precio.toFixed(2)}</p>
        </div>

        <div className="bg-purple-900 bg-opacity-30 rounded-lg p-3 mb-4 border border-purple-600">
          <p className="text-purple-300 text-sm">Yapear a nombre de:</p>
          <p className="text-white font-bold text-lg">MAX SPORT</p>
          <p className="text-gray-400 text-xs mt-1">Confirma que el nombre coincida antes de pagar</p>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4 flex justify-center">
          <img src="/yape-qr.png" alt="Código QR Yape" className="w-48 h-48 object-contain" />
        </div>

        <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 mb-4 border border-blue-600">
          <h4 className="font-bold text-blue-300 mb-2">📋 Instrucciones:</h4>
          <ol className="text-gray-300 text-sm space-y-2">
            <li>1. Escanea el código QR con tu app Yape</li>
            <li>2. Verifica que el nombre sea "MAX SPORT"</li>
            <li>3. Realiza el pago de S/ {precio.toFixed(2)}</li>
            <li>4. Toma captura de pantalla del comprobante</li>
            <li>5. Presiona "¿Ya pagaste?" y envía la captura</li>
            <li>6. Espera confirmación por WhatsApp</li>
            <li>7. Recoge en tienda o solicita envío a domicilio</li>
          </ol>
        </div>

        <div className="bg-red-900 bg-opacity-30 rounded-lg p-3 mb-4 border border-red-600 flex items-start gap-2">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-1" />
          <div>
            <p className="text-red-300 text-sm font-bold">⚠️ Advertencia de Seguridad</p>
            <p className="text-gray-300 text-xs mt-1">
              No se admiten estafas. Verifica siempre que yapeas al número correcto. 
              El pago se confirma solo tras verificación del comprobante.
            </p>
          </div>
        </div>

        <button
          onClick={handleYaPague}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Phone size={20} />
          ¿Ya pagaste? Enviar captura
        </button>
      </div>
    </div>
  );
}

function TiendaPublica() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriaActual, setCategoriaActual] = useState('2x95');
  const [subcategoriaActual, setSubcategoriaActual] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tallaFiltro, setTallaFiltro] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  // Estados para 2x95
  const [productosSeleccionados2x95, setProductosSeleccionados2x95] = useState([]);
  const [mostrarModal2x95, setMostrarModal2x95] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = () => {
    let productosFilt = [];

    if (categoriaActual === '2x95') {
      productosFilt = productos.filter(p => p.categoria === '2x95');
    } else if (categoriaActual === 'Artículos Deportivos') {
      productosFilt = productos.filter(p => p.categoria === 'Artículos Deportivos' && (!subcategoriaActual || p.subcategoria === subcategoriaActual));
    } else if (categoriaActual === 'Ofertas') {
      productosFilt = productos.filter(p => p.categoria === 'Ofertas');
    } else {
      productosFilt = productos.filter(p => p.categoria === categoriaActual);
    }

    if (searchTerm && categoriaActual !== 'Artículos Deportivos') {
      productosFilt = productosFilt.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (tallaFiltro && categoriaActual !== 'Ofertas' && categoriaActual !== '2x95') {
      productosFilt = productosFilt.filter(p => p.tallas && p.tallas.includes(tallaFiltro));
    }

    if (marcaFiltro && categoriaActual !== 'Ofertas' && categoriaActual !== '2x95') {
      productosFilt = productosFilt.filter(p => p.marca === marcaFiltro);
    }

    return productosFilt;
  };

  const handleCategoriaClick = (categoria) => {
    setCategoriaActual(categoria);
    setSubcategoriaActual(null);
    setTallaFiltro('');
    setMarcaFiltro('');
    setSearchTerm('');
    setMenuOpen(false);
    setProductosSeleccionados2x95([]);
  };

  const handleSeleccionar2x95 = (productoId) => {
    if (productosSeleccionados2x95.includes(productoId)) {
      setProductosSeleccionados2x95(productosSeleccionados2x95.filter(id => id !== productoId));
    } else {
      if (productosSeleccionados2x95.length < 2) {
        const nuevaSeleccion = [...productosSeleccionados2x95, productoId];
        setProductosSeleccionados2x95(nuevaSeleccion);
        
        if (nuevaSeleccion.length === 2) {
          setMostrarModal2x95(true);
        }
      }
    }
  };

  const handleWhatsApp = (producto) => {
    const mensaje = `Hola, estoy interesado en: ${producto.nombre}`;
    window.open(`https://wa.me/51929505174?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleWhatsAppGeneral = () => {
    window.open(`https://wa.me/51929505174`, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-black via-red-900 to-black border-b border-red-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-10 h-8 rounded object-cover"
              />
              <h1 className="text-2xl font-bold">
                <span className="text-red-600">MAX</span>
                <span className="text-white"> SPORT</span>
              </h1>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-black border-t border-red-600">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => handleCategoriaClick('2x95')} className="block w-full text-left hover:text-red-600">🔥 2 x 95</button>
              <button onClick={() => handleCategoriaClick('Niños')} className="block w-full text-left hover:text-red-600">Niños</button>
              <button onClick={() => handleCategoriaClick('Hombre')} className="block w-full text-left hover:text-red-600">Hombre</button>
              <button onClick={() => handleCategoriaClick('Mujer')} className="block w-full text-left hover:text-red-600">Mujer</button>
              <button onClick={() => handleCategoriaClick('Artículos Deportivos')} className="block w-full text-left hover:text-red-600">Artículos Deportivos</button>
              <button onClick={() => handleCategoriaClick('Ofertas')} className="block w-full text-left hover:text-red-600">🎁 Ofertas</button>
            </div>
          </div>
        )}
      </nav>

      {/* Portada */}
      <div className="relative h-[35vh] md:h-[40vh] lg:h-[45vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/max.png')" }}
        ></div>
        <div className="absolute inset-0 bg-black/35"></div>
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-5xl font-black mb-2">
            <span className="text-red-600">MAX</span>
            <span className="text-white"> SPORT</span>
          </h1>

          <p className="text-sm md:text-base text-white mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            Tu mejor opción en zapatillas y artículos deportivos aquí en HUANCAVELICA
          </p>

          <div className="text-sm md:text-base text-yellow-400 font-bold animate-pulse drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">
            ✨ Ofertas especiales cada semana ✨
          </div>
        </div>
      </div>

      {/* Carrusel de marcas */}
      <div className="w-full overflow-hidden bg-white">
        <style>{`
          @keyframes scroll-marcas {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .scroll-infinito {
            animation: scroll-marcas 9s linear infinite;
          }
        `}</style>
        <div className="flex scroll-infinito">
          {[
            { nombre: 'Adidas', logo: '/Adidas.png' },
            { nombre: 'Nike', logo: '/nike.png' },
            { nombre: 'Puma', logo: '/puma.png' },
            { nombre: 'Reebok', logo: '/reebok.png' },
            { nombre: 'New Atletic', logo: '/newatletic.png' },
            { nombre: 'Brixton', logo: '/brixton.png' },
            { nombre: 'Walon', logo: '/walon.png' },
            { nombre: 'Vady', logo: '/vady.png' },
            { nombre: 'Ivano', logo: '/ivano.png' },
            { nombre: 'Ultralong', logo: '/ultralong.png' },
            { nombre: 'Anda', logo: '/anda.png' },
            { nombre: 'Adidas', logo: '/Adidas.png' },
            { nombre: 'Nike', logo: '/nike.png' },
            { nombre: 'Puma', logo: '/puma.png' },
            { nombre: 'Reebok', logo: '/reebok.png' },
            { nombre: 'New Atletic', logo: '/newatletic.png' },
            { nombre: 'Brixton', logo: '/brixton.png' },
            { nombre: 'Walon', logo: '/walon.png' },
            { nombre: 'Vady', logo: '/vady.png' },
            { nombre: 'Ivano', logo: '/ivano.png' },
            { nombre: 'Ultralong', logo: '/ultralong.png' },
            { nombre: 'Anda', logo: '/anda.png' }
          ].map((marca, index) => (
            <div
              key={index}
              className="flex-shrink-0 bg-white flex items-center justify-center"
              style={{ width: '100px', height: '56px' }}
            >
              <img 
                src={marca.logo} 
                alt={marca.nombre}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span class="text-gray-800 font-bold text-xs">${marca.nombre}</span>`;
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Botones de categoría */}
      <div className="bg-gradient-to-r from-red-900 to-green-900 border-y border-red-600 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-2 py-4 scrollbar-hide">
            <button
              onClick={() => handleCategoriaClick('2x95')}
              className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition ${
                categoriaActual === '2x95' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-yellow-600'
              }`}
            >
              🔥 2 x 95
            </button>
            {['Niños', 'Hombre', 'Mujer', 'Artículos Deportivos'].map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoriaClick(cat)}
                className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition ${
                  categoriaActual === cat ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-red-700'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => handleCategoriaClick('Ofertas')}
              className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition ${
                categoriaActual === 'Ofertas' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-yellow-600'
              }`}
            >
              🎁 Ofertas
            </button>
          </div>
        </div>
      </div>

      {/* Sección 2x95 */}
      {categoriaActual === '2x95' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-gradient-to-r from-yellow-900 to-orange-900 rounded-xl p-6 mb-6 border-2 border-yellow-500">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              <span className="text-yellow-400">🔥 OFERTA ESPECIAL 2 x S/ 95 🔥</span>
            </h2>
            <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-4">
              <h3 className="font-bold text-yellow-300 mb-3 text-lg">📋 ¿Cómo funciona?</h3>
              <ol className="text-gray-200 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">1.</span>
                  <span>Selecciona 2 productos de esta sección</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">2.</span>
                  <span>Haz clic en "Seleccionar este" en cada producto que quieras</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">3.</span>
                  <span>Paga solo S/ 95.00 por ambos productos (sin importar el precio individual)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">4.</span>
                  <span>¡Ahorra hasta S/ 100 o más!</span>
                </li>
              </ol>
            </div>
            
            {productosSeleccionados2x95.length > 0 && (
              <div className="bg-green-900 bg-opacity-40 rounded-lg p-4 border border-green-500">
                <p className="text-green-300 font-bold text-center">
                  ✅ {productosSeleccionados2x95.length} de 2 productos seleccionados
                </p>
              </div>
            )}
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border-2 border-yellow-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          
          {loading ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-400">Cargando productos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4">
              {productosFiltrados().map((producto) => {
                const estaSeleccionado = productosSeleccionados2x95.includes(producto.id);
                return (
                  <div 
                    key={producto.id} 
                    className={`bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition border-2 ${
                      estaSeleccionado ? 'border-green-500' : 'border-yellow-500'
                    }`}
                  >
                    <div className="relative cursor-pointer" onClick={() => setProductoSeleccionado(producto)}>
                      {estaSeleccionado && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white font-bold px-3 py-1 rounded-full text-xs z-10 flex items-center gap-1">
                          <CheckCircle size={14} />
                          Seleccionado
                        </div>
                      )}
                      <div className="aspect-square bg-white">
                        <img src={producto.imagenes?.[0] || producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="p-2 md:p-4">
                      <h3 className="font-bold text-sm md:text-base mb-1 md:mb-2 line-clamp-2">{producto.nombre}</h3>
                      {producto.precio && (
                        <p className="text-base md:text-lg font-bold text-gray-400 mb-2">
                          Precio: S/ {producto.precio.toFixed(2)}
                        </p>
                      )}
                      {producto.marca && <p className="text-xs md:text-sm text-gray-400 mb-1">Marca: {producto.marca}</p>}
                      {producto.tallas && <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-4">Tallas: {producto.tallas.join(', ')}</p>}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeleccionar2x95(producto.id);
                        }}
                        disabled={productosSeleccionados2x95.length >= 2 && !estaSeleccionado}
                        className={`w-full font-bold py-2 md:py-3 px-2 md:px-4 rounded-lg transition flex items-center justify-center gap-2 text-xs md:text-base ${
                          estaSeleccionado
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : productosSeleccionados2x95.length >= 2
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                        }`}
                      >
                        {estaSeleccionado ? (
                          <>
                            <CheckCircle size={16} className="md:w-5 md:h-5" />
                            Seleccionado
                          </>
                        ) : (
                          'Seleccionar este'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && productosFiltrados().length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-gray-400">No hay productos disponibles en esta oferta</p>
            </div>
          )}
        </div>
      )}

      {/* Subcategorías Deportivas */}
      {categoriaActual === 'Artículos Deportivos' && !subcategoriaActual && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="text-red-600">Artículos</span> Deportivos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subcategoriasDeportivas.map((sub) => (
              <button
                key={sub}
                onClick={() => setSubcategoriaActual(sub)}
                className="p-4 bg-gradient-to-br from-red-600 to-green-700 rounded-xl hover:from-red-700 hover:to-green-800 transition shadow-lg"
              >
                <p className="font-bold text-sm md:text-base">{sub}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sección de Ofertas */}
      {categoriaActual === 'Ofertas' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h2 className="text-3xl font-bold text-center mb-6">
            <span className="text-yellow-400">🎁 Ofertas Especiales 🎁</span>
          </h2>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar ofertas por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border-2 border-yellow-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          
          {loading ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-400">Cargando ofertas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4">
              {productosFiltrados().map((producto) => (
                <div 
                  key={producto.id} 
                  className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition border-2 border-yellow-500"
                >
                  <div className="relative cursor-pointer" onClick={() => setProductoSeleccionado(producto)}>
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-xs md:text-sm z-10">
                      OFERTA
                    </div>
                    <div className="aspect-square bg-white">
                      <img src={producto.imagenes?.[0] || producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="p-2 md:p-4">
                    <h3 className="font-bold text-sm md:text-base mb-1 md:mb-2 line-clamp-2">{producto.nombre}</h3>
                    {producto.precio && (
                      <div className="mb-2">
                        {producto.precio_oferta && producto.precio_oferta < producto.precio ? (
                          <>
                            <p className="text-xs text-gray-500 line-through">S/ {producto.precio.toFixed(2)}</p>
                            <p className="text-lg md:text-xl font-bold text-yellow-400">S/ {producto.precio_oferta.toFixed(2)}</p>
                          </>
                        ) : (
                          <p className="text-lg md:text-xl font-bold text-green-400">S/ {producto.precio.toFixed(2)}</p>
                        )}
                      </div>
                    )}
                    {producto.marca && <p className="text-xs md:text-sm text-gray-400 mb-1">Marca: {producto.marca}</p>}
                    {producto.tallas && <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-4">Tallas: {producto.tallas.join(', ')}</p>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(producto);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 md:py-3 px-2 md:px-4 rounded-lg transition flex items-center justify-center gap-2 text-xs md:text-base"
                    >
                      <Phone size={16} className="md:w-5 md:h-5" />
                      <span className="hidden md:inline">Contactar</span>
                      <span className="md:hidden">WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && productosFiltrados().length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-gray-400">No hay ofertas disponibles</p>
            </div>
          )}
        </div>
      )}

      {/* Filtros y Productos para otras categorías */}
      {categoriaActual !== 'Ofertas' && categoriaActual !== '2x95' && (categoriaActual !== 'Artículos Deportivos' || subcategoriaActual) && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="space-y-3 mb-6">
            {categoriaActual !== 'Artículos Deportivos' && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar zapatillas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border-2 border-red-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={tallaFiltro}
                    onChange={(e) => setTallaFiltro(e.target.value)}
                    className="px-4 py-3 bg-gray-900 border-2 border-red-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Todas las tallas</option>
                    {tallas.map(talla => (
                      <option key={talla} value={talla}>Talla {talla}</option>
                    ))}
                  </select>
                  <select
                    value={marcaFiltro}
                    onChange={(e) => setMarcaFiltro(e.target.value)}
                    className="px-4 py-3 bg-gray-900 border-2 border-red-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Todas las marcas</option>
                    {categoriaActual && marcasPorCategoria[categoriaActual]?.map(marca => (
                      <option key={marca} value={marca}>{marca}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-400">Cargando productos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4">
              {productosFiltrados().map((producto) => (
                <div 
                  key={producto.id} 
                  className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition border-2 border-red-600"
                >
                  <div className="cursor-pointer" onClick={() => setProductoSeleccionado(producto)}>
                    <div className="aspect-square bg-white">
                      <img src={producto.imagenes?.[0] || producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="p-2 md:p-4">
                    <h3 className="font-bold text-sm md:text-base mb-1 md:mb-2 line-clamp-2">{producto.nombre}</h3>
                    {producto.precio && (
                      <div className="mb-1 md:mb-2">
                        {producto.precio_oferta && producto.precio_oferta < producto.precio ? (
                          <>
                            <p className="text-xs text-gray-500 line-through">S/ {producto.precio.toFixed(2)}</p>
                            <p className="text-base md:text-lg font-bold text-yellow-400">S/ {producto.precio_oferta.toFixed(2)}</p>
                          </>
                        ) : (
                          <p className="text-base md:text-lg font-bold text-green-400">S/ {producto.precio.toFixed(2)}</p>
                        )}
                      </div>
                    )}
                    {producto.marca && <p className="text-xs md:text-sm text-gray-400 mb-1">Marca: {producto.marca}</p>}
                    {producto.tallas && <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-4">Tallas: {producto.tallas.join(', ')}</p>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(producto);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 md:py-3 px-2 md:px-4 rounded-lg transition flex items-center justify-center gap-2 text-xs md:text-base"
                    >
                      <Phone size={16} className="md:w-5 md:h-5" />
                      <span className="hidden md:inline">Contactar</span>
                      <span className="md:hidden">WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && productosFiltrados().length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-gray-400">No se encontraron productos</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Producto individual */}
      {productoSeleccionado && (
        <ModalProducto 
          producto={productoSeleccionado} 
          onClose={() => setProductoSeleccionado(null)} 
        />
      )}

      {/* Modal 2x95 */}
      {mostrarModal2x95 && (
        <Modal2x95
          productosSeleccionados={productosSeleccionados2x95}
          productos={productos}
          onClose={() => {
            setMostrarModal2x95(false);
            setProductosSeleccionados2x95([]);
          }}
        />
      )}

      <button
        onClick={handleWhatsAppGeneral}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl z-50 transition transform hover:scale-110 animate-pulse"
      >
        <MessageCircle size={32} />
      </button>

      <footer className="bg-gradient-to-r from-black via-red-900 to-green-900 border-t border-red-600 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-400">&copy; 2026 MAX SPORT. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TiendaPublica />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/agregar" element={<ProtectedRoute><AgregarProducto /></ProtectedRoute>} />
        <Route path="/admin/productos" element={<ProtectedRoute><ListaProductos /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
