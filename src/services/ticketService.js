const { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { ticketPermissions, isStaff } = require('../utils/permissions');
const transcriptService = require('./transcriptService');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const TICKETS_FILE = path.join(__dirname, '../../data/tickets.json');

// Mapa de tipos → emojis e labels legíveis
const TIPOS = {
  recrutamento:    { label: 'Recrutamento', emoji: '📋', cor: 0x5865F2 },
  parcerias:       { label: 'Parceria',     emoji: '🤝', cor: 0x57F287 },
  solicitar_tag:   { label: 'Solicitar Tag', emoji: '🏷️', cor: 0xEB459E },
  duvidas:         { label: 'Dúvida',       emoji: '❓', cor: 0xFEE75C },
  reclamacoes:     { label: 'Reclamação',   emoji: '⚠️', cor: 0xED4245 },
};

// ─── HELPERS DE PERSISTÊNCIA ────────────────────────────────────────────────
function carregarTickets() {
  if (!fs.existsSync(TICKETS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf8')); }
  catch { return {}; }
}

function salvarTickets(dados) {
  fs.mkdirSync(path.dirname(TICKETS_FILE), { recursive: true });
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(dados, null, 2), 'utf8');
}

// ─── LOG DE TICKET ───────────────────────────────────────────────────────────
async function enviarLog(guild, embed) {
  const logChannelId = process.env.LOG_CHANNEL_ID;
  if (!logChannelId) return;
  const canal = guild.channels.cache.get(logChannelId);
  if (canal) await canal.send({ embeds: [embed] }).catch(() => {});
}

// ─── CRIAR TICKET ────────────────────────────────────────────────────────────
async function criarTicket(interaction, tipo = 'duvidas') {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const usuario = interaction.user;
  const tickets = carregarTickets();
  const tipoConfig = TIPOS[tipo] || TIPOS.duvidas;

  // Verifica se já tem ticket aberto
  const jaAberto = Object.values(tickets).find(
    t => t.userId === usuario.id && t.guildId === guild.id && t.status === 'aberto'
  );

  if (jaAberto) {
    const canalExistente = guild.channels.cache.get(jaAberto.channelId);
    if (canalExistente) {
      return interaction.editReply({
        content: `❌ Você já tem um ticket aberto: ${canalExistente}`,
      });
    }
    // Canal foi deletado manualmente — limpa o registro
    delete tickets[jaAberto.channelId];
    salvarTickets(tickets);
  }

  const categoryId = process.env.TICKET_CATEGORY_ID;
  logger.info(`[TICKET] TICKET_CATEGORY_ID = "${categoryId}" (tipo: ${typeof categoryId})`);

  const permissoes = ticketPermissions(guild, usuario.id);

  try {
    const canal = await guild.channels.create({
      name: `${tipo}-${usuario.username}`,
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites: permissoes,
      topic: `${tipoConfig.emoji} Ticket de ${usuario.tag} | Tipo: ${tipoConfig.label} | ID: ${usuario.id}`,
    });
    logger.info(`[TICKET] Canal criado: ${canal.name} na categoria ${canal.parentId}`);

    // Registra o ticket
    tickets[canal.id] = {
      channelId: canal.id,
      userId: usuario.id,
      guildId: guild.id,
      tipo,
      status: 'aberto',
      criadoEm: new Date().toISOString(),
    };
    salvarTickets(tickets);

    const staffRoleId = process.env.STAFF_ROLE_ID;
    const mencaoStaff = staffRoleId ? `<@&${staffRoleId}>` : '`@Staff`';

    // Embed de abertura no canal do ticket
    const embed = new EmbedBuilder()
      .setColor(tipoConfig.cor)
      .setTitle(`${tipoConfig.emoji} Ticket de ${tipoConfig.label}`)
      .setDescription(
        `Olá ${usuario}! Seu ticket foi aberto com sucesso.\n\n` +
        `Descreva sua solicitação com o máximo de detalhes possível.\n` +
        `Nossa equipe ${mencaoStaff} já foi notificada e irá atendê-lo em breve.\n\n` +
        `> Use o botão abaixo para fechar o ticket quando necessário.`
      )
      .addFields({ name: '📂 Categoria', value: `${tipoConfig.emoji} ${tipoConfig.label}`, inline: true })
      .setFooter({ text: `ID do usuário: ${usuario.id}` })
      .setTimestamp();

    // Botões: Fechar
    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_fechar')
        .setLabel('Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
    );

    await canal.send({ content: `${usuario}`, embeds: [embed], components: [botoes] });

    // Notifica o canal STAFF
    const staffChannelId = process.env.STAFF_CHANNEL_ID;
    if (staffChannelId) {
      try {
        const staffChannel = await guild.channels.fetch(staffChannelId);
        if (staffChannel) {
          const staffRoleId = process.env.STAFF_ROLE_ID;
          const mencao = staffRoleId ? `<@&${staffRoleId}>` : '`@Staff`';
          await staffChannel.send({
            content: `${mencao} — Novo ticket aberto por ${usuario}!`,
            embeds: [new EmbedBuilder()
              .setColor(tipoConfig.cor)
              .setTitle('🎫 Novo Ticket')
              .addFields(
                { name: '👤 Usuário', value: `${usuario.tag} (<@${usuario.id}>)`, inline: true },
                { name: '📂 Tipo', value: `${tipoConfig.emoji} ${tipoConfig.label}`, inline: true },
                { name: '📌 Canal', value: `${canal}`, inline: true },
              )
              .setTimestamp(),
            ],
          });
          logger.info(`[TICKET] Notificação enviada para canal STAFF: ${staffChannel.name}`);
        } else {
          logger.warn(`[TICKET] Canal STAFF não encontrado: ${staffChannelId}`);
        }
      } catch (err) {
        logger.error(`[TICKET] Erro ao enviar notificação STAFF: ${err.message}`);
      }
    } else {
      logger.warn('[TICKET] STAFF_CHANNEL_ID não configurado no .env');
    }

    logger.info(`[TICKET] Aberto (${tipo}) por ${usuario.tag} → #${canal.name}`);

    // ─── LOG DE ABERTURA ─────────────────────────────────────────────────
    const logEmbed = new EmbedBuilder()
      .setColor(tipoConfig.cor)
      .setTitle('🎫 Ticket Aberto')
      .addFields(
        { name: '👤 Usuário', value: `${usuario.tag} (<@${usuario.id}>)`, inline: true },
        { name: '📂 Tipo', value: `${tipoConfig.emoji} ${tipoConfig.label}`, inline: true },
        { name: '📌 Canal', value: `${canal}`, inline: true },
      )
      .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `ID: ${canal.id}` })
      .setTimestamp();

    await enviarLog(guild, logEmbed);

    await interaction.editReply({ content: `✅ Ticket criado: ${canal}` });
  } catch (err) {
    logger.error(`[TICKET] Erro ao criar: ${err.message}`);
    await interaction.editReply({ content: '❌ Não foi possível criar o ticket. Verifique as permissões do bot.' });
  }
}

