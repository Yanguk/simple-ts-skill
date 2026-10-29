# simple-ts-skill

Claude Code 플러그인 marketplace.

## 플러그인

| 이름 | 설명 |
|---|---|
| `simple-ts-skill` | TypeScript 작성·리뷰 컨벤션 스킬 (React 포함) |

## 설치

Claude Code 안에서:

```
/plugin marketplace add Yanguk/simple-ts-skill
/plugin install simple-ts-skill@yanguk
```

터미널에서:

```sh
claude plugin marketplace add Yanguk/simple-ts-skill
claude plugin install simple-ts-skill@yanguk
```

설치 후 Claude Code를 재시작하면 적용된다.

### 갱신 / 삭제

```
/plugin marketplace update yanguk
/plugin uninstall simple-ts-skill@yanguk
```

## 사용법

따로 호출할 필요 없다. `.ts`/`.tsx` 코드를 작성·수정·리뷰하면 Claude가 스킬을 자동으로 불러와 컨벤션을 적용한다.

직접 부르려면:

```
/simple-ts-skill:convention 이 파일 컨벤션에 맞게 리뷰해줘
```

### 구성

```
plugins/simple-ts-skill/skills/
├── convention/
│   ├── SKILL.md      ← TS 규칙 (항상 적용)
│   └── react/
│       └── hooks.md  ← React 작업이면 읽음 (useEffect·useRef 규칙)
└── fp/
    ├── SKILL.md      ← 의존성 없는 FP 유틸 (필요할 때 프로젝트에 복사)
    ├── option.ts     ← Option (Some/None, unwrap, expect)
    ├── option.test.ts
    ├── result.ts     ← Result (Ok/Err, unwrap, expect)
    └── result.test.ts
```

FP 유틸만 직접 부르려면:

```
/simple-ts-skill:fp 이 함수 반환을 Option으로 바꿔줘
```

레포에 이미 eslint/tsconfig/기존 스타일이 있으면 그쪽이 우선한다.
