const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const app = express();
app.use(express.json({ limit: '50mb' }));

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

app.post('/report', async (req, res) => {
    try {
        const { pc_name, user, processes, screenshot, status } = req.body;

        if (status === "offline") {
            await axios.post(DISCORD_WEBHOOK_URL, { content: `🔴 **${user}** đã ngắt kết nối.` });
            return res.status(200).send("OK");
        }

        // 1. DANH SÁCH HỆ THỐNG (Tuyệt đối an toàn)
        const systemApps = ['svchost', 'conhost', 'dllhost', 'runtimebroker', 'wmiprvse', 'taskhostw', 'explorer', 'dwm', 'csrss', 'wininit', 'winlogon', 'lsass', 'spoolsv', 'smss', 'system', 'unsecapp', 'audiodg', 'fontdrvhost', 'registry', 'memory compression'];
        
        // 2. DANH SÁCH ỨNG DỤNG PHỔ BIẾN (An toàn)
        const commonApps = ['chrome', 'msedge', 'discord', 'zalo', 'steam', 'roblox', 'asus', 'rtkauduservice64', 'squid', 'evkey', 'unikey', 'notepad', 'foxit', 'office', 'gamingservices', 'widgets', 'powershell', 'cmd'];

        // 3. TIẾN TRÌNH THỰC SỰ LẠ (Không nằm trong 2 danh sách trên)
        let unknownApps = processes.filter(name => 
            !systemApps.some(s => name.toLowerCase().includes(s)) && 
            !commonApps.some(c => name.toLowerCase().includes(c))
        );

        // 4. TỪ KHÓA HACK (Báo động đỏ ngay lập tức)
        const cheatKeys = ['cheat', 'hack', 'injector', 'exploit', 'aimbot', 'matcha', 'vape', 'comfort', 'app'];
        let hacksFound = processes.filter(name => cheatKeys.some(k => name.toLowerCase().includes(k)));

        // --- LOGIC PHÁN QUYẾT ---
        let color = 3066993; // Mặc định: Xanh (An toàn)
        let title = "✅ HỆ THỐNG AN TOÀN";
        let statusText = "Người dùng trong sạch.";

        if (hacksFound.length > 0) {
            color = 15548997; // Đỏ (Hack)
            title = "🚨 CẢNH BÁO: PHÁT HIỆN HACK!";
            statusText = `Tìm thấy phần mềm gian lận: ${hacksFound.join(", ")}`;
        } else if (unknownApps.length > 0) {
            color = 16776960; // Vàng (Nghi vấn - Có app lạ nhưng chưa chắc là hack)
            title = "⚠️ CHÚ Ý: CÓ TIẾN TRÌNH LẠ";
            statusText = "Phát hiện ứng dụng chưa xác định, cần Admin soi ảnh màn hình.";
        }

        const embed = {
            title: title,
            color: color,
            fields: [
                { name: "👤 User", value: `\`${user}\``, inline: true },
                { name: "💻 PC", value: `\`${pc_name}\``, inline: true },
                { name: "📝 Kết luận", value: `**${statusText}**` },
                { 
                    name: "🔍 Chi tiết app lạ", 
                    value: unknownApps.length > 0 ? `\`\`\`diff\n- ${unknownApps.join("\n- ")}\`\`\`` : "\`Không có (Máy sạch)\`" 
                }
            ],
            image: { url: 'attachment://screen.jpg' },
            timestamp: new Date()
        };

        const form = new FormData();
        form.append('payload_json', JSON.stringify({ embeds: [embed] }));
        if (screenshot) form.append('file', Buffer.from(screenshot, 'base64'), { filename: 'screen.jpg' });

        await axios.post(DISCORD_WEBHOOK_URL, form, { headers: form.getHeaders(), timeout: 30000 });
        res.status(200).send("OK");
    } catch (e) { res.status(200).send("OK"); }
});

app.listen(process.env.PORT || 3000);
