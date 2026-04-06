/**
 * Sistema de cooldown reutilizável.
 * Usa Collection do discord.js para controle por comando e usuário.
 */

const { Collection } = require('discord.js');

// Map: commandName → Collection<userId, timestamp>
const cooldowns = new Collection();

/**
 * Verifica se o usuário está em cooldown para o comando.
 * @param {string} commandName - Nome do comando
 * @param {string} userId - ID do usuário
 * @param {number} cooldownSeconds - Duração do cooldown em segundos
 * @returns {{ onCooldown: boolean, remaining: number }}
 */
function checkCooldown(commandName, userId, cooldownSeconds) {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(commandName);
  const cooldownAmount = cooldownSeconds * 1000;

  if (timestamps.has(userId)) {
    const expiration = timestamps.get(userId) + cooldownAmount;
    if (now < expiration) {
      const remaining = ((expiration - now) / 1000).toFixed(1);
      return { onCooldown: true, remaining: parseFloat(remaining) };
    }
  }

  return { onCooldown: false, remaining: 0 };
}

/**
 * Define o timestamp do cooldown para o usuário.
 * Limpa automaticamente após expiração.
 */
function setCooldown(commandName, userId, cooldownSeconds) {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Collection());
  }

  const timestamps = cooldowns.get(commandName);
  timestamps.set(userId, Date.now());

  setTimeout(() => timestamps.delete(userId), cooldownSeconds * 1000);
}

module.exports = { checkCooldown, setCooldown };
