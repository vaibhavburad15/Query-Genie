import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardList,
  Database,
  Heart,
  LockKeyhole,
  MessageSquareText,
  PanelLeft,
  Search,
  ShieldCheck,
  Table2,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/query-genie-logo.png';

const querySteps = [
  {
    icon: Database,
    title: 'Connect a source',
    text: 'Choose a SQL database, SQLite file, CSV, Excel workbook, or inspect MongoDB and Redis metadata.',
  },
  {
    icon: MessageSquareText,
    title: 'Ask in plain English',
    text: 'Query Genie builds SQL from your schema context and recent conversation history.',
  },
  {
    icon: BarChart3,
    title: 'Review the answer',
    text: 'Inspect SQL, browse sortable results, switch to charts, export data, and save useful queries.',
  },
];

const sourceGroups = [
  {
    label: 'Queryable SQL sources',
    sources: ['MySQL', 'PostgreSQL', 'MariaDB', 'Oracle', 'SQL Server', 'IBM Db2', 'SQLite'],
  },
  {
    label: 'File uploads',
    sources: ['CSV', 'Excel'],
  },
  {
    label: 'Metadata browsing',
    sources: ['MongoDB', 'Redis'],
  },
];

const capabilities = [
  {
    icon: ShieldCheck,
    title: 'Read-only guardrails',
    text: 'The backend accepts safe read queries and keeps write execution disabled until server-side approvals are complete.',
  },
  {
    icon: LockKeyhole,
    title: 'Per-user sessions',
    text: 'Auth tokens and database-session tokens keep every user attached to their own active source.',
  },
  {
    icon: Table2,
    title: 'Tables and charts',
    text: 'Results render as searchable tables with CSV/JSON export and chart views powered by Recharts.',
  },
  {
    icon: Heart,
    title: 'Favorites and history',
    text: 'Save frequently used queries, revisit chat sessions, and track execution history with stats.',
  },
  {
    icon: UploadCloud,
    title: 'CSV and Excel staging',
    text: 'Uploaded files are staged as temporary SQLite sources so they can be queried like tables.',
  },
  {
    icon: PanelLeft,
    title: 'Custom dashboards',
    text: 'Build saved dashboards with bar, line, pie, area, and scatter charts using drag-and-drop layout tools.',
  },
];

