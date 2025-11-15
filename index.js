require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}!`);
  console.log(`📊 Connected to ${client.guilds.cache.size} server(s)`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong! 🏓');
  }
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('Failed to login:', error.message);
  console.log('Make sure your DISCORD_TOKEN is set correctly in Secrets');
});
