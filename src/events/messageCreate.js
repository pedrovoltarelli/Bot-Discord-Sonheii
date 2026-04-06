const xpService = require('../services/xpService');
const { EmbedBuilder } = require('discord.js');

// Cooldown de XP por usuário (ms)
const XP_COOLDOWN_MS = 60_000; // 1 minuto
const xpCooldowns = new Map();

module.exports = {
  name: 'messageCreate',

  async execute(message) {
    // Ignora bots e DMs
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const agora = Date.now();

    // Verifica cooldown de XP
    const chave = `${guildId}:${userId}`;
    if (xpCooldowns.has(chave)) {
      const ultimo = xpCooldowns.get(chave);
      if (agora - ultimo < XP_COOLDOWN_MS) return;
    }

    xpCooldowns.set(chave, agora);

    // Adiciona XP aleatório (15-25 por mensagem)
    const xpGanho = Math.floor(Math.random() * 11) + 15;
    const resultado = await xpService.adicionarXP(userId, guildId, xpGanho);

    // Notifica level up
    if (resultado.levelUp) {
      const embed = new EmbedBuilder()
        .setColor(0xEB459E)
        .setTitle('🎉 Level Up!')
        .setDescription(
          `Parabéns ${message.author}! Você chegou ao **nível ${resultado.novoNivel}**! 🚀`
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      message.channel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
