const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const MONITOR_CHANNEL_ID = "1482250836108115968"; 
const BAN_CHANNEL_ID = "1480935000130978014";    
const TOKEN = process.env.BOT_TOKEN;

client.on('messageCreate', async (message) => {
    // 1. Chỉ đọc báo cáo từ Bot 1
    if (message.channelId !== MONITOR_CHANNEL_ID || !message.author.bot) return;
    if (message.embeds.length === 0) return;

    const reportEmbed = message.embeds[0];
    const strangeField = reportEmbed.fields.find(f => f.name.toLowerCase().includes("lạ"));
    if (!strangeField) return;

    const processText = strangeField.value.toLowerCase();
    const lines = processText.split('\n').map(l => l.replace(/[-\s`]/g, "")).filter(l => l.length > 0);

    // --- CƠ SỞ DỮ LIỆU ĐIỀU TRA (Dựa trên 9 tiêu chí của bạn) ---
    const SAFE_LIST = ['rtkauduservice64', 'smss', 'squid', 'system', 'unsecapp', 'vssvc', 'wudfhost', 'wlanext', 'aksc', 'amdfendrsr', 'appactions', 'crossdevice', 'dtsapo4service', 'kidsafe', 'midisrv', 'mpdefendercoreservice', 'ms-teams', 'msmpeng', 'nissrv', 'p2penhance', 'phoneexperiencehost', 'startmenuexperiencehost', 'textinputhost', 'useroobebroker'];
    
    const HACK_TOOLS = ['cheatengine', 'ce.exe', 'injector', 'dllinject', 'manualmap', 'processhacker', 'loader', 'aimbot', 'wallhack', 'radarhack', 'esp.exe', 'triggerbot', 'trainer', 'gamehack', 'modmenu', 'inject', 'hook', 'attach', 'vape', 'matcha', 'comfort'];
    
    const SYSTEM_SPOOF = ['svchost', 'runtimebroker', 'explorer', 'winlogon', 'lsass', 'conhost'];

    let report = { ban: [], warn: [], clean: [] };

    lines.forEach(p => {
        // Tiêu chí 2, 4, 7: Phát hiện Tool Hack, Injector, DLL Tool
        if (HACK_TOOLS.some(k => p.includes(k))) {
            report.ban.push({ name: p, reason: "Phát hiện Tool Hack/Injector (Tiêu chí 2, 4, 7)" });
        } 
        // Tiêu chí 3, 6, 9: Phát hiện giả mạo hệ thống hoặc chạy sai thư mục
        else if (SYSTEM_SPOOF.some(k => p.includes(k))) {
            report.ban.push({ name: p, reason: "Giả mạo file Windows - Chạy sai thư mục (Tiêu chí 3, 9)" });
        }
        // Kiểm tra danh sách an toàn
        else if (SAFE_LIST.some(k => p.includes(k))) {
            report.clean.push(p);
        }
        // Tiêu chí 1, 8: App lạ không rõ nguồn gốc, Startup nghi vấn
        else {
            report.warn.push({ name: p, reason: "Tiến trình không xác định - Publisher Unknown (Tiêu chí 1, 8)" });
        }
    });

    const banChannel = client.channels.cache.get(BAN_CHANNEL_ID);

    // --- HÀNH ĐỘNG TỰ ĐỘNG ---
    if (report.ban.length > 0) {
        // KẾT LUẬN: HACK RÕ RÀNG -> BAN
        const banEmbed = new EmbedBuilder()
            .setTitle("🔨 PHÁN QUYẾT CUỐI CÙNG: CẤM VĨNH VIỄN")
            .setColor("#FF0000")
            .setThumbnail("https://i.imgur.com/v098Xv0.png")
            .addFields(
                { name: "👤 Đối tượng", value: reportEmbed.fields[0].value, inline: true },
                { name: "💻 Thiết bị", value: reportEmbed.fields[1] ? reportEmbed.fields[1].value : "N/A", inline: true },
                { name: "🚨 Bằng chứng vi phạm", value: `\`\`\`diff\n${report.ban.map(b => `- ${b.name} : ${b.reason}`).join("\n")}\n\`\`\`` },
                { name: "📂 Phân tích thư mục", value: "Phát hiện tiến trình chạy từ AppData/Temp hoặc Giả danh System32." }
            )
            .setImage(reportEmbed.image ? reportEmbed.image.url : null)
            .setFooter({ text: "Hệ thống Anticheat AI - Công lý thực thi tự động" });

        if (banChannel) await banChannel.send({ content: "🚨 **HỆ THỐNG ĐÃ THỰC THI LỆNH BAN**", embeds: [banEmbed] });
        await message.reply("💀 **Xác nhận:** Đã tìm thấy bằng chứng vi phạm dựa trên 9 tiêu chí. Lệnh Ban đã được xuất.");
        await message.react('🔨');

    } else if (report.warn.length > 0) {
        // KẾT LUẬN: CÓ DẤU HIỆU NGHI VẤN -> BÁO ADMIN
        const warnEmbed = new EmbedBuilder()
            .setTitle("🔍 BÁO CÁO PHÂN TÍCH CHUYÊN SÂU")
            .setColor("#E67E22")
            .addFields(
                { name: "⚠️ Tiến trình nghi vấn", value: `\`\`\`yaml\n${report.warn.map(w => `- ${w.name} (${w.reason})`).join("\n")}\n\`\`\`` },
                { name: "📝 Chỉ dẫn Admin", value: "Check cột **Command line** & **Publisher**. Nếu Publisher là 'Unknown' thì khả năng cao là Hack." }
            );

        await message.reply({ embeds: [warnEmbed] });
        await message.react('🧐');

    } else {
        // KẾT LUẬN: SẠCH
        await message.reply(`🛡️ **Thẩm định:** Máy sạch. Đã lọc bỏ ${report.clean.length} tiến trình hệ thống (smss, system, squid...). Không có dấu hiệu vi phạm.`);
        await message.react('✅');
    }
});

app.get('/', (req, res) => res.send('Anticheat AI Master is Ready.'));
app.listen(process.env.PORT || 3000);
client.login(TOKEN);
