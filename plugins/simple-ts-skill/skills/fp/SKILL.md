---
name: fp
description: TypeScript에서 의존성 없이 쓰는 FP 유틸 모음. 값이 없을 수 있는 반환(null/undefined 대신 Option), 실패 이유를 함께 돌려주는 반환(throw 대신 Result), unwrap/expect가 필요할 때, ts-results 같은 라이브러리를 들이지 않고 Option/Result 타입을 쓰고 싶을 때 사용.
---

# FP 유틸 (의존성 없음)

외부 라이브러리(ts-results 등) 대신 이 스킬의 파일을 프로젝트에 복사해서 쓴다.

## 사용 절차

1. 레포에 이미 같은 역할의 유틸(Option/Maybe 등)이나 라이브러리가 있으면 그걸 쓴다.
2. 없으면 아래 파일을 공용 유틸 위치(예: `src/utils/`)에 그대로 복사한다. 테스트 파일도 함께 복사하고, 레포의 테스트 러너에 맞게 import만 바꾼다.
3. 필요한 기능이 없으면 같은 스타일(class 없이, 객체 리터럴 + 화살표 함수)로 그 파일에 추가한다.

| 유틸 | 파일 | 테스트 |
|---|---|---|
| `Option<T>` (`Some` / `None`, `unwrap`, `expect`) | [option.ts](option.ts) | [option.test.ts](option.test.ts) |
| `Result<T, E>` (`Ok` / `Err`, `unwrap`, `expect`) | [result.ts](result.ts) | [result.test.ts](result.test.ts) |

## Option

```ts
import { None, Some, type Option } from './option.ts';

const find = (id: number): Option<string> => (id === 1 ? Some('kim') : None);

find(1).unwrap();           // 'kim'
find(2).unwrap();           // Error: Tried to unwrap None
find(2).expect('유저 없음'); // Error: 유저 없음

const user = find(1);
if (user.some) {
  user.value; // string으로 좁혀짐
}
```

- `unwrap`/`expect`는 None이면 throw한다. "여기서 None이면 버그"인 곳에서만 쓰고, 정상 흐름에서 없을 수 있는 값은 `if (x.some)`으로 분기한다.

## Result

실패 이유를 함께 돌려줘야 할 때 쓴다. 값이 "없음"만 표현하면 되면 Option을 쓴다.

```ts
import { Err, Ok, type Result } from './result.ts';

const parseAge = (raw: string): Result<number, string> => {
  const age = Number(raw);
  if (Number.isNaN(age)) {
    return Err(`숫자가 아님: ${raw}`);
  }
  return Ok(age);
};

parseAge('20').unwrap();             // 20
parseAge('abc').unwrap();            // Error: Tried to unwrap Err (cause: '숫자가 아님: abc')
parseAge('abc').expect('파싱 실패'); // Error: 파싱 실패 (cause: '숫자가 아님: abc')

const result = parseAge('abc');
if (result.err) {
  result.error; // string으로 좁혀짐
}
```

- `unwrap`/`expect`가 던지는 에러의 `cause`에 원래 `error` 값이 담긴다.
- 실패가 예상되는 흐름은 `if (result.ok)` / `if (result.err)`로 분기하고, `unwrap`/`expect`는 Option과 같은 기준으로만 쓴다.
