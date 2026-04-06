/**
 * Parser de tempo humano para milissegundos.
 * Exemplos: "10m" → 600000 | "1h" → 3600000 | "2d" → 172800000
 */

const UNIDADES = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Converte string de tempo para milissegundos.
 * @param {string} input - Ex: "10m", "2h", "1d"
 * @returns {number|null} milissegundos ou null se inválido
 */
function parseTime(input) {
  if (!input || typeof input !== 'string') return null;

  const match = input.trim().toLowerCase().match(/^(\d+)([smhdw])$/);
  if (!match) return null;

  const valor = parseInt(match[1]);
  const unidade = match[2];

  return valor * (UNIDADES[unidade] || 0) || null;
}

/**
 * Formata milissegundos para string legível.
 * @param {number} ms
 * @returns {string} Ex: "2 horas", "30 minutos"
 */
function formatTime(ms) {
  if (ms < 60_000) return `${Math.floor(ms / 1000)} segundo(s)`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} minuto(s)`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} hora(s)`;
  return `${Math.floor(ms / 86_400_000)} dia(s)`;
}

module.exports = { parseTime, formatTime };
