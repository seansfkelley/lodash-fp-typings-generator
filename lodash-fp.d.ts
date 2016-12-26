declare module 'lodash-fp' {
  type ObjectOf<T> = { [key: string]: T } | { [key: number]: T }; // | { [key: symbol]: T };
  type ArrayOrObjectOf<T> = T[] | ObjectOf<T> | {};
  type Iteratee1<A, Z> = (arg1: A) => Z;
  type Iteratee2<A, B, Z> = (arg1: A, arg2: B) => Z;

  interface Curry1<A, Z> {
    (arg1: A): Z;
  }

  interface Curry2<A, B, Z> {
    (arg1: A): Curry1<B, Z>;
    (arg1: A, arg2: B): Z;
  }

  interface Curry3<A, B, C, Z> {
    (arg1: A): Curry2<B, C, Z>;
    (arg1: A, arg2: B): Curry1<C, Z>;
    (arg1: A, arg2: B, arc3: C): Z;
  }

  function map<T, U>(iteratee: (arg: T) => U): Curry1<T[], U[]>;
  function map<T, U>(iteratee: (arg: T) => U, data: T[]): U[];

  // export function map<T, U>(iteratee: Iteratee1<T, U>): (input: ArrayOrObjectOf<T>) => U[];
  // export function map<T, U>(iteratee: Iteratee1<T, U>, input: ArrayOrObjectOf<T>): U[];
  // export function map<V extends {}, T extends keyof V, U>(iteratee: Iteratee1<T, U>, input: V): U[];

  export const alias: typeof map;
}
