export interface ClaimItemExtracted {
  type: string; // 费用名目：如“残疾赔偿金”、“医疗费”、“误工费”、“护理费”、“被扶养人生活费”
  user_amount: number; // 文本中主张的金额
  
  // 附加提取属性
  disability_level?: number; // 伤残等级(1-10)
  years_claimed?: number; // 赔偿年限
  days_claimed?: number; // 主张天数
  daily_rate?: number; // 日标准（元/天）
  yearly_rate?: number; // 年标准（元/年）
  
  // 对于由多个数值相加组成的流水项（如多张发票加总的医疗费）
  components?: number[]; // [21895.3, 329.06, 83.88]
}

export interface ClaimVerificationResult {
  type: string;
  is_correct: boolean;
  theoretical_amount: number;
  user_amount: number;
  diff: number;
  message: string;
}

// 模拟的法定标准（实务中这部分可扩展为后端 API 拉取及省份年份选择）
export const BASE_STANDARDS = {
  // 假设：2026年 湖北省城镇居民人均可支配收入（用于残疾赔偿金等）
  URBAN_DISPOSABLE_INCOME_2026_HUBEI: 49164,
  // 假设：2026年 湖北省居民人均消费性支出标准（用于被扶养人生活费等）
  URBAN_CONSUMPTION_EXPENDITURE_2026_HUBEI: 32473,
  // 假设：护工行业平均薪酬（元/年）
  NURSING_FEE_YEARLY_2026_HUBEI: 52532,
};

/**
 * 核心核算法规引擎
 * 接收 AI 从文书提取的结构化参数，比对自带的法定规则
 */
export function verifyCompensationItem(item: ClaimItemExtracted): ClaimVerificationResult {
  let theoreticalContent = 0;
  let calculationValid = false;
  let reason = '';

  try {
    switch (item.type) {
      case '残疾赔偿金': {
        const base = BASE_STANDARDS.URBAN_DISPOSABLE_INCOME_2026_HUBEI;
        const level = item.disability_level || 10; // 默认十级
        const years = item.years_claimed || 20; // 默认20年
        // 赔偿金公式：基数 * (11 - 伤残等级) * 10% * 赔偿年限
        const coefficient = (11 - level) * 0.1;
        
        theoreticalContent = Number((base * coefficient * years).toFixed(2));
        calculationValid = (Math.abs(theoreticalContent - item.user_amount) < 1.0); // 允许1元内四舍五入误差
        
        if (calculationValid) {
          reason = `标准与计算准确（${base}元/年 × ${coefficient * 100}%比例 × ${years}年）`;
        } else {
          reason = `标准或乘积有误！按照适用标准 ${base}元/年，${level}级伤残系数${coefficient * 100}%，主张${years}年，应为 ${theoreticalContent} 元。`;
        }
        break;
      }

      case '护理费': {
        // 如果提取到了年标准，按年标准/365 * 天数；如果提到了日标准，按日标准 * 天数
        if (item.yearly_rate && item.days_claimed) {
          theoreticalContent = Number(((item.yearly_rate / 365) * item.days_claimed).toFixed(2));
          calculationValid = (Math.abs(theoreticalContent - item.user_amount) < 1.0);
          
          if (calculationValid) {
            reason = `计算准确（${item.yearly_rate}元/年 ÷ 365天 × ${item.days_claimed}天）`;
          } else {
            reason = `计算有误！按 ${item.yearly_rate}元/年 ÷ 365天 × ${item.days_claimed}天，结果应大约为 ${theoreticalContent} 元。`;
          }
        } else if (item.daily_rate && item.days_claimed) {
          theoreticalContent = Number((item.daily_rate * item.days_claimed).toFixed(2));
          calculationValid = (Math.abs(theoreticalContent - item.user_amount) < 0.1);
          if (calculationValid) {
            reason = `加权计算准确（${item.daily_rate}元/天 × ${item.days_claimed}天）`;
          } else {
            reason = `计算有误！应为 ${theoreticalContent} 元。`;
          }
        } else {
          // 缺乏参数，无法验证
          theoreticalContent = item.user_amount;
          calculationValid = true;
          reason = '文本未提供完整的基数或天数，仅作账记录。';
        }
        break;
      }

      case '误工费':
      case '休学损失':
      case '住院伙食补助费':
      case '营养费': {
        // 通常是 日标准或年标准/365 × 天数
        if (item.yearly_rate && item.days_claimed) {
          theoreticalContent = Number(((item.yearly_rate / 365) * item.days_claimed).toFixed(2));
          calculationValid = (Math.abs(theoreticalContent - item.user_amount) < 1.0);
          reason = calculationValid ? `计算准确` : `计算有误！合法金额应为 ${theoreticalContent} 元`;
        } else if (item.daily_rate && item.days_claimed) {
          theoreticalContent = Number((item.daily_rate * item.days_claimed).toFixed(2));
          calculationValid = (Math.abs(theoreticalContent - item.user_amount) < 0.1);
          reason = calculationValid ? `计算准确` : `计算有误！按 ${item.daily_rate}元/天 × ${item.days_claimed}天 应为 ${theoreticalContent} 元`;
        } else {
          theoreticalContent = item.user_amount;
          calculationValid = true;
          reason = '未提供详细算式要素，已原样提取。';
        }
        break;
      }

      case '医疗费':
      case '鉴定费':
      case '拖车施救费':
      case '电动车修理费':
      case '精神抚慰金':
      default: {
        // 纯累加逻辑：如果是医疗费列出了一长串式子
        if (item.components && item.components.length > 0) {
          theoreticalContent = Number(item.components.reduce((acc, val) => acc + val, 0).toFixed(2));
          calculationValid = (Math.abs(theoreticalContent - item.user_amount) < 0.5);
          if (calculationValid) {
            reason = `发票金额累加无误`;
          } else {
            reason = `加总运算错误！原文列出的明细项总和应为 ${theoreticalContent} 元，而不是 ${item.user_amount} 元。`;
          }
        } else {
          // 直接给定固定金额，无法验证内部结构
          theoreticalContent = item.user_amount;
          calculationValid = true;
          reason = '无计算明细，已照原文采集。';
        }
        break;
      }
    }
  } catch (err: any) {
    calculationValid = false;
    theoreticalContent = item.user_amount;
    reason = `无法解析标准公式参数 (${err.message})`;
  }

  return {
    type: item.type,
    is_correct: calculationValid,
    theoretical_amount: theoreticalContent,
    user_amount: item.user_amount,
    diff: theoreticalContent - item.user_amount,
    message: reason
  };
}

export function calculateTotalSummary(items: ClaimVerificationResult[]) {
  const userTotal = items.reduce((acc, i) => acc + i.user_amount, 0);
  const correctTotal = items.reduce((acc, i) => acc + i.theoretical_amount, 0);
  
  return {
    userTotal: Number(userTotal.toFixed(2)),
    correctTotal: Number(correctTotal.toFixed(2)),
    hasMismatch: Math.abs(userTotal - correctTotal) > 1.0
  };
}
