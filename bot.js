const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// إنشاء العميل
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// قاعدة بيانات مؤقتة في الذاكرة
let employees = new Map();
let workSessions = new Map();

// الأوامر المختصرة (Slash Commands) - مبسطة
const commands = [
    new SlashCommandBuilder()
        .setName('لوحة_التحكم')
        .setDescription('عرض لوحة التحكم الرئيسية'),
    
    new SlashCommandBuilder()
        .setName('تسجيل_دخول')
        .setDescription('تسجيل دخول في النظام'),
    
    new SlashCommandBuilder()
        .setName('تسجيل_خروج')
        .setDescription('تسجيل خروج من النظام'),
    
    new SlashCommandBuilder()
        .setName('قائمة_الموظفين')
        .setDescription('عرض قائمة جميع الموظفين')
];Description('أدخل ID الموظف')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('معرف_الرول')
                .setDescription('أدخل ID الرول')
                .setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('سحب_رتبة')
        .setDescription('سحب رتبة من موظف وإزالة الرول من الديسكورد')
        .addStringOption(option =>
            option.setName('معرف_الموظف')
                .setDescription('أدخل ID الموظف')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('معرف_الرول')
                .setDescription('أدخل ID الرول (اختياري)')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('قائمة_الموظفين')
        .setDescription('عرض قائمة جميع الموظفين'),
    
    new SlashCommandBuilder()
        .setName('حالة_الموظف')
        .setDescription('عرض حالة موظف معين')
        .addStringOption(option =>
            option.setName('معرف_الموظف')
                .setDescription('أدخل ID الموظف')
                .setRequired(true))
];

// عند استعداد البوت
client.once('ready', async () => {
    console.log(`✅ البوت جاهز! مسجل الدخول باسم ${client.user.tag}`);
    
    // تسجيل الأوامر
    try {
        console.log('🔄 بدء تسجيل أوامر التطبيق (/)...');
        await client.application.commands.set(commands);
        console.log('✅ تم تسجيل أوامر التطبيق بنجاح!');
    } catch (error) {
        console.error('❌ خطأ في تسجيل الأوامر:', error);
    }
});

// معالج الأوامر المختصرة
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isModalSubmit()) return;

    try {
        // أوامر التطبيق
        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;

            switch (commandName) {
                case 'لوحة_التحكم':
                    await showControlPanel(interaction);
                    break;
                case 'تسجيل_دخول':
                    await showLoginModal(interaction);
                    break;
                case 'تسجيل_خروج':
                    await handleLogout(interaction);
                    break;
                case 'قائمة_الموظفين':
                    await showEmployeeList(interaction);
                    break;
            }
        }
        
        // معالج الأزرار
        if (interaction.isButton()) {
            const { customId } = interaction;

            switch (customId) {
                case 'login_btn':
                    await showLoginModal(interaction);
                    break;
                case 'logout_btn':
                    await handleLogout(interaction);
                    break;
                case 'employee_list_btn':
                    await showEmployeeList(interaction);
                    break;
                case 'refresh_panel':
                    await showControlPanel(interaction);
                    break;
                case 'give_rank_btn':
                    await showGiveRankModal(interaction);
                    break;
                case 'remove_rank_btn':
                    await showRemoveRankModal(interaction);
                    break;
                case 'employee_status_btn':
                    await showEmployeeStatusModal(interaction);
                    break;
            }
        }

        // معالج النماذج
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'login_modal') {
                await processLogin(interaction);
            } else if (interaction.customId === 'give_rank_modal') {
                await processGiveRank(interaction);
            } else if (interaction.customId === 'remove_rank_modal') {
                await processRemoveRank(interaction);
            } else if (interaction.customId === 'employee_status_modal') {
                await processEmployeeStatus(interaction);
            }
        }

    } catch (error) {
        console.error('خطأ في معالجة التفاعل:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ حدث خطأ')
            .setDescription('عذراً، حدث خطأ أثناء تنفيذ العملية. يرجى المحاولة مرة أخرى.');

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

// عرض لوحة التحكم الرئيسية
async function showControlPanel(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('🎛️ لوحة التحكم - نظام إدارة الموظفين')
        .setDescription('مرحباً بك في لوحة التحكم! اختر العملية التي تريد القيام بها:')
        .addFields(
            { name: '👤 الموظفين المتصلين حالياً', value: getOnlineEmployees().toString(), inline: true },
            { name: '📊 إجمالي الموظفين', value: employees.size.toString(), inline: true },
            { name: '⏰ آخر تحديث', value: `<t:${Math.floor(Date.now()/1000)}:R>`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'نظام إدارة الموظفين' });

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('login_btn')
                .setLabel('تسجيل دخول')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📝'),
            new ButtonBuilder()
                .setCustomId('logout_btn')
                .setLabel('تسجيل خروج')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🚪'),
            new ButtonBuilder()
                .setCustomId('employee_list_btn')
                .setLabel('قائمة الموظفين')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👥'),
            new ButtonBuilder()
                .setCustomId('refresh_panel')
                .setLabel('تحديث')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄')
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('give_rank_btn')
                .setLabel('إعطاء رتبة')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👑'),
            new ButtonBuilder()
                .setCustomId('remove_rank_btn')
                .setLabel('سحب رتبة')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('📉'),
            new ButtonBuilder()
                .setCustomId('employee_status_btn')
                .setLabel('حالة موظف')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('👤')
        );

    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], components: [row1, row2] });
    } else {
        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }
}

