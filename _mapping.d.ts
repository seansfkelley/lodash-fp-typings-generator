export const aliasToReal: { [fnName: string]: string };
export const aryMethod: { [arity: string]: string[] };
export const aryRearg: { [arity: string]: number[] };
export const iterateeAry: { [fnName: string]: number };
export const iterateeRearg: { [fnName: string]: number[] };
export const methodRearg: { [fnName: string]: number[] };
export const methodSpread: { [fnName: string]: { start: number; afterRearg?: true; } };
export const mutate: { [category: string]: { [fnName: string]: true }};
export const placeholder: { [fnName: string]: true };
export const realToAlias: { [fnName: string]: string[] };
export const remap: { [fnName: string]: string };
export const skipFixed: { [fnName: string]: true };
export const skipRearg: { [fnName: string]: true };
