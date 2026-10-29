---
name: convention
description: TypeScript/TSX 코드를 작성·수정·리뷰할 때 적용하는 컨벤션. .ts/.tsx 파일 편집, 반복문·클래스·변수 선언·제어문 작성, React 컴포넌트·훅 작성 시 사용.
---

# TypeScript 컨벤션

> 레포에 tsconfig/eslint/기존 스타일이 있으면 그게 우선. 이 문서는 그게 없거나 애매할 때의 디폴트.
> lint/format으로 강제되는 규칙은 여기 적지 않는다.

## 1. 반복문: `for (let ...)` 절대 금지

`for (let i = 0; i < n; i++)` 형태는 **어떤 경우에도 쓰지 않는다** (성능 핫패스 포함). 의도에 맞는 도구를 고른다.

| 의도 | 사용 |
|---|---|
| 변환 | `arr.map(x => ...)` |
| 걸러내기 | `arr.filter(x => ...)` |
| 집계 | `arr.reduce(...)` — 콜백이 3줄을 넘으면 콜백을 이름 있는 함수로 분리 |
| 순회 + 부수효과 | `for (const x of arr)` |
| 인덱스도 필요 | `for (const [i, x] of arr.entries())` 또는 `arr.map((x, i) => ...)` |
| 숫자 범위 순회 | `for (const i of range(start, end, step))` |
| 숫자 범위로 배열 생성 | `Array.from(range(n), i => ...)` |

**이유**: off-by-one 실수가 사라지고, 루프 변수가 `const`라 재할당이 막히며, 메서드 이름만 보고 의도(변환/필터/집계)를 알 수 있다.

### `range()` 헬퍼

숫자 범위가 필요한 루프는 전부 `range()`로 쓴다. Python의 `range`와 같은 동작이다 (`end`는 포함하지 않음).

- 레포에 이미 `range` 유틸이 있으면 그걸 쓴다.
- 없으면 공용 유틸 위치(예: `src/utils/range.ts`)에 아래 구현을 추가한다.

```ts
/**
 * Python 스타일 range. end는 포함하지 않는다.
 * range(5)        → 0, 1, 2, 3, 4
 * range(2, 5)     → 2, 3, 4
 * range(0, 10, 3) → 0, 3, 6, 9
 * range(5, 0, -1) → 5, 4, 3, 2, 1
 */
export function range(end: number): Generator<number>;
export function range(start: number, end: number, step?: number): Generator<number>;
export function* range(startOrEnd: number, end?: number, step = 1): Generator<number> {
  if (step === 0) {
    throw new RangeError('range() step must not be 0');
  }
  const [from, to] = end === undefined ? [0, startOrEnd] : [startOrEnd, end];
  const length = Math.max(0, Math.ceil((to - from) / step));
  // Array(length)는 빈 슬롯 배열이라 요소를 할당하지 않고, keys()는 lazy 이터레이터다
  for (const k of Array(length).keys()) {
    yield from + k * step;
  }
}
```

```ts
// ✗
for (let i = 0; i < 10; i += 2) { ... }
for (let i = n - 1; i >= 0; i--) { ... }

// ✓
for (const i of range(0, 10, 2)) { ... }
for (const i of range(n - 1, -1, -1)) { ... }

// ✓  2차원 순회
for (const row of range(height)) {
  for (const col of range(width)) {
    grid[row][col] = 0;
  }
}
```

`range()`는 제너레이터라 값을 필요할 때마다 하나씩 만든다. 큰 범위도 배열을 통째로 만들지 않고, `break`하면 거기서 멈춘다.

```ts
// ✗
const names: string[] = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].active) names.push(users[i].name);
}

// ✓
const names = users.filter(u => u.active).map(u => u.name);
```

```ts
// ✗
for (let i = 0; i < items.length; i++) {
  console.log(`${i + 1}. ${items[i]}`);
}

// ✓  (Python의 enumerate)
for (const [i, item] of items.entries()) {
  console.log(`${i + 1}. ${item}`);
}

// ✓  (Python의 range)
const slots = Array.from(range(7), day => ({ day, bookings: [] }));
```

