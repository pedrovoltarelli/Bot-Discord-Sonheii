const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');

const YT_FILE = path.join(__dirname, '../../data/youtube.json');
const INTERVALO_MS = 5 * 60 * 1000; // 5 minutos

// ─── PERSISTÊNCIA ─────────────────────────────────────────────────────────
function carregar() {
  if (!fs.existsSync(YT_FILE)) return { canais: [], ultimosVideos: {} };
  try { return JSON.parse(fs.readFileSync(YT_FILE, 'utf8')); }
  catch { return { canais: [], ultimosVideos: {} }; }
}

function salvar(dados) {
  fs.mkdirSync(path.dirname(YT_FILE), { recursive: true });
  fs.writeFileSync(YT_FILE, JSON.stringify(dados, null, 2), 'utf8');
}

// ─── RSS FEED ─────────────────────────────────────────────────────────────
async function buscarUltimoVideo(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const parser = new xml2js.Parser({ explicitArray: false });
    const resultado = await parser.parseStringPromise(res.data);

    const entrada = resultado?.feed?.entry;
    if (!entrada) return null;

    // RSS pode retornar array ou objeto único
    const primeiro = Array.isArray(entrada) ? entrada[0] : entrada;

    return {
      id: primeiro['yt:videoId'],
      titulo: primeiro.title,
      link: primeiro.link?.['$']?.href || `https://youtu.be/${primeiro['yt:videoId']}`,
      thumbnail: `https://img.youtube.com/vi/${primeiro['yt:videoId']}/maxresdefault.jpg`,
      canal: primeiro.author?.name || 'Canal Desconhecido',
      publicado: primeiro.published,
    };
  } catch (err) {
    logger.warn(`[YOUTUBE] Erro ao buscar RSS de ${channelId}: ${err.message}`);
    return null;
  }
}

// ─── VERIFICAÇÃO ──────────────────────────────────────────────────────────
async function verificar(client) {
  const dados = carregar();
  const notifyChannelId = process.env.YOUTUBE_NOTIFY_CHANNEL_ID;

  if (!notifyChannelId || dados.canais.length === 0) return;

  const canal = client.channels.cache.get(notifyChannelId);
  if (!canal) return;

  for (const channelId of dados.canais) {
    const video = await buscarUltimoVideo(channelId);
    if (!video) continue;

    const ultimoId = dados.ultimosVideos[channelId];

    if (ultimoId !== video.id) {
      dados.ultimosVideos[channelId] = video.id;
      salvar(dados);

      if (ultimoId) {
        // Só notifica se já havia um vídeo anterior (evita spam no início)
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setAuthor({ name: `📺 ${video.canal}`, iconURL: 'https://www.youtube.com/favicon.ico' })
          .setTitle(`🎬 Novo vídeo: ${video.titulo}`)
          .setURL(video.link)
          .setImage(video.thumbnail)
          .addFields({ name: '🔗 Assistir agora', value: video.link })
          .setTimestamp(new Date(video.publicado));

        canal.send({ content: `🔔 **Novo vídeo publicado!**`, embeds: [embed] }).catch(() => {});
        logger.info(`[YOUTUBE] Novo vídeo detectado: ${video.titulo}`);
      }
    }
  }
}

// ─── INICIALIZAÇÃO ────────────────────────────────────────────────────────
function iniciar(client) {
  const dados = carregar();
  if (dados.canais.length === 0) {
    logger.info('[YOUTUBE] Nenhum canal configurado ainda. Use /addchannel.');
    return;
  }

  logger.info(`[YOUTUBE] Monitorando ${dados.canais.length} canal(is). Intervalo: 5min`);

  // Primeira verificação após 30s, depois a cada 5 min
  setTimeout(() => {
    verificar(client);
    setInterval(() => verificar(client), INTERVALO_MS);
  }, 30_000);
}

// ─── CRUD DE CANAIS ───────────────────────────────────────────────────────
function adicionarCanal(channelId) {
  const dados = carregar();
  if (dados.canais.includes(channelId)) return false;
  dados.canais.push(channelId);
  salvar(dados);
  return true;
}

function removerCanal(channelId) {
  const dados = carregar();
  const idx = dados.canais.indexOf(channelId);
  if (idx === -1) return false;
  dados.canais.splice(idx, 1);
  delete dados.ultimosVideos[channelId];
  salvar(dados);
  return true;
}

function listarCanais() {
  return carregar().canais;
}

module.exports = { iniciar, adicionarCanal, removerCanal, listarCanais };
