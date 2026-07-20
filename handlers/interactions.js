import {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import fetch from "node-fetch";
import { linkKey, getKeyOwner, getUserKeys } from "../utils/keyStore.js";

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────
const WEBSITE_URL = process.env.WEBSITE_URL?.replace(/\/$/, "");
const BOT_SECRET = process.env.BOT_SECRET;
const PREMIUM_ROLE_ID = process.env.PREMIUM_ROLE_ID;

// Kumpulkan semua loader script dari env
const loaders = [];
if (process.env.LOADER_SCRIPT) loaders.push(process.env.LOADER_SCRIPT);
for (let i = 2; i <= 10; i++) {
    const s = process.env[`LOADER_SCRIPT_${i}`];
    if (s) loaders.push(s);
}
if (loaders.length === 0) loaders.push("-- Loader belum dikonfigurasi di .env");

// ─────────────────────────────────────────
// COLOR PALETTE
// ─────────────────────────────────────────
const C = {
    brand: 0x5865F2, // Discord blurple
    success: 0x57F287, // Discord green
    error: 0xED4245, // Discord red
    warn: 0xFEE75C, // Discord yellow
    gold: 0xF1C40F, // Premium gold
    info: 0x00B9E5, // Cyan/info
};

// ─────────────────────────────────────────
// HELPER - API Call
// ─────────────────────────────────────────
async function api(method, endpoint, body = null, auth = null) {
    const headers = { "Content-Type": "application/json" };
    if (auth) headers["Authorization"] = `Bearer ${auth}`;
    const res = await fetch(`${WEBSITE_URL}${endpoint}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

// ─────────────────────────────────────────
// HELPER - Date Formatter
// ─────────────────────────────────────────
function fmtDate(iso) {
    if (!iso) return "`—`";
    const d = new Date(iso);
    return `<t:${Math.floor(d.getTime() / 1000)}:F>`;
}

function fmtRelative(iso) {
    if (!iso) return "`—`";
    const d = new Date(iso);
    return `<t:${Math.floor(d.getTime() / 1000)}:R>`;
}

// ─────────────────────────────────────────
// HELPER - Status Badge
// ─────────────────────────────────────────
function badge(status) {
    return {
        active: "🟢 **ACTIVE**",
        expired: "🔴 **EXPIRED**",
        blacklisted: "⛔ **BLACKLISTED**",
        available: "🟡 **AVAILABLE**",
        unused: "🟡 **UNUSED**",
        sold: "🟡 **SOLD**",
    }[status] ?? `❓ **${status?.toUpperCase() ?? "UNKNOWN"}**`;
}

function badgeColor(status) {
    return { active: C.success, expired: C.error, blacklisted: C.error }[status] ?? C.warn;
}

// ─────────────────────────────────────────
// HELPER - Divider
// ─────────────────────────────────────────
const DIV = "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";

// ─────────────────────────────────────────
// HELPER - Modal Builder
// ─────────────────────────────────────────
function modal(customId, title, label, placeholder) {
    const m = new ModalBuilder().setCustomId(customId).setTitle(title);
    const inp = new TextInputBuilder()
        .setCustomId("key_input")
        .setLabel(label)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(placeholder)
        .setMinLength(10)
        .setMaxLength(25)
        .setRequired(true);
    m.addComponents(new ActionRowBuilder().addComponents(inp));
    return m;
}

// ─────────────────────────────────────────
// HELPER - Error embed
// ─────────────────────────────────────────
function errEmbed(title, desc) {
    return new EmbedBuilder()
        .setColor(C.error)
        .setTitle(`❌  ${title}`)
        .setDescription(`${DIV}\n${desc}\n${DIV}`)
        .setTimestamp();
}

// ─────────────────────────────────────────
// BUTTON HANDLER
// ─────────────────────────────────────────
async function handleButton(interaction) {
    const id = interaction.customId;
    const map = {
        btn_redeem: ["modal_redeem", "🔑 Redeem Key", "Masukkan Key Premium kamu", "XXXX-XXXX-XXXX-XXXX"],
        btn_getscript: ["modal_getscript", "📜 Get Script", "Masukkan Key Premium kamu", "XXXX-XXXX-XXXX-XXXX"],
        btn_getrole: ["modal_getrole", "🏅 Get Role", "Masukkan Key Premium kamu", "XXXX-XXXX-XXXX-XXXX"],
        btn_resethwid: ["modal_resethwid", "🔄 Reset HWID", "Masukkan Key Premium kamu", "XXXX-XXXX-XXXX-XXXX"],
        btn_getstats: ["modal_getstats", "📊 Get Stats", "Masukkan Key Premium kamu", "XXXX-XXXX-XXXX-XXXX"],
    };

    if (id === "btn_findmykey") {
        return handleFindMyKey(interaction);
    }

    if (id === "btn_report_bug") {
        if (!interaction.member.roles.cache.has("1468568112273162361")) {
            return interaction.reply({ content: "❌ Maaf, hanya member Premium yang bisa report bug.", flags: 64 });
        }

        const reportModal = new ModalBuilder()
            .setCustomId("modal_report_bug")
            .setTitle("🐛 Report a Bug");

        reportModal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("bug_title")
                    .setLabel("Bug Title")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Singkat dan jelas")
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("bug_description")
                    .setLabel("Bug Description")
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder("Jelaskan bug yang kamu temukan...")
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("bug_steps")
                    .setLabel("Steps to Reproduce (opsional)")
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder("1. Buka menu\n2. Klik X\n3. Bug muncul")
                    .setRequired(false)
            )
        );

        return await interaction.showModal(reportModal);
    }

    if (id === "btn_suggest_feature") {
        if (!interaction.member.roles.cache.has("1468568112273162361")) {
            return interaction.reply({ content: "❌ Maaf, hanya member Premium yang bisa suggest feature.", flags: 64 });
        }

        const suggestModal = new ModalBuilder()
            .setCustomId("modal_suggest_feature")
            .setTitle("💡 Suggest a Feature");

        suggestModal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("feature_name")
                    .setLabel("Feature Name")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("feature_desc")
                    .setLabel("Why do you want this feature?")
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
            )
        );

        return await interaction.showModal(suggestModal);
    }

    if (id === "btn_update_step2") {
        const modal2 = new ModalBuilder()
            .setCustomId("update_modal_step2")
            .setTitle("Update Log — Isi Changelog");

        for (let i = 1; i <= 5; i++) {
            const sec = new TextInputBuilder()
                .setCustomId(`section_${i}`)
                .setLabel(`Section ${i} (Nama|item1|item2|...)`)
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(i === 1); // Section 1 wajib, sisanya opsional

            if (i === 1) sec.setPlaceholder("+|Added|New List Seed|New List Pet");
            else if (i === 2) sec.setPlaceholder("-|Deleted|Remove Feature Rollback|Remove Event Guild");
            else if (i === 3) sec.setPlaceholder("!|Fixed|Bug xyz|Crash on load");
            else if (i === 4) sec.setPlaceholder("/|Improved|Performance|UI");
            else sec.setPlaceholder("(Opsional) ex: ~|Note|Something to note");

            modal2.addComponents(new ActionRowBuilder().addComponents(sec));
        }

        return await interaction.showModal(modal2);
    }

    if (map[id]) {
        await interaction.showModal(modal(...map[id]));
    }
}

// ─────────────────────────────────────────
// FIND MY KEY (no modal - pakai Discord ID)
// ─────────────────────────────────────────
async function handleFindMyKey(interaction) {
    await interaction.deferReply({ flags: 64 });

    const userId = interaction.user.id;
    const keys = getUserKeys(userId);

    if (keys.length === 0) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(C.warn)
                    .setAuthor({ name: "KingVypers Premium", iconURL: "https://i.imgur.com/AfFp7pu.png" })
                    .setTitle("🔍  Find My Key")
                    .setDescription(
                        `${DIV}\n\n` +
                        `**${interaction.user}**, belum ada key yang tersimpan untuk akun Discord kamu.\n\n` +
                        `Gunakan tombol **🔑 Redeem Key** terlebih dahulu untuk mendaftarkan key-mu.\n\n` +
                        `${DIV}`
                    )
                    .setTimestamp(),
            ],
        });
    }

    // Cek status tiap key dari API
    const results = await Promise.all(
        keys.map(async (k) => {
            const { status, data } = await api("GET", `/api/check-key/${k}`);
            return { keyCode: k, status: status === 200 ? data.status : "unknown", expiresAt: data.expiresAt };
        })
    );

    const fields = results.map((r, i) => ({
        name: `${i + 1}. \`${r.keyCode}\``,
        value:
            `> Status: ${badge(r.status)}\n` +
            `> Expire: ${fmtDate(r.expiresAt)}\n` +
            `> *(${fmtRelative(r.expiresAt)})*`,
        inline: false,
    }));

    const embed = new EmbedBuilder()
        .setColor(C.gold)
        .setAuthor({ name: "KingVypers Premium", iconURL: "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvyperslogo.jpg" })
        .setTitle("🔍  Find My Key")
        .setDescription(
            `${DIV}\n\n` +
            `Halo **${interaction.user}**! Berikut adalah key yang terdaftar di akun Discord kamu:\n\n` +
            `${DIV}`
        )
        .addFields(...fields)
        .setFooter({ text: `${keys.length} key ditemukan  •  KingVypers Premium` })
        .setTimestamp();

    const copyableKeys = results.map(r => `\`${r.keyCode}\``).join("\n");
    await interaction.editReply({ content: copyableKeys, embeds: [embed] });
}

