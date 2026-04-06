const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Envia o painel de tickets no canal (ADM)'),

  async execute(interaction) {
    // Apenas admins podem enviar o painel
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: '❌ Apenas administradores podem enviar o painel.', ephemeral: true });
    }

    const bannerPath = path.join(__dirname, '../../../fotos/tickett-1.png');
    const attachment = new AttachmentBuilder(bannerPath, { name: 'banner.png' });

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎫 Central de Atendimento')
      .setDescription(
        'Selecione a categoria do seu ticket abaixo para iniciar o atendimento.\n\n' +
        '📋 **Recrutamento** — Faça parte da nossa equipe\n' +
        '🤝 **Parcerias** — Solicitações de parceria\n' +
        '🏷️ **Solicitar Tag** — Solicite uma tag do servidor\n' +
        '❓ **Dúvidas** — Perguntas e informações\n' +
        '⚠️ **Reclamações** — Denúncias e feedbacks\n\n' +
        '⏱️ **Atendimento:** Nossa equipe responderá assim que possível.'
      )
      .setImage('attachment://banner.png')
      .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_selecionar_tipo')
        .setPlaceholder('Selecione uma categoria...')
        .addOptions([
          {
            label: 'Recrutamento',
            description: 'Interesse em fazer parte do staff',
            value: 'recrutamento',
            emoji: '📋',
          },
          {
            label: 'Parcerias',
            description: 'Solicitações de parceria com o servidor',
            value: 'parcerias',
            emoji: '🤝',
          },
          {
            label: 'Solicitar Tag',
            description: 'Solicitar uma tag do servidor',
            value: 'solicitar_tag',
            emoji: '🏷️',
          },
          {
            label: 'Dúvidas',
            description: 'Perguntas gerais sobre o servidor',
            value: 'duvidas',
            emoji: '❓',
          },
          {
            label: 'Reclamações',
            description: 'Denúncias e reclamações',
            value: 'reclamacoes',
            emoji: '⚠️',
          },
        ]),
    );

    await interaction.reply({ content: '✅ Painel enviado!', ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [row], files: [attachment] });
  },
};
