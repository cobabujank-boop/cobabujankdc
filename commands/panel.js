import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
} from "discord.js";

export async function buildPanelEmbed() {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setAuthor({
            name: "KingVypers Premium System",
            iconURL: "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvyperslogo.jpg",
        })
        .setTitle("Panel Manajemen Key Premium")
        .setDescription(
            "Selamat datang di sistem premium **KingVypers**!\n" +
            "Gunakan tombol di bawah untuk mengelola akun premium kamu."
        )
        .addFields(
            {
                name: "Informasi Penting",
                value:
                    "> Semua response bot **hanya bisa dilihat oleh kamu** *(ephemeral)*\n" +
                    "> Jangan share key kamu ke siapapun\n" +
                    "> 1 key hanya bisa digunakan untuk 1 akun Discord",
                inline: false,
            },
            {
                name: "Website",
                value: `[kingvypers.com](${process.env.WEBSITE_URL || "#"})`,
                inline: true,
            },
            {
                name: "Support",
                value: "Hubungi admin jika ada masalah",
                inline: true,
            }
        )
        .setImage("https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/welcomee.jpg")
        .setFooter({
            text: "KingVypers Premium  •  Powered by KingVypers System",
            iconURL: "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvyperslogo.jpg",
        })
        .setTimestamp();
}

export function buildPanelRows() {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("btn_redeem")
            .setLabel("Redeem Key")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("btn_getscript")
            .setLabel("Get Script")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId("btn_getrole")
            .setLabel("Get Role")
            .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("btn_resethwid")
            .setLabel("Reset HWID")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("btn_getstats")
            .setLabel("Get Stats")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("btn_findmykey")
            .setLabel("Find My Key")
            .setStyle(ButtonStyle.Danger)
    );

    return [row1, row2];
}

export default {
    data: new SlashCommandBuilder()
        .setName("panel")
        .setDescription("Buka KingVypers Premium Panel (private / hanya kamu)"),

    async execute(interaction) {
        const allowedRoleId = process.env.ALLOWED_ROLE_ID;
        if (allowedRoleId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            if (!interaction.member.roles.cache.has(allowedRoleId)) {
                return interaction.reply({
                    content: `❌ **Akses Ditolak**\nMaaf, kamu harus memiliki role khusus untuk menggunakan command ini.`,
                    flags: 64
                });
            }
        }

        await interaction.deferReply({ flags: 64 });
        const embed = await buildPanelEmbed();
        await interaction.editReply({
            embeds: [embed],
            components: buildPanelRows(),
        });
    },
};
