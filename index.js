// Carga variables de entorno (.env en local, en Railway ya las pusimos)
require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const { Readable } = require("stream");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates, // necesario para canales de voz
  ],
});

let connection;
let player;

// Crea un audio "silencioso" para que el bot no sea expulsado por inactividad
function createSilentAudioResource() {
  const silentStream = new Readable({
    read() {
      const buffer = Buffer.alloc(1920); // frame de silencio
      this.push(buffer);
    },
  });

  return createAudioResource(silentStream);
}

async function connectToVoiceChannel() {
  const channelId = process.env.VOICE_CHANNEL_ID;
  const guildId = process.env.GUILD_ID;

  if (!channelId || !guildId) {
    console.error("❌ Falta VOICE_CHANNEL_ID o GUILD_ID en las variables de entorno");
    return;
  }

  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel || channel.type !== 2) {
      console.error("❌ El ID de canal no es un canal de voz válido");
      return;
    }

    console.log(`🎧 Conectando al canal de voz: ${channel.name}`);

    connection = joinVoiceChannel({
      channelId,
      guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Play },
    });

    const resource = createSilentAudioResource();
    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Playing, () => {
      console.log("✅ Reproduciendo audio silencioso (manteniendo al bot en la sala)");
    });

    player.on("error", (error) => {
      console.error("⚠️ Error en el reproductor de audio:", error);
    });

  } catch (err) {
    console.error("⚠️ Error al conectar al canal de voz:", err);
  }
}

client.once("ready", () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
  connectToVoiceChannel();
});

// Si el bot se desconecta de la sala, lo volvemos a meter
client.on("voiceStateUpdate", (oldState, newState) => {
  if (
    oldState.member &&
    oldState.member.id === client.user.id &&
    oldState.channelId &&
    !newState.channelId
  ) {
    console.log("⚠️ El bot salió del canal, intentando reconectar...");
    setTimeout(connectToVoiceChannel, 3000);
  }
});

// Iniciar sesión con el token
client.login(process.env.DISCORD_TOKEN);
