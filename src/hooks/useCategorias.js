import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

let cacheCategorias = null;
let promesaEnCurso = null;

async function traerCategorias() {
  const { data: cats, error: errCats } = await supabase.from('categorias').select('*').order('orden');
  if (errCats) throw errCats;

  const { data: rel, error: errRel } = await supabase
    .from('categoria_marcas')
    .select('categoria_id, marcas(nombre)');
  if (errRel) throw errRel;

  const marcasPorId = {};
  (rel || []).forEach(r => {
    if (!r.marcas) return;
    if (!marcasPorId[r.categoria_id]) marcasPorId[r.categoria_id] = [];
    marcasPorId[r.categoria_id].push(r.marcas.nombre);
  });

  return (cats || []).map(c => ({
    ...c,
    marcas: (marcasPorId[c.id] || []).sort((a, b) => a.localeCompare(b))
  }));
}

export function useCategorias() {
  const [categorias, setCategorias] = useState(cacheCategorias || []);
  const [loading, setLoading] = useState(!cacheCategorias);

  useEffect(() => {
    if (cacheCategorias) return;

    let vivo = true;
    if (!promesaEnCurso) promesaEnCurso = traerCategorias();

    promesaEnCurso
      .then(data => {
        cacheCategorias = data;
        if (vivo) setCategorias(data);
      })
      .catch(err => {
        console.error('Error cargando categorias:', err);
        promesaEnCurso = null;
      })
      .finally(() => {
        if (vivo) setLoading(false);
      });

    return () => { vivo = false; };
  }, []);

  const porSlug = (slug) => categorias.find(c => c.slug === slug);

  return { categorias, loading, porSlug };
}