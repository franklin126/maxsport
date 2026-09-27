import { Phone, X, AlertTriangle } from 'lucide-react';

export default function ModalYape({ producto, precio, onClose }) {
  const handleYaPague = () => {
    const mensaje = `Hola, ya completé el pago por Yape de: ${producto.nombre} (S/ ${precio.toFixed(2)}). Adjunto captura de pantalla.`;
    window.open(`https://wa.me/51929505174?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl max-w-md w-full border-2 border-purple-600 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2">
          <X size={20} />
        </button>

        <h3 className="text-2xl font-bold text-white mb-4 text-center">💳 Pago con Yape</h3>

        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-gray-400 text-sm">Producto:</p>
          <p className="text-white font-bold">{producto.nombre}</p>
          <p className="text-green-400 text-2xl font-bold mt-2">S/ {precio.toFixed(2)}</p>
        </div>

        <div className="bg-purple-900 bg-opacity-30 rounded-lg p-3 mb-4 border border-purple-600">
          <p className="text-purple-300 text-sm">Yapear a nombre de:</p>
          <p className="text-white font-bold text-lg">Maximo Pari Lizana</p>
          <p className="text-white font-bold text-lg">Numero: 929505174</p>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4 flex justify-center">
          <img src="/yape-qr.png" alt="Código QR Yape" className="w-53 h-53 object-contain" />
        </div>

        <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 mb-4 border border-blue-600">
          <h4 className="font-bold text-blue-300 mb-2">📋 Instrucciones:</h4>
          <ol className="text-gray-300 text-sm space-y-2">
            <li>1. Escanea el código QR con tu app Yape</li>
            <li>2. Verifica que el nombre sea "Maximo Pari Lizana"</li>
            <li>3. Realiza el pago de S/ {precio.toFixed(2)}</li>
            <li>4. Toma captura de pantalla del comprobante</li>
            <li>5. Presiona "¿Ya pagaste?" y envía la captura</li>
            <li>6. Espera confirmación por WhatsApp</li>
            <li>7. Recoge en tienda o solicita envío a domicilio</li>
          </ol>
        </div>

        <div className="bg-red-900 bg-opacity-30 rounded-lg p-3 mb-4 border border-red-600 flex items-start gap-2">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-1" />
          <div>
            <p className="text-red-300 text-sm font-bold">⚠️ Advertencia de Seguridad</p>
            <p className="text-gray-300 text-xs mt-1">
              No se admiten estafas. Verifica siempre que yapeas al número correcto.
              El pago se confirma solo tras verificación del comprobante.
            </p>
          </div>
        </div>

        <button
          onClick={handleYaPague}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
        >
          <Phone size={20} />
          ¿Ya pagaste? Enviar captura
        </button>
      </div>
    </div>
  );
}