// عرض نموذج تسجيل الدخول
async function showLoginModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('login_modal')
        .setTitle('تسجيل دخول موظف');

    const nameInput = new TextInputBuilder()
        .setCustomId('employee_name')
        .setLabel('الاسم الكامل')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('أدخل اسمك الكامل')
        .setRequired(true);

    const levelInput = new TextInputBuilder()
        .setCustomId('employee_level')
        .setLabel('المستوى')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('مثال: مستوى أول، مستوى ثاني، إلخ')
        .setRequired(true);

    const jobInput = new TextInputBuilder()
        .setCustomId('employee_job')
        .setLabel('العمل/المهام')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('صف طبيعة عملك أو مهامك')
        .setRequired(true);

    const rankInput = new TextInputBuilder()
        .setCustomId('employee_rank')
        .setLabel('الرتبة (اختياري)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('مدير، مشرف، موظف، إلخ')
        .setRequired(false);

    const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
    const secondActionRow = new ActionRowBuilder().addComponents(levelInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(jobInput);
    const fourthActionRow = new ActionRowBuilder().addComponents(rankInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

    await interaction.showModal(modal);
}

// معالجة تسجيل الدخول
async function processLogin(interaction) {
    const userId = interaction.user.id;
    const name = interaction.fields.getTextInputValue('employee_name');
    const level = interaction.fields.getTextInputValue('employee_level');
    const job = interaction.fields.getTextInputValue('employee_job');
    const rank = interaction.fields.getTextInputValue('employee_rank') || 'موظف';

    // التحقق من وجود الموظف مسجل دخول مسبقاً
    if (employees.has(userId) && employees.get(userId).isOnline) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ تنبيه')
            .setDescription('أنت مسجل دخول بالفعل! يجب تسجيل الخروج أولاً.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    const loginTime = new Date();
    const employee = {
        userId: userId,
        name: name,
        level: level,
        job: job,
        rank: rank,
        loginTime: loginTime,
        isOnline: true,
        totalWorkTime: employees.has(userId) ? employees.get(userId).totalWorkTime || 0 : 0
    };

    employees.set(userId, employee);
    workSessions.set(userId, loginTime);

    const successEmbed = new EmbedBuilder()
        .setColor('#4CAF50')
        .setTitle('✅ تم تسجيل الدخول بنجاح')
        .setDescription(`مرحباً **${name}**! تم تسجيل دخولك في النظام.`)
        .addFields(
            { name: '👤 الاسم', value: name, inline: true },
            { name: '📊 المستوى', value: level, inline: true },
            { name: '👑 الرتبة', value: rank, inline: true },
            { name: '💼 العمل', value: job, inline: false },
            { name: '🕐 وقت تسجيل الدخول', value: `<t:${Math.floor(loginTime.getTime()/1000)}:F>`, inline: false }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [successEmbed] });
}

// تسجيل الخروج
async function handleLogout(interaction) {
    const userId = interaction.user.id;

    if (!employees.has(userId) || !employees.get(userId).isOnline) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ تنبيه')
            .setDescription('أنت لست مسجل دخول حالياً!');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    const employee = employees.get(userId);
    const logoutTime = new Date();
    const sessionDuration = Math.floor((logoutTime - workSessions.get(userId)) / 1000 / 60); // بالدقائق

    employee.isOnline = false;
    employee.logoutTime = logoutTime;
    employee.lastSessionDuration = sessionDuration;
    employee.totalWorkTime += sessionDuration;

    employees.set(userId, employee);
    workSessions.delete(userId);

    const logoutEmbed = new EmbedBuilder()
        .setColor('#FF9800')
        .setTitle('👋 تم تسجيل الخروج')
        .setDescription(`وداعاً **${employee.name}**! شكراً لك على عملك اليوم.`)
        .addFields(
            { name: '⏱️ مدة الجلسة', value: `${sessionDuration} دقيقة`, inline: true },
            { name: '🕐 وقت الخروج', value: `<t:${Math.floor(logoutTime.getTime()/1000)}:F>`, inline: true },
            { name: '📊 إجمالي ساعات العمل', value: `${Math.floor(employee.totalWorkTime / 60)} ساعة و ${employee.totalWorkTime % 60} دقيقة`, inline: false }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [logoutEmbed] });
}

// عرض نموذج إعطاء الرتبة
async function showGiveRankModal(interaction) {
    // التحقق من الصلاحيات
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ غير مسموح')
            .setDescription('ليس لديك الصلاحية لإعطاء الرتب.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    const modal = new ModalBuilder()
        .setCustomId('give_rank_modal')
        .setTitle('إعطاء رتبة لموظف');

    const userIdInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('ID الموظف')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('أدخل ID الموظف')
        .setRequired(true);

    const roleIdInput = new TextInputBuilder()
        .setCustomId('role_id')
        .setLabel('ID الرول')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('أدخل ID الرول')
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(userIdInput);
    const secondActionRow = new ActionRowBuilder().addComponents(roleIdInput);

    modal.addComponents(firstActionRow, secondActionRow);

    await interaction.showModal(modal);
}

// عرض نموذج سحب الرتبة
async function showRemoveRankModal(interaction) {
    // التحقق من الصلاحيات
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ غير مسموح')
            .setDescription('ليس لديك الصلاحية لسحب الرتب.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    const modal = new ModalBuilder()
        .setCustomId('remove_rank_modal')
        .setTitle('سحب رتبة من موظف');

    const userIdInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('ID الموظف')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('أدخل ID الموظف')
        .setRequired(true);

    const roleIdInput = new TextInputBuilder()
        .setCustomId('role_id')
        .setLabel('ID الرول (اختياري)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('أدخل ID الرول أو اتركه فارغ لعرض القائمة')
        .setRequired(false);

    const firstActionRow = new ActionRowBuilder().addComponents(userIdInput);
    const secondActionRow = new ActionRowBuilder().addComponents(roleIdInput);

    modal.addComponents(firstActionRow, secondActionRow);

    await interaction.showModal(modal);
}

// عرض نموذج حالة الموظف
async function showEmployeeStatusModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('employee_status_modal')
        .setTitle('عرض حالة موظف');

    const userIdInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('ID الموظف')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('أدخل ID الموظف')
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(userIdInput);

    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

// معالجة إعطاء الرتبة من النموذج
async function processGiveRank(interaction) {
    const userIdInput = interaction.fields.getTextInputValue('user_id').trim();
    const roleIdInput = interaction.fields.getTextInputValue('role_id').trim();

    // التحقق من صحة ID المستخدم
    let targetUser;
    try {
        targetUser = await client.users.fetch(userIdInput);
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ خطأ في ID المستخدم')
            .setDescription('ID المستخدم غير صحيح أو المستخدم غير موجود.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    // التحقق من وجود العضو في السيرفر
    const targetMember = await interaction.guild.members.fetch(userIdInput).catch(() => null);
    if (!targetMember) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ تنبيه')
            .setDescription('هذا المستخدم غير موجود في السيرفر.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    // التحقق من صحة ID الرول
    const roleToAdd = interaction.guild.roles.cache.get(roleIdInput);
    if (!roleToAdd) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ خطأ في ID الرول')
            .setDescription('ID الرول غير صحيح أو الرول غير موجود في السيرفر.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    // التحقق من إمكانية إضافة الرول
    if (roleToAdd.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ غير مسموح')
            .setDescription('لا يمكنك إعطاء رول أعلى من رتبتك أو مساوي لها.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    try {
        // إضافة الرول للعضو
        await targetMember.roles.add(roleToAdd);

        // تحديث البيانات في النظام إذا كان مسجل
        if (employees.has(userIdInput)) {
            const employee = employees.get(userIdInput);
            const oldRank = employee.rank;
            employee.rank = roleToAdd.name;
            employee.roleId = roleToAdd.id;
            employees.set(userIdInput, employee);

            const rankEmbed = new EmbedBuilder()
                .setColor('#9C27B0')
                .setTitle('👑 تم تحديث الرتبة بنجاح')
                .setDescription(`تم إعطاء ${targetUser.displayName} رتبة جديدة وإضافة الرول في الديسكورد!`)
                .addFields(
                    { name: '👤 الموظف', value: employee.name, inline: true },
                    { name: '🆔 ID الموظف', value: `\`${userIdInput}\``, inline: true },
                    { name: '📋 الرتبة السابقة', value: oldRank, inline: true },
                    { name: '🎖️ الرتبة الجديدة', value: roleToAdd.name, inline: true },
                    { name: '🏷️ الرول المُضاف', value: `<@&${roleToAdd.id}>`, inline: true },
                    { name: '🆔 ID الرول', value: `\`${roleIdInput}\``, inline: true },
                    { name: '👤 تم بواسطة', value: interaction.user.displayName, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [rankEmbed] });
        } else {
            // إضافة الرول حتى لو لم يكن مسجل في النظام
            const rankEmbed = new EmbedBuilder()
                .setColor('#9C27B0')
                .setTitle('👑 تم إضافة الرول بنجاح')
                .setDescription(`تم إعطاء ${targetUser.displayName} الرول ${roleToAdd.name} في الديسكورد!`)
                .addFields(
                    { name: '👤 العضو', value: targetUser.displayName, inline: true },
                    { name: '🆔 ID العضو', value: `\`${userIdInput}\``, inline: true },
                    { name: '🏷️ الرول المُضاف', value: `<@&${roleToAdd.id}>`, inline: true },
                    { name: '🆔 ID الرول', value: `\`${roleIdInput}\``, inline: true },
                    { name: '👤 تم بواسطة', value: interaction.user.displayName, inline: true },
                    { name: '💡 ملاحظة', value: 'العضو غير مسجل في نظام الموظفين', inline: false }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [rankEmbed] });
        }

    } catch (error) {
        console.error('خطأ في إضافة الرول:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ فشل في إضافة الرول')
            .setDescription('حدث خطأ أثناء محاولة إضافة الرول. تأكد من أن البوت لديه الصلاحيات المطلوبة وأن رول البوت أعلى من الرول المراد إضافته.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

// معالجة سحب الرتبة من النموذج
async function processRemoveRank(interaction) {
    const userIdInput = interaction.fields.getTextInputValue('user_id').trim();
    const roleIdInput = interaction.fields.getTextInputValue('role_id').trim();

    // التحقق من صحة ID المستخدم
    let targetUser;
    try {
        targetUser = await client.users.fetch(userIdInput);
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ خطأ في ID المستخدم')
            .setDescription('ID المستخدم غير صحيح أو المستخدم غير موجود.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    // التحقق من وجود العضو في السيرفر
    const targetMember = await interaction.guild.members.fetch(userIdInput).catch(() => null);
    if (!targetMember) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ تنبيه')
            .setDescription('هذا المستخدم غير موجود في السيرفر.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    try {
        // إزالة الرول المحدد أو عرض قائمة الأرولز
        if (roleIdInput) {
            // التحقق من صحة ID الرول
            const roleToRemove = interaction.guild.roles.cache.get(roleIdInput);
            if (!roleToRemove) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('⚠️ خطأ في ID الرول')
                    .setDescription('ID الرول غير صحيح أو الرول غير موجود في السيرفر.');

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }

            // التحقق من وجود الرول مع العضو
            if (!targetMember.roles.cache.has(roleIdInput)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('⚠️ تنبيه')
                    .setDescription(`العضو لا يملك الرول ${roleToRemove.name}.`);

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }

            await targetMember.roles.remove(roleToRemove);
            
            // تحديث البيانات في النظام
            if (employees.has(userIdInput)) {
                const employee = employees.get(userIdInput);
                const oldRank = employee.rank;
                employee.rank = 'موظف'; // الرتبة الافتراضية
                delete employee.roleId;
                employees.set(userIdInput, employee);

                const demoteEmbed = new EmbedBuilder()
                    .setColor('#F44336')
                    .setTitle('📉 تم سحب الرول والرتبة')
                    .setDescription(`تم سحب الرول ${roleToRemove.name} من ${targetUser.displayName} وتحديث رتبته في النظام.`)
                    .addFields(
                        { name: '👤 الموظف', value: employee.name, inline: true },
                        { name: '🆔 ID الموظف', value: `\`${userIdInput}\``, inline: true },
                        { name: '📋 الرتبة السابقة', value: oldRank, inline: true },
                        { name: '🎖️ الرتبة الحالية', value: 'موظف', inline: true },
                        { name: '🏷️ الرول المُزال', value: `~~${roleToRemove.name}~~`, inline: true },
                        { name: '🆔 ID الرول', value: `\`${roleIdInput}\``, inline: true },
                        { name: '👤 تم بواسطة', value: interaction.user.displayName, inline: true }
                    )
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setTimestamp();

                await interaction.reply({ embeds: [demoteEmbed] });
            } else {
                const demoteEmbed = new EmbedBuilder()
                    .setColor('#F44336')
                    .setTitle('📉 تم سحب الرول')
                    .setDescription(`تم سحب الرول ${roleToRemove.name} من ${targetUser.displayName}.`)
                    .addFields(
                        { name: '👤 العضو', value: targetUser.displayName, inline: true },
                        { name: '🆔 ID العضو', value: `\`${userIdInput}\``, inline: true },
                        { name: '🏷️ الرول المُزال', value: `~~${roleToRemove.name}~~`, inline: true },
                        { name: '🆔 ID الرول', value: `\`${roleIdInput}\``, inline: true },
                        { name: '👤 تم بواسطة', value: interaction.user.displayName, inline: true },
                        { name: '💡 ملاحظة', value: 'العضو غير مسجل في نظام الموظفين', inline: false }
                    )
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setTimestamp();

                await interaction.reply({ embeds: [demoteEmbed] });
            }
        } else {
            // إذا لم يُحدد رول، اعرض قائمة بأرولز العضو القابلة للإزالة
            const memberRoles = targetMember.roles.cache
                .filter(role => role.id !== interaction.guild.id) // استثناء رول @everyone
                .filter(role => role.position < interaction.member.roles.highest.position || interaction.guild.ownerId === interaction.user.id)
                .sort((a, b) => b.position - a.position);

            if (memberRoles.size === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('⚠️ تنبيه')
                    .setDescription('هذا العضو لا يملك أي أرولز يمكن سحبها.');

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }

            const rolesList = memberRoles.map(role => `• <@&${role.id}> - **${role.name}** (\`${role.id}\`)`).join('\n');
            
            const infoEmbed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('🏷️ أرولز العضو')
                .setDescription(`أرولز ${targetUser.displayName} الحالية:\n\n${rolesList}\n\n**استخدم زر "سحب رتبة" مرة أخرى مع ID الرول المراد سحبه.**`)
                .addFields(
                    { name: '🆔 ID العضو', value: `\`${userIdInput}\``, inline: true },
                    { name: '📝 طريقة الاستخدام', value: 'انسخ ID الرول واستخدم الزر مرة أخرى', inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [infoEmbed] });
        }

    } catch (error) {
        console.error('خطأ في سحب الرول:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ فشل في سحب الرول')
            .setDescription('حدث خطأ أثناء محاولة سحب الرول. تأكد من أن البوت لديه الصلاحيات المطلوبة وأن رول البوت أعلى من الرول المراد سحبه.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

// معالجة عرض حالة الموظف من النموذج
async function processEmployeeStatus(interaction) {
    const userIdInput = interaction.fields.getTextInputValue('user_id').trim();

    // التحقق من صحة ID المستخدم
    let targetUser;
    try {
        targetUser = await client.users.fetch(userIdInput);
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ خطأ في ID المستخدم')
            .setDescription('ID المستخدم غير صحيح أو المستخدم غير موجود.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    if (!employees.has(userIdInput)) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ غير موجود')
            .setDescription('هذا المستخدم غير مسجل في النظام.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    const employee = employees.get(userIdInput);
    const totalHours = Math.floor(employee.totalWorkTime / 60);
    const totalMinutes = employee.totalWorkTime % 60;

    let statusDescription = '';
    let color = '#95A5A6';

    if (employee.isOnline) {
        const currentSessionTime = Math.floor((Date.now() - workSessions.get(userIdInput)) / 1000 / 60);
        statusDescription = `🟢 **متصل حالياً**\nمدة الجلسة الحالية: ${currentSessionTime} دقيقة`;
        color = '#4CAF50';
    } else {
        const lastSession = employee.lastSessionDuration || 0;
        statusDescription = `🔴 **غير متصل**\nآخر جلسة: ${lastSession} دقيقة`;
        color = '#F44336';
    }

    const statusEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`👤 حالة الموظف: ${employee.name}`)
        .setDescription(statusDescription)
        .addFields(
            { name: '🆔 ID الموظف', value: `\`${userIdInput}\``, inline: true },
            { name: '🎖️ الرتبة', value: employee.rank, inline: true },
            { name: '📊 المستوى', value: employee.level, inline: true },
            { name: '💼 العمل', value: employee.job, inline: false },
            { name: '📅 تسجيل الدخول الأول', value: `<t:${Math.floor(employee.loginTime.getTime()/1000)}:F>`, inline: false },
            { name: '⏱️ إجمالي ساعات العمل', value: `${totalHours} ساعة و ${totalMinutes} دقيقة`, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

    await interaction.reply({ embeds: [statusEmbed] });
}
}

// إعطاء رتبة
async function giveRank(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ غير مسموح')
            .setDescription('ليس لديك الصلاحية لإعطاء الرتب.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    const userIdInput = interaction.options.getString('معرف_الموظف');
    const roleIdInput = interaction.options.getString('معرف_الرول');

    // التحقق من صحة ID المستخدم
    let targetUser;
    try {
        targetUser = await client.users.fetch(userIdInput);
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ خطأ في ID المستخدم')
            .setDescription('ID المستخدم غير صحيح أو المستخدم غير موجود.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    // التحقق من وجود العضو في السيرفر
    const targetMember = await interaction.guild.members.fetch(userIdInput).catch(() => null);
    if (!targetMember) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ تنبيه')
            .setDescription('هذا المستخدم غير موجود في السيرفر.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    // التحقق من صحة ID الرول
    const roleToAdd = interaction.guild.roles.cache.get(roleIdInput);
    if (!roleToAdd) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ خطأ في ID الرول')
            .setDescription('ID الرول غير صحيح أو الرول غير موجود في السيرفر.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    // التحقق من إمكانية إضافة الرول
    if (roleToAdd.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ غير مسموح')
            .setDescription('لا يمكنك إعطاء رول أعلى من رتبتك أو مساوي لها.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    try {
        // إضافة الرول للعضو
        await targetMember.roles.add(roleToAdd);

        // تحديث البيانات في النظام إذا كان مسجل
        if (employees.has(userIdInput)) {
            const employee = employees.get(userIdInput);
            const oldRank = employee.rank;
            employee.rank = roleToAdd.name;
            employee.roleId = roleToAdd.id;
            employees.set(userIdInput, employee);

            const rankEmbed = new EmbedBuilder()
                .setColor('#9C27B0')
                .setTitle('👑 تم تحديث الرتبة بنجاح')
                .setDescription(`تم إعطاء ${targetUser.displayName} رتبة جديدة وإضافة الرول في الديسكورد!`)
                .addFields(
                    { name: '👤 الموظف', value: employee.name, inline: true },
                    { name: '🆔 ID الموظف', value: `\`${userIdInput}\``, inline: true },
                    { name: '📋 الرتبة السابقة', value: oldRank, inline: true },
                    { name: '🎖️ الرتبة الجديدة', value: roleToAdd.name, inline: true },
                    { name: '🏷️ الرول المُضاف', value: `<@&${roleToAdd.id}>`, inline: true },
                    { name: '🆔 ID الرول', value: `\`${roleIdInput}\``, inline: true },
                    { name: '👤 تم بواسطة', value: interaction.user.displayName, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [rankEmbed] });
        } else {
            // إضافة الرول حتى لو لم يكن مسجل في النظام
            const rankEmbed = new EmbedBuilder()
                .setColor('#9C27B0')
                .setTitle('👑 تم إضافة الرول بنجاح')
                .setDescription(`تم إعطاء ${targetUser.displayName} الرول ${roleToAdd.name} في الديسكورد!`)
                .addFields(
                    { name: '👤 العضو', value: targetUser.displayName, inline: true },
                    { name: '🆔 ID العضو', value: `\`${userIdInput}\``, inline: true },
                    { name: '🏷️ الرول المُضاف', value: `<@&${roleToAdd.id}>`, inline: true },
                    { name: '🆔 ID الرول', value: `\`${roleIdInput}\``, inline: true },
                    { name: '👤 تم بواسطة', value: interaction.user.displayName, inline: true },
                    { name: '💡 ملاحظة', value: 'العضو غير مسجل في نظام الموظفين', inline: false }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [rankEmbed] });
        }

    } catch (error) {
        console.error('خطأ في إضافة الرول:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ فشل في إضافة الرول')
            .setDescription('حدث خطأ أثناء محاولة إضافة الرول. تأكد من أن البوت لديه الصلاحيات المطلوبة وأن رول البوت أعلى من الرول المراد إضافته.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

// سحب رتبة
async function removeRank(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ غير مسموح')
            .setDescription('ليس لديك الصلاحية لسحب الرتب.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    const userIdInput = interaction.options.getString('معرف_الموظف');
    const roleIdInput = interaction.options.getString('معرف_الرول');

    // التحقق من صحة ID المستخدم
    let targetUser;
    try {
        targetUser = await client.users.fetch(userIdInput);
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ خطأ في ID المستخدم')
            .setDescription('ID المستخدم غير صحيح أو المستخدم غير موجود.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    // التحقق من وجود العضو في السيرفر
    const targetMember = await interaction.guild.members.fetch(userIdInput).catch(() => null);
    if (!targetMember) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ تنبيه')
            .setDescription('هذا المستخدم غير موجود في السيرفر.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    try {
        // إزالة الرول المحدد أو عرض قائمة الأرولز
        if (roleIdInput) {
            // التحقق من صحة ID الرول
            const roleToRemove = interaction.guild.roles.cache.get(roleIdInput);
            if (!roleToRemove) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('⚠️ خطأ في ID الرول')
                    .setDescription('ID الرول غير صحيح أو الرول غير موجود في السيرفر.');

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }

            // التحقق من وجود الرول مع العضو
            if (!targetMember.roles.cache.has(roleIdInput)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('⚠️ تنبيه')
                    .setDescription(`العضو لا يملك الرول ${roleToRemove.name}.`);

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }

            await targetMember.roles.remove(roleToRemove);
            
            // تحديث البيانات في النظام
            if (employees.has(userIdInput)) {
                const employee = employees.get(userIdInput);
                const oldRank = employee.rank;
                employee.rank = 'موظف'; // الرتبة الافتراضية
                delete employee.roleId;
                employees.set(userIdInput, employee);

                const demoteEmbed = new EmbedBuilder()
                    .setColor('#F44336')
                    .setTitle('📉 تم سحب الرول والرتبة')
                    .setDescription(`تم سحب الرول ${roleToRemove.name} من ${targetUser.displayName} وتحديث رتبته في النظام.`)
                    .addFields(
                        { name: '👤 الموظف', value: employee.name, inline: true },
                        { name: '🆔 ID الموظف', value: `\`${userIdInput}\``, inline: true },
                        { name: '📋 الرتبة السابقة', value: oldRank, inline: true },
                        { name: '🎖️ الرتبة الحالية', value: 'موظف', inline: true },
                        { name: '🏷️ الرول المُزال', value: `~~${roleToRemove.name}~~`, inline: true },
                        { name: '🆔 ID الرول', value: `\`${roleIdInput}\``, inline: true },
                        { name: '👤 تم بواسطة', value: interaction.user.displayName, inline: true }
                    )
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setTimestamp();

                await interaction.reply({ embeds: [demoteEmbed] });
            } else {
                const demoteEmbed = new EmbedBuilder()
                    .setColor('#F44336')
                    .setTitle('📉 تم سحب الرول')
                    .setDescription(`تم سحب الرول ${roleToRemove.name} من ${targetUser.displayName}.`)
                    .addFields(
                        { name: '👤 العضو', value: targetUser.displayName, inline: true },
                        { name: '🆔 ID العضو', value: `\`${userIdInput}\``, inline: true },
                        { name: '🏷️ الرول المُزال', value: `~~${roleToRemove.name}~~`, inline: true },
                        { name: '🆔 ID الرول', value: `\`${roleIdInput}\``, inline: true },
                        { name: '👤 تم بواسطة', value: interaction.user.displayName, inline: true },
                        { name: '💡 ملاحظة', value: 'العضو غير مسجل في نظام الموظفين', inline: false }
                    )
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setTimestamp();

                await interaction.reply({ embeds: [demoteEmbed] });
            }
        } else {
            // إذا لم يُحدد رول، اعرض قائمة بأرولز العضو القابلة للإزالة
            const memberRoles = targetMember.roles.cache
                .filter(role => role.id !== interaction.guild.id) // استثناء رول @everyone
                .filter(role => role.position < interaction.member.roles.highest.position || interaction.guild.ownerId === interaction.user.id)
                .sort((a, b) => b.position - a.position);

            if (memberRoles.size === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('⚠️ تنبيه')
                    .setDescription('هذا العضو لا يملك أي أرولز يمكن سحبها.');

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }

            const rolesList = memberRoles.map(role => `• <@&${role.id}> - **${role.name}** (\`${role.id}\`)`).join('\n');
            
            const infoEmbed = new EmbedBuilder()
                .setColor('#2196F3')
                .setTitle('🏷️ أرولز العضو')
                .setDescription(`أرولز ${targetUser.displayName} الحالية:\n\n${rolesList}\n\n**استخدم الأمر مرة أخرى مع ID الرول المراد سحبه.**`)
                .addFields(
                    { name: '🆔 ID العضو', value: `\`${userIdInput}\``, inline: true },
                    { name: '📝 طريقة الاستخدام', value: 'انسخ ID الرول واستخدم الأمر مرة أخرى', inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [infoEmbed] });
        }

    } catch (error) {
        console.error('خطأ في سحب الرول:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ فشل في سحب الرول')
            .setDescription('حدث خطأ أثناء محاولة سحب الرول. تأكد من أن البوت لديه الصلاحيات المطلوبة وأن رول البوت أعلى من الرول المراد سحبه.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

// عرض قائمة الموظفين
async function showEmployeeList(interaction) {
    if (employees.size === 0) {
        const emptyEmbed = new EmbedBuilder()
            .setColor('#95A5A6')
            .setTitle('📋 قائمة الموظفين')
            .setDescription('لا يوجد موظفين مسجلين في النظام.');

        await interaction.reply({ embeds: [emptyEmbed] });
        return;
    }

    const employeesArray = Array.from(employees.values());
    const onlineEmployees = employeesArray.filter(emp => emp.isOnline);
    const offlineEmployees = employeesArray.filter(emp => !emp.isOnline);

    let description = '';

    if (onlineEmployees.length > 0) {
        description += '🟢 **الموظفين المتصلين:**\n';
        onlineEmployees.forEach(emp => {
            const workingTime = Math.floor((Date.now() - workSessions.get(emp.userId)) / 1000 / 60);
            description += `• **${emp.name}** (${emp.rank}) - متصل منذ ${workingTime} دقيقة\n  └ ID: \`${emp.userId}\`\n`;
        });
        description += '\n';
    }

    if (offlineEmployees.length > 0) {
        description += '🔴 **الموظفين غير المتصلين:**\n';
        offlineEmployees.slice(0, 8).forEach(emp => {
            const totalHours = Math.floor(emp.totalWorkTime / 60);
            const totalMinutes = emp.totalWorkTime % 60;
            description += `• **${emp.name}** (${emp.rank}) - إجمالي العمل: ${totalHours}س ${totalMinutes}د\n  └ ID: \`${emp.userId}\`\n`;
        });
    }

    const listEmbed = new EmbedBuilder()
        .setColor('#2196F3')
        .setTitle('👥 قائمة الموظفين')
        .setDescription(description)
        .addFields(
            { name: '📊 الإحصائيات', value: `المتصلين: ${onlineEmployees.length}\nغير متصلين: ${offlineEmployees.length}\nالإجمالي: ${employees.size}`, inline: true },
            { name: '💡 ملاحظة', value: 'يمكن استخدام ID الموظف في أوامر إدارة الرتب', inline: true }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [listEmbed] });
}

// عرض حالة موظف محدد
async function showEmployeeStatus(interaction) {
    const userIdInput = interaction.options.getString('معرف_الموظف');

    // التحقق من صحة ID المستخدم
    let targetUser;
    try {
        targetUser = await client.users.fetch(userIdInput);
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ خطأ في ID المستخدم')
            .setDescription('ID المستخدم غير صحيح أو المستخدم غير موجود.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    if (!employees.has(userIdInput)) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⚠️ غير موجود')
            .setDescription('هذا المستخدم غير مسجل في النظام.');

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
    }

    const employee = employees.get(userIdInput);
    const totalHours = Math.floor(employee.totalWorkTime / 60);
    const totalMinutes = employee.totalWorkTime % 60;

    let statusDescription = '';
    let color = '#95A5A6';

    if (employee.isOnline) {
        const currentSessionTime = Math.floor((Date.now() - workSessions.get(userIdInput)) / 1000 / 60);
        statusDescription = `🟢 **متصل حالياً**\nمدة الجلسة الحالية: ${currentSessionTime} دقيقة`;
        color = '#4CAF50';
    } else {
        const lastSession = employee.lastSessionDuration || 0;
        statusDescription = `🔴 **غير متصل**\nآخر جلسة: ${lastSession} دقيقة`;
        color = '#F44336';
    }

    const statusEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`👤 حالة الموظف: ${employee.name}`)
        .setDescription(statusDescription)
        .addFields(
            { name: '🆔 ID الموظف', value: `\`${userIdInput}\``, inline: true },
            { name: '🎖️ الرتبة', value: employee.rank, inline: true },
            { name: '📊 المستوى', value: employee.level, inline: true },
            { name: '💼 العمل', value: employee.job, inline: false },
            { name: '📅 تسجيل الدخول الأول', value: `<t:${Math.floor(employee.loginTime.getTime()/1000)}:F>`, inline: false },
            { name: '⏱️ إجمالي ساعات العمل', value: `${totalHours} ساعة و ${totalMinutes} دقيقة`, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

    await interaction.reply({ embeds: [statusEmbed] });
}

// دالة مساعدة لحساب عدد الموظفين المتصلين
function getOnlineEmployees() {
    return Array.from(employees.values()).filter(emp => emp.isOnline).length;
}

// تشغيل البوت - ضع التوكن الجديد هنا
client.login('MTQwNTcyMDAyMjUxMjQzNTI0MA.G7BzIE.872zwO9FfqPy0FMgDhaDWawGbSC23tEHrfP0zo');

// تصدير للاستخدام
module.exports = {
    client,
    commands
};
