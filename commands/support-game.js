import {
    SlashCommandBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits,
    ChannelType,
} from "discord.js";

// Map temporary untuk nyimpen memori admin mau kirim ke channel mana sebelum modal muncul
export const pendingSupportTargets = new Map();

export default {
    data: new SlashCommandBuilder()
        .setName("support-game")
        .setDescription("📢 Kirim embed status Support Game (List banyak game sekaligus) (Admin only)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption((opt) =>
            opt
                .setName("channel")
                .setDescription("Channel tujuan pengiriman (default: channel sekarang)")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel("channel") ?? interaction.channel;

        // Simpan target channel sementara memakai ID user yang mengeksekusi
        pendingSupportTargets.set(interaction.user.id, targetChannel.id);

        const modal = new ModalBuilder()
            .setCustomId("modal_support_game")
            .setTitle(`Update Status Game`);

        const titleInput = new TextInputBuilder()
            .setCustomId("sg_title")
            .setLabel("Judul Embed (Opsional)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Contoh: Supported Games")
            .setRequired(false)
            .setMaxLength(256);

        const imageInput = new TextInputBuilder()
            .setCustomId("sg_image")
            .setLabel("URL Thumbnail (Gambar Kecil di Pojok) Ops.")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Contoh: https://i.imgur.com/xxx.png")
            .setRequired(false);

        const opInput = new TextInputBuilder()
            .setCustomId("sg_operational")
            .setLabel("🟢 Operational (Pisahkan dengan Enter)")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Game Lancar\nGame Lainnya")
            .setRequired(false);

        const degInput = new TextInputBuilder()
            .setCustomId("sg_degraded")
            .setLabel("🟡 Degraded (Pisahkan dengan Enter)")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Game Agak Buggy\nContoh Game")
            .setRequired(false);

        const depInput = new TextInputBuilder()
            .setCustomId("sg_deprecated")
            .setLabel("🔴 Deprecated (Pisahkan dengan Enter)")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Game Usang\nGame Tidak Diurus")
            .setRequired(false);

        // Add inputs to modal (max 5)
        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(imageInput),
            new ActionRowBuilder().addComponents(opInput),
            new ActionRowBuilder().addComponents(degInput),
            new ActionRowBuilder().addComponents(depInput),
        );

        // Show modal to user
        await interaction.showModal(modal);
    },
};
