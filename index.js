const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// --- CẤU HÌNH KÊNH ---
const MONITOR_CHANNEL_ID = "1482250836108115968"; // Kênh Bot 1 gửi ảnh
const BAN_CHANNEL_ID = "1480935000130978014";     // Kênh CHỈ DÀNH CHO HACK THẬT SỰ
const TOKEN = process.env.BOT_TOKEN;

client.on('messageCreate', async (message) => {
    if (message.channelId !== MONITOR_CHANNEL_ID || !message.author.bot) return;
    if (message.embeds.length === 0) return;

    const reportEmbed = message.embeds[0];
    
    // Tìm trường chứa tên các tiến trình (dựa theo ảnh của bạn, nó có thể là "Tiến trình cấm" hoặc "Tiến trình lạ")
    const processField = reportEmbed.fields.find(f => f.name.toLowerCase().includes("tiến trình"));
    if (!processField) return;

    // Lọc sạch các ký tự rác (như dấu -, dấu `, khoảng trắng) để đọc đúng tên file
    const processText = processField.value.toLowerCase();
    const lines = processText.split('\n').map(l => l.replace(/[-\s`]/g, "")).filter(l => l.length > 0);

    // --- BỘ LỌC TỐI THƯỢNG ---
    const SAFE_LIST = ['rtkauduservice64', 'smss', 'squid', 'system', 'unsecapp', 'vssvc', 'wudfhost', 'wlanext', 'aksc', 'amdfendrsr', 'appactions', 'crossdevice'];
    
    // TỪ KHÓA TỬ HÌNH (Chỉ có những từ này mới được gửi sang kênh BAN)
    const CRITICAL_HACKS = ['cheatengine', 'ce.exe', 'injector', 'dllinject', 'processhacker', 'loader', 'aimbot', 'wallhack', 'vape', 'matcha', 'comfort', 'executor', 'exploit', 'hacktool'];

    let realHacks = [];
    let safeApps = [];

    lines.forEach(p => {
        // Nếu tên tiến trình chứa từ khóa hack -> Đưa vào danh sách Tử hình
        if (CRITICAL_HACKS.some(k => p.includes(k))) {
            realHacks.push(p);
        } 
        // Nếu chứa từ khóa an toàn (như trong ảnh của bạn) -> Đưa vào danh sách An toàn
        else if (SAFE_LIST.some(k => p.includes(k))) {
            safeApps.push(p);
        }
    });

    const banChannel = client.channels.cache.get(BAN_CHANNEL_ID);
    const targetUser = reportEmbed.fields[0]?.value || "Unknown";
    const targetPC = reportEmbed.fields[1]?.value || "Unknown";

    // --- LOGIC PHÂN LUỒNG TỰ ĐỘNG ---

    if (realHacks.length > 0) {
        // NẾU CÓ HACK THẬT -> GỬI SANG KÊNH 1480935000130978014 (KÊNH BAN)
        const banEmbed = new EmbedBuilder()
            .setAuthor({ name: 'HỆ THỐNG PHÁN QUYẾT ANTICHEAT', iconURL: 'https://cdn-icons-png.flaticon.com/512/1022/1022313.png' })
            .setTitle('🚨 CẢNH BÁO KHẨN CẤP: PHÁT HIỆN HACK TRÊN MÁY')
            .setColor('#E74C3C') // Màu đỏ đậm cảnh báo
            .addFields(
                { name: '👤 Đối tượng', value: targetUser, inline: true },
                { name: '💻 Thiết bị', value: targetPC, inline: true },
                { name: '🚫 Bằng chứng gian lận (Tool Hack)', value: `\`\`\`diff\n- ${realHacks.join('\n- ')}\n\`\`\`` },
                { name: '📊 Mức độ đe dọa', value: '🔴 **RẤT CAO (Critical Threat)** - Yêu cầu BAN ngay lập tức.' }
            )
            .setImage(reportEmbed.image?.url || null)
            .setFooter({ text: 'S.I.L.E.N.T CyberSec Engine' })
            .setTimestamp();

        if (banChannel) {
            await banChannel.send({ content: `🔨 **THỰC THI LỆNH CẤM!**`, embeds: [banEmbed] });
        }
        await message.reply("💀 **[HỆ THỐNG]** Đã xác nhận có Tool Hack thật sự. Đã chuyển hồ sơ sang kênh BAN.");

    } else if (safeApps.length > 0 && realHacks.length === 0) {
        // NẾU CHỈ LÀ FILE HỆ THỐNG (GIỐNG TRONG ẢNH) -> KHÔNG GỬI SANG KÊNH BAN, CHỈ BÁO Ở KÊNH HIỆN TẠI
        await message.reply(`🛡️ **[HỆ THỐNG]** Máy tính này SẠCH. Tiến trình báo cáo chỉ là file hệ thống Windows (\`${safeApps.join(', ')}\`). Đã tự động bỏ qua, không kích hoạt lệnh Ban.`);
        await message.react('✅');
    }
});

app.get('/', (req, res) => res.send('CyberSec Anti-Cheat Engine is Online.'));
app.listen(process.env.PORT || 3000);
client.login(TOKEN);
