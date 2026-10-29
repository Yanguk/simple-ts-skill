export type Some<T> = {
  readonly some: true;
  readonly none: false;
  readonly value: T;
  unwrap: () => T;
  expect: (msg: string) => T;
};

export type None = {
  readonly some: false;
  readonly none: true;
  unwrap: () => never;
  expect: (msg: string) => never;
};

export type Option<T> = Some<T> | None;

export const Some = <T>(value: T): Some<T> => ({
  some: true,
  none: false,
  value,
  unwrap: () => value,
  expect: () => value,
});

export const None: None = {
  some: false,
  none: true,
  unwrap: () => {
    throw new Error('Tried to unwrap None');
  },
  expect: (msg: string) => {
    throw new Error(msg);
  },
};
