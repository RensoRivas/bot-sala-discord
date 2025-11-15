require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  AudioPlayerStatus
} = require("@discordjs/voice");
const { Readable } = require("stream");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ],
});

// AUDIO SILENCIOSO REAL, SIN FFMPEG
function createSilentResource() {
  const silentStream = new Readable({
    read() {
      this.push(Buffer.alloc(20)); // solo silencio, no requiere FFMPEG
    }
  });

  return createAudioResource(silentStream);
}

let connection;
let player;

async function connectToVoice() {
  const channelId = process.env.VOICE_CHANNEL_ID;
  const guildId = process.env.GUILD_ID;

  try {
    const channel = await client.channels.fetch(channelId);

    connection = joinVoiceChannel({
      channelId,
      guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false
    });

    player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Play }
    });

    connection.subscribe(player);

    const resource = createSilentResource();
    player.play(resource);

    player.on(AudioPlayerStatus.Playing, () => {
      console.log("🔊 Audio silencioso reproduciéndose.");
    });

  } catch (e) {
    console.error("Error conectando:", e);
  }
}

client.on("ready", () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
  connectToVoice();
});

client.on("voiceStateUpdate", (o, n) => {
  if (o.member &&
      o.member.id === client.user.id &&
      o.channelId &&
      !n.channelId) {
    console.log("🔁 Bot expulsado, reconectando…");
    setTimeout(connectToVoice, 2000);
  }
});

client.login(process.env.DISCORD_TOKEN);