// ─────────────────────────────────────────
// MODAL HANDLERS
// ─────────────────────────────────────────
async function handleModal(interaction) {
    const id = interaction.customId;
    const keyCode = interaction.fields.getTextInputValue("key_input").trim().toUpperCase();
    const userId = interaction.user.id;
    const userTag = interaction.user.tag;

    // ── REDEEM KEY ──────────────────────────
    if (id === "modal_redeem") {
        await interaction.deferReply({ flags: 64 });
        const { status, data } = await api("GET", `/api/check-key/${keyCode}`);

        if (status === 404 || !data.success) {
            return interaction.editReply({
                embeds: [errEmbed("Key Tidak Ditemukan", `Key \`${keyCode}\` tidak ada di database.\nPastikan key yang kamu masukkan sudah benar.`)],
            });
        }

        if (data.status === "blacklisted") {
            return interaction.editReply({
                embeds: [errEmbed("Key Diblacklist", `Key \`${keyCode}\` telah diblacklist dan **tidak bisa digunakan**.\nHubungi admin jika kamu merasa ini adalah kesalahan.`)],
            });
        }

        if (data.status === "expired") {
            return interaction.editReply({
                embeds: [errEmbed("Key Expired", `Key \`${keyCode}\` sudah kadaluarsa.\n\nExpired pada: ${fmtDate(data.expiresAt)}`)],
            });
        }

        // Link key ke user ini
        linkKey(keyCode, userId);

        const embed = new EmbedBuilder()
            .setColor(C.success)
            .setAuthor({ name: "KingVypers Premium", iconURL: "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvyperslogo.jpg" })
            .setTitle("✅  Key Berhasil Diverifikasi!")
            .setDescription(
                `${DIV}\n\n` +
                `**${interaction.user}** key kamu telah berhasil diverifikasi dan disimpan! 🎉\n\n` +
                `${DIV}`
            )
            .addFields(
                { name: "🔑 Key", value: `\`${keyCode}\``, inline: true },
                { name: "📊 Status", value: badge(data.status), inline: true },
                { name: "📅 Expire", value: fmtDate(data.expiresAt), inline: false },
            )
            .setFooter({ text: "Gunakan Find My Key kapan saja untuk melihat key kamu  •  KingVypers" })
            .setTimestamp();

        await interaction.editReply({ content: `\`${keyCode}\``, embeds: [embed] });
    }

    // ── GET SCRIPT ──────────────────────────
    else if (id === "modal_getscript") {
        await interaction.deferReply({ flags: 64 });
        const { status, data } = await api("GET", `/api/check-key/${keyCode}`);

        if (status === 404 || !data.success) {
            return interaction.editReply({ embeds: [errEmbed("Key Tidak Valid", `Key \`${keyCode}\` tidak ditemukan.`)] });
        }

        if (data.status === "expired" || data.status === "blacklisted") {
            return interaction.editReply({
                embeds: [errEmbed("Key Tidak Aktif", `Key \`${keyCode}\` berstatus ${badge(data.status)}.\nScript hanya tersedia untuk key yang **active**.`)],
            });
        }

        // Link key ke user
        linkKey(keyCode, userId);

        const scriptsText = loaders.map(scr => `\`${scr}\``).join("\n");

        const embed = new EmbedBuilder()
            .setColor(C.success)
            .setAuthor({ name: "KingVypers Premium", iconURL: "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvyperslogo.jpg" })
            .setTitle("📜  Script Loader")
            .setDescription(
                `${DIV}\n\n` +
                `✅ Key \`${keyCode}\` terverifikasi.\n` +
                `Loader script dapat disalin dengan mengetuk teks di atas.\n\n` +
                `${DIV}`
            )
            .addFields(
                { name: "📊 Status Key", value: badge(data.status), inline: true },
                { name: "📅 Expire", value: fmtDate(data.expiresAt), inline: true },
            )
            .setFooter({ text: "⚠️  RAHASIA — Jangan share script ini ke siapapun!  •  KingVypers" })
            .setTimestamp();

        await interaction.editReply({ content: scriptsText, embeds: [embed] });
    }

    // ── GET ROLE ────────────────────────────
    else if (id === "modal_getrole") {
        await interaction.deferReply({ flags: 64 });
        const { status, data } = await api("GET", `/api/check-key/${keyCode}`);

        if (status === 404 || !data.success) {
            return interaction.editReply({ embeds: [errEmbed("Key Tidak Ditemukan", `Key \`${keyCode}\` tidak ada di database.`)] });
        }

        if (data.status === "expired" || data.status === "blacklisted") {
            return interaction.editReply({
                embeds: [errEmbed("Key Tidak Aktif", `Key \`${keyCode}\` berstatus ${badge(data.status)}.\nRole hanya bisa diberikan untuk key yang **active**.`)],
            });
        }

        // ── Cek: apakah key sudah dipakai akun Discord lain?
        const existingOwner = getKeyOwner(keyCode);
        if (existingOwner && existingOwner !== userId) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(C.error)
                        .setAuthor({ name: "KingVypers Premium", iconURL: "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvyperslogo.jpg" })
                        .setTitle("🚫  Key Sudah Digunakan Akun Lain")
                        .setDescription(
                            `${DIV}\n\n` +
                            `Key \`${keyCode}\` sudah **terdaftar** di akun Discord lain.\n\n` +
                            `> 1 key hanya bisa digunakan untuk **1 akun Discord**\n` +
                            `> Jika kamu adalah pemilik sah key ini, hubungi admin\n\n` +
                            `${DIV}`
                        )
                        .setTimestamp(),
                ],
            });
        }

        if (!PREMIUM_ROLE_ID) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(C.warn)
                        .setTitle("⚙️  Konfigurasi Belum Lengkap")
                        .setDescription(`${DIV}\n\n\`PREMIUM_ROLE_ID\` belum diset di \`.env\` bot.\nHubungi admin!\n\n${DIV}`)
                        .setTimestamp(),
                ],
            });
        }

        try {
            const role = await interaction.guild.roles.fetch(PREMIUM_ROLE_ID);
            if (!role) throw new Error("Role not found");

            const member = interaction.member;

            if (member.roles.cache.has(PREMIUM_ROLE_ID)) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(C.info)
                            .setAuthor({ name: "KingVypers Premium", iconURL: "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvyperslogo.jpg" })
                            .setTitle("ℹ️  Sudah Memiliki Role")
                            .setDescription(`${DIV}\n\n**${interaction.user}** sudah memiliki role **${role.name}**!\nTidak perlu klaim lagi. 😊\n\n${DIV}`)
                            .setTimestamp(),
                    ],
                });
            }

            await member.roles.add(role);

            // Simpan link key → user
            linkKey(keyCode, userId);

            const embed = new EmbedBuilder()
                .setColor(C.gold)
                .setAuthor({ name: "KingVypers Premium", iconURL: "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvyperslogo.jpg" })
                .setTitle("🏅  Role Premium Berhasil Diklaim!")
                .setDescription(
                    `${DIV}\n\n` +
                    `🎉 Selamat **${interaction.user}**!\n` +
                    `Kamu mendapatkan role **${role.name}** 👑\n\n` +
                    `${DIV}`
                )
                .addFields(
                    { name: "🔑 Key", value: `\`${keyCode}\``, inline: true },
                    { name: "📊 Status", value: badge(data.status), inline: true },
                    { name: "📅 Expire", value: fmtDate(data.expiresAt), inline: false },
                )
                .setFooter({ text: "Terima kasih sudah menggunakan KingVypers Premium!  •  Enjoy 🎮" })
                .setTimestamp();

            await interaction.editReply({ content: `\`${keyCode}\``, embeds: [embed] });
        } catch (err) {
            console.error("Get Role error:", err);
            await interaction.editReply({
                embeds: [
                    errEmbed(
                        "Gagal Memberikan Role",
                        "Pastikan:\n> ✅ Bot punya permission **Manage Roles**\n> ✅ Role bot lebih tinggi dari role premium\n> ✅ `PREMIUM_ROLE_ID` di `.env` benar"
                    ),
                ],
            });
        }
    }

    // ── RESET HWID ──────────────────────────
    else if (id === "modal_resethwid") {
        await interaction.deferReply({ flags: 64 });

        let status, data;
        if (BOT_SECRET) {
            ({ status, data } = await api("POST", "/api/reset-hwid", { key: keyCode }, BOT_SECRET));
        } else {
            ({ status, data } = await api("POST", "/api/user-reset-hwid", { key: keyCode }));
        }

        if (status === 429) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(C.warn)
                        .setAuthor({ name: "KingVypers Premium", iconURL: "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvyperslogo.jpg" })
                        .setTitle("⏳  Cooldown Aktif")
                        .setDescription(
                            `${DIV}\n\n` +
                            `Kamu baru saja melakukan reset HWID.\n` +
                            `Tunggu sampai cooldown selesai sebelum reset lagi.\n\n` +
                            `**⏰ Bisa reset lagi:** ${fmtDate(data.resetAvailableAt)} *(${fmtRelative(data.resetAvailableAt)})*\n\n` +
                            `${DIV}`
                        )
                        .setTimestamp(),
                ],
            });
        }

        if (!data.success) {
            const msg =
                status === 404 ? `Key \`${keyCode}\` tidak ditemukan.` :
                    status === 403 ? data.message || "Key tidak memenuhi syarat reset HWID." :
                        status === 400 ? data.message || "Key belum aktif atau belum ada HWID yang terikat." :
                            data.message || "Terjadi error. Coba lagi nanti.";

            return interaction.editReply({ embeds: [errEmbed("Reset HWID Gagal", msg)] });
        }

        const embed = new EmbedBuilder()
            .setColor(C.success)
            .setAuthor({ name: "KingVypers Premium", iconURL: "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvyperslogo.jpg" })
            .setTitle("🔄  HWID Berhasil Di-Reset!")
            .setDescription(
                `${DIV}\n\n` +
                `✅ Hardware ID untuk key \`${keyCode}\` telah berhasil di-reset!\n\n` +
                `> Kamu sekarang bisa menggunakan key di **perangkat baru**\n> Tidak perlu aktivasi ulang\n\n` +
                `${DIV}`
            )
            .addFields({
                name: "⏰ Bisa Reset Lagi",
                value: `${fmtDate(data.resetAvailableAt)}\n*(${fmtRelative(data.resetAvailableAt)})*`,
                inline: false,
            })
            .setFooter({ text: "HWID Reset  •  KingVypers Premium" })
            .setTimestamp();

        await interaction.editReply({ content: `\`${keyCode}\``, embeds: [embed] });
    }

    // ── GET STATS ──────────────────────────
    else if (id === "modal_getstats") {
        await interaction.deferReply({ flags: 64 });
        const { status, data } = await api("GET", `/api/check-key/${keyCode}`);

        if (status === 404 || !data.success) {
            return interaction.editReply({ embeds: [errEmbed("Key Tidak Ditemukan", `Key \`${keyCode}\` tidak ada di database.`)] });
        }

        const now = new Date();
        const expDate = data.expiresAt ? new Date(data.expiresAt) : null;
        const daysLeft = expDate ? Math.max(0, Math.ceil((expDate - now) / 86400000)) : null;
        const owner = getKeyOwner(keyCode);

        // Progress bar
        let progressBar = "";
        if (data.status === "active" && data.activatedAt && expDate) {
            const total = expDate - new Date(data.activatedAt);
            const used = now - new Date(data.activatedAt);
            const pct = Math.max(0, Math.min(1, used / total));
            const filled = Math.round(pct * 10);
            progressBar = `${"█".repeat(filled)}${"░".repeat(10 - filled)} ${Math.round(pct * 100)}%`;
        }

        const embed = new EmbedBuilder()
            .setColor(badgeColor(data.status))
            .setAuthor({ name: "KingVypers Premium", iconURL: "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvyperslogo.jpg" })
            .setTitle("📊  Stats Key Premium")
            .setDescription(
                `${DIV}\n` +
                `Informasi lengkap untuk key \`${keyCode}\`\n` +
                `${DIV}`
            )
            .addFields(
                { name: "🟢 Status", value: badge(data.status), inline: true },
                { name: "⏳ Sisa", value: daysLeft !== null ? `**${daysLeft} hari**` : "`—`", inline: true },
                { name: "📅 Expire", value: fmtDate(data.expiresAt), inline: false },
                {
                    name: "💻 HWID",
                    value: data.hwid ? `\`${data.hwid.substring(0, 12)}…\`  *(terikat)*` : "`Belum terikat`",
                    inline: true,
                },
                {
                    name: "🔄 Terakhir Reset HWID",
                    value: data.hwidResetAt ? `${fmtDate(data.hwidResetAt)}\n*(${fmtRelative(data.hwidResetAt)})*` : "`Belum pernah`",
                    inline: true,
                },
                ...(owner ? [{ name: "🔗 Terdaftar untuk", value: `<@${owner}>`, inline: false }] : []),
                ...(progressBar ? [{ name: "📉 Penggunaan", value: `\`${progressBar}\``, inline: false }] : []),
            )
            .setFooter({ text: "Get Stats  •  KingVypers Premium" })
            .setTimestamp();

        await interaction.editReply({ content: `\`${keyCode}\``, embeds: [embed] });
    }
}

