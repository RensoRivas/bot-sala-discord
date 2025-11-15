require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  AudioPlayerStatus
} = require("@discordjs/voice");

// Creamos un frame de silencio nativo (sin FFmpeg)
class Silence extends require("stream").Readable {
  _read() {
    this.push(Buffer.from([0xF8, 0xFF, 0xFE]));
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

let connection;
let player;

function createSilenceResource() {
  const silence = new Silence();
  return createAudioResource(silence, { inlineVolume: false });
}

async function connectToVoiceChannel() {
  const channelId = process.env.VOICE_CHANNEL_ID;
  const guildId = process.env.GUILD_ID;

  try {
    const channel = await client.channels.fetch(channelId);

    console.log(`🎧 Conectando al canal de voz: ${channel.name}`);

    connection = joinVoiceChannel({
      channelId,
      guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });

    player.play(createSilenceResource());
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Playing, () => {
      console.log("🔊 Reproduciendo silencio para mantener conexión.");
    });

  } catch (err) {
    console.error("⚠️ Error al conectar al canal:", err.message);
  }
}

client.once("ready", () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
  connectToVoiceChannel();
});

client.on("voiceStateUpdate", (oldState, newState) => {
  if (
    oldState.member &&
    oldState.member.id === client.user.id &&
    oldState.channelId &&
    !newState.channelId
  ) {
    console.log("⚠️ Bot fue desconectado. Reconectando...");
    setTimeout(connectToVoiceChannel, 3000);
  }
});

client.login(process.env.DISCORD_TOKEN);
