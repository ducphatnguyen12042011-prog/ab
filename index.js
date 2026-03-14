const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// CẤU HÌNH ID KÊNH
const MONITOR_CHANNEL_ID = "1482250836108115968"; 
const BAN_CHANNEL_ID = "1480935000130978014";    
const TOKEN = process.env.BOT_TOKEN;

client.once('ready', () => {
    console.log(`🚀 Thẩm phán tối cao ${client.user.tag} đã online!`);
});

client.on('messageCreate', async (message) => {
    if (message.channelId !== MONITOR_CHANNEL_ID || message.embeds.length === 0) return;

    const reportEmbed = message.embeds[0];
    const isDanger = reportEmbed.color === 15548997; // Màu đỏ của Bot 1
    
    // Trích xuất thông tin từ Bot 1
    const userField = reportEmbed.fields.find(f => f.name.includes("User"));
    const pcField = reportEmbed.fields.find(f => f.name.includes("PC"));
    const strangeField = reportEmbed.fields.find(f => f.name.includes("lạ"));
    
    const username = userField ? userField.value : "Unknown";
    const pcName = pcField ? pcField.value : "Unknown";
    const strangeApps = strangeField ? strangeField.value : "N/A";

    const banChannel = client.channels.cache.get(BAN_CHANNEL_ID);

    if (isDanger) {
        // --- GIAO DIỆN LỆNH BAN (CỰC ĐẸP) ---
        const banEmbed = new EmbedBuilder()
            .setAuthor({ name: 'HỆ THỐNG PHÁN QUYẾT ANTICHEAT', iconURL: 'https://cdn-icons-png.flaticon.com/512/763/763789.png' })
            .setTitle('🔨 PHÁT HIỆN VI PHẠM NGHIÊM TRỌNG')
            .setColor('#ff0000') // Màu đỏ rực
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/1022/1022313.png') // Icon búa ban
            .addFields(
                { name: '👤 Đối tượng', value: username, inline: true },
                { name: '💻 Thiết bị', value: pcName, inline: true },
                { name: '🚫 Tiến trình cấm', value: strangeApps },
                { name: '📊 Mức độ đe dọa', value: '🔴 Rất cao (Automatic Flag)' }
            )
            .setImage(reportEmbed.image ? reportEmbed.image.url : null) // Lấy lại ảnh screenshot từ Bot 1
            .setFooter({ text: `ID Phiên: ${message.id}` })
            .setTimestamp();

        // Thêm nút bấm tương tác
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Xem bằng chứng gốc')
                .setURL(message.url)
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setCustomId('confirm_ban')
                .setLabel('Xác nhận Ban')
                .setStyle(ButtonStyle.Danger)
        );

        if (banChannel) {
            await banChannel.send({ 
                content: `🚨 **CẢNH BÁO KHẨN CẤP: PHÁT HIỆN HACK TRÊN MÁY ${pcName}**`, 
                embeds: [banEmbed], 
                components: [row] 
            });
        }
        await message.react('🔥'); // Phản ứng ở kênh báo cáo
    } else {
        // --- GIAO DIỆN AN TOÀN (GỌN GÀNG) ---
        const safeEmbed = new EmbedBuilder()
            .setDescription(`🛡️ **Thẩm định:** Người dùng **${username}** vượt qua bài kiểm tra. Trạng thái: **Sạch**.`)
            .setColor('#2ecc71'); // Màu xanh lá mượt mắt

        await message.reply({ embeds: [safeEmbed] });
        await message.react('✅');
    }
});

app.get('/', (req, res) => res.send('Judge Bot Pro is Active!'));
app.listen(process.env.PORT || 3000);
client.login(TOKEN);
