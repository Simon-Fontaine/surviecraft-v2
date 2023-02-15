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
const TicketStaff = require("../../models/ticket-staff-schema");
const TicketUser = require("../../models/ticket-user-schema");
const TicketStaffMessage = require("../../models/message-ticket-staff-schema");
const wait = require("node:timers/promises").setTimeout;
const emojis = require("../../utilities/emojis");
const IDs = require("../../utilities/ids");

module.exports = async (instance, client) => {
  const guild = client.guilds.cache.get(IDs.GUILD);
  const channel = guild.channels.cache.get(IDs.TICKET_STAFF_CHANNEL);

  let results = await TicketStaffMessage.findById(guild.id);

  const embed = new EmbedBuilder()
    .setTitle("Chers Staffs ! Ce channel est là pour vous !")
    .setColor("Red")
    .setDescription(
      [
        `Si vous avez quelconques __soucis, problèmes, questionnements importants, signalements__ à faire aux administrateurs/responsables, vous pouvez dès maintenant créer un ticket personnel.`,
        "",
        `> **Vous serez le seul à avoir accès à ce ticket.**`,
        ``,
        "*Tous types d'abus de cette fonctionnalité sont sanctionnables par notre équipe.*",
      ].join("\n")
    );

  const rows = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setMinValues(0)
      .setMaxValues(1)
      .setCustomId("ticket_staff_select")
      .setPlaceholder("Rien de sélectionné")
      .addOptions(
        {
          label: "❗ Niv 1",
          description: "Petit(s) problème(s), pas très urgent(s) ? C'est ici !",
          value: "probleme_niveau_1",
        },
        {
          label: "🔥 Niv 2",
          description: "Moyen(s) problème(s), assez pressant(s) ? C'est ici !",
          value: "probleme_niveau_2",
        },
        {
          label: "🧨 Niv 3",
          description: "Gros problème(s), très urgent(s) ? C'est ici !",
          value: "probleme_niveau_3",
        }
      )
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
        embeds: [embed],
        components: [rows],
      });
    } else {
      results = null;
    }
  }

  if (!results) {
    const message = await channel.send({
      embeds: [embed],
      components: [rows],
    });

    await TicketStaffMessage.findOneAndUpdate(
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

  let ticketValue;
  let ticketValueShort;

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId !== "ticket_staff_select") return;

    const interactionValue = interaction.values[0];

    if (!["probleme_niveau_1", "probleme_niveau_2", "probleme_niveau_3"].includes(interactionValue)) {
      return interaction.reply({
        content: `**${interaction.user.tag}** votre choix d'option a été remis à zéro !`,
        ephemeral: true,
      });
    }

    if (guild.channels.cache.find((channel) => channel.topic === interaction.user.id + "-s")) {
      return interaction.reply({
        content: `Attention **${interaction.user.tag}** ! Tu as déjà un ticket staff ouvert !`,
        ephemeral: true,
      });
    }

    let ticketUser = await TicketUser.findOne({
      guild_id: `${interaction.guild.id}`,
      user_id: `${interaction.user.id}`,
    });

    if (!ticketUser) {
      ticketUser = await TicketUser.create({
        guild_id: `${interaction.guild.id}`,
        user_id: `${interaction.user.id}`,
      });
    }

    if (ticketUser.creating_ticket) {
      return interaction.reply({
        content: `Attention **${interaction.user.tag}** ! Tu es sous **cooldown**, veuillez patienter !`,
        ephemeral: true,
      });
    } else if (ticketUser.creating_ticket === false) {
      await TicketUser.findOneAndUpdate(
        {
          guild_id: `${interaction.guild.id}`,
          user_id: `${interaction.user.id}`,
        },
        { creating_ticket: true }
      );
    }

    switch (interactionValue) {
      case "Niveau 1":
        ticketValue = "Problème Niveau 1";
        ticketValueShort = "Niv1";
        break;
      case "probleme_niveau_2":
        ticketValue = "Problème Niveau 2";
        ticketValueShort = "Niv2";
        break;
      case "probleme_niveau_3":
        ticketValue = "Problème Niveau 3";
        ticketValueShort = "Niv3";
        break;
    }

    const modal = new ModalBuilder().setCustomId(interactionValue).setTitle(ticketValue);

    const questionInput = new TextInputBuilder()
      .setCustomId("question_input")
      .setLabel("Décrivez PRÉCISÉMENT votre problème")
      .setMaxLength(1000)
      .setStyle(TextInputStyle.Paragraph);

    const secondActionRow = new ActionRowBuilder().addComponents(questionInput);
    modal.addComponents(secondActionRow);

    await interaction.showModal(modal);

    let question;

    const filter = async (interaction) => {
      if (interaction.customId !== interactionValue) {
        return false;
      } else {
        question = interaction.fields.getTextInputValue("question_input");
        await interaction.reply({ content: "Loading ticket ...", ephemeral: true });
        return true;
      }
    };

    try {
      const response = await interaction.awaitModalSubmit({ filter, time: 120000, error: ["time"] });

      if (response) {
        const ticketID = (await TicketStaff.count()) + 1;

        await interaction.guild.channels
          .create({
            name: `${ticketID}-staff-${ticketValueShort}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            topic: `${interaction.user.id}-s`,
            parent: IDs.TICKET_CATEGORY,
            permissionOverwrites: [
              {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: IDs.MODERATOR_ROLE,
                allow: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: IDs.GUILD,
                deny: [PermissionFlagsBits.ViewChannel],
              },
            ],
          })
          .then(async (channel) => {
            const ticket = await TicketStaff.create({
              ticket_id: ticketID,
              guild_id: `${interaction.guild.id}`,
              users_id: `${interaction.user.id}`,
              owner_id: `${interaction.user.id}`,
              owner_tag: `${interaction.user.tag}`,
              channel_id: `${channel.id}`,
              mod_id: "Aucun Attitré",
              mod_tag: "Aucun Attitré",
              type: `${ticketValue}`,
            });

            await TicketUser.findOneAndUpdate(
              {
                guild_id: `${interaction.guild.id}`,
                user_id: `${interaction.user.id}`,
              },
              { creating_ticket: false }
            );

            let descriptionString = [
              `:bust_in_silhouette: **${interaction.user.tag}** [${interaction.user.id}]`,
              `${emojis.triangleRight} Type: **${ticketValue}**`,
            ];

            const embed = new EmbedBuilder()
              .setColor("Green")
              .setTitle(`Ticket Staff de ${interaction.user.tag}`)
              .setThumbnail(interaction.user.avatarURL({ dynamic: true }) ?? interaction.user.defaultAvatarURL)
              .setDescription(descriptionString.join("\n"))
              .addFields({ name: "Question:", value: `${question}` })
              .setFooter({ text: "Un membre du staff a été averti de la création de ce ticket." });

            const rows = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId("staffclose")
                  .setLabel("Sauvegarder & Fermer")
                  .setEmoji("💾")
                  .setStyle(ButtonStyle.Primary)
              )
              .addComponents(new ButtonBuilder().setCustomId("stafflock").setEmoji("🔒").setStyle(ButtonStyle.Danger))
              .addComponents(
                new ButtonBuilder().setCustomId("staffunlock").setEmoji("🔓").setStyle(ButtonStyle.Success)
              )
              .addComponents(
                new ButtonBuilder()
                  .setCustomId("staffclaim")
                  .setLabel("Claim")
                  .setEmoji("🙋‍♂️")
                  .setStyle(ButtonStyle.Primary)
              );

            await channel
              .send({
                content: `${interaction.user} <@&${IDs.ADMIN_ROLE}> <@&${IDs.RESP_ROLE}>`,
              })
              .then((message) => {
                wait(5000);
                message.delete().catch(() => {});
              });

            channel.send({
              embeds: [embed],
              components: [rows],
            });

            interaction.followUp({
              content: `**${interaction.user.tag}** votre ticket a été créé : ${channel}`,
              ephemeral: true,
            });
          });
      }
    } catch (error) {
      await TicketUser.findOneAndUpdate(
        {
          guild_id: `${interaction.guild.id}`,
          user_id: `${interaction.user.id}`,
        },
        { creating_ticket: false }
      );
      interaction.followUp({ content: "Votre **cooldown** a **expiré**, veuillez recommencer ...", ephemeral: true });
    }
  });
};
