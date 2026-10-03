import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { comprimirImagen } from '../../utils/comprimirImagen';
import { TALLAS_CALZADO } from '../../utils/constantes';
import { ArrowLeft, Megaphone, Upload, Save, X, CheckCircle, Trash2 } from 'lucide-react';

const formularioVacio = {
  nombre: '', descripcion: '', precio: '', precio_oferta: '', tallas: []
};

export default function AgregarAnuncio() {
  const [formData, setFormData] = useState(formularioVacio);
  const [imagenFile, setImagenFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [anuncios, setAnuncios] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);

  useEffect(() => { cargarAnuncios(); }, []);

  const cargarAnuncios = async () => {
    setCargandoLista(true);
    const { data, error } = await supabase.from('anuncios').select('*').order('created_at', { ascending: false });
    if (!error) setAnuncios(data || []);
    setCargandoLista(false);
  };

  const handleImagen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('El archivo debe ser una imagen'); return; }

    setComprimiendo(true);
    try {
      const comprimida = await comprimirImagen(file, { maxSizeMB: 0.4, maxWidthOrHeight: 1600 });
      setImagenFile(comprimida);
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

  const quitarImagen = () => {
    setImagenFile(null);
    setPreview(null);
    const input = document.getElementById('anuncio-imagen-input');
    if (input) input.value = '';
  };

  const toggleTalla = (talla) => {
    setFormData(prev => ({
      ...prev,
      tallas: prev.tallas.includes(talla) ? prev.tallas.filter(t => t !== talla) : [...prev.tallas, talla]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      if (!imagenFile) throw new Error('Sube una imagen para el anuncio');
      if (formData.precio_oferta && Number(formData.precio_oferta) >= Number(formData.precio || 0)) {
        throw new Error('El precio de oferta debe ser menor al precio normal');
      }

      const fileName = `${Date.now()}_${crypto.randomUUID().slice(0, 6)}.webp`;
      const { error: uploadError } = await supabase.storage.from('productos').upload(`anuncios/${fileName}`, imagenFile);
      if (uploadError) throw new Error('Error al subir la imagen');

      const { data: urlData } = supabase.storage.from('productos').getPublicUrl(`anuncios/${fileName}`);

      await supabase.from('anuncios').update({ activo: false }).eq('activo', true);

      const { error } = await supabase.from('anuncios').insert([{
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio: formData.precio ? Number(formData.precio) : null,
        precio_oferta: formData.precio_oferta ? Number(formData.precio_oferta) : null,
        imagen_url: urlData.publicUrl,
        tallas: formData.tallas.length > 0 ? formData.tallas : null,
        activo: true
      }]);

      if (error) throw error;

      setMensaje({ tipo: 'success', texto: '✅ Anuncio publicado. Ya es el que se muestra a los visitantes.' });
      setFormData(formularioVacio);
      quitarImagen();
      cargarAnuncios();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `❌ ${err.message}` });
    } finally {
      setGuardando(false);
    }
  };

  const activar = async (id) => {
    await supabase.from('anuncios').update({ activo: false }).eq('activo', true);
    await supabase.from('anuncios').update({ activo: true }).eq('id', id);
    cargarAnuncios();
  };

  const eliminar = async (anuncio) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    if (anuncio.imagen_url) {
      const ruta = anuncio.imagen_url.split('/productos/')[1];
      if (ruta) await supabase.storage.from('productos').remove([ruta]);
    }
    await supabase.from('anuncios').delete().eq('id', anuncio.id);
    cargarAnuncios();
  };

  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-gradient-to-r from-black via-red-900 to-black border-b border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Megaphone className="text-red-600" size={28} />
              <h1 className="text-2xl font-bold">
                <span className="text-red-600">MAX</span>
                <span className="text-white"> SPORT</span>
              </h1>
            </div>
            <Link to="/admin/dashboard" className="text-gray-300 hover:text-white flex items-center gap-2">
              <ArrowLeft size={20} />
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Aviso Emergente</h2>
          <p className="text-gray-400">Esto se muestra a cada visitante cuando entra a la página</p>
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

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-8 border border-red-600 mb-10">

          <div className="mb-6">
            <label className="block text-gray-300 mb-3 font-semibold">Imagen del Anuncio</label>
            {comprimiendo ? (
              <div className="border-2 border-dashed border-blue-600 rounded-lg p-8 text-center h-48 flex items-center justify-center">
                <p className="text-blue-300 text-sm">Comprimiendo...</p>
              </div>
            ) : preview ? (
              <div className="relative w-56">
                <img src={preview} alt="preview" className="w-56 aspect-square object-cover rounded-lg" />
                <button type="button" onClick={quitarImagen}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block w-56">
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-red-600 transition">
                  <Upload className="mx-auto mb-2 text-gray-500" size={32} />
                  <p className="text-gray-400 text-sm">Click para subir</p>
                </div>
                <input id="anuncio-imagen-input" type="file" accept="image/*" onChange={handleImagen} className="hidden" />
              </label>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-semibold">Nombre del Producto</label>
            <input type="text" value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Ej: Nike Air Max 2024" />
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-semibold">
              Descripción <span className="text-gray-500 text-sm">(Opcional)</span>
            </label>
            <textarea value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Detalle breve del producto en oferta" />
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">
                Precio Normal (S/) <span className="text-gray-500 text-sm">(Opcional)</span>
              </label>
              <input type="number" step="0.01" min="0" value={formData.precio}
                onChange={(e) => setFormData(prev => ({ ...prev, precio: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="199.90" />
            </div>
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">
                Precio Oferta (S/) <span className="text-yellow-400 text-sm">(Opcional)</span>
              </label>
              <input type="number" step="0.01" min="0" value={formData.precio_oferta}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_oferta: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-600"
                placeholder="149.90" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-semibold">
              Tallas Disponibles <span className="text-gray-500 text-sm">(Opcional)</span>
            </label>
            <div className="grid grid-cols-6 md:grid-cols-11 gap-2">
              {TALLAS_CALZADO.map(talla => (
                <button key={talla} type="button" onClick={() => toggleTalla(talla)}
                  className={`px-3 py-2 rounded-lg font-semibold transition ${
                    formData.tallas.includes(talla) ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}>
                  {talla}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={guardando}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
            <Save size={20} />
            {guardando ? 'Publicando...' : 'Publicar Anuncio'}
          </button>
        </form>

        <h3 className="text-xl font-bold text-white mb-4">Anuncios anteriores</h3>
        {cargandoLista ? (
          <p className="text-gray-500">Cargando...</p>
        ) : anuncios.length === 0 ? (
          <p className="text-gray-500">Todavía no has creado ningún anuncio</p>
        ) : (
          <div className="space-y-3">
            {anuncios.map(a => (
              <div key={a.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
                {a.imagen_url && (
                  <img src={a.imagen_url} alt={a.nombre} className="w-16 h-16 rounded-lg object-cover bg-white flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">{a.nombre}</p>
                  {a.activo && (
                    <span className="inline-flex items-center gap-1 text-green-400 text-xs font-semibold mt-1">
                      <CheckCircle size={12} /> Activo ahora
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!a.activo && (
                    <button onClick={() => activar(a.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition">
                      Activar
                    </button>
                  )}
                  <button onClick={() => eliminar(a)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}