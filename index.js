const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// CẤU HÌNH ID
const MONITOR_CHANNEL_ID = "1482250836108115968"; 
const BAN_CHANNEL_ID = "1480935000130978014";    
const TOKEN = process.env.BOT_TOKEN;

client.on('messageCreate', async (message) => {
    // 1. Chỉ check tin nhắn từ Bot 1 trong kênh giám sát
    if (message.channelId !== MONITOR_CHANNEL_ID || message.author.bot === false) return;
    if (message.embeds.length === 0) return;

    const embed = message.embeds[0];
    const strangeField = embed.fields.find(f => f.name.includes("lạ") || f.name.includes("nhiệm"));
    if (!strangeField) return;

    // Lấy danh sách tiến trình từ tin nhắn của Bot 1
    const processText = strangeField.value.toLowerCase();
    
    // --- BỘ LỌC TỰ ĐỘNG CỦA BOT 2 ---
    const safeKeywords = ['rtkauduservice64', 'smss', 'squid', 'system', 'unsecapp', 'vssvc', 'wudfhost', 'wlanext'];
    const hackKeywords = ['matcha', 'comfort', 'vape', 'executor', 'injector', 'cheat', 'hack', 'app'];

    // Tách các tiến trình thành mảng để kiểm tra từng cái
    const lines = processText.split('\n').map(l => l.replace(/[-\s`]/g, ""));

    let realHacks = [];
    let reallyStrange = [];
    let safes = [];

    lines.forEach(p => {
        if (!p) return;
        if (safeKeywords.some(k => p.includes(k))) {
            safes.push(p);
        } else if (hackKeywords.some(k => p.includes(k))) {
            realHacks.push(p);
        } else {
            reallyStrange.push(p);
        }
    });

    // --- BOT 2 ĐƯA RA KẾT LUẬN ---
    const banChannel = client.channels.cache.get(BAN_CHANNEL_ID);

    if (realHacks.length > 0) {
        // NẾU CÓ HACK THẬT SỰ -> BAN
        if (banChannel) {
            await banChannel.send(`🔨 **PHÁN QUYẾT:** Đã tìm thấy hack **[${realHacks.join(", ")}]**. Thực hiện BAN người dùng!`);
        }
    } else if (reallyStrange.length > 0) {
        // NẾU CÓ CÁI LẠ MÀ KHÔNG BIẾT LÀ GÌ -> CẢNH BÁO ADMIN
        await message.reply(`⚠️ **Tự động check:** Có app lạ [${reallyStrange.join(", ")}], nhưng chưa đủ bằng chứng để BAN. Admin soi ảnh nhé!`);
    } else if (safes.length > 0) {
        // NẾU TẤT CẢ ĐỀU NẰM TRONG SAFE LIST -> BÁO AN TOÀN
        await message.reply(`🛡️ **Tự động check:** Tất cả tiến trình [${safes.join(", ")}] đều thuộc **Safe List**. Máy sạch!`);
    }
});

app.get('/', (req, res) => res.send('Judge Bot is analyzing...'));
app.listen(process.env.PORT || 3000);
client.login(TOKEN);
