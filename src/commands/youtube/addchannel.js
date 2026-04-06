const { SlashCommandBuilder } = require('discord.js');
const youtubeService = require('../../services/youtubeService');
const { sucesso, erro } = require('../../utils/embed');
const { isAdmin } = require('../../utils/permissions');
const axios = require('axios');
const xml2js = require('xml2js');

/**
 * Extrai o ID do canal YouTube a partir de URL ou ID direto.
 * Suporta: @handle, /channel/ID, /c/slug, ID bruto
 */
async function resolverChannelId(entrada) {
  entrada = entrada.trim();

  // Se parece ser um ID direto (UC...)
  if (/^UC[\w-]{22}$/.test(entrada)) return entrada;

  // Tenta extrair de URL
  const matchDireto = entrada.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  if (matchDireto) return matchDireto[1];

  // Handle @usuario — precisa fazer uma requisição ao RSS para ver se funciona
  const handleMatch = entrada.match(/youtube\.com\/@([\w.-]+)|^@([\w.-]+)$/);
  if (handleMatch) {
    const handle = handleMatch[1] || handleMatch[2];
    try {
      const url = `https://www.youtube.com/@${handle}`;
      const res = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const match = res.data.match(/"channelId":"(UC[\w-]{22})"/);
      if (match) return match[1];
    } catch {}
  }

  return null;
}

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('addchannel')
    .setDescription('Adiciona um canal do YouTube para monitorar')
    .addStringOption(opt =>
      opt.setName('canal')
        .setDescription('ID, URL ou @handle do canal do YouTube')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        embeds: [erro('Sem Permissão', 'Apenas administradores podem configurar canais do YouTube.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const entrada = interaction.options.getString('canal');
    const channelId = await resolverChannelId(entrada);

    if (!channelId) {
      return interaction.editReply({
        embeds: [erro('Canal Inválido', 'Não foi possível identificar o canal do YouTube. Use um ID (`UCxxxx`), URL ou @handle.')],
      });
    }

    // Verifica se o canal existe via RSS
    try {
      const rss = await axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { timeout: 10000 });
      const parser = new xml2js.Parser({ explicitArray: false });
      const dados = await parser.parseStringPromise(rss.data);
      const nomeCanal = dados?.feed?.title || channelId;

      const adicionado = youtubeService.adicionarCanal(channelId);

      if (!adicionado) {
        return interaction.editReply({
          embeds: [erro('Já Monitorado', `O canal **${nomeCanal}** já está sendo monitorado.`)],
        });
      }

      return interaction.editReply({
        embeds: [sucesso('Canal Adicionado', `✅ Agora monitorando: **${nomeCanal}**\n\nNovas notificações serão enviadas em <#${process.env.YOUTUBE_NOTIFY_CHANNEL_ID || '?'}>.`)],
      });

    } catch {
      return interaction.editReply({
        embeds: [erro('Canal Inválido', 'Não foi possível acessar o feed RSS deste canal. Verifique o ID.')],
      });
    }
  },
};
