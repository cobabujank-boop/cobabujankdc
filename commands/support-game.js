import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("support-game")
        .setDescription("📢 Kirim embed status Support Game yang rapi & profesional (Admin only)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((opt) =>
            opt
                .setName("game")
                .setDescription("Nama game yang ingin diupdate statusnya")
                .setRequired(true)
        )
        .addStringOption((opt) =>
            opt
                .setName("status")
                .setDescription("Status dari game saat ini")
                .setRequired(true)
                .addChoices(
                    { name: '🟢 Operational (Lancar)', value: 'operational' },
                    { name: '🟡 Degraded (Ada Bug/Masalah)', value: 'degraded' },
                    { name: '🔴 Deprecated (Tidak Diurus/Usang)', value: 'deprecated' }
                )
        )
        .addStringOption((opt) =>
            opt
                .setName("image")
                .setDescription("URL Gambar/Banner Game (Opsional, tapi disarankan agar lebih bagus)")
                .setRequired(false)
        )
        .addChannelOption((opt) =>
            opt
                .setName("channel")
                .setDescription("Channel tujuan pengiriman (default: channel sekarang)")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(false)
        ),

    async execute(interaction) {
        const gameName = interaction.options.getString("game");
        const statusValue = interaction.options.getString("status");
        const imageUrl = interaction.options.getString("image");
        const targetChannel = interaction.options.getChannel("channel") ?? interaction.channel;

        await interaction.deferReply({ flags: 64 }); // Ephemeral reply "Sedang diproses..."

        const statusData = {
            operational: { name: 'Operational', emoji: '🟢', color: '#57F287', desc: 'fully working' },
            degraded: { name: 'Degraded', emoji: '🟡', color: '#FEE75C', desc: 'works, but buggy' },
            deprecated: { name: 'Deprecated', emoji: '🔴', color: '#ED4245', desc: 'outdated / unmaintained' },
        };

        const currentStatus = statusData[statusValue];

        const mainEmbed = new EmbedBuilder()
            .setTitle(`Supported Games`)
            .setColor(currentStatus.color)
            .setDescription(`• **${gameName}** [ ${currentStatus.emoji} ]`)
            .setTimestamp()
            .setFooter({ text: "Status Update", iconURL: interaction.guild?.iconURL() });

        if (imageUrl) {
            mainEmbed.setImage(imageUrl);
        }

        // 2. Embed Legend (Keterangan Status) seperti di gambar
        const legendEmbed = new EmbedBuilder()
            .setColor("#2b2d31") // Warna gelap khas Discord
            .setDescription(
                `🟢 **Operational** — fully working\n` +
                `🟡 **Degraded** — works, but buggy\n` +
                `🔴 **Deprecated** — outdated / unmaintained`
            );

        try {
            await targetChannel.send({ embeds: [mainEmbed, legendEmbed] });
            
            await interaction.editReply({
                content: `✅ Embed Support Game untuk **${gameName}** berhasil dikirim ke ${targetChannel}!`,
            });
        } catch (error) {
            console.error("Gagal mengirim embed support game:", error);
            await interaction.editReply({
                content: `❌ Gagal mengirim embed ke ${targetChannel}. Pastikan bot memiliki izin untuk mengirim pesan dan embed di sana.`,
            });
        }
    },
};
