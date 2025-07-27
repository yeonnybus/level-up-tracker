# Supabase 설정 가이드

프로젝트 생성 후 아래 정보를 .env 파일에 복사하세요:

## Settings > API에서 확인할 수 있는 정보:

1. **Project URL**

   - VITE_SUPABASE_URL에 입력할 값
   - 형식: https://xxxxxxxxx.supabase.co

2. **Project API Keys > anon public**
   - VITE_SUPABASE_ANON_KEY에 입력할 값
   - 형식: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## .env 파일 예시:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjc2MDAwMDAwLCJleHAiOjE5OTE1NzYwMDB9.your-anon-key
```

⚠️ 실제 값으로 교체해주세요!
