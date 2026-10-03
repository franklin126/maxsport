import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

let cacheTarjetas = null;
let promesaEnCurso = null;

async function traerTarjetas() {
  const { data, error } = await supabase.from('tarjetas_inicio').select('*');
  if (error) throw error;

  const mapa = {};
  (data || []).forEach(t => { mapa[t.categoria_slug] = t.imagen_url; });
  return mapa;
}

export function useTarjetasInicio() {
  const [tarjetas, setTarjetas] = useState(cacheTarjetas || {});

  useEffect(() => {
    if (cacheTarjetas) return;

    let vivo = true;
    if (!promesaEnCurso) promesaEnCurso = traerTarjetas();

    promesaEnCurso
      .then(data => {
        cacheTarjetas = data;
        if (vivo) setTarjetas(data);
      })
      .catch(err => {
        console.error('Error cargando tarjetas de inicio:', err);
        promesaEnCurso = null;
      });

    return () => { vivo = false; };
  }, []);

  return tarjetas;
}