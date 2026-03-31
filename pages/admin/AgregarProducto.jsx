import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Upload, Save, Package, X, Barcode, Printer, RefreshCw } from 'lucide-react';

const SUPABASE_URL = 'https://eofdimgshwlvnzhckxku.supabase.co';
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/productos/`;
const COLA_KEY = 'maxsport_cola_etiquetas'; // clave en localStorage

const marcasPorCategoria = {
  'Niños': ['Punto original', 'Vady', 'Air running', 'Adidas', 'Ivano', 'Nacionales', 'V dariens'],
  'Hombre': ['Adidas', 'Nike', 'Puma', 'Brixton', 'Walon', 'Punto original', 'I cax', 'Ivano', 'Anda', 'Réplicas A1', 'New atletic', 'N-seven'],
  'Mujer': ['Punto original', 'Punto v dariens', 'Ultralon', 'Estilo coreano', 'Adidas', 'Puma', 'Reebok', 'Nike', 'Vi-mas', 'Yumi', 'Cacy', 'Boni', 'Quelind', 'N-seven']
};

const subcategoriasDeportivas = [
  'Pelotas Fútbol', 'Pelotas Vóley', 'Pelotas Basket',
  'Productos para entrenamiento', 'Medallas', 'Trofeos', 'Medias deportivas'
];

const tallasDisponibles = Array.from({ length: 22 }, (_, i) => (i + 22).toString());
const pasillos = Array.from({ length: 50 }, (_, i) => i + 1);
const andamios = Array.from({ length: 10 }, (_, i) => i + 1);
const niveles  = Array.from({ length: 10 }, (_, i) => i + 1);

function armarUbicacion(pasillo, andamio, nivel) {
  const partes = [];
  if (pasillo) partes.push(`Pasillo ${pasillo}`);
  if (andamio) partes.push(`Andamio ${andamio}`);
  if (nivel)   partes.push(`Nivel ${nivel}`);
  return partes.join(' · ');
}

function rutaAUrl(ruta) {
  if (!ruta) return '';
  if (ruta.startsWith('http')) return ruta;
  return `${STORAGE_BASE}${ruta}`;
}

// ── localStorage helpers ──
function leerCola() {
  try {
    const raw = localStorage.getItem(COLA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function guardarCola(cola) {
  localStorage.setItem(COLA_KEY, JSON.stringify(cola));
}

function limpiarCola() {
  localStorage.removeItem(COLA_KEY);
}

// ── Carga JsBarcode desde CDN ──
function cargarJsBarcode() {
  return new Promise((resolve) => {
    if (window.JsBarcode) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

// ── Imprime N códigos (pueden ser distintos) en filas de 3 ──
async function imprimirCola(codigos) {
  await cargarJsBarcode();

  const imagenes = codigos.map(codigo => {
    const canvas = document.createElement('canvas');
    window.JsBarcode(canvas, codigo, {
      format: 'CODE128',
      width: 1,
      height: 38,
      displayValue: false,
      margin: 2,
    });
    return { codigo, img: canvas.toDataURL('image/png') };
  });

  const filas = Math.ceil(imagenes.length / 3);
  const totalCeldas = filas * 3;

  const celdas = [];
  for (let i = 0; i < totalCeldas; i++) {
    if (i < imagenes.length) {
      celdas.push(`
        <div class="etiqueta">
          <img src="${imagenes[i].img}" alt="barcode"/>
          <div class="codigo-texto">${imagenes[i].codigo}</div>
        </div>`);
    } else {
      celdas.push(`<div class="etiqueta"></div>`);
    }
  }

  let filasHTML = '';
  for (let f = 0; f < filas; f++) {
    filasHTML += `<div class="fila">${celdas.slice(f * 3, f * 3 + 3).join('')}</div>`;
  }

  const ventana = window.open('', '_blank', 'width=500,height=400');
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
          size: 100mm ${filas * 20}mm;
          margin: 0;
        }

        body {
          width: 100mm;
          background: white;
        }

        .fila {
          width: 100mm;
          height: 20mm;
          display: flex;
          flex-direction: row;
          align-items: center;
          /* ✅ 2mm a cada lado, gap de 3mm entre etiquetas */
          padding: 0 2mm;
          gap: 3mm;
          /* Evita que el navegador agregue espacio extra */
          overflow: hidden;
        }

        .etiqueta {
          /* ✅ flex: 1 para que las 3 etiquetas se repartan igual el espacio disponible */
          flex: 1;
          height: 18mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .etiqueta img {
          width: 100%;
          max-width: 26mm;   /* ✅ antes 28mm */
          height: 12mm;
          object-fit: contain;
          display: block;
        }

        .etiqueta .codigo-texto {
          font-family: 'Courier New', monospace;
          font-size: 8pt;     /* ✅ más grande */
          font-weight: bold;
          text-align: center;
          margin-top: 0.2mm;  /* ✅ menos espacio (~2mm visual total) */
          letter-spacing: 0.4px;
        }
      </style>
    </head>
    <body>${filasHTML}</body>
    </html>
  `);
  ventana.document.close();
  setTimeout(() => { ventana.focus(); ventana.print(); ventana.close(); }, 600);
}

