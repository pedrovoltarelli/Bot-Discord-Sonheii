/**
 * Verificação de permissões por nível (admin / staff / user).
 */

/**
 * Verifica se o membro tem cargo de administrador.
 * @param {GuildMember} member
 * @returns {boolean}
 */
function isAdmin(member) {
  const adminRoleId = process.env.ADMIN_ROLE_ID;
  if (!adminRoleId) return member.permissions.has('Administrator');
  return member.roles.cache.has(adminRoleId) || member.permissions.has('Administrator');
}

/**
 * Verifica se o membro tem cargo de staff OU admin.
 * @param {GuildMember} member
 * @returns {boolean}
 */
function isStaff(member) {
  const staffRoleId = process.env.STAFF_ROLE_ID;
  if (isAdmin(member)) return true;
  if (!staffRoleId) return false;
  return member.roles.cache.has(staffRoleId);
}

/**
 * Gera objeto de permissões para o canal de ticket.
 * @param {Guild} guild
 * @param {string} userId - ID do criador do ticket
 * @returns {Array} overwrites de permissão
 */
function ticketPermissions(guild, userId) {
  const staffRoleId = process.env.STAFF_ROLE_ID;
  const overwrites = [
    {
      id: guild.roles.everyone,
      deny: ['ViewChannel'],
    },
    {
      id: userId,
      allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
    },
  ];

  if (staffRoleId) {
    overwrites.push({
      id: staffRoleId,
      allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages'],
    });
  }

  return overwrites;
}

module.exports = { isAdmin, isStaff, ticketPermissions };
