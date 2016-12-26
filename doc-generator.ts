import { readFileSync } from 'fs';
import { groupBy, omit, includes, intersection, isEqual } from 'lodash';
import * as Entry from 'docdown/lib/entry';

interface Tag {
  title: string;
  description: string;
  lineNumber: number;
  // Maybe other stuff?
}

type Param = [ string, string, string ]; // [ type, name, description ]

declare class Entry {
  static getEntries(source: string): string[];

  constructor(entry: string, source: string);

  // public parsed: {
  //   description: string;
  //   tags: Tag[];
  // };
  // public entry: string;
  // public lang: 'js';
  // public source: string;
  public getCall(): any;
  public getCategory(): string;
  public getDesc(): string;
  public getExample(): any;
  public getHash(): string;
  public getLineNumber(): number;
  public getName(): string;
  public getReturns(): [ string, string ]; // type, description
  public getSince(): string;
  public getType(): string;
  public getAliases(): Entry[];
  public getMembers(): any;
  public getParams(): Param[];
  public isAlias(): boolean;
  public isCtor(): boolean;
  public isFunction(): boolean;
  public isLicense(): boolean;
  public isPlugin(): boolean;
  public isPrivate(): boolean;
  public isStatic(): boolean;
}

interface ParsedParam {
  types: string[];
  name: string;
  isOptional: boolean;
  isSpread: boolean;
}

const TYPE_REGEX = /^(\.\.\.)?\(?([^)]*)\)?$/;
const NAME_REGEX = /^\[?([^=\]]+).*\]?$/;
const OPTIONAL_REGEX = /^\[.*\]$/;
const SPREAD_REGEX = /^\.\.\..*$/;

function execOrFail(regex: RegExp, s: string) {
  const match = regex.exec(s);
  if (!match) {
    throw new Error(`\'${s}\' didn't match ${regex.toString()}`);
  }
  return match;
}

function parseParam(param: Param): ParsedParam {
  return {
    types: execOrFail(TYPE_REGEX, param[0])[2].split('|'),
    name: execOrFail(NAME_REGEX, param[1])[1],
    isOptional: !!OPTIONAL_REGEX.exec(param[1]),
    isSpread: !!SPREAD_REGEX.exec(param[0])
  };
}


const source = readFileSync('./node_modules/lodash/lodash.js').toString();

const entries = Entry.getEntries(source)
  .map(e => new Entry(e, source))
  .filter(e => !e.isPrivate());

const functions = entries
  .filter(e => e.isFunction());

function assert(condition?: any, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

const CATEGORICAL_CONVERSIONS = {
  Util: (f: Entry, params: ParsedParam[]) => {

  },

  Seq: (f: Entry, params: ParsedParam[]) => {

  },

  Array: (f: Entry, params: ParsedParam[]) => {
    assert(isEqual(params[0].types, [ 'Array' ]));
    const returnType = f.getReturns()[0];

    let formattedReturnType: string;
    if (returnType === 'Array') {
      formattedReturnType = 'T[]';
    } else if (returnType === '*') {
      formattedReturnType = 'T';
    } else {
      formattedReturnType = returnType;
    }

    const formattedParams = params.map((p, i) => {
      let type;
      // NOTE: We're not looking at the types here, just the name.
      if (includes([ 'array', 'arrays', 'values' ], p.name)) {
        type = 'T[]';
      } else if (p.name === 'value' && isEqual(p.types, [ '*' ])) {
        type = 'T';
      } else if (isEqual(p.types, [ 'Function' ])) {
        if (p.name === 'iteratee') {
          type = `(value: T) => any`;
        } else if (p.name === 'comparator') {
          type = '(a: T, b: T) => boolean';
        } else if (p.name === 'predicate') {
          type = '(value: T) => boolean';
        } else {
          type = 'Function';
        }
      } else {
        type = `${isEqual(p.types, [ '*' ]) ? 'any' : p.types.join('|')}`;
      }
      // Slight API difference: don't accept spreads in the the middle of the arg list.
      let shouldSpread = p.isSpread && i === params.length - 1;
      // Note that we check p.isSpread, not shouldSpread, when attaching the [].
      return `${shouldSpread ? '...' : ''}${p.name}${p.isOptional ? '?' : ''}: ${p.isSpread ? `${type.indexOf('|') === -1 ? type : `(${type})`}[]` : type}`;
    });
    console.log(`${f.getName()}<T>(${formattedParams.join(', ')}): ${formattedReturnType}`);
  },

  Collection: (f: Entry, params: ParsedParam[]) => {
    assert(intersection(params[0].types, [ 'Array', 'Object' ]).length == 2, f.getName());
  },

  Date: (f: Entry, params: ParsedParam[]) => {

  },

  Function: (f: Entry, params: ParsedParam[]) => {

  },

  Lang: (f: Entry, params: ParsedParam[]) => {

  },

  Object: (f: Entry, params: ParsedParam[]) => {

  },

  Number: (f: Entry, params: ParsedParam[]) => {

  },

  String: (f: Entry, params: ParsedParam[]) => {

  },

  Math: (f: Entry, params: ParsedParam[]) => {

  },

}

functions.forEach(f => {
  CATEGORICAL_CONVERSIONS[f.getCategory()](f, f.getParams().map(parseParam));
});