const reviewNotes = [
  'FastAPI backend with auth, OTP signup, source connection, chat, favorites, history, exports, and custom dashboards.',
  'React 18, Vite, TypeScript, Tailwind, shadcn/ui, TanStack Query, Recharts, dnd-kit, and html2canvas on the frontend.',
  'Ollama can be used locally first when enabled, with Groq/LangChain available for LLM-backed SQL generation.',
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-left"
            aria-label="Query Genie home"
          >
            <img src={logo} alt="Query Genie" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-lg font-semibold leading-none">Query Genie</p>
              <p className="mt-1 text-xs text-slate-500">AI database assistant</p>
            </div>
          </button>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#workflow" className="hover:text-slate-950">
              Workflow
            </a>
            <a href="#sources" className="hover:text-slate-950">
              Sources
            </a>
            <a href="#features" className="hover:text-slate-950">
              Features
            </a>
            <a href="#review" className="hover:text-slate-950">
              Review
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="rounded-sm text-slate-700 hover:text-slate-950"
            >
              Log in
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              className="rounded-sm bg-slate-950 text-white hover:bg-slate-800"
            >
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
            <div className="flex flex-col justify-center">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Built for conversational SQL analysis
              </div>

              <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] text-slate-950 sm:text-5xl lg:text-6xl">
                Talk to your database and turn answers into dashboards.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Query Genie connects to databases and uploaded spreadsheets, converts natural language into
                schema-aware SQL, then presents results as tables, charts, favorites, history, and custom dashboards.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="rounded-sm bg-blue-700 px-6 text-white hover:bg-blue-800"
                >
                  Start asking questions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    document.getElementById('sources')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="rounded-sm border-slate-300 bg-white px-6 text-slate-800 hover:bg-slate-50"
                >
                  View supported sources
                </Button>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                <div className="border-l-2 border-blue-700 pl-4">
                  <p className="text-sm font-semibold text-slate-950">SQL generation</p>
                  <p className="mt-1 text-sm text-slate-500">Schema-aware prompts and chat context</p>
                </div>
                <div className="border-l-2 border-emerald-600 pl-4">
                  <p className="text-sm font-semibold text-slate-950">Safe execution</p>
                  <p className="mt-1 text-sm text-slate-500">Read-only SQL validation</p>
                </div>
                <div className="border-l-2 border-amber-500 pl-4">
                  <p className="text-sm font-semibold text-slate-950">Reusable insights</p>
                  <p className="mt-1 text-sm text-slate-500">Favorites, history, and dashboards</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-sm border border-slate-300 bg-slate-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2 rounded-sm border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">
                    <Database className="h-3.5 w-3.5 text-emerald-400" />
                    analytics_workspace
                  </div>
                </div>

                <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[220px_1fr]">
                  <aside className="border-b border-slate-800 bg-slate-900/80 p-4 lg:border-b-0 lg:border-r">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                      <PanelLeft className="h-4 w-4 text-blue-300" />
                      Workspace
                    </div>
                    <div className="space-y-2">
                      {['orders', 'customers', 'products', 'payments'].map((table) => (
                        <div
                          key={table}
                          className="flex items-center justify-between rounded-sm border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300"
                        >
                          <span>{table}</span>
                          <Table2 className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="text-xs font-semibold text-amber-200">Read-only mode</p>
                      <p className="mt-1 text-xs leading-5 text-amber-100/80">
                        SELECT, WITH, SHOW, DESCRIBE, EXPLAIN, and PRAGMA style reads are allowed.
                      </p>
                    </div>
                  </aside>

                  <div className="bg-slate-950 p-4 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">Ask Query Genie</p>
                        <p className="text-xs text-slate-400">Chat, SQL, table, and chart in one flow</p>
                      </div>
                      <div className="hidden items-center gap-2 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 sm:flex">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Connected
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="ml-auto max-w-[88%] rounded-sm bg-blue-700 px-4 py-3 text-sm leading-6 text-white">
                        Which customers brought the most revenue this quarter?
                      </div>

                      <div className="max-w-[95%] rounded-sm border border-slate-800 bg-slate-900 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <Bot className="h-4 w-4 text-blue-300" />
                            Generated SQL
                          </div>
                          <span className="rounded-sm bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                            validated
                          </span>
                        </div>

                        <pre className="overflow-x-auto rounded-sm border border-slate-800 bg-slate-950 p-3 text-xs leading-6 text-slate-200">
                          <code>{`SELECT c.customer_name,
       SUM(o.amount) AS revenue
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at >= DATE_TRUNC('quarter', CURRENT_DATE)
GROUP BY c.customer_name
ORDER BY revenue DESC
LIMIT 5;`}</code>
                        </pre>

                        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px]">
                          <div className="overflow-hidden rounded-sm border border-slate-800">
                            <div className="grid grid-cols-[1fr_96px] bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300">
                              <span>customer_name</span>
                              <span className="text-right">revenue</span>
                            </div>
                            {[
                              ['Acme Corp', '$245K'],
                              ['TechVision', '$198K'],
                              ['Global Solutions', '$176K'],
                            ].map(([name, value]) => (
                              <div
                                key={name}
                                className="grid grid-cols-[1fr_96px] border-t border-slate-800 px-3 py-2 text-xs text-slate-300"
                              >
                                <span>{name}</span>
                                <span className="text-right font-medium text-emerald-300">{value}</span>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
                            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-300">
                              <BarChart3 className="h-3.5 w-3.5 text-blue-300" />
                              Chart preview
                            </div>
                            <div className="space-y-2">
                              {[100, 80, 72, 63].map((width, index) => (
                                <div key={width} className="flex items-center gap-2">
                                  <span className="w-4 text-xs text-slate-500">{index + 1}</span>
                                  <div className="h-2 flex-1 bg-slate-800">
                                    <div
                                      className="h-2 bg-amber-400"
                                      style={{ width: `${width}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="border-b border-slate-200 bg-[#f7f8fb] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-semibold uppercase text-blue-700">Workflow</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
                From connection to reusable insight.
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {querySteps.map((step, index) => (
                <article key={step.title} className="rounded-sm border border-slate-200 bg-white p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-slate-950 text-white">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-400">0{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="sources" className="border-b border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-700">Sources</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
                Honest support matrix from the codebase.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                SQL-style sources and staged files are enabled for natural-language querying. MongoDB and Redis
                connections are currently useful for browsing metadata, tables, collections, keys, and schemas.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {sourceGroups.map((group) => (
                <article key={group.label} className="rounded-sm border border-slate-200 bg-[#f7f8fb] p-5">
                  <h3 className="mb-4 text-sm font-semibold text-slate-950">{group.label}</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.sources.map((source) => (
                      <span
                        key={source}
                        className="rounded-sm border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-slate-200 bg-[#f7f8fb] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase text-blue-700">Features</p>
                <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
                  Built around the working dashboard.
                </h2>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/auth')}
                className="w-fit rounded-sm border-slate-300 bg-white"
              >
                Open the app
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((feature) => (
                <article key={feature.title} className="rounded-sm border border-slate-200 bg-white p-6">
                  <feature.icon className="h-6 w-6 text-blue-700" />
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="review" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-semibold uppercase text-amber-700">Project review</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
                What this landing page now reflects.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                The previous page focused on generic marketing claims. This one mirrors the actual routes,
                services, endpoints, and UI components in your project.
              </p>
            </div>

            <div className="rounded-sm border border-slate-200 bg-[#f7f8fb] p-6">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-950">
                <ClipboardList className="h-5 w-5 text-amber-600" />
                Review highlights
              </div>
              <div className="space-y-4">
                {reviewNotes.map((note) => (
                  <div key={note} className="flex gap-3 rounded-sm border border-slate-200 bg-white p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                    <p className="text-sm leading-6 text-slate-700">{note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-sm border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                  <Search className="h-4 w-4" />
                  Practical note
                </div>
                <p className="mt-2 text-sm leading-6 text-blue-900/80">
                  Keep production credentials out of commits and rotate any keys that have ever been shared or
                  checked into a project folder.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-8 text-slate-400 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Query Genie" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-semibold text-white">Query Genie</p>
              <p className="text-xs">Natural-language SQL, results, and dashboards.</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/auth')}
            className="w-fit rounded-sm bg-white text-slate-950 hover:bg-slate-200"
          >
            Launch Query Genie
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Index;
