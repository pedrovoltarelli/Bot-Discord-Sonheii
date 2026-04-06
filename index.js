require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const path = require('path');
const fs = require('fs');
const logger = require('./src/utils/logger');

// ─── CLIENTE ───────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

// Coleções de comandos e cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// ─── HANDLER DE COMANDOS ───────────────────────────────────────────────────
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  if (!fs.statSync(folderPath).isDirectory()) continue;

  const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(folderPath, file));

    if (!command?.data || !command?.execute) {
      logger.warn(`[COMANDOS] Arquivo ${file} não tem "data" ou "execute" — ignorado.`);
      continue;
    }

    client.commands.set(command.data.name, command);
    logger.info(`[COMANDOS] /${command.data.name} carregado.`);
  }
}

// ─── HANDLER DE EVENTOS ────────────────────────────────────────────────────
const eventsPath = path.join(__dirname, 'src', 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));

  if (!event?.name || !event?.execute) {
    logger.warn(`[EVENTOS] Arquivo ${file} não tem "name" ou "execute" — ignorado.`);
    continue;
  }

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }

  logger.info(`[EVENTOS] Evento "${event.name}" registrado.`);
}

// ─── TRATAMENTO GLOBAL DE ERROS ────────────────────────────────────────────
process.on('unhandledRejection', (error) => {
  logger.error(`[UNHANDLED REJECTION] ${error.message}`);
  console.error(error);
});

process.on('uncaughtException', (error) => {
  logger.error(`[UNCAUGHT EXCEPTION] ${error.message}`);
  console.error(error);
  process.exit(1);
});

// ─── LOGIN ─────────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);
