import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Err, Ok, type Result } from './result.ts';

const parseAge = (raw: string): Result<number, string> => {
  const age = Number(raw);
  if (Number.isNaN(age)) {
    return Err(`숫자가 아님: ${raw}`);
  }
  return Ok(age);
};

test('Ok: unwrap/expect가 값을 반환한다', () => {
  assert.equal(parseAge('20').unwrap(), 20);
  assert.equal(parseAge('20').expect('파싱 실패'), 20);
});

test('Err: unwrap/expect가 원인(cause)을 담아 에러를 던진다', () => {
  assert.throws(() => parseAge('abc').unwrap(), { message: 'Tried to unwrap Err', cause: '숫자가 아님: abc' });
  assert.throws(() => parseAge('abc').expect('파싱 실패'), { message: '파싱 실패', cause: '숫자가 아님: abc' });
});

test('ok 플래그로 타입이 좁혀진다', () => {
  const result = parseAge('abc');
  if (result.err) {
    assert.equal(result.error, '숫자가 아님: abc');
  }
});
