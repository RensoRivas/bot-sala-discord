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
  ]
});

let connection;
let player;

// Stream silencioso sin FFmpeg
function silentStream() {
  return new Readable({
    read() {
      this.push(Buffer.alloc(480)); // Frame vacío
    }
  });
}

function createSilentAudio() {
  return createAudioResource(silentStream());
}

async function connectToVoice() {
  const guildId = process.env.GUILD_ID;
  const channelId = process.env.VOICE_CHANNEL_ID;

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

    const resource = createSilentAudio();
    player.play(resource);
    connection.subscribe(player);

    console.log("🔊 Bot conectado al canal y reproduciendo silencio");

    player.on(AudioPlayerStatus.Idle, () => {
      console.log("🔁 Reiniciando audio silencioso");
      player.play(createSilentAudio());
    });

    player.on("error", (e) => console.log("Error en audio:", e));

  } catch (err) {
    console.log("❌ Error conectando al canal:", err);
  }
}

client.on("ready", () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
  connectToVoice();
});

client.login(process.env.DISCORD_TOKEN);
