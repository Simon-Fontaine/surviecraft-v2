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
const TicketJoueur = require("../../models/ticket-joueur-schema");
const TicketUser = require("../../models/ticket-user-schema");
const TicketJoueurMessage = require("../../models/message-ticket-joueur-schema");
const wait = require("node:timers/promises").setTimeout;
const emojis = require("../../utilities/emojis");
const IDs = require("../../utilities/ids");

module.exports = async (instance, client) => {
  const guild = client.guilds.cache.get(IDs.GUILD);
  const channel = guild.channels.cache.get(IDs.TICKET_JOUEUR_CHANNEL);

  let results = await TicketJoueurMessage.findById(guild.id);

  // let text = [``].join("\n");

  const embed = new EmbedBuilder()
    .setTitle("Un Problème ? Ouvre un Ticket !")
    .setColor("Gold")
    .setDescription(
      [
        `Pour pouvoir discuter avec des membres du staff merci de **sélectionner** une option dans le **menu de sélection** ci-dessous.`,
        "",
        `> Tous les tickets dont nous n'avons pas de réponses de votre part sous 24h seront automatiquement fermés.`,
        ``,
        "*Tous types d'abus de cette fonctionnalité sont sanctionnables par notre équipe.*",
      ].join("\n")
    );

  const rows = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setMinValues(0)
      .setMaxValues(1)
      .setCustomId("ticket_joueur_select")
      .setPlaceholder("Rien de sélectionné")
      .addOptions(
        {
          label: "🔐 Problème Mot De Passe",
          description: "Perdu votre mot de passe ? C'est ici !",
          value: "probleme_motdepasse",
        },
        {
          label: "🌄 Problème En Jeu",
          description: "Problème(s) sur notre serveur Minecraft ? C'est ici !",
          value: "probleme_en_jeu",
        },
        {
          label: "🖥️ Problème Site Web",
          description: "Problème(s) sur note site web ? C'est ici !",
          value: "probleme_boutique",
        },
        {
          label: "🎙️ Problème Discord",
          description: "Problème(s) sur notre serveur Discord ? C'est ici !",
          value: "probleme_discord",
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
        // content: text,
        embeds: [embed],
        components: [rows],
      });
    } else {
      results = null;
    }
  }

  if (!results) {
    const message = await channel.send({
      // content: text,
      embeds: [embed],
      components: [rows],
    });

    await TicketJoueurMessage.findOneAndUpdate(
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

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId !== "ticket_joueur_select") return;

    const interactionValue = interaction.values[0];

    if (
      !["probleme_en_jeu", "probleme_boutique", "probleme_discord", "probleme_motdepasse"].includes(interactionValue)
    ) {
      return interaction.reply({
        content: `**${interaction.user.tag}** votre choix d'option a été remis à zéro !`,
        ephemeral: true,
      });
    }

    if (guild.channels.cache.find((channel) => channel.topic === interaction.user.id + "-j")) {
      return interaction.reply({
        content: `Attention **${interaction.user.tag}** ! Tu as déjà un ticket ouvert !`,
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
      case "probleme_en_jeu":
        ticketValue = "Problème En Jeu";
        break;
      case "probleme_boutique":
        ticketValue = "Problème Site Web";
        break;
      case "probleme_discord":
        ticketValue = "Problème Discord";
        break;
      case "probleme_motdepasse":
        ticketValue = "Problème Mot De Passe";
        break;
    }

    const modal = new ModalBuilder().setCustomId(interactionValue).setTitle(ticketValue);

    let usernameInput;

    switch (interactionValue) {
      case "probleme_en_jeu":
        usernameInput = new TextInputBuilder()
          .setCustomId("username_input")
          .setLabel("Votre pseudo Minecraft EXACT")
          .setPlaceholder('ex: "H3st1a"')
          .setMaxLength(16)
          .setMinLength(3)
          .setStyle(TextInputStyle.Short);
        break;
      case "probleme_boutique":
        usernameInput = new TextInputBuilder()
          .setCustomId("username_input")
          .setLabel("L'addresse E-Mail associée au compte boutique")
          .setPlaceholder("votrenom@email.com")
          .setMaxLength(100)
          .setStyle(TextInputStyle.Short);
        break;
      case "probleme_motdepasse":
        usernameInput = new TextInputBuilder()
          .setCustomId("username_input")
          .setLabel("Votre pseudo Minecraft EXACT")
          .setPlaceholder('ex: "H3st1a"')
          .setMaxLength(16)
          .setMinLength(3)
          .setStyle(TextInputStyle.Short);
        break;
    }

    const questionInput = new TextInputBuilder()
      .setCustomId("question_input")
      .setLabel("Décrivez PRÉCISÉMENT votre problème")
      .setMaxLength(1000)
      .setStyle(TextInputStyle.Paragraph);

    const firstActionRow = new ActionRowBuilder().addComponents(usernameInput);
    const secondActionRow = new ActionRowBuilder().addComponents(questionInput);

    if (interactionValue === "probleme_discord") {
      modal.addComponents(secondActionRow);
    } else if (interactionValue === "probleme_motdepasse") {
      const ipInput = new TextInputBuilder()
        .setCustomId("ip_input")
        .setLabel("Votre IP via https://www.monip.org/")
        .setMaxLength(15)
        .setMinLength(7)
        .setPlaceholder('ex: "123.456.789.012"')
        .setStyle(TextInputStyle.Short);

      const thirdActionRow = new ActionRowBuilder().addComponents(ipInput);

      modal.addComponents(firstActionRow, thirdActionRow, secondActionRow);
    } else {
      modal.addComponents(firstActionRow, secondActionRow);
    }

    await interaction.showModal(modal);

    let identifiant;
    let question;
    let userIp;

    const filter = async (interaction) => {
      if (interaction.customId !== interactionValue) {
        return false;
      } else {
        if (interactionValue !== "probleme_discord") {
          identifiant = interaction.fields.getTextInputValue("username_input");
        }
        question = interaction.fields.getTextInputValue("question_input");
        if (interactionValue === "probleme_motdepasse") {
          userIp = interaction.fields.getTextInputValue("ip_input");
        }
        await interaction.reply({ content: "Loading ticket ...", ephemeral: true });
        return true;
      }
    };

    try {
      const response = await interaction.awaitModalSubmit({ filter, time: 120000, error: ["time"] });

      if (response) {
        const ticketID = (await TicketJoueur.count()) + 1;

        await interaction.guild.channels
          .create({
            name: `${ticketID}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            topic: `${interaction.user.id}-j`,
            parent: IDs.TICKET_CATEGORY,
            permissionOverwrites: [
              {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: IDs.SUPERMODO_ROLE,
                allow: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: IDs.MODERATOR_ROLE,
                allow: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: IDs.DEV_ROLE,
                allow: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: IDs.GUIDE_ROLE,
                allow: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: IDs.GUILD,
                deny: [PermissionFlagsBits.ViewChannel],
              },
            ],
          })
          .then(async (channel) => {
            const ticket = await TicketJoueur.create({
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
            if (identifiant) {
              descriptionString.push(`${emojis.triangleRight} Identifiant: **${identifiant}**`);
            }
            if (userIp) {
              descriptionString.push(`${emojis.triangleRight} IP: **${userIp}**`);
            }

            const embed = new EmbedBuilder()
              .setColor("Green")
              .setTitle(`Ticket de ${interaction.user.tag}`)
              .setThumbnail(interaction.user.avatarURL({ dynamic: true }) ?? interaction.user.defaultAvatarURL)
              .setDescription(descriptionString.join("\n"))
              .addFields({ name: "Question:", value: `${question}` })
              .setFooter({ text: "Un membre du staff a été averti de la création de ce ticket." });

            const rows = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId("close")
                  .setLabel("Sauvegarder & Fermer")
                  .setEmoji("💾")
                  .setStyle(ButtonStyle.Primary)
              )
              .addComponents(new ButtonBuilder().setCustomId("lock").setEmoji("🔒").setStyle(ButtonStyle.Danger))
              .addComponents(new ButtonBuilder().setCustomId("unlock").setEmoji("🔓").setStyle(ButtonStyle.Success))
              .addComponents(
                new ButtonBuilder().setCustomId("claim").setLabel("Claim").setEmoji("🙋‍♂️").setStyle(ButtonStyle.Primary)
              );

            await channel
              .send({
                content: `${interaction.user} <@&${IDs.SUPERMODO_ROLE}> <@&${IDs.MODERATOR_ROLE}> <@&${IDs.GUIDE_ROLE}>`,
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
