import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Package, Trash2, Edit, Search } from 'lucide-react';

export default function ListaProductos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [productoEditando, setProductoEditando] = useState(null);

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
      setProductos(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarProducto = async (id, imagenes) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      if (imagenes && imagenes.length > 0) {
        const archivos = imagenes.map(url => url.split('/').pop());
        await supabase.storage.from('productos').remove(archivos);
      }

      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMensaje({ tipo: 'success', texto: '✅ Producto eliminado correctamente' });
      cargarProductos();
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    }
  };

  const actualizarProducto = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        nombre: productoEditando.nombre,
        marca: productoEditando.marca,
        tallas: productoEditando.tallas,
        precio: Number(productoEditando.precio),
        precio_oferta: productoEditando.precio_oferta ? Number(productoEditando.precio_oferta) : null
      };

      if (updateData.precio_oferta && updateData.precio_oferta >= updateData.precio) {
        throw new Error('El precio de oferta debe ser menor al precio normal');
      }

      const { error } = await supabase
        .from('productos')
        .update(updateData)
        .eq('id', productoEditando.id);

      if (error) throw error;

      setMensaje({ tipo: 'success', texto: '✅ Producto actualizado correctamente' });
      setProductoEditando(null);
      cargarProductos();
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = !categoriaFiltro || p.categoria === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Cargando productos...</div>
      </div>
    );
  }

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

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">Productos</h2>
            <p className="text-gray-400">Total: {productosFiltrados.length} productos</p>
          </div>
          <Link
            to="/admin/agregar"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            + Agregar Producto
          </Link>
        </div>

        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-lg ${
            mensaje.tipo === 'success' ? 'bg-green-900/50 border border-green-600 text-green-200' : 'bg-red-900/50 border border-red-600 text-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">Todas las categorías</option>
            <option value="2x95">🔥 2 x 95</option>
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
            <option value="Niños">Niños</option>
            <option value="Artículos Deportivos">Artículos Deportivos</option>
            <option value="Ofertas">Ofertas</option>
          </select>
        </div>

        {productoEditando && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full border border-red-600 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-white mb-6">Editar Producto</h3>
              <form onSubmit={actualizarProducto}>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2 font-semibold">Nombre</label>
                  <input
                    type="text"
                    value={productoEditando.nombre}
                    onChange={(e) => setProductoEditando({...productoEditando, nombre: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                {productoEditando.marca && (
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2 font-semibold">Marca</label>
                    <input
                      type="text"
                      value={productoEditando.marca || ''}
                      onChange={(e) => setProductoEditando({...productoEditando, marca: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                )}

                {productoEditando.tallas && (
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2 font-semibold">Tallas (separadas por coma)</label>
                    <input
                      type="text"
                      value={productoEditando.tallas?.join(', ') || ''}
                      onChange={(e) => setProductoEditando({...productoEditando, tallas: e.target.value.split(',').map(t => t.trim())})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      placeholder="38, 39, 40, 41"
                    />
                  </div>
                )}

                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold">Precio Normal (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productoEditando.precio || ''}
                      onChange={(e) => setProductoEditando({...productoEditando, precio: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold">Precio Oferta (S/) <span className="text-yellow-400 text-sm">(Opcional)</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productoEditando.precio_oferta || ''}
                      onChange={(e) => setProductoEditando({...productoEditando, precio_oferta: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-600"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductoEditando(null)}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productosFiltrados.map((producto) => (
            <div key={producto.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-red-600 transition">
              {(producto.imagenes?.[0] || producto.imagen_url) && (
                <div className="aspect-square bg-white relative">
                  <img
                    src={producto.imagenes?.[0] || producto.imagen_url}
                    alt={producto.nombre}
                    className="w-full h-full object-cover"
                  />
                  {producto.precio_oferta && producto.precio_oferta < producto.precio && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-xs">
                      OFERTA
                    </div>
                  )}
                  {producto.categoria === '2x95' && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-3 py-1 rounded-full text-xs">
                      🔥 2x95
                    </div>
                  )}
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-white mb-2">{producto.nombre}</h3>
                <div className="text-sm text-gray-400 space-y-1 mb-4">
                  <p>Categoría: {producto.categoria}</p>
                  {producto.marca && <p>Marca: {producto.marca}</p>}
                  {producto.subcategoria && <p>Subcategoría: {producto.subcategoria}</p>}
                  {producto.tallas && <p>Tallas: {producto.tallas.join(', ')}</p>}
                  {producto.precio && (
                    <div className="mt-2">
                      {producto.precio_oferta && producto.precio_oferta < producto.precio ? (
                        <>
                          <p className="text-gray-500 line-through">S/ {producto.precio.toFixed(2)}</p>
                          <p className="text-yellow-400 font-bold text-lg">S/ {producto.precio_oferta.toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="text-green-400 font-bold text-lg">S/ {producto.precio.toFixed(2)}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setProductoEditando(producto)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Edit size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarProducto(producto.id, producto.imagenes)}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {productosFiltrados.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl">No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
}