**`map`/`filter` 대신 `for...of`를 쓰는 경우**
- 순차 `await`가 필요할 때 (`map` + `await`는 병렬 실행되고, `forEach`는 await를 기다리지 않는다)
- `break`/`continue`/`return`으로 일찍 빠져나가야 할 때
- 그래서 `forEach`보다 `for...of`를 쓴다

배열에 `for...in`은 쓰지 않는다 (키가 문자열로 나오고, 프로토타입 속성까지 순회한다).

## 2. `class` 금지: 클로저 + 함수로

`class`를 쓰지 않는다. **Go처럼** 생각한다: class도 상속도 없이, 생성자 함수(`newX`)가 값을 만들고, 확장은 상속 대신 조합(embedding)으로 한다. 상태가 필요하면 클로저를 쓰는 생성자 함수로, 상태가 없으면 그냥 모듈 함수로 쓴다.

**이유**: `this` 바인딩 문제(콜백으로 넘길 때 `this`가 풀리는 것)가 없고, 상속 계층 대신 함수 조합으로 끝나며, private 상태는 클로저에 그냥 숨겨진다. 코드가 더 짧고 단순해진다.

| class로 하던 것 | 대신 (Go 관례) |
|---|---|
| `new X()` | 생성자 함수 `newX()` (Go의 `NewX`) |
| 상태 + 메서드 | `newX()`가 상태를 클로저 변수로 두고, 메서드를 담은 객체를 반환 |
| `private` / `#field` | 클로저 변수 (Go의 소문자 unexported처럼 반환 객체에 안 넣으면 밖에서 접근 불가) |
| `static` 메서드만 있는 유틸 클래스 | 모듈에서 함수를 named export (Go의 패키지 함수) |
| 생성자 주입(DI) | 생성자 함수의 인자로 의존성을 받는다 |
| 상속 (`extends`) | 조합: 다른 생성자의 결과를 펼쳐서(`...base`) 포함 (Go의 struct embedding) |
| 인스턴스 타입 | `type X = ReturnType<typeof newX>` |

```ts
// ✗
class Counter {
  private count = 0;
  constructor(private readonly step: number) {}
  increment() { this.count += this.step; return this.count; }
  reset() { this.count = 0; }
}
const counter = new Counter(2);
button.addEventListener('click', counter.increment); // this가 풀려서 버그

// ✓
export function newCounter(step: number) {
  const state = { count: 0 };
  return {
    increment: () => (state.count += step),
    reset: () => { state.count = 0; },
  };
}
export type Counter = ReturnType<typeof newCounter>;

const counter = newCounter(2);
button.addEventListener('click', counter.increment); // 그대로 동작
```

```ts
// ✗  static만 있는 클래스
class DateUtil {
  static toISODate(d: Date) { return d.toISOString().slice(0, 10); }
}

// ✓  그냥 함수
export const toISODate = (d: Date) => d.toISOString().slice(0, 10);
```

```ts
// ✗
class UserService {
  constructor(private readonly repo: UserRepo, private readonly mailer: Mailer) {}
  async signUp(email: string) { ... }
}

// ✓  의존성은 생성자 함수 인자로
export function newUserService(deps: { repo: UserRepo; mailer: Mailer }) {
  const signUp = async (email: string) => { ... };
  return { signUp };
}
```

```ts
// ✗  상속
class Logger { log(msg: string) { ... } }
class TimedLogger extends Logger {
  time(label: string) { ... }
}

// ✓  조합 (Go의 embedding)
export function newLogger() {
  return { log: (msg: string) => { ... } };
}
export function newTimedLogger() {
  const logger = newLogger();
  return {
    ...logger,
    time: (label: string) => { logger.log(`${label}: ${Date.now()}`); },
  };
}
```

