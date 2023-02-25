import { Message, MessageEmbed } from 'discord.js';
import config from './config';

const { prefix } = config;

const commands: { [name: string]: { aliases?: string[]; description: string; format: string } } = {
  'help': {
    description: 'Shows the list of commands and their details.',
    format: 'help'
  },
  'ping': {
    description: 'Checks connectivity with discord\'s servers.',
    format: 'ping'
  },
  "new-counter": {
    description: "Creates and registers a new counter for you.",
    format: "new-counter [name]"
  },
  "list-drugs": {
    description: "Lists all the drugs that are saved in my dictionary.",
    format: "list-drugs"
  },
  "get-drugid": {
    description: "Drugs are stored in my dictionary with a `drugId`. Use this command to find a drug's id.",
    format: "get-drugid <name of the drug>"
  }
}

export default function helpCommand(message: Message) {
  const footerText = message.author.tag;
  const footerIcon = message.author.displayAvatarURL();
  const embed = new MessageEmbed()
    .setTitle('HELP MENU')
    .setColor('GREEN')
    .setFooter({ text: footerText, iconURL: footerIcon });

  for (const commandName of Object.keys(commands)) {
    const command = commands[commandName];
    let desc = command.description + '\n\n';
    if (command.aliases) desc += `**Aliases :** ${command.aliases.join(', ')}\n\n`;
    desc += '**Format**\n```\n' + prefix + command.format + '```';

    embed.addField(commandName, desc, false);
  }

  return embed;
}