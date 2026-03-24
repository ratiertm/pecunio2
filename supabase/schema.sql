-- ===========================
-- pecunio2 Database Schema
-- ===========================
-- 8 tables for Phase 1 (ai_conversations deferred to Phase 2)
-- RLS enabled on all tables

-- Users (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) primary key,
  name text not null,
  email text not null,
  level integer not null default 1,
  xp integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

-- Portfolios
create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null default '기본 포트폴리오',
  mode text not null default 'sim' check (mode in ('sim', 'real')),
  initial_cash bigint not null default 10000000, -- 1천만원
  current_cash bigint not null default 10000000
);

alter table public.portfolios enable row level security;
create policy "Users can manage own portfolios" on public.portfolios
  for all using (auth.uid() = user_id);

-- Holdings
create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  ticker text not null,
  market text not null check (market in ('KRX', 'US')),
  qty integer not null check (qty > 0),
  avg_price bigint not null check (avg_price > 0),
  unique (portfolio_id, ticker)
);

alter table public.holdings enable row level security;
create policy "Users can manage own holdings" on public.holdings
  for all using (
    portfolio_id in (
      select id from public.portfolios where user_id = auth.uid()
    )
  );

-- Trades
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  ticker text not null,
  market text not null check (market in ('KRX', 'US')),
  type text not null check (type in ('buy', 'sell')),
  qty integer not null check (qty > 0),
  price bigint not null check (price > 0),
  confidence integer check (confidence between 1 and 5),
  emotion_tag text,
  bias_alert_shown boolean not null default false,
  bias_alert_action text not null default 'none'
    check (bias_alert_action in ('delay', 'learn', 'ignore', 'none')),
  created_at timestamptz not null default now()
);

alter table public.trades enable row level security;
create policy "Users can manage own trades" on public.trades
  for all using (
    portfolio_id in (
      select id from public.portfolios where user_id = auth.uid()
    )
  );

-- Bias Events
create table public.bias_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete set null,
  bias_type text not null
    check (bias_type in ('loss_aversion', 'overconfidence', 'confirmation', 'herd')),
  score_delta integer not null default 0,
  outcome text not null check (outcome in ('overcome', 'triggered')),
  context_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.bias_events enable row level security;
create policy "Users can view own bias events" on public.bias_events
  for select using (auth.uid() = user_id);

-- Bias Scores (latest per user)
create table public.bias_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  loss_aversion integer,
  overconfidence integer,
  confirmation integer,
  herd integer,
  total integer,
  calculated_at timestamptz not null default now()
);

alter table public.bias_scores enable row level security;
create policy "Users can view own bias scores" on public.bias_scores
  for select using (auth.uid() = user_id);

-- Lessons
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  chapter integer not null,
  "order" integer not null,
  title text not null,
  content_md text not null,
  xp_reward integer not null default 100,
  unique (chapter, "order")
);

-- Lessons are public (no RLS needed for read)
alter table public.lessons enable row level security;
create policy "Anyone can read lessons" on public.lessons
  for select using (true);

-- Quiz Questions
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  question text not null,
  options jsonb not null, -- ["option1", "option2", "option3", "option4"]
  correct_index integer not null,
  explanation text not null
);

alter table public.quiz_questions enable row level security;
create policy "Anyone can read quiz questions" on public.quiz_questions
  for select using (true);

-- Quiz Attempts
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table public.quiz_attempts enable row level security;
create policy "Users can manage own quiz attempts" on public.quiz_attempts
  for all using (auth.uid() = user_id);

-- ===========================
-- RPC Functions
-- ===========================

create or replace function update_portfolio_cash(p_portfolio_id uuid, p_delta bigint)
returns void as $$
begin
  update public.portfolios
  set current_cash = current_cash + p_delta
  where id = p_portfolio_id
    and user_id = auth.uid();
end;
$$ language plpgsql security definer;

create or replace function add_user_xp(p_user_id uuid, p_xp integer)
returns void as $$
begin
  update public.users
  set xp = xp + p_xp
  where id = p_user_id
    and id = auth.uid();
end;
$$ language plpgsql security definer;

-- ===========================
-- Indexes
-- ===========================

create index idx_trades_portfolio on public.trades(portfolio_id, created_at desc);
create index idx_holdings_portfolio on public.holdings(portfolio_id);
create index idx_bias_events_user on public.bias_events(user_id, created_at desc);
create index idx_quiz_attempts_user on public.quiz_attempts(user_id);
create index idx_lessons_chapter on public.lessons(chapter, "order");