// ─────────────────────────────────────────
// CUSTOM EMBED (Announcement Maker)
// ─────────────────────────────────────────
async function handleCustomEmbedModal(interaction) {
    await interaction.deferReply({ flags: 64 }); // Ephemeral balas ke admin aja

    // Ngambil data target channel yang disimpen sementara
    const { pendingEmbedTargets } = await import("../commands/send-embed.js").catch(() => ({ pendingEmbedTargets: new Map() }));
    const targetChannelId = pendingEmbedTargets.get(interaction.user.id);

    if (!targetChannelId) {
        return interaction.editReply({ content: "❌ Target channel hilang/kadaluarsa. Silakan ketik `/send-embed` lagi." });
    }

    // Bersihin memori
    pendingEmbedTargets.delete(interaction.user.id);

    // Ambil isian form
    const title = interaction.fields.getTextInputValue("embed_title");
    const desc = interaction.fields.getTextInputValue("embed_desc");
    const colorStr = interaction.fields.getTextInputValue("embed_color") || "#F1C40F"; // Default Gold
    const imageUrl = interaction.fields.getTextInputValue("embed_image");

    // Validasi warna Hex
    let colorObj = C.gold;
    if (/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorStr)) {
        colorObj = parseInt(colorStr.replace("#", ""), 16);
    }

    // Bikin Embed Khusus Custom
    const announceEmbed = new EmbedBuilder()
        .setColor(colorObj)
        .setDescription(desc)
        .setFooter({
            text: `Pengumuman KingVypers`,
            iconURL: "https://i.imgur.com/AfFp7pu.png"
        })
        .setTimestamp();

    if (title) announceEmbed.setTitle(title);

    if (imageUrl) {
        // Validasi URL gambarnya jalan atau ngga
        try {
            if (imageUrl.startsWith("http")) announceEmbed.setImage(imageUrl);
        } catch (e) { }
    }

    // Coba kirim ke channel
    try {
        const channel = await interaction.client.channels.fetch(targetChannelId);
        if (!channel) throw new Error("Channel tidak ditemukan.");

        await channel.send({ embeds: [announceEmbed] });
        await interaction.editReply({ content: `✅ Pengumuman berhasil dikirim ke ${channel}!` });

    } catch (error) {
        console.error("Gagal mengirim custom embed:", error);
        await interaction.editReply({ content: "❌ Gagal mengirim pengumuman. Pastikan bot punya permission `Send Messages` & `Embed Links` di channel tersebut." });
    }
}