**예외 — `class`를 허용**
- 커스텀 에러: `class NotFoundError extends Error` (`instanceof`로 구분하고 스택 트레이스를 남기려면 필요)
- 프레임워크가 class를 요구할 때 (NestJS 데코레이터, TypeORM 엔티티, React Error Boundary 등). 레포가 이미 그 방식이면 따른다.

## 3. `let` 금지: `const` + 함수 분리 + early return

`let`을 쓰지 않는다. 모든 변수는 `const`다. 값이 조건에 따라 달라지면 **그 값을 계산하는 함수로 분리하고 early return**으로 쓴다.

**이유**: 선언하는 순간 값이 정해지니, 위에서 아래로 읽기만 하면 된다. "이 변수가 어디서 또 바뀌었나"를 추적할 필요가 없다. 분리한 함수에는 이름이 생겨서 의도가 드러난다.

| `let`이 필요해 보이는 상황 | 대신 |
|---|---|
| 조건에 따라 값 결정 (단순) | 삼항 연산자 `const x = a ? 1 : 2` — 중첩 삼항은 금지 |
| 조건에 따라 값 결정 (분기 3개 이상) | 함수로 분리 + early return |
| 루프에서 누적 | `map`/`filter`/`reduce` (1번 규칙) |
| `try`/`catch` 결과를 변수에 담기 | `try` 안에서 `return`하는 함수로 분리 |
| 두 값 교환 | 구조 분해 `const [b, a] = [a, b]` |
| 클로저 안의 변경 가능한 상태 | `const state = { ... }`의 속성을 변경 (2번 규칙의 `newCounter` 참고) |

```ts
// ✗
let fee;
if (user.isVip) {
  fee = 0;
} else if (order.total >= 50_000) {
  fee = 0;
} else if (order.region === 'jeju') {
  fee = 6_000;
} else {
  fee = 3_000;
}

// ✓
function shippingFee(user: User, order: Order): number {
  if (user.isVip) {
    return 0;
  }
  if (order.total >= 50_000) {
    return 0;
  }
  if (order.region === 'jeju') {
    return 6_000;
  }
  return 3_000;
}
const fee = shippingFee(user, order);
```

```ts
// ✗
let config;
try {
  config = JSON.parse(raw);
} catch {
  config = DEFAULT_CONFIG;
}

// ✓
function parseConfig(raw: string): Config {
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CONFIG;
  }
}
const config = parseConfig(raw);
```

```ts
// ✗  중첩 삼항
const label = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';

// ✓
function grade(score: number) {
  if (score >= 90) {
    return 'A';
  }
  if (score >= 80) {
    return 'B';
  }
  return 'C';
}
```

`const`는 재할당만 막을 뿐이다. 클로저 상태를 담는 `state` 객체 말고는 객체·배열을 변경하지 말고 새 값을 만든다 (`{ ...obj, key }`, `[...arr, item]`).

## 4. 제어문은 항상 중괄호 `{ }`

`if` / `else` / `for` / `while` / `do`의 본문은 **한 줄이어도 항상 중괄호로 감싸고 줄을 바꾼다**. early return(`if (x) return;`)도 예외 없다.

**이유**: 한 줄짜리는 일반적인 프로그래밍 컨벤션이 아니라 읽을 때 걸린다. 나중에 본문에 줄을 추가할 때 중괄호를 빠뜨려 생기는 버그(goto fail류)도 막는다.

```ts
// ✗
if (!user) return;
for (const n of range(2, 11, 2)) console.log(n);

// ✓
if (!user) {
  return;
}
for (const n of range(2, 11, 2)) {
  console.log(n);
}
```

화살표 함수의 표현식 본문(`x => x * 2`)은 제어문이 아니므로 해당하지 않는다.

## 5. React

React 코드(.tsx/.jsx 컴포넌트·훅)를 다룰 때는 [react/hooks.md](react/hooks.md)도 읽는다. 위 1~4번 규칙은 React 코드에도 그대로 적용된다.
