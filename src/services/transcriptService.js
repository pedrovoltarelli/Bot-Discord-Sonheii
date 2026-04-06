const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const TRANSCRIPTS_DIR = path.join(__dirname, '../../transcripts');

/**
 * Gera um transcript HTML do canal de ticket.
 * @param {TextChannel} canal - Canal do ticket
 * @param {Object} ticketData - Dados do ticket
 * @returns {string} Caminho do arquivo gerado
 */
async function gerarTranscript(canal, ticketData) {
  fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });

  // Busca até 500 mensagens
  const mensagens = [];
  let lastId = null;

  while (true) {
    const opcoes = { limit: 100 };
    if (lastId) opcoes.before = lastId;

    const batch = await canal.messages.fetch(opcoes);
    if (batch.size === 0) break;

    mensagens.push(...batch.values());
    lastId = batch.last().id;

    if (batch.size < 100) break;
    if (mensagens.length >= 500) break;
  }

  // Ordena cronologicamente
  mensagens.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const nome = `ticket-${canal.name}-${Date.now()}.html`;
  const caminho = path.join(TRANSCRIPTS_DIR, nome);

  const html = gerarHTML(canal, mensagens, ticketData);
  fs.writeFileSync(caminho, html, 'utf8');

  logger.info(`[TRANSCRIPT] Salvo: ${nome}`);
  return caminho;
}

function gerarHTML(canal, mensagens, ticketData) {
  const linhas = mensagens.map(msg => {
    const horario = new Date(msg.createdTimestamp).toLocaleString('pt-BR');
    const autor = escapeHtml(msg.author.tag);
    const avatar = msg.author.displayAvatarURL({ format: 'png', size: 32 });
    const conteudo = escapeHtml(msg.content || '');
    const embedsHTML = msg.embeds.map(e =>
      `<div class="embed"><strong>${escapeHtml(e.title || '')}</strong><p>${escapeHtml(e.description || '')}</p></div>`
    ).join('');

    return `
      <div class="message">
        <img class="avatar" src="${avatar}" alt="${autor}" />
        <div class="content">
          <span class="author">${autor}</span>
          <span class="time">${horario}</span>
          <p class="text">${conteudo}</p>
          ${embedsHTML}
        </div>
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Transcript — ${escapeHtml(canal.name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #1e1f22; color: #dbdee1; padding: 20px; }
    header { background: #2b2d31; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px; }
    header h1 { font-size: 1.2rem; color: #ffffff; }
    header p { font-size: 0.85rem; color: #949ba4; margin-top: 4px; }
    .message { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #2b2d31; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
    .content { flex: 1; }
    .author { font-weight: 600; color: #ffffff; margin-right: 8px; }
    .time { font-size: 0.75rem; color: #949ba4; }
    .text { margin-top: 4px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
    .embed { background: #2b2d31; border-left: 4px solid #5865f2; padding: 8px 12px; border-radius: 4px; margin-top: 6px; }
    .embed strong { color: #ffffff; }
    .embed p { color: #dbdee1; font-size: 0.9rem; margin-top: 4px; }
    footer { text-align: center; padding: 20px 0 0; color: #949ba4; font-size: 0.8rem; }
  </style>
</head>
<body>
  <header>
    <h1>📄 Transcript — #${escapeHtml(canal.name)}</h1>
    <p>Ticket ID: ${ticketData.channelId} | Criado por: ${ticketData.userId} | ${new Date(ticketData.criadoEm).toLocaleString('pt-BR')}</p>
    <p>Total de mensagens: ${mensagens.length}</p>
  </header>
  <main>${linhas}</main>
  <footer>Gerado automaticamente pelo bot</footer>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { gerarTranscript };
