const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const MONITOR_CHANNEL_ID = "1482250836108115968"; 
const BAN_CHANNEL_ID = "1480935000130978014";    
const TOKEN = process.env.BOT_TOKEN;

client.on('messageCreate', async (message) => {
    // 1. Chỉ đọc tin nhắn từ Bot gửi báo cáo
    if (message.channelId !== MONITOR_CHANNEL_ID || !message.author.bot) return;
    if (message.embeds.length === 0) return;

    const reportEmbed = message.embeds[0];
    const strangeField = reportEmbed.fields.find(f => f.name.toLowerCase().includes("lạ"));
    if (!strangeField) return;

    // 2. Lấy dữ liệu thô và làm sạch
    const processText = strangeField.value.toLowerCase();
    const lines = processText.split('\n').map(l => l.replace(/[-\s`]/g, "")).filter(l => l.length > 0);

    // 3. BỘ NÃO TỰ PHÂN LOẠI (Mở rộng Safe List từ ảnh bạn gửi)
    const safeKeywords = [
        'rtkauduservice64', 'smss', 'squid', 'system', 'unsecapp', 'vssvc', 'wudfhost', 'wlanext',
        'aksc', 'amdfendrsr', 'appactions', 'crossdevice', 'dtsapo4service', 'kidsafe', 'midisrv',
        'mpdefendercoreservice', 'ms-teams', 'msmpeng', 'nissrv', 'p2penhance', 'phoneexperiencehost',
        'startmenuexperiencehost', 'textinputhost', 'useroobebroker'
    ];
    const hackKeywords = ['matcha', 'comfort', 'vape', 'executor', 'injector', 'cheat', 'hack', 'app'];

    let foundHacks = [];
    let foundSafes = [];
    let foundUnknowns = [];

    lines.forEach(p => {
        if (safeKeywords.some(k => p.includes(k))) foundSafes.push(p);
        else if (hackKeywords.some(k => p.includes(k))) foundHacks.push(p);
        else foundUnknowns.push(p);
    });

    // 4. XỬ LÝ KẾT QUẢ
    const banChannel = client.channels.cache.get(BAN_CHANNEL_ID);

    if (foundHacks.length > 0) {
        // --- TRƯỜNG HỢP: BAN THẲNG TAY ---
        const banEmbed = new EmbedBuilder()
            .setTitle("🔨 LỆNH PHÁN QUYẾT TỰ ĐỘNG")
            .setColor("#FF0000")
            .setThumbnail("https://i.imgur.com/v098Xv0.png") // Icon búa đỏ
            .addFields(
                { name: "👤 Đối tượng", value: reportEmbed.fields[0].value, inline: true },
                { name: "🚨 Bằng chứng Hack", value: `\`\`\`diff\n- ${foundHacks.join("\n- ")}\`\`\`` },
                { name: "🛡️ App hệ thống đi kèm", value: `\`${foundSafes.length} apps (Đã lọc)\``, inline: true }
            )
            .setImage(reportEmbed.image ? reportEmbed.image.url : null)
            .setTimestamp();

        if (banChannel) {
            await banChannel.send({ content: "🚨 **PHÁT HIỆN GIAN LẬN!**", embeds: [banEmbed] });
        }
        await message.react('❌');
        await message.reply("💀 **Kết luận:** Đã tìm thấy mã độc. Lệnh BAN đã được gửi.");

    } else if (foundUnknowns.length > 0) {
        // --- TRƯỜNG HỢP: CÓ CÁI LẠ NHƯNG CHƯA ĐỦ BẰNG CHỨNG ---
        const warnEmbed = new EmbedBuilder()
            .setTitle("⚠️ PHÂN TÍCH NGHI VẤN")
            .setColor("#F1C40F")
            .setDescription(`Phát hiện **${foundUnknowns.length}** tiến trình lạ không nằm trong danh sách an toàn.`)
            .addFields(
                { name: "🔍 App lạ", value: `\`\`\`yaml\n${foundUnknowns.join("\n")}\`\`\`` },
                { name: "💡 Lời khuyên", value: "Admin nên check ảnh màn hình để xác nhận." }
            );

        await message.reply({ embeds: [warnEmbed] });
        await message.react('❓');

    } else if (foundSafes.length > 0) {
        // --- TRƯỜNG HỢP: AN TOÀN TUYỆT ĐỐI ---
        const successEmbed = new EmbedBuilder()
            .setAuthor({ name: "Judge Bot AI", iconURL: "https://i.imgur.com/Z9foc9P.png" })
            .setTitle("✅ XÁC NHẬN AN TOÀN")
            .setColor("#2ECC71")
            .setDescription(`Tất cả **${foundSafes.length}** tiến trình báo về đều khớp với **Safe List**.`)
            .addFields({ name: "🛡️ Trạng thái", value: "Máy sạch. Không phát hiện gian lận." });

        await message.reply({ embeds: [successEmbed] });
        await message.react('✅');
    }
});

app.get('/', (req, res) => res.send('Anticheat AI is Online!'));
app.listen(process.env.PORT || 3000);
client.login(TOKEN);