// ─────────────────────────────────────────
// SUPPORT GAME EMBED
// ─────────────────────────────────────────
async function handleSupportGameModal(interaction) {
    await interaction.deferReply({ flags: 64 }); // Ephemeral

    // Ambil data target channel
    const { pendingSupportTargets } = await import("../commands/support-game.js").catch(() => ({ pendingSupportTargets: new Map() }));
    const targetChannelId = pendingSupportTargets.get(interaction.user.id);

    if (!targetChannelId) {
        return interaction.editReply({ content: "❌ Target channel hilang/kadaluarsa. Silakan ketik `/support-game` lagi." });
    }

    pendingSupportTargets.delete(interaction.user.id);

    const title = interaction.fields.getTextInputValue("sg_title") || "Supported Games";
    const imageUrl = interaction.fields.getTextInputValue("sg_image");
    const ops = interaction.fields.getTextInputValue("sg_operational");
    const degs = interaction.fields.getTextInputValue("sg_degraded");
    const deps = interaction.fields.getTextInputValue("sg_deprecated");

    let descriptionLines = [];

    // Helper untuk memproses baris game
    const processLines = (text, emoji) => {
        if (!text) return;
        const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        for (const line of lines) {
            descriptionLines.push(`• **${line}** [ ${emoji} ]`);
        }
    };

    processLines(ops, "🟢");
    processLines(degs, "🟡");
    processLines(deps, "🔴");

    if (descriptionLines.length === 0) {
        return interaction.editReply({ content: "❌ Kamu belum memasukkan game apapun di salah satu kolom status!" });
    }

    const mainEmbed = new EmbedBuilder()
        .setTitle(title)
        .setColor("#2b2d31")
        .setDescription(descriptionLines.join("\n"))
        .setFooter({ text: "Status Update", iconURL: interaction.guild?.iconURL() })
        .setTimestamp();

    if (imageUrl) {
        try {
            if (imageUrl.startsWith("http")) mainEmbed.setThumbnail(imageUrl);
        } catch (e) { }
    }

    // Embed Legend
    const legendEmbed = new EmbedBuilder()
        .setColor("#2b2d31")
        .setDescription(
            `🟢 **Operational** — fully working\n` +
            `🟡 **Degraded** — works, but buggy\n` +
            `🔴 **Deprecated** — outdated / unmaintained`
        );

    try {
        const channel = await interaction.client.channels.fetch(targetChannelId);
        if (!channel) throw new Error("Channel tidak ditemukan.");

        await channel.send({ embeds: [mainEmbed, legendEmbed] });
        await interaction.editReply({ content: `✅ Daftar Support Game berhasil dikirim ke ${channel}!` });

    } catch (error) {
        console.error("Gagal mengirim support game:", error);
        await interaction.editReply({ content: "❌ Gagal mengirim embed. Pastikan bot punya permission di channel tersebut." });
    }
}

