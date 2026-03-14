const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// --- CẤU HÌNH HỆ THỐNG ---
const MONITOR_CHANNEL_ID = "1482250836108115968"; 
const BAN_CHANNEL_ID = "1480935000130978014";    
const TOKEN = process.env.BOT_TOKEN;

client.on('messageCreate', async (message) => {
    // Bỏ qua nếu không phải tin nhắn từ Bot giám sát
    if (message.channelId !== MONITOR_CHANNEL_ID || !message.author.bot) return;
    if (message.embeds.length === 0) return;

    const reportEmbed = message.embeds[0];
    const strangeField = reportEmbed.fields.find(f => f.name.toLowerCase().includes("lạ"));
    if (!strangeField) return;

    const processText = strangeField.value.toLowerCase();
    const lines = processText.split('\n').map(l => l.replace(/[-\s`]/g, "")).filter(l => l.length > 0);

    // --- THREAT INTELLIGENCE DATABASE (Dữ liệu Tình báo) ---
    const SAFE_LIST = ['rtkauduservice64', 'smss', 'squid', 'system', 'unsecapp', 'vssvc', 'wudfhost', 'wlanext', 'aksc', 'amdfendrsr', 'appactions', 'crossdevice', 'dtsapo4service', 'kidsafe', 'midisrv', 'mpdefendercoreservice', 'ms-teams', 'msmpeng', 'nissrv', 'p2penhance', 'phoneexperiencehost', 'startmenuexperiencehost', 'textinputhost', 'useroobebroker'];
    
    // Nhận diện Engine tiêm mã độc
    const HACK_PAYLOADS = ['cheatengine', 'ce.exe', 'injector', 'dllinject', 'manualmap', 'processhacker', 'loader', 'aimbot', 'wallhack', 'vape', 'matcha', 'comfort', 'executor', 'exploit', 'hook', 'attach'];
    
    // Nhận diện hành vi giả mạo (Spoofing)
    const SYSTEM_SPOOF = ['svchost', 'runtimebroker', 'explorer', 'winlogon', 'lsass', 'conhost', 'services', 'taskhost'];

    let forensicData = { critical: [], warning: [], cleanCount: 0 };

    lines.forEach(p => {
        if (HACK_PAYLOADS.some(k => p.includes(k))) {
            forensicData.critical.push(`[PAYLOAD] ${p} -> Memory Injection / Exploit Tool`);
        } else if (SYSTEM_SPOOF.some(k => p.includes(k))) {
            forensicData.critical.push(`[SPOOF] ${p} -> Unauthorized Path (Appdata/Temp/Downloads)`);
        } else if (SAFE_LIST.some(k => p.includes(k))) {
            forensicData.cleanCount++;
        } else {
            forensicData.warning.push(`[UNKNOWN] ${p} -> Unverified Publisher / Suspicious Thread`);
        }
    });

    const banChannel = client.channels.cache.get(BAN_CHANNEL_ID);
    const targetUser = reportEmbed.fields[0]?.value || "Unknown_Entity";
    const targetPC = reportEmbed.fields[1]?.value || "Unknown_HWID";
    const caseID = `CSIRT-${message.id.slice(-8).toUpperCase()}`; // Tạo mã hồ sơ ảo cực ngầu

    // --- HỆ THỐNG XUẤT BÁO CÁO (TERMINAL UI) ---

    if (forensicData.critical.length > 0) {
        // 🔴 CẤP ĐỘ: CRITICAL (BAN)
        const banEmbed = new EmbedBuilder()
            .setAuthor({ name: `HỆ THỐNG PHÒNG THỦ KHÔNG GIAN MẠNG | CASE: ${caseID}`, iconURL: 'https://cdn-icons-png.flaticon.com/512/2633/2633264.png' })
            .setTitle('⚠️ [CRITICAL THREAT] PHÁT HIỆN XÂM NHẬP TRÁI PHÉP')
            .setColor('#2B2D31') // Nền tối phong cách Hacker
            .setDescription(`**Mức độ đe dọa:** 🔴 Cực kỳ nghiêm trọng (CVSS: 10.0)\n**Trạng thái:** Đã cô lập đối tượng.`)
            .addFields(
                { name: '📡 TELEMETRY (DỮ LIỆU MỤC TIÊU)', value: `\`\`\`yaml\nTargetID: ${targetUser}\nHardware: ${targetPC}\nScanTime: ${new Date().toISOString()}\n\`\`\`` },
                { name: '🔬 FORENSIC ANALYSIS (BẰNG CHỨNG KỸ THUẬT)', value: `\`\`\`diff\n- DETECTED MALICIOUS SIGNATURES:\n${forensicData.critical.map(c => `- ${c}`).join('\n')}\n\`\`\`` },
                { name: '⚙️ SYSTEM ACTION (HÀNH ĐỘNG)', value: `\`\`\`fix\n> Thực thi giao thức [PERMANENT_BAN].\n> Thu hồi toàn bộ quyền truy cập hệ thống.\n\`\`\`` }
            )
            .setImage(reportEmbed.image?.url || null)
            .setFooter({ text: 'S.I.L.E.N.T CyberSec Engine • Automated Response', iconURL: 'https://cdn-icons-png.flaticon.com/512/2097/2097330.png' })
            .setTimestamp();

        if (banChannel) await banChannel.send({ content: `🚨 <@&ROLE_ADMIN_ID_NEU_CO> **THÔNG BÁO KHẨN: KÍCH HOẠT LỆNH BAN TỰ ĐỘNG!**`, embeds: [banEmbed] });
        await message.reply("💀 **[TERMINAL]** Hành vi thao túng bộ nhớ bị phát hiện. Khóa mục tiêu thành công.");
        await message.react('🛑');

    } else if (forensicData.warning.length > 0) {
        // 🟡 CẤP ĐỘ: WARNING (NGHI VẤN)
        const warnEmbed = new EmbedBuilder()
            .setTitle(`[HEURISTIC ALERT] PHÂN TÍCH HÀNH VI BẤT THƯỜNG`)
            .setColor('#2B2D31')
            .setDescription(`Phát hiện tiến trình không có chữ ký số (Unknown Publisher) hoạt động ngầm.`)
            .addFields(
                { name: '⚠️ THREAT INTELLIGENCE', value: `\`\`\`yaml\n${forensicData.warning.join('\n')}\n\`\`\`` },
                { name: '📋 ADMIN DIRECTIVE', value: `\`\`\`bash\n$ Check_CommandLine -Flag "-inject" / "-attach"\n$ Require_Manual_Review = TRUE\n\`\`\`` }
            );
        await message.reply({ embeds: [warnEmbed] });
        await message.react('⚠️');

    } else {
        // 🟢 CẤP ĐỘ: CLEAR (AN TOÀN)
        const safeText = `\`\`\`yaml\n[+] Telemetry Check: PASSED\n[+] Background Processes: ${forensicData.cleanCount} Verified\n[+] Integrity Status: SECURE\n\`\`\``;
        await message.reply(`🛡️ **[SYSTEM]** Trạng thái mục tiêu ổn định.\n${safeText}`);
        await message.react('✅');
    }
});

app.get('/', (req, res) => res.send('CyberSec Anti-Cheat Engine is Online.'));
app.listen(process.env.PORT || 3000);
client.login(TOKEN);
