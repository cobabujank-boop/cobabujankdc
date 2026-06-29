import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_PATH || path.join(__dirname, "..", "data");
const STORE_PATH = path.join(DATA_DIR, "key-users.json");

// Default structure
const DEFAULT = { keyToUser: {}, userToKeys: {} };

function load() {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    if (!existsSync(STORE_PATH)) {
        writeFileSync(STORE_PATH, JSON.stringify(DEFAULT, null, 2));
        return structuredClone(DEFAULT);
    }
    try {
        return JSON.parse(readFileSync(STORE_PATH, "utf-8"));
    } catch {
        return structuredClone(DEFAULT);
    }
}

function save(data) {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

/**
 * Link key ke Discord user.
 * Returns false jika key sudah dipakai akun lain.
 */
export function linkKey(keyCode, userId) {
    const data = load();
    const key = keyCode.toUpperCase();
    const existing = data.keyToUser[key];

    if (existing && existing !== userId) {
        // Key sudah dipakai akun Discord lain
        return { ok: false, takenByOther: true };
    }

    // Simpan keyToUser
    data.keyToUser[key] = userId;

    // Simpan userToKeys (array - satu user bisa punya banyak key)
    if (!data.userToKeys[userId]) data.userToKeys[userId] = [];
    if (!data.userToKeys[userId].includes(key)) {
        data.userToKeys[userId].push(key);
    }

    save(data);
    return { ok: true };
}

/**
 * Cek apakah key sudah dilink ke user lain.
 */
export function getKeyOwner(keyCode) {
    const data = load();
    return data.keyToUser[keyCode.toUpperCase()] ?? null;
}

/**
 * Ambil semua key milik satu Discord user.
 */
export function getUserKeys(userId) {
    const data = load();
    return data.userToKeys[userId] ?? [];
}

/**
 * Hapus link key dari user (misal kalau key expired/blacklisted).
 */
export function unlinkKey(keyCode) {
    const data = load();
    const key = keyCode.toUpperCase();
    const userId = data.keyToUser[key];
    if (!userId) return;

    delete data.keyToUser[key];
    if (data.userToKeys[userId]) {
        data.userToKeys[userId] = data.userToKeys[userId].filter((k) => k !== key);
        if (data.userToKeys[userId].length === 0) delete data.userToKeys[userId];
    }
    save(data);
}
