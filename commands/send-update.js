import {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    PermissionFlagsBits,
    ChannelType
} from "discord.js";

// Simpan data sementara per user (pakai Map)
export const updateDraftMap = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName("send-update")
        .setDescription("Kirim update log ke channel tujuan")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption((opt) =>
            opt
                .setName("channel")
                .setDescription("Channel tujuan update log")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
        )
        .addRoleOption((opt) =>
            opt
                .setName("role")
                .setDescription("Role yang ingin di-tag (opsional)")
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel("channel");
        const role = interaction.options.getRole("role");

        // Simpan data channel tujuan & role sementara
        updateDraftMap.set(interaction.user.id, {
            targetChannelId: targetChannel.id,
            pingRole: role ? role.id : null,
        });

        // Modal Step 1 — Info Utama
        const modal1 = new ModalBuilder()
            .setCustomId("update_modal_step1")
            .setTitle("Update Log — Info Utama");

        const logoInput = new TextInputBuilder()
            .setCustomId("logo_url")
            .setLabel("Logo URL (opsional)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("https://cdn.discordapp.com/...")
            .setRequired(false);

        const titleInput = new TextInputBuilder()
            .setCustomId("update_title")
            .setLabel("Judul Update")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Atomicals Script Update Logs")
            .setRequired(true);

        const gameInput = new TextInputBuilder()
            .setCustomId("game_name")
            .setLabel("Nama Game")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Grow A Garden 2")
            .setRequired(true);

        const versionInput = new TextInputBuilder()
            .setCustomId("version")
            .setLabel("Version")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("v0.0.6.6")
            .setRequired(true);

        const devNotesInput = new TextInputBuilder()
            .setCustomId("dev_notes")
            .setLabel("Developer Notes (opsional)")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Found any bugs? Feel free to report them to the developers!")
            .setRequired(false);

        modal1.addComponents(
            new ActionRowBuilder().addComponents(logoInput),
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(gameInput),
            new ActionRowBuilder().addComponents(versionInput),
            new ActionRowBuilder().addComponents(devNotesInput)
        );

        await interaction.showModal(modal1);
    },
};
