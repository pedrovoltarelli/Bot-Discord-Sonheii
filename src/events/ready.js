const logger = require('../utils/logger');
const youtubeService = require('../services/youtubeService');

module.exports = {
  name: 'ready',
  once: true,

  async execute(client) {
    logger.success(`Bot conectado como ${client.user.tag}`);
    logger.info(`Servidores: ${client.guilds.cache.size}`);

    // Define o status/atividade do bot
    client.user.setPresence({
      activities: [{ name: '/ticket | /rank | /ban', type: 3 }], // WATCHING
      status: 'online',
    });

    // Inicia o monitoramento de YouTube
    youtubeService.iniciar(client);
  },
};
