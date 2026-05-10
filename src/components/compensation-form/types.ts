import type { CaseParams, Dependent } from '../../utils/compensation-calculator';

export type UpdateCaseParam = <K extends keyof CaseParams>(key: K, value: CaseParams[K]) => void;
export type UpdateDependent = <K extends keyof Dependent>(id: string, key: K, value: Dependent[K]) => void;