export default function AgregarProducto() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const [modoCodigoManual, setModoCodigoManual] = useState(false);

  // Estado de la cola — se sincroniza con localStorage
  const [cola, setCola] = useState(() => leerCola());

  // Fase: null | 'pregunta' (¿agregarás más?) | 'imprimiendo'
  const [fase, setFase] = useState(null);
  const [ultimoCodigo, setUltimoCodigo] = useState(null);

  const [imagenesTemp, setImagenesTemp] = useState({ temp1: null, temp2: null, temp3: null });

  const formularioVacio = {
    nombre: '', categoria: 'Hombre', subcategoria: '', marca: '', tallas: [],
    precio: '', precio_oferta: '', codigo_barras: '', stock: '',
    pasillo: '', andamio: '', nivel: '',
    imagen1: null, imagen2: null, imagen3: null
  };
  const [formData, setFormData] = useState(formularioVacio);
  const [previews, setPreviews] = useState({ preview1: null, preview2: null, preview3: null });

  // Sincroniza cola con localStorage cada vez que cambia
  useEffect(() => { guardarCola(cola); }, [cola]);

  const mostrarMarca   = formData.categoria !== 'Artículos Deportivos' && formData.categoria !== 'Ofertas';
  const mostrarTallas  = formData.categoria !== 'Artículos Deportivos' && formData.categoria !== 'Ofertas';
  const marcaRequerida = formData.categoria !== '2x95' && mostrarMarca;

  const generarCodigoAuto = async () => {
    setGenerandoCodigo(true);
    try {
      const { data } = await supabase
        .from('productos')
        .select('codigo_barras')
        .not('codigo_barras', 'is', null)
        .order('codigo_barras', { ascending: false })
        .limit(50);

      let maxNum = 0;
      (data || []).forEach(p => {
        const cod = p.codigo_barras || '';
        if (/^\d{9}$/.test(cod)) {
          const num = parseInt(cod, 10);
          if (num > maxNum) maxNum = num;
        }
      });

      // También consideramos los códigos que ya están en la cola local
      cola.forEach(c => {
        if (/^\d{9}$/.test(c)) {
          const num = parseInt(c, 10);
          if (num > maxNum) maxNum = num;
        }
      });

      const codigoNuevo = String(maxNum + 1).padStart(9, '0');
      setFormData(prev => ({ ...prev, codigo_barras: codigoNuevo }));
    } catch (err) {
      console.error('Error generando código:', err);
      alert('Error al generar código automático');
    } finally {
      setGenerandoCodigo(false);
    }
  };

  const handleImagenChange = async (e, numeroImagen) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${crypto.randomUUID().slice(0, 6)}_imagen${numeroImagen}.${ext}`;
      const { error } = await supabase.storage.from('productos').upload(`temp/${fileName}`, file);
      if (error) { alert('Error al subir imagen'); return; }
      setImagenesTemp(prev => ({ ...prev, [`temp${numeroImagen}`]: `temp/${fileName}` }));
      setFormData(prev => ({ ...prev, [`imagen${numeroImagen}`]: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => ({ ...prev, [`preview${numeroImagen}`]: reader.result }));
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar imagen');
    }
  };

  const eliminarImagen = async (numeroImagen) => {
    const rutaTemp = imagenesTemp[`temp${numeroImagen}`];
    if (rutaTemp) {
      try { await supabase.storage.from('productos').remove([rutaTemp]); } catch (e) { console.error(e); }
    }
    setFormData(prev => ({ ...prev, [`imagen${numeroImagen}`]: null }));
    setPreviews(prev => ({ ...prev, [`preview${numeroImagen}`]: null }));
    setImagenesTemp(prev => ({ ...prev, [`temp${numeroImagen}`]: null }));
    const input = document.getElementById(`imagen-input-${numeroImagen}`);
    if (input) input.value = '';
  };

  const handleTallasChange = (talla) => {
    setFormData(prev => {
      const tallas = [...prev.tallas];
      const index = tallas.indexOf(talla);
      if (index > -1) { tallas.splice(index, 1); } else { tallas.push(talla); }
      return { ...prev, tallas: tallas.sort((a, b) => Number(a) - Number(b)) };
    });
  };

  const cancelarYLimpiar = async () => {
    for (let i = 1; i <= 3; i++) {
      const rutaTemp = imagenesTemp[`temp${i}`];
      if (rutaTemp) {
        try { await supabase.storage.from('productos').remove([rutaTemp]); } catch (e) { console.error(e); }
      }
    }
    navigate('/admin/dashboard');
  };

  const resetFormulario = () => {
    setFormData(formularioVacio);
    setPreviews({ preview1: null, preview2: null, preview3: null });
    setImagenesTemp({ temp1: null, temp2: null, temp3: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });
    const imagenesMovidas = [];

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

      const rutasImagenes = [];
      for (let i = 1; i <= 3; i++) {
        const rutaTemp = imagenesTemp[`temp${i}`];
        if (!rutaTemp) throw new Error(`Imagen ${i} no encontrada`);
        const rutaPublicada = rutaTemp.replace('temp/', 'publicados/');
        const { error: moveError } = await supabase.storage.from('productos').move(rutaTemp, rutaPublicada);
        if (moveError) throw new Error(`Error al publicar imagen ${i}`);
        rutasImagenes.push(rutaAUrl(rutaPublicada));
        imagenesMovidas.push(rutaPublicada);
      }

      const ubicacion = armarUbicacion(formData.pasillo, formData.andamio, formData.nivel);
      const codigoFinal = formData.codigo_barras.trim() || null;

      const { error } = await supabase.from('productos').insert([{
        nombre: formData.nombre,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria || null,
        marca: formData.marca || null,
        tallas: (formData.categoria !== 'Artículos Deportivos' && formData.categoria !== 'Ofertas') ? formData.tallas : null,
        precio: Number(formData.precio),
        precio_oferta: formData.precio_oferta ? Number(formData.precio_oferta) : null,
        imagenes: rutasImagenes,
        imagen_url: rutasImagenes[0],
        codigo_barras: codigoFinal,
        stock: formData.stock !== '' ? Number(formData.stock) : null,
        ubicacion_almacen: ubicacion || null,
      }]);

      if (error) throw error;

      setMensaje({ tipo: 'success', texto: '✅ Producto guardado correctamente' });
      resetFormulario();

      if (codigoFinal) {
        // Agregamos el código a la cola
        const nuevaCola = [...cola, codigoFinal];

        if (nuevaCola.length >= 3) {
          // Fila completa — imprimimos y reiniciamos
          setCola([]);
          limpiarCola();
          setFase(null);
          setUltimoCodigo(null);
          await imprimirCola(nuevaCola);
        } else {
          // Fila incompleta — guardamos y preguntamos
          setCola(nuevaCola);
          setUltimoCodigo(codigoFinal);
          setFase('pregunta');
        }
      } else {
        // Sin código → solo navigamos
        setTimeout(() => navigate('/admin/productos'), 1500);
      }

    } catch (error) {
      for (const rutaPublicada of imagenesMovidas) {
        try {
          await supabase.storage.from('productos').move(rutaPublicada, rutaPublicada.replace('publicados/', 'temp/'));
        } catch (e) { console.error(e); }
      }
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Usuario dice "Sí, voy a agregar más"
  const handleAgregarMas = () => {
    setFase(null);
    setMensaje({ tipo: '', texto: '' });
    // El formulario ya está limpio, listo para el siguiente producto
  };

  // Usuario dice "No, imprimir ahora" con lo que hay en la cola
  const handleImprimirAhora = async () => {
    const colaActual = [...cola];
    setCola([]);
    limpiarCola();
    setFase(null);
    setUltimoCodigo(null);
    await imprimirCola(colaActual);
  };

  const ubicacionPreview = armarUbicacion(formData.pasillo, formData.andamio, formData.nivel);

  // ── Indicador visual de la cola (asientos) ──
  const AsientosCola = () => {
    if (cola.length === 0) return null;
    return (
      <div className="mb-6 p-4 bg-gray-800 border border-blue-600 rounded-xl">
        <p className="text-blue-300 text-sm font-semibold mb-3">
          Fila de etiquetas — {cola.length}/3 lista{cola.length > 1 ? 's' : ''}
        </p>
        <div className="flex gap-3 items-center">
          {[0, 1, 2].map(i => (
            <div key={i}
              className={`flex-1 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition ${
                i < cola.length
                  ? 'bg-blue-600 border-blue-400'
                  : 'bg-gray-700 border-gray-600 border-dashed'
              }`}>
              {i < cola.length ? (
                <>
                  <span className="text-white text-xs font-bold">✓</span>
                  <span className="text-blue-200 text-xs font-mono">{cola[i]}</span>
                </>
              ) : (
                <span className="text-gray-500 text-xs">vacío</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-2">
          {cola.length === 1 && 'Faltan 2 productos para imprimir la fila'}
          {cola.length === 2 && 'Falta 1 producto para completar la fila'}
        </p>
      </div>
    );
  };

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
            <Link to="/admin/dashboard" className="text-gray-300 hover:text-white flex items-center gap-2">
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

        {/* Indicador visual de la cola */}
        <AsientosCola />

        {/* Mensaje éxito / error */}
        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-lg ${
            mensaje.tipo === 'success'
              ? 'bg-green-900/50 border border-green-600 text-green-200'
              : 'bg-red-900/50 border border-red-600 text-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {/* ── Pregunta: ¿agregarás más productos? ── */}
        {fase === 'pregunta' && (
          <div className="mb-6 p-6 bg-yellow-900/40 border-2 border-yellow-500 rounded-xl">
            <p className="text-yellow-200 font-bold text-lg mb-1">
              Código <span className="font-mono">{ultimoCodigo}</span> guardado en la fila
            </p>
            <p className="text-yellow-300 text-sm mb-5">
              ¿Vas a agregar más productos para completar la fila de 3?
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleAgregarMas}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition"
              >
                Sí, agrego más
              </button>
              <button
                onClick={handleImprimirAhora}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition"
              >
                <Printer size={18} />
                No, imprimir ahora ({cola.length} {cola.length === 1 ? 'etiqueta' : 'etiquetas'})
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-8 border border-red-600">

          {/* Nombre */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-semibold">Nombre del Producto</label>
            <input type="text" value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Ej: Nike Air Max 2024" />
          </div>

          {/* Categoría */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-semibold">Categoría</label>
            <select value={formData.categoria}
              onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value, marca: '', subcategoria: '', tallas: [] }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600">
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
              <label className="block text-gray-300 mb-2 font-semibold">Subcategoría</label>
              <select value={formData.subcategoria}
                onChange={(e) => setFormData(prev => ({ ...prev, subcategoria: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600">
                <option value="">Seleccionar...</option>
                {subcategoriasDeportivas.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          )}

          {mostrarMarca && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-semibold">
                Marca {formData.categoria === '2x95' && <span className="text-gray-500 text-sm">(Opcional)</span>}
              </label>
              <select value={formData.marca}
                onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                required={marcaRequerida}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600">
                <option value="">Seleccionar marca...</option>
                {(formData.categoria === '2x95' ? marcasPorCategoria['Mujer'] : marcasPorCategoria[formData.categoria])?.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
            </div>
          )}

          {mostrarTallas && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-semibold">
                Tallas Disponibles {formData.categoria === '2x95' && <span className="text-gray-500 text-sm">(Opcional)</span>}
              </label>
              <div className="grid grid-cols-6 md:grid-cols-11 gap-2">
                {tallasDisponibles.map(talla => (
                  <button key={talla} type="button" onClick={() => handleTallasChange(talla)}
                    className={`px-3 py-2 rounded-lg font-semibold transition ${
                      formData.tallas.includes(talla) ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}>
                    {talla}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">Seleccionadas: {formData.tallas.join(', ') || 'Ninguna'}</p>
            </div>
          )}

          {/* Precios */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">Precio Normal (S/)</label>
              <input type="number" step="0.01" min="0" value={formData.precio}
                onChange={(e) => setFormData(prev => ({ ...prev, precio: e.target.value }))}
                required
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
              <p className="text-xs text-gray-500 mt-1">Si agregas oferta, se mostrará el precio normal tachado</p>
            </div>
          </div>

          {/* ── SECCIÓN POS ── */}
          <div className="mb-6 bg-gray-800 rounded-xl p-5 border border-blue-700">
            <h3 className="text-blue-300 font-bold mb-4 flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">POS</span>
              Datos para el Sistema de Caja
            </h3>

            {/* Código de barras */}
            <div className="mb-4">
              <label className="block text-gray-300 mb-2 font-semibold">
                Código de Barras <span className="text-gray-500 text-sm">(Opcional)</span>
              </label>
              <div className="flex gap-2 mb-3">
                <button type="button"
                  onClick={() => { setModoCodigoManual(false); setFormData(prev => ({ ...prev, codigo_barras: '' })); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    !modoCodigoManual ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}>
                  <RefreshCw size={14} /> Generar automático
                </button>
                <button type="button"
                  onClick={() => { setModoCodigoManual(true); setFormData(prev => ({ ...prev, codigo_barras: '' })); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    modoCodigoManual ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}>
                  <Barcode size={14} /> Escribir / escanear manual
                </button>
              </div>

              {!modoCodigoManual && (
                <div className="flex gap-2">
                  <input type="text" value={formData.codigo_barras} readOnly
                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-lg tracking-widest"
                    placeholder="Haz clic en 'Generar' →" />
                  <button type="button" onClick={generarCodigoAuto} disabled={generandoCodigo}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
                    <RefreshCw size={16} className={generandoCodigo ? 'animate-spin' : ''} />
                    {generandoCodigo ? 'Generando...' : 'Generar'}
                  </button>
                </div>
              )}

              {modoCodigoManual && (
                <input type="text" value={formData.codigo_barras}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo_barras: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Haz clic aquí y escanea el producto con tu lector"
                  autoFocus />
              )}

              {formData.codigo_barras && (
                <p className="text-blue-400 text-xs mt-1">
                  ✓ Código: <span className="font-mono font-bold text-white">{formData.codigo_barras}</span>
                </p>
              )}
            </div>

            {/* Stock */}
            <div className="mb-4">
              <label className="block text-gray-300 mb-2 font-semibold">Stock Inicial <span className="text-gray-500 text-sm">(Opcional)</span></label>
              <input type="number" min="0" value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 10" />
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">
                Ubicación en Almacén <span className="text-gray-500 text-sm">(Opcional)</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Pasillo</label>
                  <select value={formData.pasillo} onChange={(e) => setFormData(prev => ({ ...prev, pasillo: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">—</option>
                    {pasillos.map(n => <option key={n} value={n}>Pasillo {n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Andamio</label>
                  <select value={formData.andamio} onChange={(e) => setFormData(prev => ({ ...prev, andamio: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">—</option>
                    {andamios.map(n => <option key={n} value={n}>Andamio {n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Nivel</label>
                  <select value={formData.nivel} onChange={(e) => setFormData(prev => ({ ...prev, nivel: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">—</option>
                    {niveles.map(n => <option key={n} value={n}>Nivel {n}</option>)}
                  </select>
                </div>
              </div>
              {ubicacionPreview && (
                <div className="mt-2 px-3 py-2 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <p className="text-blue-300 text-xs">Ubicación: <span className="text-white font-semibold">{ubicacionPreview}</span></p>
                </div>
              )}
            </div>
          </div>

          {/* Imágenes */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-3 font-semibold">Imágenes del Producto (3 obligatorias)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((num) => (
                <div key={num}>
                  <label className="block text-gray-400 text-sm mb-2">
                    Imagen {num} {num === 1 ? '(Frente)' : num === 2 ? '(Costado)' : '(Planta)'}
                  </label>
                  {previews[`preview${num}`] ? (
                    <div className="relative">
                      <img src={previews[`preview${num}`]} alt={`Preview ${num}`} className="w-full h-48 object-cover rounded-lg" />
                      <button type="button" onClick={() => eliminarImagen(num)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-red-600 transition">
                        <Upload className="mx-auto mb-2 text-gray-500" size={32} />
                        <p className="text-gray-400 text-sm">Click para subir</p>
                      </div>
                      <input id={`imagen-input-${num}`} type="file" accept="image/*"
                        onChange={(e) => handleImagenChange(e, num)} required className="hidden" />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button type="submit" disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
              <Save size={20} />
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
            <button type="button" onClick={cancelarYLimpiar}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}