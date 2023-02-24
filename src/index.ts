import { Client } from 'discord.js';
import config from './config';
import helpCommand from './commands';
import { DrugController } from './DrugController';
import { RegistryController } from './RegistryController';

const { intents, prefix, token } = config;

const client = new Client({
  intents,
  presence: {
    status: 'online',
    activities: [{
      name: "the voices :3",
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
    const args = message.content.slice(prefix.length)
      .split(' ')
      .map(arg => arg.replace('_', ' '));
    const command = args.shift();

    const hackers = ["Toucan", "outoftheinferno"];
    let drugController = new DrugController();
    drugController.logLevel = "Loquacious";
    let userRegistryController = new RegistryController();
    userRegistryController.logLevel = "Loquacious";

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

      case 'help': {
        const embed = helpCommand(message);
        embed.setThumbnail(client.user!.displayAvatarURL());
        await message.channel.send({ embeds: [embed] });
      } break;

      case "add-drug": {
        // TODO more robust error handling and role-based access control
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
          } else if (result === "Success") {
            drugController.saveChanges();
            await message.react("✅");
          }
        }
      } break;

      case "list-drugs": {
        const drugDict = drugController.getAllDrugDefinitions();
        let response = "**List of all drug definitions in my dictionary:**";
        for (const drug of drugDict.drugList) {
          response += `\nDrug name: ${drug.genericName}, id: \`${drug.drugId}\`\n`
            + `• Synonyms: ${drug.aliases.join(", ")}\n`
            + `• Classes: ${drug.drugClass.join(", ")}`;
        }
        await message.channel.send(response);
      } break;

      case "new-counter": {
        const counterName: string | null = args.at(0) ?? null;
        await userRegistryController.registerNewUser(
          message.author.id,
          counterName ?? message.author.username,
          message
        ).then(result => {
          switch (result) {
            case "Success":
              userRegistryController.saveChanges().then(() => {
                message.react("✅");
              });
              break;
            case "Already registered":
              message.reply("You already have a registered counter :3");
              break;
            case "Failed to set category":
              message.reply("I couldn't put the channel in the counter category. Ping Log or inferno");
              break;
            case "Failed to create new channel":
              message.reply("I couldn't create the new channel. Ping Log or inferno.");
              break;
            default:
              message.channel.send(
                `Uhhh... shit. Ping Log or Inferno, something's wrong idk, it says "${result}"`
              );
              break;
          }
        });
      } break;
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const drugController = new DrugController();
  drugController.logLevel = "Loquacious";
  const drugDict = drugController.getAllDrugDefinitions();
  for (const item of drugDict.drugList) {
    if (message.content.includes(item.genericName)) {
      console.log(item.drugId);
    }
    else {
      for (const alias of item.aliases) {
        if (message.content.includes(alias)) {
          console.log(JSON.stringify(new Date()))
          console.log(item.drugId);
        }
      }
    }

  }
});


client.login(token);
