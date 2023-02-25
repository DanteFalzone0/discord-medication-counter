import fs from "fs";
import { Snowflake } from "discord-api-types";
import { RegistryController } from "./RegistryController";
import { UserData, Scrobble } from "./UserInfo";

export class ScrobbleController {
  readonly userDictionaryPath = "/home/runner/benny-bot/drugInfo/userData.json";
  private userData: UserData;
  private registryController: RegistryController;
  constructor(registryController: RegistryController) {
    const userFileContents = fs.readFileSync(this.userDictionaryPath, "utf-8");
    this.userData = JSON.parse(userFileContents);
    this.registryController = registryController;
  }

  addScrobbleToUser(
    discordUserId: Snowflake, newScrobble: Scrobble
  ): "Success" | "Unknown Discord User Id" {
    if (!this.registryController.isUserRegistered(discordUserId)) {
      return "Unknown Discord User Id";
    } else {

      return "Success";
    }
  }

  parseScrobbleFromMessage(messageText: string): Scrobble | null {
    
    return null;
  }
};
