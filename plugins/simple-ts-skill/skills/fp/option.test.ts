import assert from 'node:assert/strict';
import { test } from 'node:test';
import { None, Some, type Option } from './option.ts';

const find = (id: number): Option<string> => (id === 1 ? Some('kim') : None);

test('Some: unwrap/expect가 값을 반환한다', () => {
  assert.equal(find(1).unwrap(), 'kim');
  assert.equal(find(1).expect('없음'), 'kim');
});

test('None: unwrap/expect가 에러를 던진다', () => {
  assert.throws(() => find(2).unwrap(), /Tried to unwrap None/);
  assert.throws(() => find(2).expect('유저 없음'), /유저 없음/);
});

test('some 플래그로 타입이 좁혀진다', () => {
  const user = find(1);
  if (user.some) {
    assert.equal(user.value, 'kim');
  }
});
