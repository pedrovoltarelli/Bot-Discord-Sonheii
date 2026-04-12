const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

const softwareList = [
  { id: 'premiere', name: 'Premiere Pro', image: 'premiere.png', versions: [
    { version: '2026', link: 'https://www.mediafire.com/file_premium/sl5o2ggrblgkeup/Premiere_Pro_2026_-_satvrn.zip/file' }
  ]},
  { id: 'aftereffects', name: 'After Effects', image: 'after.png', versions: [
    { version: '2026', link: 'https://www.mediafire.com/file_premium/d8gr3jf5xow0f1b/After_Effects_2026_-_satvrn.zip/file' }
  ]},
  { id: 'vegas', name: 'Vegas Pro', image: 'vegas.png', versions: [
    { version: '16', link: 'https://drive.google.com/drive/folders/1LxyqGly_hOrrgCzh8JI5Phqld1ItvOrj' },
    { version: '18', link: 'https://drive.google.com/drive/folders/1YGRA6iy4-T00gZ72ILM7nnT7CL4bdovf' },
    { version: '20', link: 'https://drive.usercontent.google.com/download?id=1T0vbYrV6g5N16dSKzldQXEs4l0ePOlEC&export=download&authuser=0' },
    { version: '26', link: 'https://www.mediafire.com/file/kd1h3uomsypcmld/BorisFX.VEGAS.Pro.2026.rar/file' }
  ]},
  { id: 'photoshop', name: 'Photoshop', image: 'photoshop.png', versions: [
    { version: '2026', link: 'https://www.mediafire.com/file_premium/u1kx9092stsrbup/Photoshop.2026_%28v27.0%29_WIN_-_satvrn.7z/file' }
  ]},
  { id: 'plugins', name: 'Adobe Plugins', image: null, versions: [
    { version: 'Continuum 2026', link: 'https://www.mediafire.com/file_premium/br2e5e5m0z0390t/Continuum_2026.Adobe_.v19.0.1_Win_-_satvrn.7z/file' },
    { version: 'Sapphire 2026', link: 'https://www.mediafire.com/file_premium/3n0rjz0i6cwq95m/BorisFX_Sapphire_AE_WIN_2026.0_-_satvrn.7z/file' },
    { version: 'Red Giant 2026', link: 'https://www.mediafire.com/file_premium/zfqjr8vo2n2kuq1/RedGiant.v2026.3.0_Win_-_satvrn.7z/file' },
    { version: 'REVisionFX', link: 'https://www.mediafire.com/file_premium/zwh5xd3vv65dc5l/REVisionFX.Effections.Plus.v25.08_Win_-_satvrn.7z/file' }
  ]},
  { id: 'vegasplugins', name: 'Vegas Plugins', image: null, versions: [
    { version: 'Continuum 2026', link: 'https://www.mediafire.com/file_premium/32npiq3z89zmvh4/BorisFX_Continuum_2026_OFX_v19.0.0_win_-_satvrn.7z/file' },
    { version: 'Sapphire 2026', link: 'https://www.mediafire.com/file_premium/01vm0agltgnwe0y/Sapphire_OFX_2026_Win_-_satvrn.7z/file' },
    { version: 'Twixtor 8.1', link: 'https://www.mediafire.com/file_premium/ydz6rvid4su4rj6/Twixtor_v8.1.0_OFX_Win_-_satvrn.7z/file' },
    { version: 'RSMB 6.6', link: 'https://www.mediafire.com/file_premium/dce8dporymklq7v/REVisionFX_RSMB_6.6.0_OFX_Win_-_DISCORD.GG_%E2%88%95SATVRN.zip/file' },
    { version: 'All Plugins', link: 'https://drive.google.com/file/d/1LbdZQM90EhxwetwwDSAcS8C9auP7VMDH/view' }
  ]}
];

const PASSWORD = 'star';
const fotosPath = path.join(__dirname, '..', '..', 'fotos');

function getSoftwareById(customId) {
  const softwareId = customId.replace('soft_', '');
  return softwareList.find(s => s.id === softwareId);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('softwares')
    .setDescription('Abre o painel de downloads de softwares'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📥 Central de Downloads')
      .setDescription('Selecione um software para ver as versões')
      .setColor('#0099ff')
      .setTimestamp();

    const rows = [];
    for (let i = 0; i < softwareList.length; i += 2) {
      const row = new ActionRowBuilder();
      for (let j = i; j < Math.min(i + 2, softwareList.length); j++) {
        const software = softwareList[j];
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`soft_${software.id}`)
            .setLabel(software.name)
            .setStyle(ButtonStyle.Secondary)
        );
      }
      rows.push(row);
    }

    await interaction.reply({ embeds: [embed], components: rows });
  },

  async handleSoftwareClick(interaction) {
    const software = getSoftwareById(interaction.customId);
    if (!software) return;

    let files = [];
    if (software.image) {
      const imagePath = path.join(fotosPath, software.image);
      if (fs.existsSync(imagePath)) {
        files = [new AttachmentBuilder(imagePath)];
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`${software.name} - Versões`)
      .setDescription('Selecione uma versão para baixar:')
      .setColor('#000000')
      .setTimestamp();

    if (files.length > 0 && software.image) {
      embed.setImage(`attachment://${software.image}`);
    }

    const rows = [];
    for (const v of software.versions) {
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel(`v${v.version}`)
            .setStyle(ButtonStyle.Link)
            .setURL(v.link)
        );
      rows.push(row);
    }

    embed.addFields({ name: '🔑 Senha', value: PASSWORD, inline: false });
    await interaction.reply({ embeds: [embed], components: rows, files: files, flags: 64 });
  },
};