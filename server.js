const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Your Discord bot token
let botToken = '';
let mainServerId = '';
let targetServerId = '';
let memberLimit = 300;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// Bot login
client.once('ready', () => {
  console.log('Bot is ready!');
});

// Route for handling pulling members
app.post('/pull-members', async (req, res) => {
  const { botToken, mainServerId, targetServerId, memberLimit } = req.body;

  if (!botToken || !mainServerId || !targetServerId || !memberLimit) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  botToken = botToken;
  mainServerId = mainServerId;
  targetServerId = targetServerId;
  memberLimit = Math.min(memberLimit, 300); // Limit the number of members to 300

  try {
    // Log in the bot with the provided token
    await client.login(botToken);

    // Check if the bot is in both the main and target server
    const mainGuild = await client.guilds.fetch(mainServerId);
    const targetGuild = await client.guilds.fetch(targetServerId);

    // Check if the bot is a member of both servers
    if (!mainGuild || !targetGuild) {
      return res.status(400).json({ message: 'Bot has to be in both servers.' });
    }

    // Bot is in both servers, now we fetch the members
    const members = await mainGuild.members.fetch();
    const memberList = members.array().slice(0, memberLimit); // Limit the number of members to pull

    for (const member of memberList) {
      const user = member.user;
      const invite = await targetGuild.invites.create(targetGuild.channels.cache.find(ch => ch.type === 'text').id, {
        maxAge: 0, // Permanent invite
        maxUses: 1, // Only 1 use
      });
      user.send(`You have been invited to join a new server! Here is your invite: ${invite.url}`);
    }

    res.json({ message: `${memberList.length} members have been invited to the new server.` });
  } catch (error) {
    console.error(error);
    
    // Return a proper JSON error message
    if (error.message.includes('Invalid Token') || error.message.includes('Authentication')) {
      return res.status(401).json({ message: 'Invalid bot token. Please check your token and try again.' });
    }

    res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
