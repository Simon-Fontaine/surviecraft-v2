const {
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  Events,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const IDs = require("../utilities/ids");
const messageRolesMenuSchema = require("../models/message-roles-menu-schema");

const notificationRoles = {
  "📢": [IDs.ALL_NOTIFICATIONS_ROLE, "Toutes Notifications (updates, sondages, vidéo, etc.)"],
  "⚙": [IDs.CHANGELOGS_NOTIFICATIONS_ROLE, "Notifications Change Logs SurvieCraft"],
  "💾": [IDs.YT_NOTIFICATIONS_ROLE, "Notifications Nouvelles Vidéos"],
  "🎲": [IDs.EVENT_NOTIFICATIONS_ROLE, "Notifications Nouveaux Évents"],
  "🌄": [IDs.SURVIE_NOTIFICATIONS_ROLE, "Notifications Nouveautés Survie"],
};

module.exports = async (instance, client) => {
  const guild = client.guilds.cache.get(IDs.GUILD);
  const channel = guild.channels.cache.get(IDs.ROLES_CHANNEL);

  let results = await messageRolesMenuSchema.findById(guild.id);

  const keys = Object.keys(notificationRoles);
  const options = [];
  const text = `**Quelles notifications souhaitez-vous recevoir ?**\n\n> • <@&${IDs.ALL_NOTIFICATIONS_ROLE}>\n> • <@&${IDs.CHANGELOGS_NOTIFICATIONS_ROLE}>\n> • <@&${IDs.YT_NOTIFICATIONS_ROLE}>\n> • <@&${IDs.EVENT_NOTIFICATIONS_ROLE}>\n> • <@&${IDs.SURVIE_NOTIFICATIONS_ROLE}>\n\n*Faites dérouler le menu et cliquer sur les rôles que vous souhaiter équiper/déséquiper.*`;

  for (let a = 0; a < keys.length; ++a) {
    let emoji = keys[a];
    const [id, desc] = notificationRoles[emoji];

    if (emoji.startsWith(":")) {
      emoji = guild.emojis.cache.find((e) => {
        if (typeof emoji === "string") {
          return e.name === emoji.substr(1);
        }

        return false;
      });
    }

    options.push({
      label: desc,
      value: id,
      emoji,
    });
  }

  const rows = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("role_select")
      .setMinValues(0)
      .setMaxValues(options.length)
      .setPlaceholder("Sélectionnez Vos Rôles")
      .addOptions(options)
  );

  if (results) {
    const message = await channel.messages
      .fetch(results.messageId, {
        cache: true,
        force: true,
      })
      .catch(() => {});

    if (message) {
      message.edit({
        content: text,
        components: [rows],
        allowedMentions: {
          parse: [],
        },
      });
    } else {
      results = null;
    }
  }

  if (!results) {
    const message = await channel.send({
      content: text,
      components: [rows],
      allowedMentions: {
        parse: [],
      },
    });

    await messageRolesMenuSchema.findOneAndUpdate(
      {
        _id: guild.id,
      },
      {
        _id: guild.id,
        messageId: message.id,
      },
      {
        upsert: true,
      }
    );
  }

  client.on(Events.InteractionCreate, (interaction) => {
    if (!interaction.isStringSelectMenu() || interaction.channelId !== IDs.ROLES_CHANNEL) {
      return;
    }

    const { customId, values, member } = interaction;

    if (customId === "role_select" && member) {
      const component = interaction.component;
      const removed = component.options.filter((role) => !values.includes(role.value));
      for (const id of removed) {
        member.roles.remove(id.value);
      }

      for (const id of values) {
        member.roles.add(id);
      }

      interaction.reply({
        ephemeral: true,
        content: "Rôles mis à jour!",
      });
    }
  });
};
