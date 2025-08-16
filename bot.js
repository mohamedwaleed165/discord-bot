const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

// قائمة الأوامر
const commands = [
    new SlashCommandBuilder().setName('panel').setDescription('عرض لوحة التحكم الرئيسية'),
    new SlashCommandBuilder().setName('login').setDescription('تسجيل دخول في النظام'),
    new SlashCommandBuilder().setName('logout').setDescription('تسجيل خروج من النظام'),
    new SlashCommandBuilder().setName('employees').setDescription('عرض قائمة جميع الموظفين'),
    new SlashCommandBuilder()
        .setName('give_rank')
        .setDescription('إعطاء رتبة لموظف')
        .addStringOption(option => option.setName('user_id').setDescription('أدخل ID الموظف').setRequired(true))
        .addStringOption(option => option.setName('role_id').setDescription('أدخل ID الرول').setRequired(true)),
    new SlashCommandBuilder()
        .setName('remove_rank')
        .setDescription('سحب رتبة من موظف وإزالة الرول من الديسكورد')
        .addStringOption(option => option.setName('user_id').setDescription('أدخل ID الموظف').setRequired(true))
        .addStringOption(option => option.setName('role_id').setDescription('أدخل ID الرول (اختياري)').setRequired(false)),
    new SlashCommandBuilder()
        .setName('employee_status')
        .setDescription('عرض حالة موظف معين')
        .addStringOption(option => option.setName('user_id').setDescription('أدخل ID الموظف').setRequired(true))
];

// باقي الكود (تعريف التخزين المؤقت للموظفين + تنفيذ الأوامر + الدوال المساعدة ...)
// ...

// تشغيل البوت – التوكن مكشوف هنا مباشرة
client.login('MTQwNTcyMDAyMjUxMjQzNTI0MA.G7BzIE.872zwO9FfqPy0FMgDhaDWawGbSC23tEHrfP0zo');

// تصدير
module.exports = { client, commands };
