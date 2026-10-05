import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../services/supabase';
import { useCategorias } from '../../hooks/useCategorias';
import { useTarjetasInicio } from '../../hooks/useTarjetasInicio';
import { DOMINIO, GRUPO_INICIO_A, GRUPO_INICIO_B } from '../../utils/constantes';
import Navbar from './Navbar';
import Footer from './Footer';
import BotonWhatsAppFlotante from './BotonWhatsAppFlotante';
import CarruselSecciones from './CarruselSecciones';

function armarGrupo(slugs, categorias, tarjetas) {
  return slugs
    .map(slug => {
      const cat = categorias.find(c => c.slug === slug);
      if (!cat) return null;
      return { slug, nombre: cat.nombre, imagen_url: tarjetas[slug] };
    })
    .filter(Boolean);
}

export default function Inicio() {
  const navigate = useNavigate();
  const { categorias } = useCategorias();
  const tarjetas = useTarjetasInicio();
  const [zapatillas, setZapatillas] = useState([]);

  useEffect(() => {
    supabase
      .from('zapatillas_tendencia')
      .select('*')
      .order('orden')
      .then(({ data, error }) => {
        if (!error) setZapatillas(data || []);
      });
  }, []);

  const irACategoria = (slug) => navigate('/tienda', { state: { categoria: slug } });

  const grupoCompleto = armarGrupo([...GRUPO_INICIO_A, ...GRUPO_INICIO_B], categorias, tarjetas);

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>MAX SPORT - Zapatillas y Artículos Deportivos en Huancavelica</title>
        <meta name="description" content="Tienda de zapatillas y artículos deportivos en Huancavelica, Perú. Ofertas 2x95, marcas originales, pago con Yape." />
        <link rel="canonical" href={DOMINIO} />
      </Helmet>

      <Navbar categorias={categorias} onCategoriaClick={irACategoria} />

      <div className="relative">
        <video
          src="/video-hombre.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-[60vh] md:h-[75vh] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-6 md:left-12">
          <p className="text-red-500 font-bold tracking-[0.3em] text-xs md:text-sm mb-2">NUEVO INGRESO</p>
          <h2 className="text-2xl md:text-5xl font-black mb-4 max-w-sm leading-tight">NIKE AIR FORCE WHITE</h2>
          <button
            onClick={() => irACategoria('Hombre')}
            className="border-2 border-white text-white hover:bg-white hover:text-black font-bold px-6 py-3 transition tracking-wider text-sm"
          >
            VER PRODUCTO
          </button>
        </div>
      </div>

      <CarruselSecciones titulo="Descubre más" items={grupoCompleto} onSelect={irACategoria} />

      <div className="relative">
        <video
          src="/video-jordan.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-[60vh] md:h-[75vh] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-6 md:left-12">
          <p className="text-red-500 font-bold tracking-[0.3em] text-xs md:text-sm mb-2">COLECCION</p>
          <h2 className="text-2xl md:text-5xl font-black mb-4">JORDAN</h2>
          <button
            onClick={() => irACategoria('Jordan')}
            className="border-2 border-white text-white hover:bg-white hover:text-black font-bold px-6 py-3 transition tracking-wider text-sm"
          >
            COMPRAR AHORA
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black mb-2">Tendencia</h2>
          <p className="text-gray-400">Descubre todas las opciones que tenemos para ti, camina con estilo</p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
          {zapatillas.map(z => (
            <div key={z.id} className="text-center">
              <div className="aspect-square mb-3 flex items-center justify-center">
                {z.imagen_url ? (
                  <img src={z.imagen_url} alt={z.nombre || ''} loading="lazy" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-gray-900 rounded-lg" />
                )}
              </div>
              {z.nombre && <p className="text-xs md:text-sm font-semibold text-gray-300">{z.nombre}</p>}
            </div>
          ))}
        </div>
      </div>

      <BotonWhatsAppFlotante />

      <Footer variante="inicio" />
    </div>
  );
}