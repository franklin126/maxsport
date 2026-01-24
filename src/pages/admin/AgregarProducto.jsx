import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Upload, Save, Package, X } from 'lucide-react';

const marcasPorCategoria = {
  'Niños': ['Punto original', 'Vady', 'Air running', 'Adidas', 'Ivano', 'Nacionales', 'V dariens'],
  'Hombre': ['Adidas', 'Nike', 'Puma', 'Brixton', 'Walon', 'Punto original', 'I cax', 'Ivano', 'Anda', 'Réplicas A1', 'New atletic', 'N-seven'],
  'Mujer': ['Punto original', 'Punto v dariens', 'Ultralon', 'Estilo coreano', 'Adidas', 'Puma', 'Reebok', 'Nike', 'Vi-mas', 'Yumi', 'Cacy', 'Boni', 'Quelind', 'N-seven']
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

  // States para imágenes temporales
  const [imagenesTemp, setImagenesTemp] = useState({
    temp1: null,
    temp2: null,
    temp3: null
  });

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Hombre',
    subcategoria: '',
    marca: '',
    tallas: [],
    precio: '',
    precio_oferta: '',
    imagen1: null,
    imagen2: null,
    imagen3: null
  });

  const [previews, setPreviews] = useState({
    preview1: null,
    preview2: null,
    preview3: null
  });

  // 🆕 MEJORADO: Función para subir imagen a carpeta TEMP con callbacks seguros
  const handleImagenChange = async (e, numeroImagen) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Generar nombre único con UUID
      const ext = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;

      // Subir a carpeta TEMP
      const { error } = await supabase.storage
        .from('productos')
        .upload(`temp/${fileName}`, file);

      if (error) {
        alert('Error al subir imagen');
        console.error(error);
        return;
      }

      // ✅ MEJORADO: Usar callback para evitar race conditions
      setImagenesTemp(prev => ({
        ...prev,
        [`temp${numeroImagen}`]: `temp/${fileName}`
      }));

      setFormData(prev => ({
        ...prev,
        [`imagen${numeroImagen}`]: file
      }));

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({
          ...prev,
          [`preview${numeroImagen}`]: reader.result
        }));
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar imagen');
    }
  };

  // 🆕 MEJORADO: Eliminar imagen de TEMP con callbacks seguros
  const eliminarImagen = async (numeroImagen) => {
    const rutaTemp = imagenesTemp[`temp${numeroImagen}`];

    // Si hay imagen temporal, borrarla de Supabase
    if (rutaTemp) {
      try {
        await supabase.storage
          .from('productos')
          .remove([rutaTemp]);
      } catch (error) {
        console.error('Error al eliminar imagen temporal:', error);
      }
    }

    // ✅ MEJORADO: Limpiar estados con callbacks
    setFormData(prev => ({
      ...prev,
      [`imagen${numeroImagen}`]: null
    }));

    setPreviews(prev => ({
      ...prev,
      [`preview${numeroImagen}`]: null
    }));

    setImagenesTemp(prev => ({
      ...prev,
      [`temp${numeroImagen}`]: null
    }));
    
    const input = document.getElementById(`imagen-input-${numeroImagen}`);
    if (input) input.value = '';
  };

  const handleTallasChange = (talla) => {
    setFormData(prev => {
      const tallas = [...prev.tallas];
      const index = tallas.indexOf(talla);
      
      if (index > -1) {
        tallas.splice(index, 1);
      } else {
        tallas.push(talla);
      }
      
      return {
        ...prev,
        tallas: tallas.sort((a, b) => Number(a) - Number(b))
      };
    });
  };

  // 🆕 MEJORADO: Mueve imágenes de TEMP a PUBLICADOS y guarda solo RUTAS
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    const imagenesMovidas = []; // Para rollback si falla

    try {
      if (!formData.imagen1 || !formData.imagen2 || !formData.imagen3) {
        throw new Error('Debes subir las 3 imágenes del producto');
      }

      if (!formData.precio || Number(formData.precio) <= 0) {
        throw new Error('Debes ingresar un precio válido');
      }

      if (formData.precio_oferta && Number(formData.precio_oferta) >= Number(formData.precio)) {
        throw new Error('El precio de oferta debe ser menor al precio normal');
      }

      const rutasImagenes = []; // ✅ MEJORADO: Guardar solo rutas, no URLs completas

      // Mover imágenes de TEMP a PUBLICADOS
      for (let i = 1; i <= 3; i++) {
        const rutaTemp = imagenesTemp[`temp${i}`];

        if (!rutaTemp) {
          throw new Error(`Imagen ${i} no encontrada`);
        }

        // Crear nueva ruta en PUBLICADOS
        const rutaPublicada = rutaTemp.replace('temp/', 'publicados/');

        // Mover archivo
        const { error: moveError } = await supabase.storage
          .from('productos')
          .move(rutaTemp, rutaPublicada);

        if (moveError) {
          console.error('Error al mover imagen:', moveError);
          throw new Error(`Error al publicar imagen ${i}`);
        }

        // ✅ MEJORADO: Guardar solo la RUTA, no la URL completa
        rutasImagenes.push(rutaPublicada);
        imagenesMovidas.push(rutaPublicada); // Para rollback
      }

      // Insertar producto en la base de datos
      const { error } = await supabase
        .from('productos')
        .insert([
          {
            nombre: formData.nombre,
            categoria: formData.categoria,
            subcategoria: formData.subcategoria || null,
            marca: formData.marca || null,
            tallas: (formData.categoria !== 'Artículos Deportivos' && formData.categoria !== 'Ofertas') ? formData.tallas : null,
            precio: Number(formData.precio),
            precio_oferta: formData.precio_oferta ? Number(formData.precio_oferta) : null,
            imagenes: rutasImagenes, // ✅ Array de rutas
            imagen_url: rutasImagenes[0] // ✅ Primera ruta
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
        precio: '',
        precio_oferta: '',
        imagen1: null,
        imagen2: null,
        imagen3: null
      });

      setPreviews({
        preview1: null,
        preview2: null,
        preview3: null
      });

      setImagenesTemp({
        temp1: null,
        temp2: null,
        temp3: null
      });

      setTimeout(() => navigate('/admin/productos'), 2000);

    } catch (error) {
      // 🆕 ROLLBACK: Si falla la BD, devolver imágenes a temp/
      if (imagenesMovidas.length > 0) {
        console.log('⚠️ Error en BD, revirtiendo imágenes...');
        for (const rutaPublicada of imagenesMovidas) {
          try {
            const rutaTemp = rutaPublicada.replace('publicados/', 'temp/');
            await supabase.storage
              .from('productos')
              .move(rutaPublicada, rutaTemp);
          } catch (rollbackError) {
            console.error('Error en rollback:', rollbackError);
          }
        }
      }

      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Función para cancelar y limpiar TEMP
  const cancelarYLimpiar = async () => {
    // Borrar todas las imágenes temporales
    for (let i = 1; i <= 3; i++) {
      const rutaTemp = imagenesTemp[`temp${i}`];
      if (rutaTemp) {
        try {
          await supabase.storage
            .from('productos')
            .remove([rutaTemp]);
        } catch (error) {
          console.error('Error al limpiar temp:', error);
        }
      }
    }

    navigate('/admin/productos');
  };

  const mostrarMarca = formData.categoria !== 'Artículos Deportivos' && formData.categoria !== 'Ofertas';
  const mostrarTallas = formData.categoria !== 'Artículos Deportivos' && formData.categoria !== 'Ofertas';
  const marcaRequerida = formData.categoria !== '2x95' && mostrarMarca;

  return (
    <div className="min-h-screen bg-black">
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
          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-semibold">Nombre del Producto *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Ej: Nike Air Max 2024"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-semibold">Categoría *</label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value, marca: '', subcategoria: '', tallas: [] }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="2x95">🔥 2 x 95</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Niños">Niños</option>
              <option value="Artículos Deportivos">Artículos Deportivos</option>
              <option value="Ofertas">🎁 Ofertas</option>
            </select>
          </div>

          {formData.categoria === 'Artículos Deportivos' && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-semibold">Subcategoría *</label>
              <select
                value={formData.subcategoria}
                onChange={(e) => setFormData(prev => ({ ...prev, subcategoria: e.target.value }))}
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

          {mostrarMarca && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-semibold">
                Marca {marcaRequerida && '*'}
              </label>
              <select
                value={formData.marca}
                onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                required={marcaRequerida}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="">Seleccionar marca...</option>
                {(formData.categoria === '2x95' ? marcasPorCategoria['Mujer'] : marcasPorCategoria[formData.categoria])?.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
              {!marcaRequerida && (
                <p className="text-xs text-gray-500 mt-1">Opcional para productos 2x95</p>
              )}
            </div>
          )}

          {mostrarTallas && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-semibold">
                Tallas Disponibles {formData.categoria !== '2x95' && '*'}
              </label>
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
              <p className="text-sm text-gray-500 mt-2">
                Seleccionadas: {formData.tallas.join(', ') || 'Ninguna'}
                {formData.categoria === '2x95' && ' (Opcional para productos 2x95)'}
              </p>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">Precio Normal (S/) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio}
                onChange={(e) => setFormData(prev => ({ ...prev, precio: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="199.90"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">
                Precio Oferta (S/) <span className="text-yellow-400 text-sm">(Opcional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_oferta}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_oferta: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-600"
                placeholder="149.90"
              />
              <p className="text-xs text-gray-500 mt-1">Si agregas oferta, se mostrará el precio normal tachado</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 mb-3 font-semibold">Imágenes del Producto (3 obligatorias) *</label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((num) => (
                <div key={num}>
                  <label className="block text-gray-400 text-sm mb-2">Imagen {num} {num === 1 ? '(Frente)' : num === 2 ? '(Costado)' : '(Planta)'}</label>
                  
                  {previews[`preview${num}`] ? (
                    <div className="relative">
                      <img src={previews[`preview${num}`]} alt={`Preview ${num}`} className="w-full h-48 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => eliminarImagen(num)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-red-600 transition">
                        <Upload className="mx-auto mb-2 text-gray-500" size={32} />
                        <p className="text-gray-400 text-sm">Click para subir</p>
                      </div>
                      <input
                        id={`imagen-input-${num}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImagenChange(e, num)}
                        required
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
            <button
              type="button"
              onClick={cancelarYLimpiar}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
