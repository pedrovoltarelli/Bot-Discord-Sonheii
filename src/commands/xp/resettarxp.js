const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetar-xp')
    .setDescription('Reseta o XP de todos os usuários do servidor (ADM)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Apenas administradores podem usar este comando.', ephemeral: true });
    }

    const xpService = require('../../services/xpService');
    const { sucesso } = require('../../utils/embed');
    const guildId = interaction.guild.id;

    const confirm = await interaction.reply({
      content: '⚠️ **Confirmar reset de XP?**\n\nIsso irá zerar o XP de **todos** os membros do servidor. Esta ação não pode ser desfeita.',
      components: [
        {
          type: 1,
          components: [
            { customId: 'confirm_reset_xp', label: '✅ Confirmar', style: 3 },
            { customId: 'cancel_reset_xp', label: '❌ Cancelar', style: 4 },
          ],
        },
      ],
      ephemeral: true,
      fetchReply: true,
    });

    const filtro = (i) => i.customId === 'confirm_reset_xp' || i.customId === 'cancel_reset_xp';
    const coletor = confirm.createMessageComponentCollector({ filtro, time: 30000 });

    coletor.on('collect', async (i) => {
      if (i.customId === 'cancel_reset_xp') {
        await i.update({ content: '❌ Reset cancelado.', components: [] });
        coletor.stop();
        return;
      }

      if (i.customId === 'confirm_reset_xp') {
        xpService.resetarXP(guildId);
        await i.update({
          content: '',
          embeds: [sucesso('XP Resetado', 'O XP de todos os membros foi zerado com sucesso.')],
          components: [],
        });
        coletor.stop();
      }
    });

    coletor.on('end', (coletado) => {
      if (!coletado) {
        interaction.editReply({ content: '⏰ Tempo esgotado. Cancelado.', components: [] }).catch(() => {});
      }
    });
  },
};
