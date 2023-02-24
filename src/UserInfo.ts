import { Snowflake } from "discord-api-types";
import { Dosage, DrugId } from "./Drug";

type Numeral = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type Tag = `${Numeral}${Numeral}${Numeral}${Numeral}`
export type DiscordUsername = `${string}#${Tag}`;

export interface Scrobble {
  drugId: DrugId,
  timestamp: Date,
  dosage: Dosage
};

export interface UserEntry {
  username: DiscordUsername,
  discordUserId: Snowflake,
  drugScrobbles: Scrobble[]
};

export interface UserData {
  userList: UserEntry[]
};


