const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logMod, erro } = require('../../utils/embed');
const logger = require('../../utils/logger');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um usuário do servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuário a ser banido').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('motivo').setDescription('Motivo do ban').setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('dias_mensagens')
        .setDescription('Deletar mensagens dos últimos X dias (0-7)')
        .setMinValue(0).setMaxValue(7).setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const alvo = interaction.options.getMember('usuario');
    const motivo = interaction.options.getString('motivo') || 'Nenhum motivo informado';
    const diasMensagens = interaction.options.getInteger('dias_mensagens') ?? 0;

    if (!alvo) {
      return interaction.editReply({ embeds: [erro('Usuário não Encontrado', 'O usuário especificado não está neste servidor.')] });
    }

    // Proteções
    if (alvo.id === interaction.user.id) {
      return interaction.editReply({ embeds: [erro('Erro', 'Você não pode banir a si mesmo.')] });
    }
    if (!alvo.bannable) {
      return interaction.editReply({ embeds: [erro('Sem Permissão', 'Não consigo banir este usuário. Ele pode ter um cargo superior ao meu.')] });
    }

    try {
      // DM antes de banir
      await alvo.send({
        content: `⛔ Você foi banido de **${interaction.guild.name}**.\n📋 Motivo: ${motivo}`,
      }).catch(() => {});

      await alvo.ban({
        deleteMessageDays: diasMensagens,
        reason: `${motivo} | Por: ${interaction.user.tag}`,
      });

      logger.info(`[BAN] ${alvo.user.tag} banido por ${interaction.user.tag} — Motivo: ${motivo}`);

      // Log no canal de moderação
      const logChannelId = process.env.LOG_CHANNEL_ID;
      if (logChannelId) {
        const logCanal = interaction.guild.channels.cache.get(logChannelId);
        if (logCanal) {
          await logCanal.send({
            embeds: [logMod({
              acao: 'Ban',
              usuario: alvo.user,
              moderador: interaction.user,
              motivo,
            })],
          }).catch(() => {});
        }
      }

      await interaction.editReply({
        content: `✅ **${alvo.user.tag}** foi banido com sucesso.\n📋 Motivo: ${motivo}`,
      });

    } catch (err) {
      logger.error(`[BAN] Erro: ${err.message}`);
      await interaction.editReply({ embeds: [erro('Erro ao Banir', err.message)] });
    }
  },
};
