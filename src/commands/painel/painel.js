const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isAdmin } = require('../../utils/permissions');

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Envia o painel de categorias com botões de criação de canal'),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        content: '❌ Apenas administradores podem usar este comando.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📂 Painel de Categorias')
      .setDescription(
        'Selecione o tipo de atendimento desejado clicando em um dos botões abaixo.\n\n' +
        '🔧 **Suporte** — Problemas técnicos e dúvidas gerais\n' +
        '❓ **Dúvidas** — Perguntas sobre o servidor\n' +
        '🤝 **Parcerias** — Solicitações de parceria'
      )
      .setFooter({
        text: interaction.guild.name,
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setTimestamp();

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('painel_suporte')
        .setLabel('Suporte')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔧'),
      new ButtonBuilder()
        .setCustomId('painel_duvidas')
        .setLabel('Dúvidas')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❓'),
      new ButtonBuilder()
        .setCustomId('painel_parcerias')
        .setLabel('Parcerias')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🤝'),
    );

    await interaction.reply({ content: '✅ Painel enviado!', ephemeral: true });
    await interaction.channel.send({ embeds: [embed] });
    await interaction.channel.send({ components: [botoes] });
  },
};
