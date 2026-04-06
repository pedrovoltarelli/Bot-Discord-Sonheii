const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',

  async execute(member) {
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    if (!welcomeChannelId) return;

    const canal = member.guild.channels.cache.get(welcomeChannelId);
    if (!canal) return;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('👋 Bem-vindo(a)!')
      .setDescription(
        `Olá ${member}! Seja muito bem-vindo(a) ao **${member.guild.name}**!\n\n` +
        `🎟️ Abra um ticket com \`/ticket\` se precisar de ajuda.\n` +
        `⭐ Ganhe XP conversando e suba no ranking!`
      )
      .setThumbnail(member.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Membro #${member.guild.memberCount}` })
      .setTimestamp();

    canal.send({ embeds: [embed] }).catch(() => {});
  },
};
