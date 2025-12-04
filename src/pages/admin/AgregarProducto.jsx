import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Upload, Save, Package } from 'lucide-react';

const marcasPorCategoria = {
  'Niños': ['Punto original', 'Vady', 'Air running', 'Adidas', 'Ivano', 'Nacionales', 'V dariens'],
  'Hombre': ['Adidas', 'Nike', 'Puma', 'Brixton', 'Walon', 'Punto original', 'I cax', 'Ivano', 'Anda', 'Réplicas A1', 'New atletic'],
  'Mujer': ['Punto original', 'Punto v dariens', 'Ultralong', 'Estilo coreano']
};

const subcategoriasDeportivas = [
  'Pelotas Fútbol',
  'Pelotas Vóley',
  'Pelotas Basket',
  'Productos para entrenamiento',
  'Medallas',
  'Trofeos',
  'Medias deportivas'
];

const tallasDisponibles = Array.from({ length: 22 }, (_, i) => (i + 22).toString());

export default function AgregarProducto() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Hombre',
    subcategoria: '',
    marca: '',
    tallas: [],
    imagen: null
  });

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imagen: file });
    }
  };

  const handleTallasChange = (talla) => {
    const tallas = [...formData.tallas];
    const index = tallas.indexOf(talla);
    
    if (index > -1) {
      tallas.splice(index, 1);
    } else {
      tallas.push(talla);
    }
    
    setFormData({ ...formData, tallas: tallas.sort((a, b) => Number(a) - Number(b)) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      let imagenUrl = null;

      // Subir imagen si existe
      if (formData.imagen) {
        const fileExt = formData.imagen.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('productos')
          .upload(filePath, formData.imagen);

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data } = supabase.storage
          .from('productos')
          .getPublicUrl(filePath);

        imagenUrl = data.publicUrl;
      }

      // Insertar producto
      const { error } = await supabase
        .from('productos')
        .insert([
          {
            nombre: formData.nombre,
            categoria: formData.categoria,
            subcategoria: formData.subcategoria || null,
            marca: formData.marca || null,
            tallas: (formData.categoria !== 'Artículos Deportivos' && formData.categoria !== 'Ofertas') ? formData.tallas : null,
            imagen_url: imagenUrl
          }
        ]);

      if (error) throw error;

      setMensaje({ tipo: 'success', texto: '✅ Producto agregado correctamente' });
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        categoria: 'Hombre',
        subcategoria: '',
        marca: '',
        tallas: [],
        imagen: null
      });

      // Resetear input de archivo
      document.getElementById('imagen-input').value = '';

      // Redirigir después de 2 segundos
      setTimeout(() => navigate('/admin/productos'), 2000);

    } catch (error) {
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const mostrarMarca = formData.categoria !== 'Artículos Deportivos' && formData.categoria !== 'Ofertas';
  const mostrarTallas = formData.categoria !== 'Artículos Deportivos' && formData.categoria !== 'Ofertas';

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-black via-red-900 to-black border-b border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Package className="text-red-600" size={28} />
              <h1 className="text-2xl font-bold">
                <span className="text-red-600">MAX</span>
                <span className="text-white"> SPORT</span>
              </h1>
            </div>
            <Link
              to="/admin/dashboard"
              className="text-gray-300 hover:text-white flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Formulario */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Agregar Producto</h2>
          <p className="text-gray-400">Completa los datos del nuevo producto</p>
        </div>

        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-lg ${
            mensaje.tipo === 'success' ? 'bg-green-900/50 border border-green-600 text-green-200' : 'bg-red-900/50 border border-red-600 text-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-8 border border-red-600">
          {/* Nombre */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-semibold">Nombre del Producto *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Ej: Nike Air Max 2024"
            />
          </div>

          {/* Categoría */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-semibold">Categoría *</label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value, marca: '', subcategoria: '', tallas: [] })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Niños">Niños</option>
              <option value="Artículos Deportivos">Artículos Deportivos</option>
              <option value="Ofertas">🎁 Ofertas</option>
            </select>
          </div>

          {/* Subcategoría (solo para artículos deportivos) */}
          {formData.categoria === 'Artículos Deportivos' && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-semibold">Subcategoría *</label>
              <select
                value={formData.subcategoria}
                onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="">Seleccionar...</option>
                {subcategoriasDeportivas.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* Marca (solo para zapatillas) */}
          {mostrarMarca && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-semibold">Marca *</label>
              <select
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="">Seleccionar marca...</option>
                {marcasPorCategoria[formData.categoria]?.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tallas (solo para zapatillas) */}
          {mostrarTallas && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-semibold">Tallas Disponibles *</label>
              <div className="grid grid-cols-6 md:grid-cols-11 gap-2">
                {tallasDisponibles.map(talla => (
                  <button
                    key={talla}
                    type="button"
                    onClick={() => handleTallasChange(talla)}
                    className={`px-3 py-2 rounded-lg font-semibold transition ${
                      formData.tallas.includes(talla)
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {talla}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">Seleccionadas: {formData.tallas.join(', ') || 'Ninguna'}</p>
            </div>
          )}

          {/* Imagen */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-semibold">Imagen del Producto *</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-red-600 transition">
                  <Upload className="mx-auto mb-2 text-gray-500" size={32} />
                  <p className="text-gray-400">
                    {formData.imagen ? formData.imagen.name : 'Click para subir imagen'}
                  </p>
                </div>
                <input
                  id="imagen-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  required
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
            <Link
              to="/admin/productos"
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}