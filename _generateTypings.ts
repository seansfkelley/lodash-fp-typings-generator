import {
  aryMethod,
  realToAlias,
  methodSpread,
  iterateeAry
} from './_mapping';

interface FunctionMetadata {
  name: string;
  aliases: string[];
  arity: number;
  spreadStart: number | undefined;
  iterateeArity: number | undefined;
}

const BINARY_ACCUMULATOR_ITERATEES = [
  'reduce',
  'reduceRight',
  'transform'
];

const functions: { [fnName: string]: FunctionMetadata } = {};

for (let arity in aryMethod) {
  aryMethod[arity].forEach(fnName => {
    functions[fnName] = {
      name: fnName,
      aliases: [],
      arity: +arity,
      spreadStart: undefined,
      iterateeArity: undefined
    };
  });
}

for (let fnName in functions) {
  functions[fnName].aliases = realToAlias[fnName] || [];
  if (methodSpread[fnName]) {
    functions[fnName].spreadStart = methodSpread[fnName].start;
  }
  functions[fnName].iterateeArity = iterateeAry[fnName];
}

const fnNames = [ 'map' ]; // Object.keys(functions).sort();

const GENERIC_ARG_RETURN = 'Z';
const GENERIC_ARG_PARAMS = [ 'A', 'B', 'C', 'D' ];

function range(n: number) {
  const numbers: number[] = [];
  for (let i = 0; i < n; ++i) {
    numbers.push(i);
  }
  return numbers;
}

function assert(condition?: any, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

interface ParameterDefinition {
  name: string;
  type: string;
  genericType?: string;
}

interface PartialFunctionDefinition {
  parameters: ParameterDefinition[];
  returnType: string;
}

function generateCurriedCombinations(parameters: ParameterDefinition[], returnType: string): PartialFunctionDefinition[] {
  return parameters.map((p, i) => {
    const includedParameters = parameters.slice(0, i + 1);
    const restParameters = parameters.slice(i + 1);
    return {
      parameters: includedParameters,
      returnType: restParameters.length === 0 ? returnType : `Curry${restParameters.length}<${restParameters.map(p => p.type).join(', ')}, ${returnType}>`
    };
  });
}

function generateIteratee1Reference(valueType: string, returnType: string) {
  return `Iteratee1<${valueType}, ${returnType}>`;
}

function generateIteratee2Reference(valueType: string, returnType: string) {
  return `Iteratee2<${valueType}, ${returnType}>`;
}

function logIndent(text: string) {
  console.log(`  ${text}`);
}

console.log(`declare module 'lodash/fp' {`);
logIndent(`type ObjectOf<T> = { [key: string]: T } | { [key: number]: T }`);
logIndent(`type CollectionOf<T> = ObjectOf<T> | T[];`);
console.log();
logIndent(`interface Curry1<A, Z> {`);
logIndent(`  (arg1: A): Z;`);
logIndent(`}`);
console.log();
logIndent(`interface Curry2<A, B, Z> {`);
logIndent(`  (arg1: A): Curry1<B, Z>;`);
logIndent(`  (arg1: A, arg2: B): Z;`);
logIndent(`}`);
console.log();
logIndent(`interface Curry3<A, B, C, Z> {`);
logIndent(`  (arg1: A): Curry2<B, C, Z>;`);
logIndent(`  (arg1: A, arg2: B): Curry1<C, Z>;`);
logIndent(`  (arg1: A, arg2: B, arc3: C): Z;`);
logIndent(`}`);
console.log();
logIndent(`type Iteratee1<T, R> = (value: T) => R;`);
logIndent(`type Iteratee2<T, R> = (accumulator: R, value: T) => R;`);
console.log();

function arrayType(type: string) {
  return `${type}[]`;
}

function collectionType(type: string) {
  return `CollectionOf<${type}>`;
}

fnNames.forEach(fnName => {
  const fn = functions[fnName];
  let parameters: ParameterDefinition[] = [];
  let returnType: string;
  let genericReturnType: string | undefined;

  if (fn.iterateeArity != null) {
    assert(fn.arity >= 2);

    parameters.push({
      name: 'iteratee',
      type: generateIteratee1Reference(GENERIC_ARG_PARAMS[0], GENERIC_ARG_RETURN),
      genericType: GENERIC_ARG_PARAMS[0]
    })

    range(fn.arity - 2).forEach(i => {
      parameters.push({
        name: `arg${i + 2}`,
        type: GENERIC_ARG_PARAMS[i + 1],
        genericType: GENERIC_ARG_PARAMS[i + 1]
      });
    });

    parameters.push({
      name: 'collection',
      type: collectionType(GENERIC_ARG_PARAMS[parameters.length]),
      genericType: GENERIC_ARG_PARAMS[parameters.length]
    });

    returnType = arrayType(GENERIC_ARG_RETURN);
    genericReturnType = GENERIC_ARG_RETURN;
  }

  assert(parameters.length === fn.arity);
  assert(returnType);

  logIndent(`// lodash/fp/${fnName}`);

  generateCurriedCombinations(parameters, returnType).forEach(fnDefinition => {
    logIndent(`export function ${fnName}<${parameters.map(p => p.genericType).concat([ genericReturnType ]).filter(t => !!t).join(', ')}>(${fnDefinition.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}): ${fnDefinition.returnType};`);
  });

  fn.aliases.forEach(alias => {
    logIndent(`// lodash/fp/${alias}`);
    logIndent(`export const ${alias}: typeof ${fn.name};`);
  });

  console.log();
});

console.log('}');
