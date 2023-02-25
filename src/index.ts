import { Client } from 'discord.js';
import config from './config';
import helpCommand from './commands';
import { DrugController } from './DrugController';
import { RegistryController } from './RegistryController';
import { DrugId } from './Drug';

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

  const hackers = ["Toucan", "outoftheinferno"];
  let drugController = new DrugController();
  drugController.logLevel = "Loquacious";
  let userRegistryController = new RegistryController();
  userRegistryController.logLevel = "Loquacious";

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length)
      .split(' ')
      .map(arg => arg.replace('_', ' '));
    const command = args.shift();

    switch (command) {
      case 'ping':
        const msg = await message.reply('Pinging...');
        await msg.edit(`Pong! The round trip took ${Date.now() - msg.createdTimestamp}ms.`);
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
          return;
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

      case "get-drugid": {
        const drugName = args.at(0)?.toLowerCase();
        if (drugName === undefined) {
          await message.reply("The syntax is: `!get-drugid <name of the drug>`.");
        } else {
          const drugId = drugController.getDrugIdFromAlias(drugName);
          if (drugId === null) {
            await message.reply(`I don't have any such drug as "${drugName}" in my dictionary.`);
          } else {
            await message.reply(`The drugId for ${drugName} is \`${drugId}\`.`);
          }
        }
      } break;

      case "add-drug-class": {
        if (!hackers.includes(message.author.username)) {
          await message.channel.send("only log and inferno can use that command right now");
          return;
        }
        const drugId = args.at(0) as DrugId | undefined;
        if (drugId === undefined) {
          await message.reply("Specify a drugId. Use `!get-drugid` if you don't know the drugId.");
        } else {
          const drugClass = args.at(1);
          if (drugClass === undefined) {
            await message.reply("Specify the drug class you want to add the drug to.");
          } else {
            const result = drugController.addDrugIdToClass(drugId, drugClass);
            if (result === "Success") {
              drugController.saveChanges();
              await message.react("✅");
            } else {
              await message.reply(`Error: ${result}`); 
            }
          }
        }
      } break;

      case "rm-drug-class": {
        if (!hackers.includes(message.author.username)) {
          await message.channel.send("only log and inferno can use that command right now");
          return;
        }
        const drugId = args.at(0) as DrugId | undefined;
        if (drugId === undefined) {
          await message.reply("Specify a drugId. Use `!get-drugid` if you don't know the drugId.");
        } else {
          const drugClass = args.at(1);
          if (drugClass === undefined) {
            await message.reply("Specify the drug class you want to remove the drug from.");
          } else {
            const result = drugController.removeDrugIdFromClass(drugId, drugClass);
            if (result === "Success") {
              drugController.saveChanges();
              await message.react("✅");
            } else {
              await message.reply(`Error: ${result}`); 
            }
          }
        }
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
  } else {
    if (drugController.recognizesDrugAlias(message.content)) {
      const drugIdList = drugController.getMentionedDrugs(message.content);
      console.log(`From message saying "${message.content}", these drugs were recognized:`);
      for (const drugId of drugIdList) {
        const drugGenericName = drugController.getGenericName(drugId);
        if (drugGenericName !== null) {
          console.log(`\t${drugGenericName}`);
        }
      }
    }
  }
});

client.login(token);
