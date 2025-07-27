# Level Up Tracker

Supabase Auth를 활용한 React + TypeScript + Vite 기반의 레벨업 트래커 애플리케이션입니다.

## 🚀 기능

- **사용자 인증**: Supabase Auth를 활용한 회원가입 및 로그인
- **보안**: 인증된 사용자만 대시보드 접근 가능
- **반응형 디자인**: Tailwind CSS를 활용한 모던 UI
- **타입 안전성**: TypeScript로 구현된 타입 안전한 코드

## 🛠️ 기술 스택

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Authentication**: Supabase Auth
- **State Management**: React Context API

## 📦 설치 및 실행

1. **의존성 설치**

   ```bash
   pnpm install
   ```

2. **환경 변수 설정**

   ```bash
   cp .env.example .env
   ```

   `.env` 파일을 열고 Supabase 프로젝트 정보를 입력하세요:

   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **개발 서버 실행**

   ```bash
   pnpm dev
   ```

4. **빌드**
   ```bash
   pnpm build
   ```

## 🏗️ 프로젝트 구조

```
src/
├── api/
│   └── auth.ts              # Supabase 인증 함수들
├── components/
│   ├── Auth.tsx            # 인증 통합 컴포넌트
│   ├── AuthGuard.tsx       # 인증 보호 컴포넌트
│   ├── Dashboard.tsx       # 메인 대시보드
│   ├── LoginForm.tsx       # 로그인 폼
│   └── SignUpForm.tsx      # 회원가입 폼
├── contexts/
│   └── AuthContext.tsx     # 인증 상태 관리
├── hooks/
│   └── useAuth.ts          # 인증 커스텀 훅
├── lib/
│   └── supabase.ts         # Supabase 클라이언트 설정
├── App.tsx                 # 메인 애플리케이션
└── main.tsx               # 애플리케이션 진입점
```

## 🔧 주요 컴포넌트

### AuthProvider

인증 상태를 관리하는 React Context Provider입니다.

### useAuth Hook

인증 관련 상태와 함수들을 제공하는 커스텀 훅입니다.

### Auth Component

로그인과 회원가입 폼을 통합한 컴포넌트입니다.

### Dashboard Component

인증된 사용자만 접근할 수 있는 메인 대시보드입니다.

### AuthGuard Component

인증이 필요한 페이지를 보호하는 컴포넌트입니다.

## 🎯 사용법

1. 애플리케이션을 실행하면 로그인 화면이 표시됩니다.
2. 신규 사용자는 "회원가입" 버튼을 클릭하여 계정을 생성할 수 있습니다.
3. 기존 사용자는 이메일과 비밀번호로 로그인할 수 있습니다.
4. 로그인 후 대시보드에 접근할 수 있습니다.
5. 우측 상단의 "로그아웃" 버튼으로 로그아웃할 수 있습니다.

## 🔐 보안 고려사항

- 모든 인증 처리는 Supabase에서 안전하게 관리됩니다.
- 클라이언트에서는 JWT 토큰을 통해 인증 상태를 확인합니다.
- 환경 변수를 통해 민감한 정보를 보호합니다.

## 📄 라이선스

MIT License
{
files: ['**/*.{ts,tsx}'],
extends: [
// Other configs...
// Enable lint rules for React
reactX.configs['recommended-typescript'],
// Enable lint rules for React DOM
reactDom.configs.recommended,
],
languageOptions: {
parserOptions: {
project: ['./tsconfig.node.json', './tsconfig.app.json'],
tsconfigRootDir: import.meta.dirname,
},
// other options...
},
},
])

```

```
