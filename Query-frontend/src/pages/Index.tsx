import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  FileUp,
  Github,
  GitBranch,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  LineChart,
  Lock,
  MessageSquare,
  Play,
  Plug,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  UserRound,
  XCircle,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import logo from '@/assets/query-genie-logo.png';

const databaseSources = [
  { name: 'MySQL', color: '#00758f' },
  { name: 'PostgreSQL', color: '#336791' },
  { name: 'MariaDB', color: '#003545' },
  { name: 'Oracle', color: '#f80000' },
  { name: 'SQL Server', color: '#cc2927' },
  { name: 'IBM Db2', color: '#054ada' },
  { name: 'SQLite', color: '#003b57' },
  { name: 'CSV', color: '#3ddc97' },
  { name: 'Excel', color: '#1d6f42' },
  { name: 'MongoDB', color: '#13aa52' },
  { name: 'Redis', color: '#dc382d' },
];

const workflowSteps = [
  {
    icon: Plug,
    accent: 'violet',
    step: 'STEP / 01',
    title: 'Connect a source',
    text: 'Pick a SQL database, SQLite file, CSV, Excel workbook, or inspect MongoDB and Redis metadata.',
    extra: (
      <div className="mt-6 flex flex-wrap gap-1.5">
        {['MySQL', 'Postgres', '+8 more'].map((item) => (
          <span key={item} className="landing-chip text-[10px]">
            {item}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: MessageSquare,
    accent: 'cyan',
    step: 'STEP / 02',
    title: 'Ask in plain English',
    text: 'Query Genie builds SQL from your schema context and recent conversation history.',
    extra: (
      <div className="landing-code-strip mt-6 font-mono text-[11px]">
        &gt; show monthly active users by region
      </div>
    ),
  },
  {
    icon: LineChart,
    accent: 'green',
    step: 'STEP / 03',
    title: 'Review the answer',
    text: 'Inspect SQL, browse sortable results, switch to charts, export data, and save useful queries.',
    extra: (
      <div className="mt-6 flex h-10 items-end gap-1">
        {[30, 55, 40, 80, 65, 100, 75].map((height) => (
          <div
            key={height}
            className="w-2 rounded-sm bg-emerald-400/70"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    ),
  },
];

const sourceCards = [
  {
    title: 'Queryable SQL sources',
    subtitle: 'Full natural-language querying',
    icon: Terminal,
    status: 'Queryable',
    statusColor: 'bg-emerald-400',
    accent: 'violet',
    sources: ['MySQL', 'PostgreSQL', 'MariaDB', 'Oracle', 'SQL Server', 'IBM Db2', 'SQLite'],
  },
  {
    title: 'File uploads',
    subtitle: 'Uploaded files become temporary SQLite sources.',
    icon: FileUp,
    status: 'Staged',
    statusColor: 'bg-emerald-400',
    accent: 'cyan',
    sources: ['CSV', 'Excel'],
  },
  {
    title: 'Metadata browsing',
    subtitle: 'Inspect tables, collections, keys, and schemas.',
    icon: Search,
    status: 'Browse only',
    statusColor: 'bg-amber-400',
    accent: 'amber',
    sources: ['MongoDB', 'Redis'],
  },
];

const creatorProfile = {
  sectionLabel: 'Team',
  headline: 'Meet the creator behind Query Genie',
  name: 'Your Name',
  role: 'Founder / Developer',
  photo: '/your-photo.jpg',
  aboutTitle: 'About me',
  aboutHeadline: 'Tell visitors who you are and why you built this product',
  aboutText:
    'Use this section to introduce yourself, your background, and what inspired you to build Query Genie. This is the perfect place to make the page feel more personal and trustworthy.',
  aboutText2:
    'You can talk about your experience with analytics, AI, product development, and the kind of value you create for users or clients. Replace this copy with your real story and achievements.',
  highlights: [
    'Share your mission and the problem you solve',
    'Highlight your product, design, and engineering strengths',
    'Add trust signals like experience, projects, or clients',
    'Invite people to connect, collaborate, or get in touch',
  ],
};

const dbColor = new Map(databaseSources.map((source) => [source.name, source.color]));

const getAccentClasses = (accent: string) => {
  const classes = {
    violet: 'bg-violet-500/15 border-violet-400/30 text-violet-300',
    cyan: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300',
    green: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
    amber: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    pink: 'bg-pink-500/15 border-pink-400/30 text-pink-300',
    fuchsia: 'bg-fuchsia-500/15 border-fuchsia-400/30 text-fuchsia-300',
  };
  return classes[accent as keyof typeof classes] ?? classes.violet;
};

const sourceIcon = (source: string) => {
  if (source === 'CSV') return <FileText className="h-3.5 w-3.5 text-emerald-300" />;
  if (source === 'Excel') return <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />;
  return (
    <span
      className="h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: dbColor.get(source) ?? '#7c5cff' }}
    />
  );
};

const Index = () => {
  const navigate = useNavigate();
  const sourceMarquee = [...databaseSources, ...databaseSources];

  const goToAuth = () => navigate('/auth');
  const [profileImageError, setProfileImageError] = useState(false);

  return (
    <div className="landing-page min-h-screen overflow-x-hidden bg-[var(--landing-bg)] text-[var(--landing-ink)]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--landing-line)] bg-[var(--landing-nav)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5"
            aria-label="Query Genie home"
          >
            <img src={logo} alt="" className="h-9 w-9 object-contain" />
            <span className="text-[15px] font-bold tracking-tight">Query Genie</span>
          </button>

          <nav className="hidden items-center gap-8 text-sm text-[var(--landing-muted)] md:flex">
            <a href="#workflow" className="transition hover:text-[var(--landing-ink)]">
              Workflow
            </a>
            <a href="#sources" className="transition hover:text-[var(--landing-ink)]">
              Sources
            </a>
            <a href="#features" className="transition hover:text-[var(--landing-ink)]">
              Features
            </a>
            <a href="#team" className="transition hover:text-[var(--landing-ink)]">
              Team
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={goToAuth}
              className="hidden text-sm text-[var(--landing-soft)] hover:bg-[var(--landing-card-hover)] hover:text-[var(--landing-ink)] sm:inline-flex"
            >
              Sign in
            </Button>
            <Button onClick={goToAuth} className="landing-btn-primary h-10 rounded-xl px-4 text-sm">
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pb-24 pt-36">
          <div className="landing-grid-bg absolute inset-0 opacity-80" />
          <div className="landing-radial absolute inset-0" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <h1 className="landing-grad-text text-[44px] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                  Talk to your database.
                  <br />
                  <span className="landing-grad-text-2">Get dashboards.</span>
                </h1>
                <p className="mt-7 max-w-xl text-lg leading-relaxed text-[var(--landing-soft)]">
                  Query Genie connects to your databases and uploaded spreadsheets, converts natural
                  language into schema-aware SQL, and presents results as tables, charts, favorites,
                  history, and custom dashboards.
                </p>

                <div className="mt-9 flex flex-wrap gap-3">
                  <Button onClick={goToAuth} className="landing-btn-primary h-12 rounded-xl px-5">
                    Start querying free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}
                    className="landing-btn-ghost h-12 rounded-xl px-5"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    See workflow
                  </Button>
                </div>

                <div className="mt-10 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="landing-card p-4">
                    <Sparkles className="h-5 w-5 text-violet-300" />
                    <p className="mt-2 text-xs font-medium text-[var(--landing-soft)]">SQL generation</p>
                    <p className="mt-0.5 text-[11px] text-[var(--landing-muted)]">Schema-aware</p>
                  </div>
                  <div className="landing-card p-4">
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                    <p className="mt-2 text-xs font-medium text-[var(--landing-soft)]">Safe execution</p>
                    <p className="mt-0.5 text-[11px] text-[var(--landing-muted)]">Read-only guard</p>
                  </div>
                  <div className="landing-card p-4">
                    <LayoutDashboard className="h-5 w-5 text-cyan-300" />
                    <p className="mt-2 text-xs font-medium text-[var(--landing-soft)]">Reusable</p>
                    <p className="mt-0.5 text-[11px] text-[var(--landing-muted)]">History and favorites</p>
                  </div>
                </div>
              </div>

              <div className="relative lg:col-span-6">
                <div className="landing-preview-glow absolute -inset-5 rounded-3xl" />
                <div className="landing-code-window relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--landing-line)] px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f56]" />
                      <span className="h-[11px] w-[11px] rounded-full bg-[#ffbd2e]" />
                      <span className="h-[11px] w-[11px] rounded-full bg-[#27c93f]" />
                    </div>
                    <span className="font-mono text-[11px] text-[var(--landing-muted)]">
                      querygenie - chat
                    </span>
                    <span className="landing-chip py-1 text-[10px]">
                      <Database className="h-3 w-3" />
                      sales_db
                    </span>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="flex items-start gap-3">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pink-400 to-violet-500 text-[10px] font-bold text-white">
                        YOU
                      </div>
                      <div className="rounded-xl border border-[var(--landing-line)] bg-[var(--landing-card)] px-4 py-2.5 text-sm text-[var(--landing-ink)]">
                        Top 5 products by revenue last quarter, with month-over-month growth.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 font-mono text-[11px] text-[var(--landing-muted)]">
                          Generated SQL - validated read-only
                        </div>
                        <pre className="overflow-x-auto rounded-xl border border-[var(--landing-line)] bg-[var(--landing-code)] p-4 font-mono text-[12px] leading-6 text-[var(--landing-code-ink)]">
                          <code>
                            <span className="text-pink-400">SELECT</span> p.name,{'\n'}
                            {'       '}<span className="text-pink-400">SUM</span>(o.amount){' '}
                            <span className="text-pink-400">AS</span> revenue,{'\n'}
                            {'       '}<span className="text-pink-400">ROUND</span>(
                            <span className="text-pink-400">AVG</span>(o.growth), 2){' '}
                            <span className="text-pink-400">AS</span> mom{'\n'}
                            <span className="text-pink-400">FROM</span> orders o{'\n'}
                            <span className="text-pink-400">JOIN</span> products p{' '}
                            <span className="text-pink-400">ON</span> p.id = o.product_id{'\n'}
                            <span className="text-pink-400">WHERE</span> o.created_at &gt;={' '}
                            <span className="text-emerald-300">'2026-Q1'</span>
                            {'\n'}
                            <span className="text-pink-400">GROUP BY</span> p.name{'\n'}
                            <span className="text-pink-400">ORDER BY</span> revenue{' '}
                            <span className="text-pink-400">DESC</span>
                            {'\n'}
                            <span className="text-pink-400">LIMIT</span> 5;
                          </code>
                        </pre>

                        <div className="mt-4 rounded-xl border border-[var(--landing-line)] bg-[var(--landing-code)] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-[var(--landing-soft)]">
                              Revenue - Q1 2026
                            </span>
                            <div className="flex gap-1.5">
                              <span className="landing-chip py-0.5 text-[10px]">
                                <BarChart3 className="h-3 w-3" />
                                Bar
                              </span>
                              <span className="landing-chip py-0.5 text-[10px]">
                                <Download className="h-3 w-3" />
                                CSV
                              </span>
                            </div>
                          </div>
                          <div className="flex h-24 items-end gap-2">
                            {[90, 72, 60, 48, 38].map((height, index) => (
                              <div
                                key={height}
                                className={`flex-1 rounded-t-md ${
                                  index === 2
                                    ? 'bg-gradient-to-t from-cyan-500 to-cyan-300'
                                    : 'bg-gradient-to-t from-violet-600 to-violet-300'
                                }`}
                                style={{ height: `${height}%` }}
                              />
                            ))}
                          </div>
                          <div className="mt-2 grid grid-cols-5 text-center font-mono text-[10px] text-[var(--landing-muted)]">
                            <span>Alpha</span>
                            <span>Beta</span>
                            <span>Gamma</span>
                            <span>Delta</span>
                            <span>Epsilon</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="landing-float-badge -left-4 top-12 hidden md:flex">
                  <Zap className="h-4 w-4 text-amber-300" />
                  1.2s query preview
                </div>
                <div className="landing-float-badge -right-3 bottom-20 hidden md:flex">
                  <Lock className="h-4 w-4 text-emerald-300" />
                  Read-only safe
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--landing-line)] bg-[var(--landing-band)]">
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
            <p className="mb-6 text-center text-xs uppercase tracking-[0.25em] text-[var(--landing-muted)]">
              Works with the databases and files you already use
            </p>
            <div className="landing-mask relative overflow-hidden">
              <div className="landing-marquee-track flex w-max gap-4">
                {sourceMarquee.map((source, index) => (
                  <div key={`${source.name}-${index}`} className="landing-db-pill whitespace-nowrap">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: source.color }}
                    />
                    {source.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="landing-section relative">
          <div className="landing-radial absolute inset-0 opacity-60" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-16 max-w-2xl">
              <div className="landing-chip mb-4">
                <GitBranch className="h-3.5 w-3.5" />
                Workflow
              </div>
              <h2 className="landing-grad-text text-4xl font-extrabold tracking-tight sm:text-5xl">
                From connection to reusable insight.
              </h2>
              <p className="mt-4 text-lg text-[var(--landing-muted)]">
                Three steps. No SQL knowledge required.
              </p>
            </div>

            <div className="relative grid gap-6 lg:grid-cols-3">
              <div className="absolute left-[16%] right-[16%] top-24 hidden h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent lg:block" />
              {workflowSteps.map((step) => (
                <article key={step.title} className="landing-card landing-bento-card relative p-7">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="font-mono text-xs tracking-[0.2em] text-[var(--landing-muted)]">
                      {step.step}
                    </span>
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-xl border ${getAccentClasses(
                        step.accent
                      )}`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--landing-muted)]">{step.text}</p>
                  {step.extra}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="sources" className="landing-section relative bg-[var(--landing-source-bg)]">
          <div className="mx-auto grid max-w-7xl items-start gap-10 px-6 lg:grid-cols-12 lg:px-10">
            <div className="lg:sticky lg:top-28 lg:col-span-4">
              <div className="landing-chip mb-4">
                <Database className="h-3.5 w-3.5" />
                Sources
              </div>
              <h2 className="landing-grad-text text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Honest support matrix.
              </h2>
              <p className="mt-4 leading-relaxed text-[var(--landing-muted)]">
                Straight from the codebase. SQL-style sources and staged files are enabled for
                natural-language querying. MongoDB and Redis are currently for metadata browsing.
              </p>
              <div className="mt-6 flex items-center gap-3 text-xs text-[var(--landing-muted)]">
                <span className="landing-pulse-dot h-3 w-3 rounded-full bg-emerald-400" />
                Live capability check
              </div>
            </div>

            <div className="space-y-5 lg:col-span-8">
              <article className="landing-card p-7">
                <SourceCardContent card={sourceCards[0]} wide />
              </article>

              <div className="grid gap-5 md:grid-cols-2">
                {sourceCards.slice(1).map((card) => (
                  <article key={card.title} className="landing-card p-7">
                    <SourceCardContent card={card} />
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <div className="landing-chip mx-auto mb-4">
                <Layers className="h-3.5 w-3.5" />
                Features
              </div>
              <h2 className="landing-grad-text text-4xl font-extrabold tracking-tight sm:text-5xl">
                Built around the working dashboard.
              </h2>
              <p className="mt-4 text-lg text-[var(--landing-muted)]">
                Everything you need to go from question to dashboard.
              </p>
            </div>

            <div className="grid auto-rows-[minmax(220px,auto)] grid-cols-1 gap-5 md:grid-cols-6">
              <div className="landing-card landing-bento-card p-7 md:col-span-4">
                <div className="flex items-start justify-between">
                  <div>
                    <FeatureIcon icon={ShieldCheck} accent="green" />
                    <h3 className="mb-2 text-xl font-bold">Read-only guardrails</h3>
                    <p className="max-w-md text-sm text-[var(--landing-muted)]">
                      The backend accepts safe read queries and keeps write execution disabled until
                      server-side approvals are complete.
                    </p>
                  </div>
                  <div className="hidden flex-col gap-2 font-mono text-xs md:flex">
                    <GuardrailRow safe label="SELECT" />
                    <GuardrailRow safe label="WITH" />
                    <GuardrailRow label="DROP" />
                    <GuardrailRow label="DELETE" />
                  </div>
                </div>
              </div>

              <div className="landing-card landing-bento-card p-7 md:col-span-2">
                <FeatureIcon icon={KeyRound} accent="violet" />
                <h3 className="mb-2 text-lg font-bold">Per-user sessions</h3>
                <p className="text-sm text-[var(--landing-muted)]">
                  Auth tokens and database-session tokens keep every user attached to their own active source.
                </p>
              </div>

              <div className="landing-card landing-bento-card p-7 md:col-span-2">
                <FeatureIcon icon={BarChart3} accent="cyan" />
                <h3 className="mb-2 text-lg font-bold">Tables and charts</h3>
                <p className="text-sm text-[var(--landing-muted)]">
                  Sortable, searchable tables with CSV/JSON export and chart views powered by Recharts.
                </p>
              </div>

              <div className="landing-card landing-bento-card p-7 md:col-span-4">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <FeatureIcon icon={Star} accent="pink" />
                    <h3 className="mb-2 text-xl font-bold">Favorites and history</h3>
                    <p className="max-w-md text-sm text-[var(--landing-muted)]">
                      Save frequently used queries, revisit chat sessions, and track execution history with stats.
                    </p>
                  </div>
                  <div className="hidden w-56 space-y-2 md:block">
                    <MiniHistory icon={Star} iconClass="text-amber-300" text="Monthly revenue by region" />
                    <MiniHistory icon={History} iconClass="text-[var(--landing-muted)]" text="Active users last 7 days" />
                    <MiniHistory icon={History} iconClass="text-[var(--landing-muted)]" text="Top 5 products Q1" />
                  </div>
                </div>
              </div>

              <div className="landing-card landing-bento-card p-7 md:col-span-3">
                <FeatureIcon icon={FileSpreadsheet} accent="amber" />
                <h3 className="mb-2 text-lg font-bold">CSV and Excel staging</h3>
                <p className="text-sm text-[var(--landing-muted)]">
                  Uploaded files are staged as temporary SQLite sources so they can be queried like tables.
                </p>
              </div>

              <div className="landing-card landing-bento-card p-7 md:col-span-3">
                <FeatureIcon icon={LayoutDashboard} accent="fuchsia" />
                <h3 className="mb-2 text-lg font-bold">Custom dashboards</h3>
                <p className="text-sm text-[var(--landing-muted)]">
                  Build saved dashboards with bar, line, pie, area, and scatter charts using drag-and-drop layout tools.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="team" className="landing-section relative bg-[var(--landing-band)]">
          <div className="landing-radial absolute inset-0 opacity-50" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <div className="landing-chip mx-auto mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                {creatorProfile.sectionLabel}
              </div>
              <h2 className="landing-grad-text text-4xl font-extrabold tracking-tight sm:text-5xl">
                {creatorProfile.headline}
              </h2>
            </div>

            <div className="grid items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="landing-card overflow-hidden p-3 sm:p-4">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-[var(--landing-line)] bg-gradient-to-br from-violet-500/15 via-[var(--landing-card)] to-cyan-500/10">
                    {!profileImageError ? (
                      <img
                        src={creatorProfile.photo}
                        alt={creatorProfile.name}
                        className="h-full w-full object-cover"
                        onError={() => setProfileImageError(true)}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                        <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 shadow-[0_0_45px_-18px_rgba(124,92,255,0.9)]">
                          <UserRound className="h-10 w-10 text-white" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[var(--landing-ink)]">Add your photo</p>
                          <p className="mt-1 text-sm text-[var(--landing-muted)]">
                            Replace
                            {' '}
                            <span className="font-mono">creatorProfile.photo</span>
                            {' '}
                            with your image path.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-[var(--landing-line)] bg-[var(--landing-card)] px-5 py-4">
                    <p className="text-xl font-bold text-[var(--landing-ink)]">{creatorProfile.name}</p>
                    <p className="mt-1 text-sm text-[var(--landing-muted)]">{creatorProfile.role}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="landing-card p-7 sm:p-9">
                  <div className="landing-chip mb-5">
                    <Star className="h-3.5 w-3.5" />
                    {creatorProfile.aboutTitle}
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight text-[var(--landing-ink)] sm:text-4xl">
                    {creatorProfile.aboutHeadline}
                  </h3>
                  <p className="mt-5 text-base leading-7 text-[var(--landing-soft)]">
                    {creatorProfile.aboutText}
                  </p>
                  <p className="mt-4 text-base leading-7 text-[var(--landing-muted)]">
                    {creatorProfile.aboutText2}
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {creatorProfile.highlights.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 rounded-2xl border border-[var(--landing-line)] bg-[var(--landing-card)] px-4 py-3"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span className="text-sm text-[var(--landing-soft)]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section relative overflow-hidden">
          <div className="landing-radial absolute inset-0" />
          <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-10">
            <div className="landing-chip mx-auto mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Ready when you are
            </div>
            <h2 className="landing-grad-text text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Stop writing SQL.
              <br />
              Start asking questions.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--landing-muted)]">
              Connect a source in 60 seconds. Save your first dashboard today.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button onClick={goToAuth} className="landing-btn-primary h-12 rounded-xl px-5">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://github.com/vaibhavburad15/Query-Genie', '_blank')}
                className="landing-btn-ghost h-12 rounded-xl px-5"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-[var(--landing-muted)]">
              {['No credit card required', 'Read-only and safe', 'Self-hostable'].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--landing-line)] bg-[var(--landing-source-bg)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4 lg:px-10">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <img src={logo} alt="" className="h-8 w-8 object-contain" />
              <span className="font-bold tracking-tight">Query Genie</span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--landing-muted)]">
              Natural-language SQL, results, and dashboards built around what your database can actually answer.
            </p>
          </div>

          <FooterColumn
            title="Product"
            links={[
              ['Workflow', '#workflow'],
              ['Sources', '#sources'],
              ['Features', '#features'],
              ['Team', '#team'],
              ['Get started', '/auth'],
            ]}
          />
          <FooterColumn
            title="Resources"
            links={[
              ['Documentation', '#'],
              ['API reference', '#'],
              ['README', '#'],
              ['GitHub', 'https://github.com/vaibhavburad15/Query-Genie'],
            ]}
          />
          <div>
            <h5 className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--landing-muted)]">
              Stay in the loop
            </h5>
            <form className="flex gap-2" onSubmit={(event) => event.preventDefault()}>
              <input
                type="email"
                placeholder="you@company.com"
                className="min-w-0 flex-1 rounded-lg border border-[var(--landing-line-strong)] bg-[var(--landing-card)] px-3 py-2 text-sm placeholder:text-[var(--landing-muted)] focus:border-violet-400 focus:outline-none"
              />
              <Button className="landing-btn-primary rounded-lg px-4 py-2 text-sm">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-3 text-[11px] text-[var(--landing-muted)]">
              Occasional product updates. No spam.
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--landing-line)]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-[var(--landing-muted)] sm:flex-row lg:px-10">
            <span>(c) 2026 Query Genie. All rights reserved.</span>
            <div className="flex gap-5">
              <a className="hover:text-[var(--landing-ink)]" href="#">
                Privacy
              </a>
              <a className="hover:text-[var(--landing-ink)]" href="#">
                Terms
              </a>
              <a className="hover:text-[var(--landing-ink)]" href="#">
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .landing-page {
          --landing-bg: #f6f7fb;
          --landing-band: #ffffff;
          --landing-source-bg: #f9fafc;
          --landing-nav: rgba(255, 255, 255, 0.74);
          --landing-ink: #09090f;
          --landing-soft: #3e4252;
          --landing-muted: #6d7282;
          --landing-line: rgba(15, 23, 42, 0.10);
          --landing-line-strong: rgba(15, 23, 42, 0.18);
          --landing-card: rgba(255, 255, 255, 0.78);
          --landing-card-hover: rgba(255, 255, 255, 0.96);
          --landing-code: rgba(8, 10, 18, 0.94);
          --landing-code-ink: #eef1ff;
        }
        .dark .landing-page {
          --landing-bg: #07070b;
          --landing-band: #0a0a12;
          --landing-source-bg: #08080e;
          --landing-nav: rgba(11, 11, 19, 0.65);
          --landing-ink: #f5f5f7;
          --landing-soft: #d0d0db;
          --landing-muted: #8b8b9e;
          --landing-line: rgba(255, 255, 255, 0.08);
          --landing-line-strong: rgba(255, 255, 255, 0.14);
          --landing-card: rgba(255, 255, 255, 0.04);
          --landing-card-hover: rgba(255, 255, 255, 0.07);
          --landing-code: rgba(0, 0, 0, 0.38);
          --landing-code-ink: #f4f4fb;
        }
        .landing-grad-text {
          background: linear-gradient(135deg, var(--landing-ink) 0%, #8e85ff 50%, #684bff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .dark .landing-grad-text {
          background: linear-gradient(135deg, #ffffff 0%, #b9b3ff 45%, #7c5cff 100%);
          -webkit-background-clip: text;
          background-clip: text;
        }
        .landing-grad-text-2 {
          background: linear-gradient(135deg, #7c5cff 0%, #0891b2 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .dark .landing-grad-text-2 {
          background: linear-gradient(135deg, #a78bff 0%, #2bd4ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
        }
        .landing-grid-bg {
          background-image:
            linear-gradient(var(--landing-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--landing-line) 1px, transparent 1px);
          background-size: 56px 56px;
          background-position: -1px -1px;
        }
        .landing-radial {
          background:
            radial-gradient(60% 60% at 50% 0%, rgba(124, 92, 255, 0.20) 0%, rgba(124, 92, 255, 0) 62%),
            radial-gradient(40% 45% at 82% 22%, rgba(43, 212, 255, 0.12) 0%, rgba(43, 212, 255, 0) 70%);
        }
        .landing-card {
          border: 1px solid var(--landing-line);
          border-radius: 18px;
          background: linear-gradient(180deg, var(--landing-card) 0%, rgba(255, 255, 255, 0.02) 100%);
          backdrop-filter: blur(10px);
          transition: transform .35s cubic-bezier(.2,.7,.2,1), border-color .35s ease, background .35s ease;
        }
        .landing-card:hover {
          transform: translateY(-3px);
          border-color: var(--landing-line-strong);
          background: linear-gradient(180deg, var(--landing-card-hover) 0%, var(--landing-card) 100%);
        }
        .landing-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid var(--landing-line);
          border-radius: 999px;
          background: var(--landing-card);
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          color: var(--landing-muted);
          backdrop-filter: blur(8px);
        }
        .landing-db-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--landing-line);
          border-radius: 12px;
          background: var(--landing-card);
          padding: 10px 16px;
          color: var(--landing-ink);
          font-size: 14px;
          font-weight: 500;
          transition: all .25s ease;
        }
        .landing-db-pill:hover {
          transform: translateY(-2px);
          border-color: #7c5cff;
          background: rgba(124, 92, 255, 0.10);
        }
        .landing-btn-primary {
          background: linear-gradient(135deg, #7c5cff 0%, #5b3cff 100%);
          color: white;
          font-weight: 600;
          box-shadow: 0 10px 30px -10px rgba(124, 92, 255, 0.60);
          transition: all .25s ease;
        }
        .landing-btn-primary:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #876bff 0%, #6548ff 100%);
          box-shadow: 0 14px 40px -10px rgba(124, 92, 255, 0.78);
        }
        .landing-btn-ghost {
          border-color: var(--landing-line-strong);
          background: var(--landing-card);
          color: var(--landing-ink);
          font-weight: 500;
          transition: all .25s ease;
        }
        .landing-btn-ghost:hover {
          background: var(--landing-card-hover);
          color: var(--landing-ink);
          transform: translateY(-2px);
        }
        .landing-code-window {
          border: 1px solid var(--landing-line);
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(16,16,28,0.96) 0%, rgba(9,9,18,0.96) 100%);
          color: #f5f5f7;
          box-shadow: 0 30px 80px -20px rgba(0,0,0,0.45), 0 0 0 1px rgba(124,92,255,0.08) inset;
        }
        .landing-preview-glow {
          background: linear-gradient(135deg, rgba(124, 92, 255, 0.18), rgba(43, 212, 255, 0.08));
          filter: blur(28px);
        }
        .landing-float-badge {
          position: absolute;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--landing-line);
          border-radius: 12px;
          background: var(--landing-card);
          padding: 8px 12px;
          color: var(--landing-ink);
          font-size: 12px;
          backdrop-filter: blur(12px);
        }
        .landing-mask {
          mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
        }
        .landing-marquee-track {
          animation: landing-marquee 35s linear infinite;
        }
        @keyframes landing-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .landing-section {
          padding: 110px 0;
        }
        .landing-code-strip {
          border: 1px solid var(--landing-line);
          border-radius: 10px;
          background: var(--landing-code);
          color: var(--landing-muted);
          padding: 8px 12px;
        }
        .landing-bento-card {
          position: relative;
          overflow: hidden;
        }
        .landing-bento-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(420px 220px at 50% 0%, rgba(124,92,255,0.16), transparent 62%);
          opacity: 0;
          pointer-events: none;
          transition: opacity .3s ease;
        }
        .landing-bento-card:hover::after {
          opacity: 1;
        }
        .landing-pulse-dot {
          animation: landing-pulse-ring 1.8s infinite;
        }
        @keyframes landing-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(61,220,151,0.5); }
          70% { box-shadow: 0 0 0 12px rgba(61,220,151,0); }
          100% { box-shadow: 0 0 0 0 rgba(61,220,151,0); }
        }
        @media (max-width: 768px) {
          .landing-section {
            padding: 70px 0;
          }
        }
      `}</style>
    </div>
  );
};

interface SourceCardContentProps {
  card: (typeof sourceCards)[number];
  wide?: boolean;
}

const SourceCardContent = ({ card, wide = false }: SourceCardContentProps) => (
  <>
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className={`grid h-10 w-10 place-items-center rounded-lg border ${getAccentClasses(card.accent)}`}
        >
          <card.icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold">{card.title}</h3>
          {wide && <p className="mt-0.5 text-xs text-[var(--landing-muted)]">{card.subtitle}</p>}
        </div>
      </div>
      <span className="landing-chip text-[10px]">
        <span className={`h-2 w-2 rounded-full ${card.statusColor}`} />
        {card.status}
      </span>
    </div>
    <div className="flex flex-wrap gap-2">
      {card.sources.map((source) => (
        <span key={source} className="landing-db-pill">
          {sourceIcon(source)}
          {source}
        </span>
      ))}
    </div>
    {!wide && <p className="mt-4 text-xs text-[var(--landing-muted)]">{card.subtitle}</p>}
  </>
);

interface FeatureIconProps {
  icon: ComponentType<{ className?: string }>;
  accent: string;
}

const FeatureIcon = ({ icon: Icon, accent }: FeatureIconProps) => (
  <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl border ${getAccentClasses(accent)}`}>
    <Icon className="h-6 w-6" />
  </div>
);

const GuardrailRow = ({ safe = false, label }: { safe?: boolean; label: string }) => (
  <div className={`flex items-center gap-2 ${safe ? 'text-emerald-300' : 'text-rose-400'}`}>
    {safe ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
    {label}
  </div>
);

const MiniHistory = ({
  icon: Icon,
  iconClass,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
  text: string;
}) => (
  <div className="flex items-center gap-2 rounded-lg border border-[var(--landing-line)] bg-[var(--landing-card)] px-3 py-2 text-xs">
    <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
    <span className="truncate text-[var(--landing-soft)]">{text}</span>
  </div>
);

const FooterColumn = ({ title, links }: { title: string; links: Array<[string, string]> }) => {
  const navigate = useNavigate();

  return (
    <div>
      <h5 className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--landing-muted)]">{title}</h5>
      <ul className="space-y-2 text-sm text-[var(--landing-muted)]">
        {links.map(([label, href]) => (
          <li key={label}>
            <button
              type="button"
              className="transition hover:text-[var(--landing-ink)]"
              onClick={() => {
                if (href === '/auth') {
                  navigate('/auth');
                } else if (href.startsWith('http')) {
                  window.open(href, '_blank');
                } else if (href !== '#') {
                  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Index;
