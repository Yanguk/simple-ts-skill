# React — 훅

## 1. 로직은 이벤트 핸들러에: `useEffect`로 구독하지 않는다

`useEffect`로 state 변화를 구독해서 로직을 돌리지 않는다. **사용자 동작이 원인인 로직은 그 동작의 이벤트 핸들러에 직접 넣는다.**

**이유**: "무엇이 이 로직을 실행시켰나"가 핸들러 안에 그대로 보인다. effect는 렌더 후에 한 번 더 돌아서 추가 렌더가 생기고, 의존성 배열이 틀리면 누락·무한 루프가 생기며, 여러 effect가 서로를 연쇄로 깨우면 흐름을 추적할 수 없다.

| effect로 하던 것 | 대신 |
|---|---|
| state가 바뀌면 API 호출·알림·로그 | 그 state를 바꾸는 핸들러에서 같이 실행 |
| state가 바뀌면 다른 state 갱신 | 핸들러에서 둘 다 갱신, 또는 렌더 중에 계산 (파생 값은 state로 두지 않는다) |
| prop이 바뀌면 state 초기화 | 부모에서 `key`를 바꿔 컴포넌트를 새로 마운트 |
| 부모에게 변경 알리기 (`onChange`) | 자기 state를 바꾸는 핸들러에서 `onChange`도 호출 |

```tsx
// ✗  state 변화를 effect로 구독
const [submitted, setSubmitted] = useState(false);
useEffect(() => {
  if (!submitted) {
    return;
  }
  void postOrder(form);
  showToast('주문 완료');
}, [submitted]);

const handleSubmit = () => setSubmitted(true);

// ✓  원인이 된 핸들러에서 바로 실행
const handleSubmit = async () => {
  await postOrder(form);
  showToast('주문 완료');
};
```

```tsx
// ✗  state 연쇄
const [country, setCountry] = useState('KR');
const [city, setCity] = useState('서울');
useEffect(() => {
  setCity(defaultCity(country));
}, [country]);

// ✓
const handleCountryChange = (next: string) => {
  setCountry(next);
  setCity(defaultCity(next));
};
```

```tsx
// ✗  부모 알림을 effect로
useEffect(() => {
  onChange(isOn);
}, [isOn]);

// ✓
const toggle = () => {
  const next = !isOn;
  setIsOn(next);
  onChange(next);
};
```

**예외 — `useEffect`를 허용**
- React 밖의 시스템과 동기화할 때: DOM API(포커스, 스크롤, `IntersectionObserver`), 서드파티 위젯, WebSocket 연결. 화면에 "보이는 동안" 유지돼야 하는 것들이다. cleanup을 꼭 반환한다.
- 외부 store 구독은 `useSyncExternalStore`가 있으면 그걸 먼저 쓴다.
- 데이터 페칭은 레포에서 쓰는 라이브러리(TanStack Query 등)가 있으면 그걸 쓴다. effect로 직접 fetch하지 않는다.

판단 기준: **"사용자가 무엇을 했기 때문에" 실행되는가? → 핸들러. "컴포넌트가 화면에 있기 때문에" 실행되는가? → effect.**

## 2. `useRef`는 DOM 참조에만: 값은 `useState`로

`useRef`는 DOM 요소를 잡을 때만 쓴다. 컴포넌트가 기억해야 하는 값은 `useState`로 둔다. DOM이 아닌 값에 ref가 꼭 필요하면 **이름 있는 커스텀 훅으로 감싸고, 왜 state가 아니라 ref인지 주석을 단다.**

**이유**: ref는 바뀌어도 렌더가 일어나지 않아서 화면과 값이 어긋난다. 렌더 중에 ref를 읽으면 오래된 값이 보이고, 어디서 바뀌는지 추적하기 어렵다. state면 값이 바뀔 때 화면이 같이 바뀌고, 바뀌는 곳이 setter 호출로 드러난다.

| ref로 하던 것 | 대신 |
|---|---|
| 화면에 쓰이는 값 (카운트, 선택 항목, 로딩 여부) | `useState` |
| "이미 실행했나" 플래그 | `useState`, 또는 핸들러에서 처리 (1번 규칙) |
| 이전 값 비교 | `useState`로 이전 값을 저장해 렌더 중에 비교 |
| 타이머 id, `AbortController`, 최신 콜백 보관 | 컴포넌트에 직접 쓰지 말고 `useInterval`, `useLatest` 같은 커스텀 훅 안에서 ref 사용 |

```tsx
// ✗  화면에 쓰이는 값을 ref에
const countRef = useRef(0);
const handleClick = () => {
  countRef.current += 1;
};
return <span>{countRef.current}</span>; // 클릭해도 화면이 안 바뀜

// ✓
const [count, setCount] = useState(0);
const handleClick = () => setCount(c => c + 1);
return <span>{count}</span>;
```

```tsx
// ✗  컴포넌트 본문에 DOM이 아닌 ref
const timerRef = useRef<number>();
useEffect(() => {
  timerRef.current = window.setInterval(tick, 1000);
  return () => clearInterval(timerRef.current);
}, []);

// ✓  의도가 이름에 드러나는 커스텀 훅으로 감싼다
export function useInterval(callback: () => void, ms: number) {
  // 매 렌더마다 interval을 다시 걸지 않고 최신 callback을 호출하려고 ref를 쓴다
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  useEffect(() => {
    const id = window.setInterval(() => callbackRef.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

useInterval(tick, 1000);
```

```tsx
// ✓  DOM 참조는 그대로 ref
const inputRef = useRef<HTMLInputElement>(null);
const focusInput = () => inputRef.current?.focus();
return <input ref={inputRef} />;
```

**허용 — DOM이 아닌 ref**
- 커스텀 훅 내부에서, 훅 이름과 주석으로 의도가 드러날 때 (`useInterval`, `useLatest`, `useDebouncedCallback` 등)
- 서드파티 라이브러리 인스턴스(지도, 차트, 에디터)를 보관할 때. 이것도 가능하면 커스텀 훅으로 감싼다.