// ─────────────────────────────────────────
// SEND UPDATE EMBED & HANDLERS (Velocity Style)
// ─────────────────────────────────────────
async function handleUpdateModalStep1(interaction) {
    const { updateDraftMap } = await import("../commands/send-update.js").catch(() => ({ updateDraftMap: new Map() }));
    const draft = updateDraftMap.get(interaction.user.id) || {};

    draft.bannerUrl = interaction.fields.getTextInputValue("banner_url") || null;
    draft.title = interaction.fields.getTextInputValue("update_title");
    draft.gameName = interaction.fields.getTextInputValue("game_name");
    draft.version = interaction.fields.getTextInputValue("version");
    draft.devNotes = interaction.fields.getTextInputValue("dev_notes") || null;

    updateDraftMap.set(interaction.user.id, draft);

    const btnNext = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("btn_update_step2")
            .setLabel("Lanjut Isi Changelog ➡️")
            .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
        content: "✅ **Step 1 berhasil disimpan!**\nSilakan klik tombol di bawah untuk melanjutkan pengisian Changelog (Added, Fixed, dll).",
        components: [btnNext],
        flags: 64
    });
}

async function handleUpdateModalStep2(interaction) {
    const { updateDraftMap } = await import("../commands/send-update.js").catch(() => ({ updateDraftMap: new Map() }));
    const draft = updateDraftMap.get(interaction.user.id);

    if (!draft) {
        return interaction.reply({
            content: "❌ Session expired, ulangi /send-update.",
            flags: 64,
        });
    }

    await interaction.deferReply({ flags: 64 });

    // ── Parse changelog sections ──
    const sections = [];
    for (let i = 1; i <= 5; i++) {
        const raw = interaction.fields.getTextInputValue(`section_${i}`);
        if (!raw || !raw.trim()) continue;

        const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
        if (parts.length < 2) continue;

        const prefixMap = { "+": "[ + ]", "-": "[ - ]", "!": "[ ! ]", "/": "[ / ]", "~": "[ ~ ]" };
        let prefix = "[ • ]";
        let nameIndex = 0;

        if (prefixMap[parts[0]]) {
            prefix = prefixMap[parts[0]];
            nameIndex = 1;
        }

        const sectionName = parts[nameIndex] || "Section";
        const items = parts.slice(nameIndex + 1);

        // Auto-detect fallback
        if (nameIndex === 0) {
            const sn = sectionName.toLowerCase();
            if (sn.includes("add") || sn.includes("update")) prefix = "[ + ]";
            else if (sn.includes("delet") || sn.includes("remov")) prefix = "[ - ]";
            else if (sn.includes("fix")) prefix = "[ ! ]";
            else if (sn.includes("improv")) prefix = "[ / ]";
        }

        sections.push({ name: sectionName, items, prefix });
    }

    // ── Script type badge ──
    const scriptBadge = draft.scriptType === "premium"
        ? "💎 **Premium Script**"
        : "🆓 **Freemium Script**";

    // ══════════════════════════════════════════
    // Single Embed: Banner + Info + Changelog
    // ══════════════════════════════════════════
    const embed = new EmbedBuilder().setColor(0x6b2fa0);

    let desc = "";

    // Judul besar (Header 1 markdown) di paling atas
    desc += `# ${draft.title}\n`;

    // Role ping (visual di embed) & Script type di bawah judul
    if (draft.pingRole) desc += `<@&${draft.pingRole}> `;
    desc += `${scriptBadge}\n\n`;

    // Game Place & Version
    desc += `• **Game Place:** ${draft.gameName}\n`;
    desc += `• **Version:** ${draft.version}\n`;

    // Developer Notes (blockquote style)
    if (draft.devNotes) {
        desc += `\n• **Developer Notes:**\n> ${draft.devNotes.replace(/\n/g, "\n> ")}\n`;
    }

    // Changelog sections
    if (sections.length > 0) {
        desc += `\n${DIV}\n`;
        for (const sec of sections) {
            desc += `**${sec.name}:**\n`;
            desc += sec.items.map((item) => `${sec.prefix} ${item}`).join("\n");
            desc += `\n${DIV}\n`;
        }
    }

    embed.setDescription(desc.trim());

    // Banner image (di dalam embed yang sama)
    if (draft.bannerUrl) {
        embed.setImage(draft.bannerUrl);
    }

    embed.setFooter({
        text: "KingVypers Update Logs",
        iconURL: "https://raw.githubusercontent.com/taurusss1000-design/web/refs/heads/main/Kingvyperslogo.jpg"
    });
    embed.setTimestamp();

    // ── Buttons (tetap sama) ──
    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("btn_report_bug")
            .setLabel("Report Bugs")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("btn_suggest_feature")
            .setLabel("Suggest a Feature")
            .setStyle(ButtonStyle.Secondary)
    );

    try {
        const targetChannel = await interaction.client.channels.fetch(draft.targetChannelId);
        if (!targetChannel) throw new Error("Channel tidak ditemukan");

        await targetChannel.send({ embeds: [embed], components: [buttons] });

        updateDraftMap.delete(interaction.user.id);
        await interaction.editReply({ content: `✅ Update log berhasil dikirim ke ${targetChannel}!` });
    } catch (error) {
        console.error("Gagal mengirim update log:", error);
        await interaction.editReply({ content: "❌ Gagal mengirim update log. Pastikan bot punya permission di channel tersebut." });
    }
}

