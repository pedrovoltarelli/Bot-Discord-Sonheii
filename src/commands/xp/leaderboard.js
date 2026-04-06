const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const xpService = require('../../services/xpService');

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Exibe o ranking de XP do servidor (Top 10)')
    .addIntegerOption(opt =>
      opt.setName('limite')
        .setDescription('Quantidade de usuários (máx 25)')
        .setMinValue(5)
        .setMaxValue(25)
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const limite = interaction.options.getInteger('limite') || 10;
    const ranking = xpService.leaderboard(interaction.guild.id, limite);

    if (ranking.length === 0) {
      return interaction.editReply({ content: '❌ Nenhum dado de XP encontrado neste servidor.' });
    }

    const medalhas = ['🥇', '🥈', '🥉'];

    const linhas = await Promise.all(
      ranking.map(async (entry, i) => {
        const usuario = await interaction.client.users.fetch(entry.userId).catch(() => null);
        const nome = usuario ? usuario.username : `ID: ${entry.userId}`;
        const medalha = medalhas[i] ?? `**${i + 1}.**`;
        return `${medalha} **${nome}** — Nível ${entry.nivel} (${entry.xp} XP)`;
      })
    );

    const embed = new EmbedBuilder()
      .setColor(0xEB459E)
      .setTitle(`🏆 Leaderboard de XP — ${interaction.guild.name}`)
      .setDescription(linhas.join('\n'))
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: `Top ${ranking.length} membros` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
