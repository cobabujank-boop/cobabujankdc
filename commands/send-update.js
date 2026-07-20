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

// Default banner URL — KingVyper banner memanjang
const DEFAULT_BANNER = "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvypersbanner.png";

export default {
    data: new SlashCommandBuilder()
        .setName("send-update")
        .setDescription("Kirim update log ke channel tujuan (Velocity style)")
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
        )
        .addStringOption((opt) =>
            opt
                .setName("script-type")
                .setDescription("Tipe script (Premium / Freemium)")
                .addChoices(
                    { name: "💎 Premium Script", value: "premium" },
                    { name: "🆓 Freemium Script", value: "freemium" }
                )
                .setRequired(true)
        ),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel("channel");
        const role = interaction.options.getRole("role");
        const scriptType = interaction.options.getString("script-type");

        // Simpan data channel tujuan, role & script type sementara
        updateDraftMap.set(interaction.user.id, {
            targetChannelId: targetChannel.id,
            pingRole: role ? role.id : null,
            scriptType,
        });

        // Modal Step 1 — Info Utama
        const modal1 = new ModalBuilder()
            .setCustomId("update_modal_step1")
            .setTitle("Update Log — Info Utama");

        const bannerInput = new TextInputBuilder()
            .setCustomId("banner_url")
            .setLabel("Banner URL (kosongkan = default)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(DEFAULT_BANNER)
            .setRequired(false);

        const titleInput = new TextInputBuilder()
            .setCustomId("update_title")
            .setLabel("Judul Update (Header besar)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("KingVypers Script Update Logs")
            .setRequired(true);

        const gameInput = new TextInputBuilder()
            .setCustomId("game_name")
            .setLabel("Game Place")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Fish It!")
            .setRequired(true);

        const versionInput = new TextInputBuilder()
            .setCustomId("version")
            .setLabel("Version")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("0.1")
            .setRequired(true);

        const devNotesInput = new TextInputBuilder()
            .setCustomId("dev_notes")
            .setLabel("Developer Notes (opsional)")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Found any bugs or issues? Feel free to report them!\nGot ideas or suggestions? We'd love to hear them!")
            .setRequired(false);

        modal1.addComponents(
            new ActionRowBuilder().addComponents(bannerInput),
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(gameInput),
            new ActionRowBuilder().addComponents(versionInput),
            new ActionRowBuilder().addComponents(devNotesInput)
        );

        await interaction.showModal(modal1);
    },
};
