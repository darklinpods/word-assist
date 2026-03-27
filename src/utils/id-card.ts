const PROVINCE_CODES: Record<string, string> = {
  '11': '北京',
  '12': '天津',
  '13': '河北',
  '14': '山西',
  '15': '内蒙古',
  '21': '辽宁',
  '22': '吉林',
  '23': '黑龙江',
  '31': '上海',
  '32': '江苏',
  '33': '浙江',
  '34': '安徽',
  '35': '福建',
  '36': '江西',
  '37': '山东',
  '41': '河南',
  '42': '湖北',
  '43': '湖南',
  '44': '广东',
  '45': '广西',
  '46': '海南',
  '50': '重庆',
  '51': '四川',
  '52': '贵州',
  '53': '云南',
  '54': '西藏',
  '61': '陕西',
  '62': '甘肃',
  '63': '青海',
  '64': '宁夏',
  '65': '新疆',
  '71': '台湾',
  '81': '香港',
  '82': '澳门',
  '91': '国外',
};

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECKSUM_MAP = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

export interface IdCardCheckResult {
  id: string;
  masked: string;
  isValid: boolean;
  reason: string;
  birthDate: string;
  gender: string;
  age: number | null;
  province: string;
  checksumExpected: string;
}

export function normalizeIdCard(input: string): string {
  return input.trim().toUpperCase();
}

export function extractIdCardsFromText(text: string): string[] {
  const results: string[] = [];
  const seen = new Set<string>();
  const regex = /(^|[^\d])(\d{17}[\dXx])(?!\d)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const id = normalizeIdCard(match[2]);
    if (!seen.has(id)) {
      seen.add(id);
      results.push(id);
    }
  }
  return results;
}

export function validateIdCard(idRaw: string): IdCardCheckResult {
  const id = normalizeIdCard(idRaw);
  if (!/^\d{17}[\dX]$/.test(id)) {
    return invalidResult(id, '格式错误：应为 18 位数字，最后一位可为 X。');
  }

  const provinceCode = id.slice(0, 2);
  const province = PROVINCE_CODES[provinceCode] || '';
  if (!province) {
    return invalidResult(id, '省级行政区划码无效。');
  }

  const birth = id.slice(6, 14);
  const birthDate = formatBirthDate(birth);
  if (!birthDate) {
    return invalidResult(id, '出生日期无效。', province);
  }

  const checksumExpected = calcChecksum(id.slice(0, 17));
  const checksumActual = id[17];
  if (checksumExpected !== checksumActual) {
    return invalidResult(id, `校验位错误：应为 ${checksumExpected}。`, province, birthDate, checksumExpected);
  }

  const gender = parseGender(id);
  const age = calcAge(birthDate);

  return {
    id,
    masked: maskId(id),
    isValid: true,
    reason: '校验通过。',
    birthDate,
    gender,
    age,
    province,
    checksumExpected,
  };
}

function invalidResult(
  id: string,
  reason: string,
  province = '',
  birthDate = '',
  checksumExpected = ''
): IdCardCheckResult {
  return {
    id,
    masked: maskId(id),
    isValid: false,
    reason,
    birthDate,
    gender: '',
    age: null,
    province,
    checksumExpected,
  };
}

function formatBirthDate(birth: string): string {
  if (!/^\d{8}$/.test(birth)) return '';
  const year = Number(birth.slice(0, 4));
  const month = Number(birth.slice(4, 6));
  const day = Number(birth.slice(6, 8));
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return '';
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function calcChecksum(first17: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += Number(first17[i]) * WEIGHTS[i];
  }
  const mod = sum % 11;
  return CHECKSUM_MAP[mod];
}

function parseGender(id: string): string {
  const seq = Number(id[16]);
  if (Number.isNaN(seq)) return '';
  return seq % 2 === 1 ? '男' : '女';
}

function calcAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const hasHadBirthday =
    today.getMonth() + 1 > m || (today.getMonth() + 1 === m && today.getDate() >= d);
  if (!hasHadBirthday) age -= 1;
  return age < 0 ? null : age;
}

function maskId(id: string): string {
  if (id.length !== 18) return id;
  return `${id.slice(0, 6)}********${id.slice(14)}`;
}
