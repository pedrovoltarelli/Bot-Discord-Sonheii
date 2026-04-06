/**
 * Script para registrar os Slash Commands no Discord.
 *
 * USO:
 *   node src/deploy-commands.js           → Registra no servidor (GUILD_ID) — imediato
 *   node src/deploy-commands.js --global  → Registra globalmente — até 1h de delay
 */

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

const isGlobal = process.argv.includes('--global');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  if (!fs.statSync(folderPath).isDirectory()) continue;

  const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(folderPath, file));
    if (command?.data) {
      commands.push(command.data.toJSON());
      logger.info(`Comando encontrado: /${command.data.name}`);
    }
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    logger.info(`Registrando ${commands.length} comando(s) ${isGlobal ? 'globalmente' : 'no servidor'}...`);

    let data;
    if (isGlobal) {
      data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
    } else {
      data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
    }

    logger.success(`✅ ${data.length} comando(s) registrado(s) com sucesso!`);
  } catch (error) {
    logger.error(`Erro ao registrar comandos: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
})();
