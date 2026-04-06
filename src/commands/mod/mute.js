const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logMod, erro, sucesso } = require('../../utils/embed');
const { parseTime, formatTime } = require('../../utils/parseTime');
const logger = require('../../utils/logger');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Aplica timeout (mute) em um usuário')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuário a ser mutado').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('tempo')
        .setDescription('Duração (ex: 10m, 1h, 2d)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('motivo').setDescription('Motivo do mute').setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const alvo = interaction.options.getMember('usuario');
    const tempoStr = interaction.options.getString('tempo');
    const motivo = interaction.options.getString('motivo') || 'Nenhum motivo informado';

    const tempoMs = parseTime(tempoStr);

    if (!tempoMs) {
      return interaction.editReply({
        embeds: [erro('Tempo Inválido', 'Use formatos como: `10s`, `5m`, `2h`, `1d`')],
      });
    }

    // Discord limita timeout em 28 dias
    const MAX_MS = 28 * 24 * 60 * 60 * 1000;
    if (tempoMs > MAX_MS) {
      return interaction.editReply({
        embeds: [erro('Tempo Excedido', 'O tempo máximo de timeout é **28 dias**.')],
      });
    }

    if (!alvo) {
      return interaction.editReply({ embeds: [erro('Usuário não Encontrado', 'O usuário não está neste servidor.')] });
    }

    if (alvo.id === interaction.user.id) {
      return interaction.editReply({ embeds: [erro('Erro', 'Você não pode mutar a si mesmo.')] });
    }

    if (!alvo.moderatable) {
      return interaction.editReply({ embeds: [erro('Sem Permissão', 'Não consigo moderar este usuário.')] });
    }

    try {
      await alvo.timeout(tempoMs, `${motivo} | Por: ${interaction.user.tag}`);

      const duracaoFormatada = formatTime(tempoMs);
      logger.info(`[MUTE] ${alvo.user.tag} mutado por ${interaction.user.tag} por ${duracaoFormatada}`);

      // Log no canal de moderação
      const logChannelId = process.env.LOG_CHANNEL_ID;
      if (logChannelId) {
        const logCanal = interaction.guild.channels.cache.get(logChannelId);
        if (logCanal) {
          await logCanal.send({
            embeds: [logMod({
              acao: 'Mute (Timeout)',
              usuario: alvo.user,
              moderador: interaction.user,
              motivo,
              duracao: duracaoFormatada,
            })],
          }).catch(() => {});
        }
      }

      await interaction.editReply({
        embeds: [sucesso('Mute Aplicado',
          `${alvo} foi silenciado por **${duracaoFormatada}**.\n📋 Motivo: ${motivo}`
        )],
      });

    } catch (err) {
      logger.error(`[MUTE] Erro: ${err.message}`);
      await interaction.editReply({ embeds: [erro('Erro ao Mutar', err.message)] });
    }
  },
};