async function handleReportBugModal(interaction) {
    await interaction.deferReply({ flags: 64 });

    const title = interaction.fields.getTextInputValue("bug_title");
    const desc = interaction.fields.getTextInputValue("bug_description");
    const steps = interaction.fields.getTextInputValue("bug_steps") || null;

    const bugEmbed = new EmbedBuilder()
        .setColor(0xff4444)
        .setTitle(`🐛 Bug Report — ${title}`)
        .setDescription(desc)
        .setFooter({
            text: `Reported by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

    if (steps) bugEmbed.addFields({ name: "Steps to Reproduce", value: steps });

    try {
        const bugChannel = await interaction.client.channels.fetch("1468470097273163836"); // Report Bug Channel
        if (bugChannel) await bugChannel.send({ embeds: [bugEmbed] });

        await interaction.editReply({ content: "✅ Bug report kamu udah dikirim, makasih!" });
    } catch (e) {
        console.error("Gagal kirim bug report:", e);
        await interaction.editReply({ content: "❌ Gagal mengirim bug report, pastikan channel ID benar dan bot punya akses." });
    }
}

async function handleSuggestFeatureModal(interaction) {
    await interaction.deferReply({ flags: 64 });

    const name = interaction.fields.getTextInputValue("feature_name");
    const desc = interaction.fields.getTextInputValue("feature_desc");

    const suggestEmbed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(`💡 Feature Suggestion — ${name}`)
        .setDescription(desc)
        .setFooter({
            text: `Suggested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

    try {
        const suggestChannel = await interaction.client.channels.fetch("1528572127635177595"); // Suggestion Channel
        if (suggestChannel) await suggestChannel.send({ embeds: [suggestEmbed] });

        await interaction.editReply({ content: "✅ Suggestion kamu udah dikirim, makasih!" });
    } catch (e) {
        console.error("Gagal kirim suggestion:", e);
        await interaction.editReply({ content: "❌ Gagal mengirim suggestion, pastikan channel ID benar dan bot punya akses." });
    }
}

// ─────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────
export async function handleInteraction(interaction, client) {
    try {
        // Cek Role Access Block (jika disetel di env)
        const allowedRoleId = process.env.ALLOWED_ROLE_ID;
        if (allowedRoleId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            if (!interaction.member.roles.cache.has(allowedRoleId)) {
                return interaction.reply({
                    content: `❌ **Akses Ditolak**\nMaaf, kamu harus memiliki role khusus untuk menggunakan sistem bot ini.`,
                    flags: 64
                });
            }
        }

        if (interaction.isButton()) {
            await handleButton(interaction);
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === "modal_custom_embed") {
                await handleCustomEmbedModal(interaction);
            } else if (interaction.customId === "modal_support_game") {
                await handleSupportGameModal(interaction);
            } else if (interaction.customId === "update_modal_step1") {
                await handleUpdateModalStep1(interaction);
            } else if (interaction.customId === "update_modal_step2") {
                await handleUpdateModalStep2(interaction);
            } else if (interaction.customId === "modal_report_bug") {
                await handleReportBugModal(interaction);
            } else if (interaction.customId === "modal_suggest_feature") {
                await handleSuggestFeatureModal(interaction);
            } else {
                await handleModal(interaction);
            }
        }
    } catch (error) {
        console.error("Interaction error:", error);
        const reply = { content: "❌ Terjadi error. Coba lagi nanti.", flags: 64 };
        if (interaction.replied || interaction.deferred) await interaction.followUp(reply).catch(() => { });
        else if (!interaction.isModalSubmit()) await interaction.reply(reply).catch(() => { });
    }
}
