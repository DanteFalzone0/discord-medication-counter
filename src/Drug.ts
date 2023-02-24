import { DiscordUsername } from "./UserInfo";

type ThreeLetters = string & { length: 3 };
type TenDigits = string & { length: 10 };

export type DrugId = `${ThreeLetters}::${TenDigits}`;

export interface Drug {
  drugId: DrugId,
  genericName: string,
  drugClass: string[],
  aliases: string[]
};

type SiPrefix =
  "micro"
  | "milli"
  | "kilo";

export type MassUnit = `${SiPrefix | ""}grams` | "ounces";
export type VolumeUnit = `${SiPrefix | ""}liters` | "fluid ounces";
export interface CustomUnit {
  customUnitName: string,
  definedForUser: DiscordUsername,
  customUnitDetails: {
    unitType: "Mass",
    ugEquivalent: number
  } | {
    unitType: "Volume",
    mLEquivalent: number
  }
};

export function convertCustomToStandard(
  qty: number,
  unit: CustomUnit
): { unit: MassUnit | VolumeUnit, qty: number } | "Conversion Error" {
  if (unit.customUnitDetails.unitType === "Mass") {
    return {
      unit: "micrograms",
      qty: qty * unit.customUnitDetails.ugEquivalent
    };
  } else if (unit.customUnitDetails.unitType === "Volume") {
    return {
      unit: "milliliters",
      qty: qty * unit.customUnitDetails.mLEquivalent
    };
  } else {
    return "Conversion Error";
  }
}

export function convertMassToMicrograms(qty: number, unit: MassUnit): number {
  switch (unit) {
    case "micrograms":
      return qty;
    case "milligrams":
      return 1000 * qty;
    case "grams":
      return 1000000 * qty;
    case "kilograms":
      return 1e+9 * qty;
    case "ounces":
      return 28349523.125 * qty;
    default:
      throw new Error(`Expected mass unit but got "${unit} instead"`);
  }
}

export function convertVolumeToMilliliters(qty: number, unit: VolumeUnit): number {
  switch (unit) {
    case "microliters":
      return qty / 1000;
    case "milliliters":
      return qty;
    case "liters":
      return 1000 * qty;
    case "kiloliters":
      return 1000000 * qty;
    case "fluid ounces":
      return 29.573529 * qty;
    default:
      throw new Error(`Expected volume unit but got "${unit} instead"`);
  }
}

export interface Dosage {
  units: MassUnit | VolumeUnit | CustomUnit,
  qty: number
};

export interface DrugDictionary {
  drugList: Drug[]
};