// ─── CHAMAR STAFF ─────────────────────────────────────────────────────────────
async function chamarStaff(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const tickets = carregarTickets();
  const ticketData = tickets[interaction.channel.id];

  if (!ticketData) {
    return interaction.editReply({ content: '❌ Este canal não é um ticket registrado.' });
  }

  // Cooldown de 3 min por ticket para evitar spam
  const agora = Date.now();
  if (ticketData.ultimoChamarStaff && agora - ticketData.ultimoChamarStaff < 3 * 60 * 1000) {
    const restante = Math.ceil((3 * 60 * 1000 - (agora - ticketData.ultimoChamarStaff)) / 1000);
    return interaction.editReply({ content: `⏱️ Aguarde **${restante}s** para chamar o staff novamente.` });
  }

  ticketData.ultimoChamarStaff = agora;
  salvarTickets(tickets);

  const staffRoleId = process.env.STAFF_ROLE_ID;
  const mencao = staffRoleId ? `<@&${staffRoleId}>` : '`@Staff`';

  await interaction.channel.send({
    content: `🔔 ${mencao} — ${interaction.user} está aguardando atendimento neste ticket!`,
  });

  await interaction.editReply({ content: '✅ Staff notificado com sucesso!' });
}

// ─── FECHAR TICKET ───────────────────────────────────────────────────────────
async function fecharTicket(interaction) {
  await interaction.deferReply();

  const canal = interaction.channel;
  const guild = interaction.guild;
  const tickets = carregarTickets();
  const ticketData = tickets[canal.id];

  if (!ticketData) {
    return interaction.editReply({ content: '❌ Este canal não é um ticket registrado.' });
  }

  // Apenas o criador ou staff pode fechar
  const isDonoOuStaff = interaction.user.id === ticketData.userId || isStaff(interaction.member);
  if (!isDonoOuStaff) {
    return interaction.editReply({ content: '❌ Você não tem permissão para fechar este ticket.' });
  }

  await interaction.editReply({ content: '🔒 Fechando ticket e salvando transcript...' });

  try {
    const arquivoTranscript = await transcriptService.gerarTranscript(canal, ticketData);

    // Atualiza registro
    tickets[canal.id].status = 'fechado';
    tickets[canal.id].fechadoEm = new Date().toISOString();
    tickets[canal.id].fechadoPor = interaction.user.id;
    salvarTickets(tickets);

    const tipoConfig = TIPOS[ticketData.tipo] || TIPOS.duvidas;

    // ─── LOG DE FECHAMENTO ───────────────────────────────────────────────
    const duracaoMs = Date.now() - new Date(ticketData.criadoEm).getTime();
    const duracaoMin = Math.round(duracaoMs / 60000);
    const duracao = duracaoMin < 60
      ? `${duracaoMin} minutos`
      : `${Math.round(duracaoMin / 60)} hora(s)`;

    const logEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🔒 Ticket Fechado')
      .addFields(
        { name: '👤 Usuário', value: `<@${ticketData.userId}>`, inline: true },
        { name: '📂 Tipo', value: `${tipoConfig.emoji} ${tipoConfig.label}`, inline: true },
        { name: '🛡️ Fechado por', value: `${interaction.user.tag}`, inline: true },
        { name: '⏱️ Duração', value: duracao, inline: true },
        { name: '📄 Transcript', value: `\`${path.basename(arquivoTranscript)}\``, inline: true },
      )
      .setFooter({ text: `Canal: #${canal.name}` })
      .setTimestamp();

    await enviarLog(guild, logEmbed);

    logger.info(`[TICKET] Fechado #${canal.name} — transcript: ${path.basename(arquivoTranscript)}`);

    // Deleta o canal após 3 segundos
    setTimeout(() => canal.delete().catch(() => {}), 3000);
  } catch (err) {
    logger.error(`[TICKET] Erro ao fechar: ${err.message}`);
    await interaction.editReply({ content: '❌ Erro ao fechar o ticket.' });
  }
}

module.exports = { criarTicket, chamarStaff, fecharTicket };
