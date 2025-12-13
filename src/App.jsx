import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, Phone, MessageCircle } from 'lucide-react';
import { supabase } from './services/supabase';

// Páginas Admin
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import AgregarProducto from './pages/admin/AgregarProducto';
import ListaProductos from './pages/admin/ListaProductos';
import ProtectedRoute from './components/admin/ProtectedRoute';

// Componente de copo de nieve
const Snowflake = ({ delay, duration, left }) => (
  <div
    className="absolute text-white opacity-70 pointer-events-none"
    style={{
      left: `${left}%`,
      animation: `fall ${duration}s linear infinite`,
      animationDelay: `${delay}s`,
      fontSize: `${Math.random() * 10 + 10}px`
    }}
  >
    ❄
  </div>
);

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

function TiendaPublica() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriaActual, setCategoriaActual] = useState('Hombre');
  const [subcategoriaActual, setSubcategoriaActual] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tallaFiltro, setTallaFiltro] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

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

    if (categoriaActual === 'Artículos Deportivos') {
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

    if (tallaFiltro && categoriaActual !== 'Ofertas') {
      productosFilt = productosFilt.filter(p => p.tallas && p.tallas.includes(tallaFiltro));
    }

    if (marcaFiltro && categoriaActual !== 'Ofertas') {
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
  };

  const handleWhatsApp = (producto) => {
    const mensaje = `Hola, estoy interesado en: ${producto.nombre}`;
    window.open(`https://wa.me/51929505174?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleWhatsAppGeneral = () => {
    window.open(`https://wa.me/51929505174`, '_blank');
  };

  const snowflakes = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 10,
    duration: Math.random() * 5 + 10,
    left: Math.random() * 100
  }));

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <style>{`
        @keyframes fall {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>

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
              <button onClick={() => handleCategoriaClick('Niños')} className="block w-full text-left hover:text-red-600">Niños</button>
              <button onClick={() => handleCategoriaClick('Hombre')} className="block w-full text-left hover:text-red-600">Hombre</button>
              <button onClick={() => handleCategoriaClick('Mujer')} className="block w-full text-left hover:text-red-600">Mujer</button>
              <button onClick={() => handleCategoriaClick('Artículos Deportivos')} className="block w-full text-left hover:text-red-600">Artículos Deportivos</button>
              <button onClick={() => handleCategoriaClick('Ofertas')} className="block w-full text-left hover:text-red-600">🎁 Ofertas</button>
            </div>
          </div>
        )}
      </nav>

      {/* portada */}
      <div className="relative h-[35vh] md:h-[40vh] lg:h-[45vh]">
        
        {/* Imagen de fondo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/max.png')" }}
        ></div>

        {/* Oscurecimiento suave (opcional, puedes ajustar) */}
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Nieve */}
        {snowflakes.map(flake => (
          <Snowflake
            key={flake.id}
            delay={flake.delay}
            duration={flake.duration}
            left={flake.left}
          />
        ))}

        {/* Árboles */}
        <div className="absolute top-4 left-4 text-4xl animate-bounce">🎄</div>
        <div className="absolute top-4 right-4 text-4xl animate-bounce">🎄</div>

        {/* Texto */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">

          <h1 className="text-3xl md:text-5xl font-black mb-2">
            <span className="text-red-600">MAX</span>
            <span className="text-white"> SPORT</span>
          </h1>

          <div className="mb-2 text-base md:text-lg font-bold text-white">
            🎅 te desea una feliz navidad 🎄
          </div>

          <p className="text-sm md:text-base text-gray-200 mb-3">
            Tu mejor opción en zapatillas y artículos deportivos aquí en Huancavelica
          </p>

          <div className="text-sm md:text-base text-yellow-300 font-semibold animate-pulse">
            ✨ Ofertas especiales de fin de año ✨
          </div>

        </div>
      </div>

      {/* Botones de categoria */}
      <div className="bg-gradient-to-r from-red-900 to-green-900 border-y border-red-600 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-2 py-4 scrollbar-hide">
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
                <div key={producto.id} className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition border-2 border-yellow-500">
                  <div className="relative">
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-xs md:text-sm">
                      OFERTA
                    </div>
                    <div className="aspect-square bg-white">
                      <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="p-2 md:p-4">
                    <h3 className="font-bold text-sm md:text-base mb-1 md:mb-2 line-clamp-2">{producto.nombre}</h3>
                    {producto.marca && <p className="text-xs md:text-sm text-gray-400 mb-1">Marca: {producto.marca}</p>}
                    {producto.tallas && <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-4">Tallas: {producto.tallas.join(', ')}</p>}
                    <button
                      onClick={() => handleWhatsApp(producto)}
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
      {categoriaActual !== 'Ofertas' && (categoriaActual !== 'Artículos Deportivos' || subcategoriaActual) && (
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
                <div key={producto.id} className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition border-2 border-red-600">
                  <div className="aspect-square bg-white">
                    <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2 md:p-4">
                    <h3 className="font-bold text-sm md:text-base mb-1 md:mb-2 line-clamp-2">{producto.nombre}</h3>
                    {producto.marca && <p className="text-xs md:text-sm text-gray-400 mb-1">Marca: {producto.marca}</p>}
                    {producto.tallas && <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-4">Tallas: {producto.tallas.join(', ')}</p>}
                    <button
                      onClick={() => handleWhatsApp(producto)}
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

      <button
        onClick={handleWhatsAppGeneral}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl z-50 transition transform hover:scale-110 animate-pulse"
      >
        <MessageCircle size={32} />
      </button>

      <footer className="bg-gradient-to-r from-black via-red-900 to-green-900 border-t border-red-600 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-300 mb-2">🎄 Felices Fiestas 🎅</p>
          <p className="text-gray-400">&copy; 2024 MAX SPORT. Todos los derechos reservados.</p>
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
