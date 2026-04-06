const { SlashCommandBuilder } = require('discord.js');
const youtubeService = require('../../services/youtubeService');
const { sucesso, erro, info } = require('../../utils/embed');
const { isAdmin } = require('../../utils/permissions');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('removechannel')
    .setDescription('Remove ou lista canais do YouTube monitorados')
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove um canal do monitoramento')
        .addStringOption(opt =>
          opt.setName('channel_id').setDescription('ID do canal YouTube (UCxxxx)').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('lista').setDescription('Lista todos os canais monitorados')
    ),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        embeds: [erro('Sem Permissão', 'Apenas administradores podem configurar canais do YouTube.')],
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'lista') {
      const canais = youtubeService.listarCanais();

      if (canais.length === 0) {
        return interaction.reply({
          embeds: [info('Nenhum Canal', 'Nenhum canal do YouTube está sendo monitorado.\nUse `/addchannel` para adicionar.')],
          ephemeral: true,
        });
      }

      const lista = canais.map((id, i) =>
        `${i + 1}. \`${id}\` — [Ver canal](https://youtube.com/channel/${id})`
      ).join('\n');

      return interaction.reply({
        embeds: [info('Canais Monitorados', `**${canais.length} canal(is) ativo(s):**\n\n${lista}`)],
        ephemeral: true,
      });
    }

    if (sub === 'remove') {
      const channelId = interaction.options.getString('channel_id');
      const removido = youtubeService.removerCanal(channelId);

      if (!removido) {
        return interaction.reply({
          embeds: [erro('Não Encontrado', `Canal \`${channelId}\` não está na lista de monitoramento.`)],
          ephemeral: true,
        });
      }

      return interaction.reply({
        embeds: [sucesso('Canal Removido', `✅ Canal \`${channelId}\` removido do monitoramento com sucesso.`)],
        ephemeral: true,
      });
    }
  },
};
