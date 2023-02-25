import fs from "fs";
import type { Drug, DrugDictionary, DrugId } from "./Drug";

export class DrugController {
  // TODO get from environment variable or config file instead?
  readonly drugDictionaryPath = "/home/runner/benny-bot/drugInfo/drugs.json";
  private drugDictionary: DrugDictionary;
  logLevel: "Quiet" | "Verbose" | "Loquacious" = "Quiet";

  constructor() {
    const drugFileContents = fs.readFileSync(this.drugDictionaryPath, "utf-8");
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

  getGenericName(drugId: DrugId): string | null {
    const result = this.drugDictionary.drugList.find(drug => drug.drugId === drugId);
    if (result === undefined) {
      if (this.logLevel === "Loquacious") {
        console.log(`DrugController: Couldn't find generic name for drug with id ${drugId}`);
      }
      return null;
    } else {
      return result.genericName;
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
      const randomIndex = () => Math.floor(Math.random() * drugLowerName.length);
      const middleChar = drugLowerName.slice(1, -1).match(/\d/) ?? priorityList.find(
        c => drugLowerName.slice(1, -1).includes(c)
      ) ?? drugLowerName.at(randomIndex());
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
        console.log(`DrugController: New drugId created: ${drugId}`);
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
        console.log(`DrugController: New drug "${genericName}" added with id ${drug.drugId}`);
      } else if (this.logLevel === "Loquacious") {
        console.log(`DrugController: New drug added: ${JSON.stringify(drug, null, 2)}`);
      }
      this.drugDictionary.drugList.push(drug);
      return "Success";
    }
  }

  saveChanges() {
    const output = JSON.stringify(this.drugDictionary, null, 2);
    if (this.logLevel === "Verbose" || this.logLevel === "Loquacious") {
      console.log(`DrugController: Saving to ${this.drugDictionaryPath}: ${output}`);
    }
    fs.writeFileSync(this.drugDictionaryPath, output);
  }

  getAllDrugDefinitions(): DrugDictionary {
    return JSON.parse(JSON.stringify(this.drugDictionary));
  }

  /** Checks if a given drugId is in the dictionary. */
  doesIdExist(drugId: DrugId): boolean {
    return this.drugDictionary.drugList.some(drug => drug.drugId === drugId);
  }

  /** Checks if a message contains a known alias for a drug. */
  recognizesDrugAlias(text: string): boolean {
    return this.drugDictionary.drugList.some((drug: Drug) =>
      drug.aliases.some(alias => text.toLowerCase().includes(alias))
    );
  }

  /** Returns an array of DrugIds for drugs listed in a string. */
  getMentionedDrugs(text: string): DrugId[] {
    const drugMentions = text.split(" ").filter(drug => this.recognizesDrugAlias(drug));
    let result: DrugId[] = [];
    for (const drugName of drugMentions) {
      const drugId = this.drugDictionary.drugList.find(
        (d: Drug) => d.aliases.includes(drugName.toLowerCase())
      )?.drugId;
      if (drugId !== undefined) {
        result.push(drugId);
      } else if (["Loquacious", "Verbose"].includes(this.logLevel)) {
        console.log(`DrugController: Tried to find the drugId of "${drugName}", but none was found.`);
      }
    }
    if (this.logLevel === "Loquacious") {
      console.log(
        `DrugController: Loaded these drugIds: ${JSON.stringify(result)}\n` +
        `\tfor these mentions: ${JSON.stringify(drugMentions)}`
      );
    }
    return result;
  }

  addDrugIdToClass(drugId: DrugId, drugClass: string): "Success" | "Already in class" | "Drug not found" {
    if (!this.doesIdExist(drugId)) {
      return "Drug not found";
    } else {
      const i: number = this.drugDictionary.drugList.findIndex(drug => drug.drugId === drugId);
      if (this.drugDictionary.drugList[i].drugClass.includes(drugClass.toLowerCase())) {
        return "Already in class";
      } else {
        this.drugDictionary.drugList[i].drugClass.push(drugClass);
        return "Success";
      }
    }
  }

  removeDrugIdFromClass(
    drugId: DrugId, drugClass: string
  ): "Success" | "Wasn't in that class" | "Drug not found" {
    if (!this.doesIdExist(drugId)) {
      return "Drug not found";
    } else {
      const i: number = this.drugDictionary.drugList.findIndex(drug => drug.drugId === drugId);
      if (!this.drugDictionary.drugList[i].drugClass.includes(drugClass.toLowerCase())) {
        return "Wasn't in that class";
      } else {
        const prev = this.drugDictionary.drugList[i].drugClass;
        this.drugDictionary.drugList[i].drugClass = prev.filter(dc => dc !== drugClass);
        return "Success";
      }
    }
  }
};
