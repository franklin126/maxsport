import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Phone, ChevronLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useCategorias } from '../../hooks/useCategorias';
import { useTarjetasInicio } from '../../hooks/useTarjetasInicio';
import { DOMINIO, SUBCATEGORIAS_DEPORTIVAS } from '../../utils/constantes';
import ModalProducto from './ModalProducto';
import Modal2x95 from './Modal2x95';
import Navbar from './Navbar';
import Footer from './Footer';
import BotonWhatsAppFlotante from './BotonWhatsAppFlotante';

const PAGE_SIZE = 20;
const tallas = Array.from({ length: 22 }, (_, i) => (i + 22).toString());

export default function TiendaPublica() {
  const location = useLocation();
  const navigate = useNavigate();
  const matchProducto = location.pathname.match(/^\/producto\/(.+)$/);
  const idProductoUrl = matchProducto ? matchProducto[1] : null;

  const { categorias, porSlug } = useCategorias();
  const tarjetas = useTarjetasInicio();

  const [categoriaActual, setCategoriaActual] = useState(() => location.state?.categoria || '2x95');
  const [subcategoriaActual, setSubcategoriaActual] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tallaFiltro, setTallaFiltro] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [productos, setProductos] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [hayMas, setHayMas] = useState(true);
  const [loading, setLoading] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productosSeleccionados2x95, setProductosSeleccionados2x95] = useState([]);
  const [mostrarModal2x95, setMostrarModal2x95] = useState(false);
  const cacheRef = useRef({});

  const catActual = porSlug(categoriaActual);

  useEffect(() => {
    const t = setTimeout(() => {
      const limpio = searchInput.trim();
      if (limpio.length === 0 || limpio.length >= 2) {
        setSearchTerm(limpio);
      }
    }, 550);
    return () => clearTimeout(t);
  }, [searchInput]);

  const claveCache = () => `${categoriaActual}|${subcategoriaActual || ''}|${searchTerm}|${tallaFiltro}|${marcaFiltro}`;

  const construirQuery = (paginaActual) => {
    const cat = porSlug(categoriaActual);
    let query = supabase.from('productos').select('*').eq('categoria', categoriaActual).order('created_at', { ascending: false });

    if (cat?.tiene_subcategoria && subcategoriaActual) {
      query = query.eq('subcategoria', subcategoriaActual);
    }
    if (searchTerm) {
      query = query.ilike('nombre', `%${searchTerm}%`);
    }
    if (tallaFiltro) {
      query = query.contains('tallas', [tallaFiltro]);
    }
    if (marcaFiltro) {
      query = query.eq('marca', marcaFiltro);
    }

    const desde = paginaActual * PAGE_SIZE;
    return query.range(desde, desde + PAGE_SIZE - 1);
  };

  const cargarProductos = async (paginaActual, reemplazar) => {
    try {
      const { data, error } = await construirQuery(paginaActual);
      if (error) throw error;
      const lista = data || [];
      setProductos(prev => reemplazar ? lista : [...prev, ...lista]);
      const masDisponible = lista.length === PAGE_SIZE;
      setHayMas(masDisponible);
      if (reemplazar) {
        cacheRef.current[claveCache()] = { productos: lista, hayMas: masDisponible };
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  useEffect(() => {
    const cat = porSlug(categoriaActual);

    if (cat?.tiene_subcategoria && !subcategoriaActual) {
      setProductos([]);
      setHayMas(false);
      setLoading(false);
      return;
    }

    const cacheado = cacheRef.current[claveCache()];
    if (cacheado) {
      setProductos(cacheado.productos);
      setHayMas(cacheado.hayMas);
      setPagina(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setPagina(0);
    cargarProductos(0, true).finally(() => setLoading(false));
  }, [categoriaActual, subcategoriaActual, searchTerm, tallaFiltro, marcaFiltro, categorias]);

  useEffect(() => {
    if (!idProductoUrl) return;
    const yaLoTengo = productos.find(p => p.id === idProductoUrl);
    if (yaLoTengo) {
      setProductoSeleccionado(yaLoTengo);
      return;
    }
    if (productoSeleccionado && productoSeleccionado.id === idProductoUrl) return;
    const cargarProductoDirecto = async () => {
      const { data, error } = await supabase.from('productos').select('*').eq('id', idProductoUrl).maybeSingle();
      if (!error && data) setProductoSeleccionado(data);
    };
    cargarProductoDirecto();
  }, [idProductoUrl]);

  const verMas = async () => {
    setCargandoMas(true);
    const siguiente = pagina + 1;
    await cargarProductos(siguiente, false);
    setPagina(siguiente);
    setCargandoMas(false);
  };

  const abrirProducto = (producto) => {
    setProductoSeleccionado(producto);
    navigate(`/producto/${producto.id}`);
  };

  const cerrarProducto = () => {
    setProductoSeleccionado(null);
    navigate('/');
  };

  const handleCategoriaClick = (categoria) => {
    setCategoriaActual(categoria);
    setSubcategoriaActual(null);
    setTallaFiltro('');
    setMarcaFiltro('');
    setSearchInput('');
    setSearchTerm('');
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

  const fondoPortada = tarjetas[categoriaActual] || '/max.png';

  const BotonVerMas = () => {
    if (!hayMas || productos.length === 0) return null;
    return (
      <div className="text-center mt-8">
        <button
          onClick={verMas}
          disabled={cargandoMas}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg transition"
        >
          {cargandoMas ? 'Cargando...' : 'Ver más productos'}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {!productoSeleccionado && (
        <Helmet>
          <title>MAX SPORT - Zapatillas y Artículos Deportivos en Huancavelica</title>
          <meta name="description" content="Tienda de zapatillas y artículos deportivos en Huancavelica, Perú. Ofertas 2x95, marcas originales, pago con Yape." />
          <link rel="canonical" href={DOMINIO} />
        </Helmet>
      )}

      <Navbar categorias={categorias} onCategoriaClick={handleCategoriaClick} />

      <div className="relative h-[35vh] md:h-[40vh] lg:h-[45vh]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${fondoPortada}')` }}></div>
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
            <div key={index} className="flex-shrink-0 bg-white flex items-center justify-center" style={{ width: '100px', height: '56px' }}>
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

      <div className="bg-gradient-to-r from-red-900 to-green-900 border-y border-red-600 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-2 py-4 scrollbar-hide">
            {categorias.map(cat => {
              const activa = categoriaActual === cat.slug;

              if (cat.slug === '2x95') {
                return (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoriaClick(cat.slug)}
                    className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition ${
                      activa ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-yellow-600'
                    }`}
                  >
                    🔥 {cat.nombre}
                  </button>
                );
              }

              if (cat.slug === 'Ofertas') {
                return (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoriaClick(cat.slug)}
                    className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition ${
                      activa ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-yellow-600'
                    }`}
                  >
                    🎁 {cat.nombre}
                  </button>
                );
              }

              return (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoriaClick(cat.slug)}
                  className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition ${
                    activa ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-red-700'
                  }`}
                >
                  {cat.nombre}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {categoriaActual === '2x95' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-gradient-to-r from-yellow-900 to-orange-900 rounded-md p-2 mb-3 border border-yellow-500">
            <h2 className="text-lg md:text-2xl font-bold text-center mb-2 leading-tight">
              <span className="text-yellow-400">🔥 OFERTA ESPECIAL 2 x S/ 95 🔥</span>
            </h2>
            <div className="bg-black/40 rounded-sm p-2 mb-2">
              <h3 className="font-bold text-yellow-300 mb-1 text-sm">📋 ¿Cómo funciona?</h3>
              <ol className="text-gray-200 space-y-0 text-xs md:text-sm leading-snug">
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border-2 border-yellow-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-16"><p className="text-xl text-gray-400">Cargando productos...</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4">
              {productos.map((producto) => {
                const estaSeleccionado = productosSeleccionados2x95.includes(producto.id);
                return (
                  <div key={producto.id} className={`bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition border-2 ${estaSeleccionado ? 'border-green-500' : 'border-yellow-500'}`}>
                    <div className="relative cursor-pointer" onClick={() => abrirProducto(producto)}>
                      {estaSeleccionado && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white font-bold px-3 py-1 rounded-full text-xs z-10 flex items-center gap-1">
                          <CheckCircle size={14} />
                          Seleccionado
                        </div>
                      )}
                      <div className="aspect-square bg-white">
                        <img src={producto.imagenes?.[0] || producto.imagen_url} alt={producto.nombre} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="p-2 md:p-4">
                      <h3 className="font-bold text-sm md:text-base mb-1 md:mb-2 line-clamp-2">{producto.nombre}</h3>
                      {producto.precio && (
                        <p className="text-base md:text-lg font-bold text-gray-400 mb-2">Precio: S/ {producto.precio.toFixed(2)}</p>
                      )}
                      {producto.marca && <p className="text-xs md:text-sm text-gray-400 mb-1">Marca: {producto.marca}</p>}
                      {producto.tallas && <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-4">Tallas: {producto.tallas.join(', ')}</p>}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSeleccionar2x95(producto.id); }}
                        disabled={productosSeleccionados2x95.length >= 2 && !estaSeleccionado}
                        className={`w-full font-bold py-2 md:py-3 px-2 md:px-4 rounded-lg transition flex items-center justify-center gap-2 text-xs md:text-base ${
                          estaSeleccionado
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : productosSeleccionados2x95.length >= 2
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                        }`}
                      >
                        {estaSeleccionado ? <><CheckCircle size={16} />Seleccionado</> : 'Seleccionar este'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && productos.length === 0 && (
            <div className="text-center py-16"><p className="text-xl text-gray-400">No hay productos disponibles en esta oferta</p></div>
          )}
          <BotonVerMas />
        </div>
      )}

      {catActual?.tiene_subcategoria && !subcategoriaActual && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="text-red-600">Artículos</span> Deportivos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SUBCATEGORIAS_DEPORTIVAS.map((sub) => (
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border-2 border-yellow-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          {loading ? (
            <div className="text-center py-16"><p className="text-xl text-gray-400">Cargando ofertas...</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4">
              {productos.map((producto) => (
                <div key={producto.id} className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition border-2 border-yellow-500">
                  <div className="relative cursor-pointer" onClick={() => abrirProducto(producto)}>
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-xs md:text-sm z-10">OFERTA</div>
                    <div className="aspect-square bg-white">
                      <img src={producto.imagenes?.[0] || producto.imagen_url} alt={producto.nombre} loading="lazy" className="w-full h-full object-cover" />
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
                      onClick={(e) => { e.stopPropagation(); handleWhatsApp(producto); }}
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
          {!loading && productos.length === 0 && (
            <div className="text-center py-16"><p className="text-xl text-gray-400">No hay ofertas disponibles</p></div>
          )}
          <BotonVerMas />
        </div>
      )}

      {catActual && catActual.slug !== '2x95' && catActual.slug !== 'Ofertas' && (!catActual.tiene_subcategoria || subcategoriaActual) && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="space-y-3 mb-6">
            {!catActual.tiene_subcategoria && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border-2 border-red-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                {(catActual.filtra_por_talla || catActual.tiene_marca) && (
                  <div className={`grid grid-cols-1 gap-3 ${catActual.filtra_por_talla && catActual.tiene_marca ? 'md:grid-cols-2' : ''}`}>
                    {catActual.filtra_por_talla && (
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
                    )}
                    {catActual.tiene_marca && (
                      <select
                        value={marcaFiltro}
                        onChange={(e) => setMarcaFiltro(e.target.value)}
                        className="px-4 py-3 bg-gray-900 border-2 border-red-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Todas las marcas</option>
                        {catActual.marcas.map(marca => (
                          <option key={marca} value={marca}>{marca}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {subcategoriaActual && (
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => setSubcategoriaActual(null)}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
              >
                <ChevronLeft size={18} /> Volver a subcategorías
              </button>
              <span className="text-white font-bold">{subcategoriaActual}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16"><p className="text-xl text-gray-400">Cargando productos...</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4">
              {productos.map((producto) => (
                <div key={producto.id} className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition border-2 border-red-600">
                  <div className="cursor-pointer" onClick={() => abrirProducto(producto)}>
                    <div className="aspect-square bg-white">
                      <img src={producto.imagenes?.[0] || producto.imagen_url} alt={producto.nombre} loading="lazy" className="w-full h-full object-cover" />
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
                    {producto.stock !== null && producto.stock === 0 && (
                      <p className="text-red-400 text-xs mb-1 font-bold">Agotado</p>
                    )}
                    {producto.tallas_stock && Object.keys(producto.tallas_stock).length > 0 ? (
                      <div className="mb-1">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(producto.tallas_stock)
                            .sort((a, b) => Number(a[0]) - Number(b[0]))
                            .map(([talla, unidades]) => (
                              <span key={talla} className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                                unidades === 0 ? 'bg-gray-700 text-gray-500 line-through' :
                                unidades <= 2 ? 'bg-yellow-900 text-yellow-300' :
                                'bg-gray-800 text-green-400'
                              }`}>
                                T{talla}: {unidades}
                              </span>
                            ))}
                        </div>
                      </div>
                    ) : (
                      producto.stock !== null && producto.stock > 0 && (
                        <p className="text-green-400 text-xs mb-1 font-bold">{producto.stock} disponibles</p>
                      )
                    )}
                    {producto.marca && <p className="text-xs md:text-sm text-gray-400 mb-1">Marca: {producto.marca}</p>}
                    {producto.tallas && <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-4">Tallas: {producto.tallas.join(', ')}</p>}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleWhatsApp(producto); }}
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
          {!loading && productos.length === 0 && (
            <div className="text-center py-16"><p className="text-xl text-gray-400">No se encontraron productos</p></div>
          )}
          <BotonVerMas />
        </div>
      )}

      {productoSeleccionado && (
        <ModalProducto producto={productoSeleccionado} onClose={cerrarProducto} />
      )}

      {mostrarModal2x95 && (
        <Modal2x95
          productosSeleccionados={productosSeleccionados2x95}
          productos={productos}
          onClose={() => { setMostrarModal2x95(false); setProductosSeleccionados2x95([]); }}
        />
      )}

      <BotonWhatsAppFlotante />

      <Footer />
    </div>
  );
}