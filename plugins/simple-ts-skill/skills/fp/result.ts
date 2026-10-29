export type Ok<T> = {
  readonly ok: true;
  readonly err: false;
  readonly value: T;
  unwrap: () => T;
  expect: (msg: string) => T;
};

export type Err<E> = {
  readonly ok: false;
  readonly err: true;
  readonly error: E;
  unwrap: () => never;
  expect: (msg: string) => never;
};

export type Result<T, E> = Ok<T> | Err<E>;

export const Ok = <T>(value: T): Ok<T> => ({
  ok: true,
  err: false,
  value,
  unwrap: () => value,
  expect: () => value,
});

export const Err = <E>(error: E): Err<E> => ({
  ok: false,
  err: true,
  error,
  unwrap: () => {
    throw new Error('Tried to unwrap Err', { cause: error });
  },
  expect: (msg: string) => {
    throw new Error(msg, { cause: error });
  },
});
