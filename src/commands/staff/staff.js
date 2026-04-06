const { SlashCommandBuilder } = require('discord.js');
const { isAdmin } = require('../../utils/permissions');
const { sucesso, erro } = require('../../utils/embed');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Gerencia cargos de staff')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Adiciona cargo de staff a um usuário')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário alvo').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove cargo de staff de um usuário')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário alvo').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('lista').setDescription('Lista os membros com cargo de staff')
    ),

  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        embeds: [erro('Sem Permissão', 'Apenas administradores podem gerenciar o staff.')],
        ephemeral: true,
      });
    }

    const staffRoleId = process.env.STAFF_ROLE_ID;
    if (!staffRoleId) {
      return interaction.reply({
        embeds: [erro('Configuração Ausente', 'A variável `STAFF_ROLE_ID` não foi configurada no `.env`.')],
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();
    const role = interaction.guild.roles.cache.get(staffRoleId);

    if (!role) {
      return interaction.reply({
        embeds: [erro('Cargo não Encontrado', `Cargo com ID \`${staffRoleId}\` não encontrado.`)],
        ephemeral: true,
      });
    }

    if (sub === 'add') {
      const usuario = interaction.options.getMember('usuario');

      if (usuario.roles.cache.has(staffRoleId)) {
        return interaction.reply({
          embeds: [erro('Já é Staff', `${usuario} já possui o cargo de staff.`)],
          ephemeral: true,
        });
      }

      await usuario.roles.add(role);
      return interaction.reply({
        embeds: [sucesso('Staff Adicionado', `${usuario} foi promovido a **${role.name}** com sucesso! 🎉`)],
      });
    }

    if (sub === 'remove') {
      const usuario = interaction.options.getMember('usuario');

      if (!usuario.roles.cache.has(staffRoleId)) {
        return interaction.reply({
          embeds: [erro('Não é Staff', `${usuario} não possui o cargo de staff.`)],
          ephemeral: true,
        });
      }

      await usuario.roles.remove(role);
      return interaction.reply({
        embeds: [sucesso('Staff Removido', `${usuario} teve o cargo de **${role.name}** removido.`)],
      });
    }

    if (sub === 'lista') {
      await interaction.guild.members.fetch();
      const staffMembers = interaction.guild.members.cache
        .filter(m => m.roles.cache.has(staffRoleId))
        .map(m => `• ${m.user.tag}`);

      const lista = staffMembers.length > 0
        ? staffMembers.join('\n')
        : 'Nenhum membro com este cargo.';

      return interaction.reply({
        embeds: [
          sucesso('Lista de Staff', `Membros com o cargo **${role.name}**:\n\n${lista}`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        ],
      });
    }
  },
};
