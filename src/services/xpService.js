const fs = require('fs');
const path = require('path');

const XP_FILE = path.join(__dirname, '../../data/xp.json');

// ─── XP POR NÍVEL ─────────────────────────────────────────────────────────
// Fórmula: xpNecessario(n) = 5 * n² + 50 * n + 100
function xpParaNivel(nivel) {
  return 5 * nivel * nivel + 50 * nivel + 100;
}

function nivelAtual(xpTotal) {
  let nivel = 0;
  let xpAcumulado = 0;
  while (true) {
    const necessario = xpParaNivel(nivel);
    if (xpAcumulado + necessario > xpTotal) break;
    xpAcumulado += necessario;
    nivel++;
  }
  return { nivel, xpNivel: xpTotal - xpAcumulado };
}

// ─── PERSISTÊNCIA ─────────────────────────────────────────────────────────
function carregar() {
  if (!fs.existsSync(XP_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(XP_FILE, 'utf8')); }
  catch { return {}; }
}

function salvar(dados) {
  fs.mkdirSync(path.dirname(XP_FILE), { recursive: true });
  fs.writeFileSync(XP_FILE, JSON.stringify(dados, null, 2), 'utf8');
}

// ─── FUNÇÕES PRINCIPAIS ───────────────────────────────────────────────────
/**
 * Adiciona XP ao usuário e retorna resultado com info de levelUp.
 */
function adicionarXP(userId, guildId, quantidade) {
  const dados = carregar();
  const chave = `${guildId}:${userId}`;

  if (!dados[chave]) {
    dados[chave] = { xp: 0, userId, guildId };
  }

  const nivelAntes = nivelAtual(dados[chave].xp).nivel;
  dados[chave].xp += quantidade;
  const { nivel: nivelDepois } = nivelAtual(dados[chave].xp);

  salvar(dados);

  return {
    xpTotal: dados[chave].xp,
    nivelAntes,
    novoNivel: nivelDepois,
    levelUp: nivelDepois > nivelAntes,
  };
}

/**
 * Obtém dados de XP do usuário.
 */
function obterXP(userId, guildId) {
  const dados = carregar();
  const chave = `${guildId}:${userId}`;
  const entry = dados[chave] || { xp: 0 };
  const { nivel, xpNivel } = nivelAtual(entry.xp);
  const xpProximoNivel = xpParaNivel(nivel);

  return {
    xp: entry.xp,
    nivel,
    xpNivel,
    xpProximoNivel,
  };
}

/**
 * Retorna o leaderboard do servidor (top N).
 */
function leaderboard(guildId, limite = 10) {
  const dados = carregar();

  return Object.entries(dados)
    .filter(([chave]) => chave.startsWith(`${guildId}:`))
    .map(([chave, entry]) => ({
      userId: entry.userId,
      xp: entry.xp,
      ...nivelAtual(entry.xp),
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limite);
}

function resetarXP(guildId) {
  const dados = carregar();
  const chavesRemover = Object.keys(dados).filter((chave) => chave.startsWith(`${guildId}:`));
  chavesRemover.forEach((chave) => delete dados[chave]);
  salvar(dados);
}

module.exports = { adicionarXP, obterXP, leaderboard, nivelAtual, xpParaNivel, resetarXP };
