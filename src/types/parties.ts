export interface PartyExtraction {
  plaintiffsNatural: string[];
  defendantsNatural: string[];
  defendantsLegal: string[];
  defendantsInsurance: string[];
  thirdPartyLegal: string[];
  claimsText: string;           // 诉讼请求（原文照抄）
  accidentFacts: string;        // 交通事故发生情况
  liabilityDetermination: string; // 交通事故责任认定
  insuranceInfo: string;        // 机动车投保情况
  otherFacts: string[];         // 其他情况及法律依据（各段原文，不合并）
  claimsList: string;           // 索赔清单（原文照抄）
}
