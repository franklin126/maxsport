export function formatSoles(num) {
  return `S/ ${Number(num || 0).toFixed(2)}`;
}

export function formatFechaHora(iso) {
  return new Date(iso).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}