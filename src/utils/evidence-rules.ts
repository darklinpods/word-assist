/**
 * 交通事故人身损害案件 — 标准证据清单规则库
 */

export interface EvidenceItem {
  id: string;
  name: string;
  purpose: string;        // 用于支撑哪项诉求
  required: 'must' | 'conditional' | 'recommended'; // 必须 / 条件性 / 建议
  obtainTip: string;      // 未提供时的取得建议
}

export type EvidenceStatus = 'present' | 'weak' | 'missing';

export interface EvidenceCheckResult {
  item: EvidenceItem;
  status: EvidenceStatus;
  note: string; // AI 摘取的原文依据，或缺失说明
}

// AI 返回的轻量中间结果
export interface EvidenceRawResult {
  id: string;
  status: EvidenceStatus;
  note: string;
}

/** 交通事故人身损害标准证据清单（14项） */
export const EVIDENCE_CHECKLIST: EvidenceItem[] = [
  {
    id: 'accident_report',
    name: '道路交通事故认定书',
    purpose: '事故责任认定',
    required: 'must',
    obtainTip: '向事故处理交警大队申请，通常事故发生后 10 日内出具（简单案件）或 20 日内出具（复杂案件）。如对认定结论有异议，可在 3 日内申请复核。',
  },
  {
    id: 'medical_invoice',
    name: '医疗费票据（发票 + 明细清单）',
    purpose: '医疗费',
    required: 'must',
    obtainTip: '向就诊医院财务/收费处申请补开正式发票及费用明细清单，所有票据须加盖医院公章。异地就医需附医院资质证明。',
  },
  {
    id: 'diagnosis_certificate',
    name: '诊断证明书 / 出院小结',
    purpose: '伤情证明、护理期及营养期认定',
    required: 'must',
    obtainTip: '向主治医师申请开具加盖医院公章的诊断证明，住院患者同时索取出院小结（含入出院时间、伤情、诊疗经过）。',
  },
  {
    id: 'disability_assessment',
    name: '伤残鉴定意见书',
    purpose: '残疾赔偿金、精神损害抚慰金',
    required: 'conditional',
    obtainTip: '伤情稳定后（一般为治疗终结后 6 个月），向具有法定资质的司法鉴定机构申请道路交通事故伤残等级鉴定。双方同意的鉴定机构优先；一方委托鉴定须告知对方。',
  },
  {
    id: 'lost_wages_proof',
    name: '误工证明 + 工资流水 / 劳动合同',
    purpose: '误工费',
    required: 'must',
    obtainTip: '由用人单位出具加盖公章的误工证明（注明因伤不能正常工作的时间），附近 3~6 个月工资银行流水或劳动合同。个体经营者可提供税务申报记录。',
  },
  {
    id: 'nursing_proof',
    name: '护理费说明 / 护理票据',
    purpose: '护理费',
    required: 'must',
    obtainTip: '住院期间由医院护工的提供收费票据；家属护理的，须医嘱建议及护理人员身份证明（含误工损失）；出院后如有持续护理需求应由医生出具证明。',
  },
  {
    id: 'dependents_proof',
    name: '被扶养人身份及抚养关系证明',
    purpose: '被扶养人生活费',
    required: 'conditional',
    obtainTip: '向户籍所在地公安机关或村委/居委申请开具家庭关系证明，注明被扶养人年龄（未成年 / 老人无劳动能力者）。如有配偶，须证明其丧失劳动能力。',
  },
  {
    id: 'nutrition_advice',
    name: '营养费医嘱建议',
    purpose: '营养费',
    required: 'recommended',
    obtainTip: '由主治医师在诊断证明或专项证明中注明"建议营养支持"及建议天数，部分地区法院要求此项有医嘱才予支持。',
  },
  {
    id: 'hospitalization_meals',
    name: '住院伙食补助说明',
    purpose: '住院伙食补助费',
    required: 'recommended',
    obtainTip: '凭医院出具的住院证明即可主张（按各省标准 × 住院天数），多数法院无需额外票据，住院证明或出院小结即可。',
  },
  {
    id: 'transportation_receipts',
    name: '交通费票据',
    purpose: '交通费',
    required: 'recommended',
    obtainTip: '保留就医往返的交通票据（出租车、公交、网约车发票/截图等），无票据时法院通常酌情认定少量金额；建议尽量收集。',
  },
  {
    id: 'vehicle_damage',
    name: '车辆损失评估报告 / 修理票据',
    purpose: '财产损失（车辆损失）',
    required: 'conditional',
    obtainTip: '到具有资质的价格鉴定机构或保险公司认可的定损机构进行定损，保留修理厂发票和工单；车辆全损时可附购车发票或二手车评估报告。',
  },
  {
    id: 'mental_distress',
    name: '精神损害抚慰金依据（伤残鉴定 / 死亡情形）',
    purpose: '精神损害抚慰金',
    required: 'recommended',
    obtainTip: '精神损害抚慰金须以构成伤残（或死亡）为前提，附伤残鉴定意见书即可作为主要依据；另可提供病历、心理干预记录等辅助材料。',
  },
  {
    id: 'defendant_qualification',
    name: '被告主体资格证明（营业执照 / 行驶证 / 保险单）',
    purpose: '被告适格、保险公司主体确认',
    required: 'must',
    obtainTip: '机动车行驶证通过交警处理案件调取；营业执照可在国家企业信用信息公示系统查询（gsxt.gov.cn）；交强险及商业险保单通过交警卷宗或保险公司查调。',
  },
  {
    id: 'plaintiff_id',
    name: '原告身份证明（身份证复印件）',
    purpose: '原告适格',
    required: 'must',
    obtainTip: '提供本人身份证正反面复印件（加盖"与原件一致"章）；如原告为未成年人或死者近亲属，须附相应关系证明（户口本、死亡证明等）。',
  },
];

/**
 * 合并 AI 原始结果与规则库，生成完整核查报告
 */
export function mergeEvidenceResults(rawResults: EvidenceRawResult[]): EvidenceCheckResult[] {
  const rawMap = new Map(rawResults.map(r => [r.id, r]));

  const merged: EvidenceCheckResult[] = EVIDENCE_CHECKLIST.map(item => {
    const raw = rawMap.get(item.id);
    if (!raw) {
      // AI 遗漏输出该项，按缺失处理
      return { item, status: 'missing', note: '（AI未识别到相关内容，按缺失处理）' };
    }
    return { item, status: raw.status, note: raw.note };
  });

  // 排序：缺失必须 → 缺失条件性 → 缺失建议 → 偏弱 → 已具备
  const priority = (r: EvidenceCheckResult): number => {
    if (r.status === 'present') return 3;
    if (r.status === 'weak') return 2;
    // missing
    if (r.item.required === 'must') return -1;
    if (r.item.required === 'conditional') return 0;
    return 1;
  };

  return merged.sort((a, b) => priority(a) - priority(b));
}
