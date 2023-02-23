type ThreeLetters = string & { length: 3 };
type TenDigits = string & { length: 10 };

export type DrugId = `${ThreeLetters}::${TenDigits}`;

export interface Drug {
  drugId: DrugId,
  genericName: string,
  drugClass: string[],
  aliases: string[]
};

export interface DrugDictionary {
  drugList: Drug[]
};
