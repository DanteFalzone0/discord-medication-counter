import fs from "fs";
import type { Drug, DrugDictionary, DrugId } from "./Drug";

export class DrugController {
  // TODO get from environment variable or config file instead?
  readonly drugDictionaryPath = "/home/runner/benny-bot/drugInfo/drugs.json";
  private drugDictionary: DrugDictionary;
  logLevel: "Quiet" | "Verbose" | "Loquacious" = "Quiet";

  constructor() {
    const drugFileContents = fs.readFileSync(this.drugDictionaryPath, "ascii");
    this.drugDictionary = JSON.parse(drugFileContents);
  }

  getDrugIdFromAlias(alias: string): DrugId | null {
    const drug = this.drugDictionary.drugList.find(
      d => d.aliases.includes(alias.toLowerCase())
    );
    if (drug === undefined) {
      return null;
    } else {
      return drug.drugId;
    }
  }

  private createNewDrugId(genericName: string): DrugId {
    let abbrev = "";
    let drugLowerName = genericName.toLowerCase().replace("-", "");
    if (drugLowerName.length === 3) {
      abbrev = drugLowerName;
    } else if (drugLowerName.length > 3) {
      const firstChar = drugLowerName.at(0);
      const lastChar = drugLowerName.at(-1);
      const priorityList = ['x', 'j', 'z', 'q', 'l', 'o'];
      const randomIndex = Math.floor(Math.random() * drugLowerName.length);
      const middleChar = priorityList.find(
        c => drugLowerName.slice(1, -1).includes(c)
      ) ?? drugLowerName.at(randomIndex);
      abbrev = `${firstChar}${middleChar}${lastChar}`;
    }
    const hexNumber = Math.floor(
      Math.random() * 0xFFFFFFFFFF
    ).toString(16).padStart(10, '0').toUpperCase();
    const drugId: DrugId = `${abbrev}::${hexNumber}`;
    if (this.drugDictionary.drugList.some(d => d.drugId === drugId)) {
      // This is very unlikely, but not impossible
      return this.createNewDrugId(genericName);
    } else {
      if (this.logLevel === "Loquacious") {
        console.log(`New drugId created: ${drugId}`);
      }
      return drugId;
    }
  }

  createNewDrugDefinition(
    genericName: string,
    drugClass: string[],
    aliases?: string[]
  ): "Success" | "Exists Already" {
    if (this.drugDictionary.drugList.some(
      d => d.genericName.toLowerCase() === genericName.toLowerCase()
    )) {
      return "Exists Already";
    } else {
      const drug: Drug = {
        drugId: this.createNewDrugId(genericName),
        genericName,
        drugClass,
        aliases: aliases ?? []
      };
      if (this.logLevel === "Verbose") {
        console.log(`New drug "${genericName}" added with id ${drug.drugId}`);
      } else if (this.logLevel === "Loquacious") {
        console.log(`New drug added: ${JSON.stringify(drug, null, 2)}`);
      }
      this.drugDictionary.drugList.push(drug);
      return "Success";
    }
  }

  saveChanges() {
    const output = JSON.stringify(this.drugDictionary, null, 2);
    if (this.logLevel === "Verbose" || this.logLevel === "Loquacious") {
      console.log(`Saving to ${this.drugDictionaryPath}: ${output}`);
    }
    fs.writeFileSync(this.drugDictionaryPath, output);
  }
};
