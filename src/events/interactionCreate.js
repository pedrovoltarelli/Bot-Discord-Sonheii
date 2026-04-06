const { InteractionType, ComponentType } = require('discord.js');
const { checkCooldown, setCooldown } = require('../utils/cooldown');
const { erro, aviso } = require('../utils/embed');
const ticketService = require('../services/ticketService');
const logger = require('../utils/logger');

// Tipos válidos de ticket
const TICKET_TIPOS = ['recrutamento', 'parcerias', 'solicitar_tag', 'duvidas', 'reclamacoes'];

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    // ─── SLASH COMMANDS ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`Comando /${interaction.commandName} não encontrado.`);
        return interaction.reply({ embeds: [erro('Erro', 'Comando não encontrado.')], ephemeral: true });
      }

      // Verificação de cooldown
      const cooldownSec = command.cooldown ?? 3;
      const { onCooldown, remaining } = checkCooldown(command.data.name, interaction.user.id, cooldownSec);

      if (onCooldown) {
        return interaction.reply({
          embeds: [aviso('Cooldown Ativo', `Aguarde **${remaining}s** para usar este comando novamente.`)],
          ephemeral: true,
        });
      }

      setCooldown(command.data.name, interaction.user.id, cooldownSec);

      try {
        await command.execute(interaction, client);
      } catch (error) {
        logger.error(`Erro em /${interaction.commandName}: ${error.message}`);
        console.error(error);

        const resposta = { embeds: [erro('Erro Interno', 'Ocorreu um erro ao executar o comando.')], ephemeral: true };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(resposta).catch(() => {});
        } else {
          await interaction.reply(resposta).catch(() => {});
        }
      }
    }

    // ─── BOTÕES ──────────────────────────────────────────────────────────────
    if (interaction.isButton()) {
      const { customId } = interaction;

      try {
        // Ticket: fechar
        if (customId === 'ticket_fechar') {
          await ticketService.fecharTicket(interaction);
          return;
        }

        // Painel: botões de categoria
        if (customId.startsWith('painel_')) {
          const tipo = customId.replace('painel_', '');
          await criarCanalCategoria(interaction, tipo);
          return;
        }

        // Resetar XP: botões de confirmação
        if (customId === 'confirm_reset_xp' || customId === 'cancel_reset_xp') {
          return;
        }
      } catch (error) {
        logger.error(`Erro em botão "${customId}": ${error.message}`);
        console.error(error);

        const resposta = { embeds: [erro('Erro', 'Ocorreu um erro ao processar esta ação.')], ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(resposta).catch(() => {});
        } else {
          await interaction.reply(resposta).catch(() => {});
        }
      }
    }

    // ─── MENUS DE SELEÇÃO ────────────────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      const { customId, values } = interaction;

      try {
        if (customId === 'ticket_selecionar_tipo') {
          const tipo = values[0];
          if (TICKET_TIPOS.includes(tipo)) {
            await ticketService.criarTicket(interaction, tipo);
          } else {
            await interaction.reply({ content: '❌ Tipo de ticket inválido.', ephemeral: true });
          }
          return;
        }
      } catch (error) {
        logger.error(`Erro em menu "${customId}": ${error.message}`);
        console.error(error);
        const resposta = { embeds: [erro('Erro', 'Ocorreu um erro ao processar esta ação.')], ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(resposta).catch(() => {});
        } else {
          await interaction.reply(resposta).catch(() => {});
        }
      }
    }
  },
};

/**
 * Cria um canal temporário em uma categoria do painel.
 */
async function criarCanalCategoria(interaction, tipo) {
  await interaction.deferReply({ ephemeral: true });

  const mapa = {
    suporte:        { env: 'CATEGORY_SUPORTE_ID',        nome: 'suporte' },
    duvidas:        { env: 'CATEGORY_DUVIDAS_ID',        nome: 'duvidas' },
    parcerias:      { env: 'CATEGORY_PARCERIAS_ID',      nome: 'parcerias' },
    solicitar_tag:  { env: 'CATEGORY_SOLICITAR_TAG_ID', nome: 'solicitar-tag' },
  };

  const config = mapa[tipo];
  if (!config) return interaction.editReply({ content: '❌ Tipo inválido.' });

  const categoryId = process.env[config.env];
  const guild = interaction.guild;

  try {
    const canal = await guild.channels.create({
      name: `${config.nome}-${interaction.user.username}`,
      parent: categoryId || null,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: ['ViewChannel'] },
        { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
      ],
    });

    const { sucesso } = require('../utils/embed');
    await interaction.editReply({
      embeds: [sucesso('Canal Criado', `Seu canal foi criado: ${canal}`)],
    });
  } catch (err) {
    logger.error(`Erro ao criar canal de painel: ${err.message}`);
    await interaction.editReply({ content: '❌ Não foi possível criar o canal.' });
  }
}
