/**
 * Factory de embeds padronizados.
 * Garante consistência visual em todo o bot.
 */

const { EmbedBuilder } = require('discord.js');

// Paleta de cores do bot
const CORES = {
  primaria:  0x5865F2, // Azul Discord
  sucesso:   0x57F287, // Verde
  erro:      0xED4245, // Vermelho
  aviso:     0xFEE75C, // Amarelo
  info:      0x5865F2, // Azul
  ticket:    0x2B2D31, // Escuro
  xp:        0xEB459E, // Rosa
  moderacao: 0xED4245, // Vermelho
};

/**
 * Embed de sucesso
 */
function sucesso(titulo, descricao, campos = []) {
  return new EmbedBuilder()
    .setColor(CORES.sucesso)
    .setTitle(`✅ ${titulo}`)
    .setDescription(descricao)
    .addFields(campos)
    .setTimestamp();
}

/**
 * Embed de erro
 */
function erro(titulo, descricao) {
  return new EmbedBuilder()
    .setColor(CORES.erro)
    .setTitle(`❌ ${titulo}`)
    .setDescription(descricao)
    .setTimestamp();
}

/**
 * Embed informativo
 */
function info(titulo, descricao, campos = []) {
  return new EmbedBuilder()
    .setColor(CORES.info)
    .setTitle(`ℹ️ ${titulo}`)
    .setDescription(descricao)
    .addFields(campos)
    .setTimestamp();
}

/**
 * Embed de aviso
 */
function aviso(titulo, descricao) {
  return new EmbedBuilder()
    .setColor(CORES.aviso)
    .setTitle(`⚠️ ${titulo}`)
    .setDescription(descricao)
    .setTimestamp();
}

/**
 * Embed de moderação (log)
 */
function logMod({ acao, usuario, moderador, motivo, duracao }) {
  const embed = new EmbedBuilder()
    .setColor(CORES.moderacao)
    .setTitle(`🔨 Ação de Moderação — ${acao}`)
    .addFields(
      { name: '👤 Usuário', value: `${usuario.tag} (${usuario.id})`, inline: true },
      { name: '🛡️ Moderador', value: `${moderador.tag}`, inline: true },
      { name: '📋 Motivo', value: motivo || 'Nenhum motivo informado', inline: false },
    )
    .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  if (duracao) embed.addFields({ name: '⏱️ Duração', value: duracao, inline: true });

  return embed;
}

/**
 * Embed de XP / rank
 */
function xpEmbed({ usuario, xp, nivel, xpProximoNivel, posicao }) {
  return new EmbedBuilder()
    .setColor(CORES.xp)
    .setTitle(`⭐ Rank de ${usuario.username}`)
    .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '🏅 Nível', value: `${nivel}`, inline: true },
      { name: '✨ XP Total', value: `${xp}`, inline: true },
      { name: '🎯 Próximo Nível', value: `${xpProximoNivel} XP`, inline: true },
      { name: '🏆 Posição', value: posicao ? `#${posicao}` : 'N/A', inline: true },
    )
    .setTimestamp();
}

module.exports = { sucesso, erro, info, aviso, logMod, xpEmbed, CORES };
