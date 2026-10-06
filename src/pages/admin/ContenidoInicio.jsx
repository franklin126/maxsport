import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { comprimirImagen } from '../../utils/comprimirImagen';
import { useCategorias } from '../../hooks/useCategorias';
import { GRUPO_INICIO_A, GRUPO_INICIO_B } from '../../utils/constantes';
import { ArrowLeft, Image as ImageIcon, Upload, Save, RefreshCw } from 'lucide-react';

const SLUGS_PORTADA = [...GRUPO_INICIO_A, ...GRUPO_INICIO_B];

async function subirImagen(file, carpeta) {
  const comprimida = await comprimirImagen(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1920 });
  const fileName = `${Date.now()}_${crypto.randomUUID().slice(0, 6)}.webp`;
  const ruta = `${carpeta}/${fileName}`;
  const { error } = await supabase.storage.from('productos').upload(ruta, comprimida);
  if (error) throw error;
  const { data } = supabase.storage.from('productos').getPublicUrl(ruta);
  return data.publicUrl;
}

function TarjetaPortada({ slug, nombre, imagenActual, onGuardado }) {
  const [subiendo, setSubiendo] = useState(false);
  const [preview, setPreview] = useState(imagenActual);

  const handleArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const url = await subirImagen(file, 'inicio');
      const { error } = await supabase.from('tarjetas_inicio').upsert({ categoria_slug: slug, imagen_url: url });
      if (error) throw error;
      setPreview(url);
      onGuardado();
    } catch (err) {
      console.error(err);
      alert('Error al subir la imagen');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
      <p className="text-white font-bold mb-3">{nombre}</p>
      <div className="aspect-[4/5] bg-gray-800 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
        {subiendo ? (
          <RefreshCw className="animate-spin text-blue-400" size={28} />
        ) : preview ? (
          <img src={preview} alt={nombre} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="text-gray-600" size={32} />
        )}
      </div>
      <label className="cursor-pointer block">
        <div className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-center py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2">
          <Upload size={14} /> {preview ? 'Cambiar foto' : 'Subir foto'}
        </div>
        <input type="file" accept="image/*" onChange={handleArchivo} className="hidden" />
      </label>
    </div>
  );
}

function FilaZapatilla({ zapatilla, onGuardado }) {
  const [nombre, setNombre] = useState(zapatilla.nombre || '');
  const [preview, setPreview] = useState(zapatilla.imagen_url);
  const [imagenNueva, setImagenNueva] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const comprimida = await comprimirImagen(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1000 });
      setImagenNueva(comprimida);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(comprimida);
    } catch (err) {
      console.error(err);
      alert('Error al procesar la imagen');
    } finally {
      setSubiendo(false);
    }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      let imagen_url = zapatilla.imagen_url;
      if (imagenNueva) {
        imagen_url = await subirImagen(imagenNueva, 'inicio');
      }
      const { error } = await supabase.from('zapatillas_tendencia').update({ nombre: nombre || null, imagen_url }).eq('id', zapatilla.id);
      if (error) throw error;
      setImagenNueva(null);
      onGuardado();
    } catch (err) {
      console.error(err);
      alert('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <label className="relative w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer group mx-auto sm:mx-0">
        {subiendo ? (
          <RefreshCw className="animate-spin text-blue-400" size={20} />
        ) : preview ? (
          <img src={preview} alt={nombre} className="w-full h-full object-contain" />
        ) : (
          <ImageIcon className="text-gray-600" size={24} />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/60 transition">
          <Upload size={16} className="text-white opacity-0 group-hover:opacity-100 transition" />
        </div>
        <input type="file" accept="image/*" onChange={handleArchivo} className="hidden" />
      </label>

      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre de la zapatilla"
        className="w-full sm:flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
      />

      <button
        onClick={guardar}
        disabled={guardando}
        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 flex-shrink-0"
      >
        <Save size={16} />
        {guardando ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
}

export default function ContenidoInicio() {
  const { categorias } = useCategorias();
  const [tarjetas, setTarjetas] = useState({});
  const [zapatillas, setZapatillas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    const [{ data: t }, { data: z }] = await Promise.all([
      supabase.from('tarjetas_inicio').select('*'),
      supabase.from('zapatillas_tendencia').select('*').order('orden')
    ]);
    const mapa = {};
    (t || []).forEach(row => { mapa[row.categoria_slug] = row.imagen_url; });
    setTarjetas(mapa);
    setZapatillas(z || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-gradient-to-r from-black via-red-900 to-black border-b border-red-600">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:space-x-3">
              <ImageIcon className="text-red-600" size={22} />
              <h1 className="text-lg sm:text-2xl font-bold">
                <span className="text-red-600">MAX</span>
                <span className="text-white"> SPORT</span>
              </h1>
            </div>
            <Link to="/admin/dashboard" className="text-gray-300 hover:text-white flex items-center gap-2">
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Volver al Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">Contenido de Inicio</h2>
          <p className="text-gray-400 text-sm sm:text-base">Fotos de portada de cada sección y de las zapatillas en tendencia</p>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Portadas de sección</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-10 sm:mb-12">
              {SLUGS_PORTADA.map(slug => {
                const cat = categorias.find(c => c.slug === slug);
                return (
                  <TarjetaPortada
                    key={slug}
                    slug={slug}
                    nombre={cat?.nombre || slug}
                    imagenActual={tarjetas[slug]}
                    onGuardado={cargar}
                  />
                );
              })}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Zapatillas en tendencia</h3>
            <div className="space-y-3">
              {zapatillas.map(z => (
                <FilaZapatilla key={z.id} zapatilla={z} onGuardado={cargar} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}