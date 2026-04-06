const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const xpService = require('../../services/xpService');
const axios = require('axios');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Exibe seu rank de XP ou o de outro usuário')
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('Usuário para ver o rank')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const alvo = interaction.options.getUser('usuario') || interaction.user;
    const { xp, nivel, xpNivel, xpProximoNivel } = xpService.obterXP(alvo.id, interaction.guild.id);

    // Posição no leaderboard
    const lb = xpService.leaderboard(interaction.guild.id, 100);
    const posicao = lb.findIndex(e => e.userId === alvo.id) + 1;

    try {
      // ─── CANVAS RANK CARD ─────────────────────────────────────────────
      const W = 800, H = 200;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext('2d');

      // Fundo
      const fundo = ctx.createLinearGradient(0, 0, W, H);
      fundo.addColorStop(0, '#1a1b2e');
      fundo.addColorStop(1, '#16213e');
      ctx.fillStyle = fundo;
      ctx.roundRect(0, 0, W, H, 16);
      ctx.fill();

      // Avatar
      const avatarUrl = alvo.displayAvatarURL({ format: 'png', size: 128 });
      const { data: imgData } = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      const avatarImg = await loadImage(Buffer.from(imgData));

      ctx.save();
      ctx.beginPath();
      ctx.arc(100, H / 2, 65, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, 35, H / 2 - 65, 130, 130);
      ctx.restore();

      // Borda avatar
      ctx.beginPath();
      ctx.arc(100, H / 2, 68, 0, Math.PI * 2);
      ctx.strokeStyle = '#EB459E';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Nome
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(alvo.username.substring(0, 18), 190, 65);

      // Nível e posição
      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#EB459E';
      ctx.fillText(`Nível ${nivel}`, 190, 95);
      ctx.fillStyle = '#949ba4';
      ctx.fillText(posicao > 0 ? `#${posicao} no ranking` : 'Sem ranking', 300, 95);

      // XP texto
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#949ba4';
      ctx.fillText(`${xpNivel} / ${xpProximoNivel} XP`, W - 160, 95);

      // Barra de progresso (fundo)
      const barX = 190, barY = 115, barW = W - 230, barH = 18;
      ctx.fillStyle = '#2b2d31';
      ctx.roundRect(barX, barY, barW, barH, 9);
      ctx.fill();

      // Barra de progresso (preenchimento)
      const pct = Math.min(xpNivel / xpProximoNivel, 1);
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      barGrad.addColorStop(0, '#5865F2');
      barGrad.addColorStop(1, '#EB459E');
      ctx.fillStyle = barGrad;
      ctx.roundRect(barX, barY, Math.max(barW * pct, 18), barH, 9);
      ctx.fill();

      // XP total
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#949ba4';
      ctx.fillText(`XP Total: ${xp}`, barX, barY + barH + 22);

      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });

      await interaction.editReply({ files: [attachment] });

    } catch (err) {
      console.error(err);
      // Fallback em embed se canvas falhar
      const { xpEmbed } = require('../../utils/embed');
      await interaction.editReply({
        embeds: [xpEmbed({ usuario: alvo, xp, nivel, xpProximoNivel, posicao })],
      });
    }
  },
};
