export function cargarJsBarcode() {
  return new Promise((resolve) => {
    if (window.JsBarcode) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

export async function imprimirEtiquetas(codigos) {
  await cargarJsBarcode();

  const imagenes = codigos.map(c => {
    const canvas = document.createElement('canvas');
    window.JsBarcode(canvas, c, {
      format: 'CODE128', width: 1, height: 38,
      displayValue: false, margin: 2,
    });
    return { codigo: c, img: canvas.toDataURL('image/png') };
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
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { size: 100mm ${filas * 20}mm; margin: 0; }
      body { width: 100mm; background: white; }
      .fila { width: 100mm; height: 20mm; display: flex; flex-direction: row;
              align-items: center; padding: 0 2mm; gap: 3mm; overflow: hidden; }
      .etiqueta { flex: 1; height: 18mm; display: flex; flex-direction: column;
                  align-items: center; justify-content: center; overflow: hidden; }
      .etiqueta img { width: 100%; max-width: 26mm; height: 12mm; object-fit: contain; display: block; }
      .etiqueta .codigo-texto { font-family: 'Courier New', monospace; font-size: 8pt;
                                font-weight: bold; text-align: center; margin-top: 0.2mm;
                                letter-spacing: 0.4px; }
    </style></head>
    <body>${filasHTML}</body></html>
  `);
  ventana.document.close();
  setTimeout(() => { ventana.focus(); ventana.print(); ventana.close(); }, 600);
}