import { writeFile } from "fs/promises";
import { readFileSync } from "fs";
import { Snowflake, Message, Guild } from "discord.js";
import { ChannelTypes } from "discord.js/typings/enums";

interface UserRegistryEntry {
  userId: Snowflake,
  registrationDate: Date,
  counterChannelId: Snowflake // type used for channelIds in discord.js
};

interface UserRegistry {
  registeredUsers: UserRegistryEntry[]
};

export class RegistryController {
  readonly userRegistryPath = "/home/runner/benny-bot/drugInfo/userRegistry.json";
  private registry: UserRegistry;
  private counterCategory: Snowflake;
  logLevel: "Quiet" | "Verbose" | "Loquacious" = "Quiet";

  constructor(counterCategoryId?: Snowflake) {
    this.counterCategory = counterCategoryId ?? "1078088809469710366";
    const registryDataRaw = readFileSync(this.userRegistryPath, "ascii");
    const registryData = JSON.parse(registryDataRaw);
    this.registry = { registeredUsers: [] };
    for (const entry of registryData.registeredUsers) {
      if (this.logLevel === "Loquacious") {
        console.log(`Reading user entry: ${JSON.stringify(entry, null, 2)}`);
      }
      this.registry.registeredUsers.push({
        ...entry,
        registrationDate: new Date(entry.registrationDate)
      });
    }
    if (["Verbose", "Loquacious"].includes(this.logLevel)) {
      console.log(`Loaded user registry: ${JSON.stringify(this.registry, null, 2)}`);
    }
  }

  async registerNewUser(
    userId: Snowflake,
    counterName: string,
    originalMessage: Message
  ): Promise<
    "Success"
    | "Already registered"
    | "Failed to set category"
    | "Failed to create new channel"
    | string
  > {
    if (this.registry.registeredUsers.some(user => user.userId === userId)) {
      return Promise.resolve("Already registered");
    } else {
      try {
        const newChannel = await originalMessage.guild!.channels.create(`${counterName}-counter`, {
          type: ChannelTypes.GUILD_TEXT
        });
        if (this.logLevel === "Loquacious") {
          console.log(`Created new channel: ${newChannel.id}`);
        }
        try {
          const channel_1 = await newChannel.setParent(this.counterCategory);
          this.registry.registeredUsers.push({
            userId,
            registrationDate: new Date(),
            counterChannelId: channel_1.id
          });
          if (this.logLevel === "Verbose") {
            console.log(`Added user to registry, user id: ${userId}`);
          } else if (this.logLevel === "Loquacious") {
            console.log(`Updated registry: ${JSON.stringify(this.registry, null, 2)}`);
          }
          return "Success";
        } catch (e) {
          return "Failed to set category";
        }
      } catch (e) {
        return "Failed to create new channel";
      }
    }
  }

  isUserRegistered(userId: Snowflake): boolean {
    return this.registry.registeredUsers.some(user => user.userId === userId);
  }

  saveChanges() {
    return writeFile(this.userRegistryPath, JSON.stringify(this.registry, null, 2));
  }
};
