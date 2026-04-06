const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const axios = require('axios');

module.exports = {
  cooldown: 15,
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Gera um banner personalizado com seu avatar')
    .addStringOption(opt =>
      opt.setName('texto')
        .setDescription('Texto personalizado para o banner')
        .setMaxLength(50)
        .setRequired(false)
    )
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('Usuário alvo (padrão: você mesmo)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const alvo = interaction.options.getUser('usuario') || interaction.user;
    const texto = interaction.options.getString('texto') || `Bem-vindo ao ${interaction.guild.name}!`;

    try {
      // ─── CANVAS ────────────────────────────────────────────────────────
      const largura = 900;
      const altura = 300;
      const canvas = createCanvas(largura, altura);
      const ctx = canvas.getContext('2d');

      // Fundo gradiente
      const grad = ctx.createLinearGradient(0, 0, largura, altura);
      grad.addColorStop(0, '#1a1b2e');
      grad.addColorStop(0.5, '#16213e');
      grad.addColorStop(1, '#0f3460');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, largura, altura);

      // Círculos decorativos de fundo
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#5865F2';
      ctx.beginPath(); ctx.arc(750, -50, 250, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(150, 350, 200, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Barra lateral colorida
      const barraGrad = ctx.createLinearGradient(0, 0, 0, altura);
      barraGrad.addColorStop(0, '#5865F2');
      barraGrad.addColorStop(1, '#EB459E');
      ctx.fillStyle = barraGrad;
      ctx.fillRect(0, 0, 8, altura);

      // Avatar (circular)
      const avatarUrl = alvo.displayAvatarURL({ format: 'png', size: 256 });
      const { data: imgData } = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      const avatarImg = await loadImage(Buffer.from(imgData));

      const avatarX = 60;
      const avatarY = altura / 2;
      const avatarR = 90;

      // Sombra do avatar
      ctx.save();
      ctx.shadowColor = '#5865F2';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(avatarX + avatarR, avatarY, avatarR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY - avatarR, avatarR * 2, avatarR * 2);
      ctx.restore();

      // Borda do avatar
      ctx.beginPath();
      ctx.arc(avatarX + avatarR, avatarY, avatarR + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#5865F2';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Nome do usuário
      const textoX = avatarX + avatarR * 2 + 30;
      ctx.font = 'bold 48px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(alvo.username, textoX, altura / 2 - 10);

      // Tag / discriminador (se houver)
      if (alvo.discriminator && alvo.discriminator !== '0') {
        ctx.font = '22px sans-serif';
        ctx.fillStyle = '#949ba4';
        ctx.fillText(`#${alvo.discriminator}`, textoX, altura / 2 + 25);
      }

      // Separator line
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(textoX, altura / 2 + 42);
      ctx.lineTo(largura - 40, altura / 2 + 42);
      ctx.stroke();

      // Texto customizado
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#dbdee1';
      const textoFinal = texto.length > 60 ? texto.substring(0, 57) + '...' : texto;
      ctx.fillText(textoFinal, textoX, altura / 2 + 72);

      // Tag do servidor
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#5865F2';
      ctx.fillText(`✦ ${interaction.guild.name}`, textoX, altura - 20);

      // Exporta
      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, { name: 'banner.png' });

      await interaction.editReply({ files: [attachment] });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌ Erro ao gerar o banner. Tente novamente.' });
    }
  },
};
