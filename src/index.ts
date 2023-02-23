import { Client } from 'discord.js';
import config from './config';
import helpCommand from './commands';
import { DrugController } from './DrugController';

const { intents, prefix, token } = config;

const client = new Client({
  intents,
  presence: {
    status: 'online',
    activities: [{
      name: `${prefix}help`,
      type: 'LISTENING'
    }]
  }
});

client.on('ready', () => {
  console.log(`Logged in as: ${client.user?.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift();
    const drugController = new DrugController();
    drugController.logLevel = "Loquacious";

    switch (command) {
      case 'ping':
        const msg = await message.reply('Pinging...');
        await msg.edit(`Pong! The round trip took ${Date.now() - msg.createdTimestamp}ms.`);
        break;

      case 'say':
      case 'repeat':
        if (args.length > 0) await message.channel.send(args.join(' '));
        else await message.reply('You did not send a message to repeat, cancelling command.');
        break;

      case 'help':
        const embed = helpCommand(message);
        embed.setThumbnail(client.user!.displayAvatarURL());
        await message.channel.send({ embeds: [embed] });
        break;

      case "add-drug":
        // TODO more robust error handling and role-based access control
        const hackers = ["Toucan", "outoftheinferno"];
        if (!hackers.includes(message.author.username)) {
          await message.channel.send("only log and inferno can use that command right now");
        }
        const genericName = args.at(0);
        const aliasListIndex = args.indexOf("%aliases");
        const classListIndex = args.indexOf("%classes");
        const notifySyntaxError = () => message.channel.send(
          "the command's syntax is `!add-drug <generic name> %aliases "
          + "<synonyms for that drug> %classes <classes that drug is in>`"
        );
        if (genericName === undefined || genericName.startsWith('%')) {
          console.log(`Couldn't get generic name: ${JSON.stringify(args)}`);
          await notifySyntaxError();
        } else if (
          aliasListIndex > classListIndex
          || [aliasListIndex, classListIndex].includes(-1)
        ) {
          console.log(`Bad/misordered args: ${JSON.stringify(args)}`);
          await notifySyntaxError();
        } else {
          const toLower = (s: string) => s.toLowerCase();
          let aliasList = args.slice(aliasListIndex + 1, classListIndex).map(toLower);
          if (!aliasList.includes(genericName.toLowerCase())) {
            aliasList = [genericName.toLowerCase(), ...aliasList];
          }
          const classList = args.slice(classListIndex + 1).map(toLower);
          const result = drugController.createNewDrugDefinition(
            genericName,
            classList,
            aliasList
          );
          if (result === "Exists Already") {
            await message.channel.send("That drug is in the dictionary already");
          } else {
            drugController.saveChanges();
            await message.react("✅");
          }
        }
        break;
    }
  }
});

client.login(token);
