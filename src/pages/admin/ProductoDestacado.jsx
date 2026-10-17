import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { comprimirImagen } from '../../utils/comprimirImagen';
import { TALLAS_CALZADO } from '../../utils/constantes';
import { ArrowLeft, Star, Upload, Save, RefreshCw } from 'lucide-react';

export default function ProductoDestacado() {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [tallas, setTallas] = useState([]);
  const [urlActual, setUrlActual] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imagenNueva, setImagenNueva] = useState(null);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const inputRef = useRef(null);

  useEffect(() => {
    supabase
      .from('producto_destacado')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          setMensaje({ tipo: 'error', texto: '❌ No se pudo cargar el producto actual' });
        }
        if (data) {
          setNombre(data.nombre || '');
          setPrecio(data.precio ?? '');
          setTallas(data.tallas || []);
          setUrlActual(data.imagen_url);
          setPreview(data.imagen_url);
        }
        setCargando(false);
      });
  }, []);

  const handleImagen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('El archivo debe ser una imagen'); return; }

    setComprimiendo(true);
    try {
      const comprimida = await comprimirImagen(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1600 });
      setImagenNueva(comprimida);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(comprimida);
    } catch (err) {
      console.error(err);
      alert('Error al procesar la imagen');
    } finally {
      setComprimiendo(false);
    }
  };

  const toggleTalla = (talla) => {
    setTallas(prev => prev.includes(talla) ? prev.filter(t => t !== talla) : [...prev, talla]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      if (!imagenNueva && !urlActual) throw new Error('Sube una foto del producto');

      let imagen_url = urlActual;
      if (imagenNueva) {
        const fileName = `${Date.now()}_${crypto.randomUUID().slice(0, 6)}.webp`;
        const { error: uploadError } = await supabase.storage.from('productos').upload(`destacado/${fileName}`, imagenNueva);
        if (uploadError) throw new Error('Error al subir la imagen');
        imagen_url = supabase.storage.from('productos').getPublicUrl(`destacado/${fileName}`).data.publicUrl;
      }

      const { error } = await supabase.from('producto_destacado').upsert({
        id: 1,
        nombre: nombre.trim(),
        precio: precio !== '' ? Number(precio) : null,
        tallas: [...tallas].sort((a, b) => Number(a) - Number(b)),
        imagen_url,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;

      if (imagenNueva && urlActual) {
        const rutaVieja = urlActual.split('/productos/')[1];
        if (rutaVieja) await supabase.storage.from('productos').remove([rutaVieja]);
      }

      setUrlActual(imagen_url);
      setPreview(imagen_url);
      setImagenNueva(null);
      if (inputRef.current) inputRef.current.value = '';
      setMensaje({ tipo: 'success', texto: '✅ Producto guardado. Ya se muestra al tocar "Ver producto" en el inicio.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `❌ ${err.message}` });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-gradient-to-r from-black via-red-900 to-black border-b border-red-600">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:space-x-3">
              <Star className="text-red-600" size={22} />
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

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">Producto Destacado</h2>
          <p className="text-gray-400 text-sm sm:text-base">Es el que se abre cuando tocan "Ver producto" en el video del inicio</p>
        </div>

        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-lg ${
            mensaje.tipo === 'success'
              ? 'bg-green-900/50 border border-green-600 text-green-200'
              : 'bg-red-900/50 border border-red-600 text-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {cargando ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-5 sm:p-8 border border-red-600">

            <div className="mb-6">
              <label className="block text-gray-300 mb-3 font-semibold">Foto del producto</label>
              <label className="relative block w-full max-w-xs aspect-square bg-white rounded-lg overflow-hidden cursor-pointer border-2 border-dashed border-gray-700 hover:border-red-600 transition">
                {comprimiendo ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <RefreshCw className="animate-spin text-blue-400" size={28} />
                  </div>
                ) : preview ? (
                  <>
                    <img src={preview} alt="Producto" className="w-full h-full object-contain" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-sm py-2 flex items-center justify-center gap-2">
                      <Upload size={14} /> Cambiar foto
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-gray-400">
                    <Upload size={32} className="mb-2" />
                    <p className="text-sm">Toca para subir la foto</p>
                  </div>
                )}
                <input ref={inputRef} type="file" accept="image/*" onChange={handleImagen} className="hidden" />
              </label>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-semibold">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Ej: Nike Air Force White"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-semibold">Precio (S/)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="199.90"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-semibold">Tallas disponibles</label>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-11 gap-2">
                {TALLAS_CALZADO.map(talla => (
                  <button
                    key={talla}
                    type="button"
                    onClick={() => toggleTalla(talla)}
                    className={`py-2 rounded-lg font-semibold transition ${
                      tallas.includes(talla) ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {talla}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando || comprimiendo}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={20} />
              {guardando ? 'Guardando...' : 'Guardar producto'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}