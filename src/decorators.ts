/* eslint-disable */

/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

"use strict";

function decorate(
  decorator: (fn: Function, key: string) => Function,
): Function {
  return (_target: any, key: string, descriptor: any) => {
    let fnKey: string | null = null;
    let fn: Function | null = null;

    if (typeof descriptor.value === "function") {
      fnKey = "value";
      fn = descriptor.value;
    } else if (typeof descriptor.get === "function") {
      fnKey = "get";
      fn = descriptor.get;
    }

    if (!fn || !fnKey) {
      throw new Error("not supported");
    }

    descriptor[fnKey] = decorator(fn, key);
  };
}

function _memoize(fn: Function, key: string): Function {
  const memoizeKey = `$memoize$${key}`;

  return function(this: any, ...args: any[]) {
    if (!this.hasOwnProperty(memoizeKey)) {
      Object.defineProperty(this, memoizeKey, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: fn.apply(this, args),
      });
    }

    return this[memoizeKey];
  };
}

export const memoize = decorate(_memoize);

function _throttle<T>(fn: Function, key: string): Function {
  const currentKey = `$throttle$current$${key}`;
  const nextKey = `$throttle$next$${key}`;

  const trigger = function(this: any, ...args: any[]) {
    if (this[nextKey]) {
      return this[nextKey];
    }

    if (this[currentKey]) {
      this[nextKey] = done(this[currentKey]).then(() => {
        this[nextKey] = undefined;
        return trigger.apply(this, args);
      });

      return this[nextKey];
    }

    this[currentKey] = fn.apply(this, args) as Promise<T>;

    const clear = () => (this[currentKey] = undefined);
    done(this[currentKey]).then(clear, clear);

    return this[currentKey];
  };

  return trigger;
}

export const throttle = decorate(_throttle);

function _sequentialize(fn: Function, key: string): Function {
  const currentKey = `__$sequence$${key}`;

  return function(this: any, ...args: any[]) {
    const currentPromise =
      (this[currentKey] as Promise<any>) || Promise.resolve(null);
    const run = async () => fn.apply(this, args);
    this[currentKey] = currentPromise.then(run, run);
    return this[currentKey];
  };
}

export const sequentialize = decorate(_sequentialize);

export function debounce(delay: number): Function {
  return decorate((fn, key) => {
    const timerKey = `$debounce$${key}`;

    return function(this: any, ...args: any[]) {
      clearTimeout(this[timerKey]);
      this[timerKey] = setTimeout(() => fn.apply(this, args), delay);
    };
  });
}

const _seqList: { [key: string]: any } = {};

export function globalSequentialize(name: string): Function {
  return decorate((fn, _key) => function(this: any, ...args: any[]) {
    const currentPromise =
        (_seqList[name] as Promise<any>) || Promise.resolve(null);
    const run = async () => fn.apply(this, args);
    _seqList[name] = currentPromise.then(run, run);
    return _seqList[name];
  });
}

function done<T>(promise: Promise<T>): Promise<void> {
  return promise.then<void>(() => void 0);
}

// tslint:enable
