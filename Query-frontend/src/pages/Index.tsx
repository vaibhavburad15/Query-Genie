import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Database, Lock, MessageSquare, Zap, CheckCircle2, BarChart3, Shield, Sparkles, Code2, FileText, Download, Clock, Users, TrendingUp, GitBranch, Star, Play, LayoutDashboard } from 'lucide-react';
import logo from '@/assets/query-genie-logo.png';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated gradient orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header - Premium Glass */}
        <header className="fixed top-0 w-full bg-white/70 backdrop-blur-2xl z-50 border-b border-gray-100/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center">
                  <img src={logo} alt="Query Genie Logo"  />
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent tracking-tight">
                    Query Genie
                  </span>
                  <div className="flex items-center gap-1.5">
                 
                   
                  </div>
                </div>
              </div>
              
              <nav className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
              
              </nav>

              <div className="flex gap-3 items-center">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
                >
                  Login
                </Button>
                <Button
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300"
                  onClick={() => navigate('/auth')}
                >
                  Get Started Free
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section - Next Level */}
        <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <div className="relative z-10">
                {/* Badge */}
                

                <h1 className="text-6xl sm:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.05] tracking-tight">
                  Ask Your Database
                  <span className="block mt-2 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 bg-clip-text text-transparent">
                    Questions in Plain English.
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                  Transform natural language into optimized SQL queries instantly. Get production-ready results with auto-generated visualizations—no SQL knowledge required.
                </p>

                {/* CTA Buttons */}
                <div className="flex gap-4 flex-wrap mb-12">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all duration-300 px-8 py-6 text-lg group"
                    onClick={() => navigate('/auth')}
                  >
                    Start Querying Now
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-8 py-6 text-lg group"
                  >
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Watch Demo
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                  <div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">10K+</div>
                    <div className="text-sm text-gray-600 mt-1">Queries Generated</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">99.9%</div>
                    <div className="text-sm text-gray-600 mt-1">Accuracy Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">&lt;2s</div>
                    <div className="text-sm text-gray-600 mt-1">Avg Response</div>
                  </div>
                </div>

                {/* Tech Stack Badges */}
                <div className="mt-10">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-4">Trusted Technology Stack</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="px-4 py-2 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg flex items-center gap-2 hover:shadow-md transition-shadow">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">MySQL</span>
                    </div>
                   
                  
                  </div>
                </div>
              </div>

              {/* Right - Premium Laptop Mockup */}
              <div className="hidden lg:block relative">
                <div className="relative">
                  {/* Ambient glow */}
                  <div className="absolute -inset-8 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
                  
                  {/* Laptop Container */}
                  <div className="relative">
                    {/* Screen bezel shadow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl transform translate-y-2 blur-2xl opacity-30"></div>
                    
                    {/* Laptop frame */}
                    <div className="relative bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-2xl p-2 shadow-2xl">
                      {/* Screen */}
                      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden">
                        {/* Browser chrome */}
                        <div className="bg-gradient-to-b from-gray-800 to-gray-900 px-4 py-3 flex items-center gap-3 border-b border-gray-700/50">
                          <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                          </div>
                          <div className="flex-1 flex items-center justify-center">
                            <div className="bg-gray-700/50 rounded-md px-4 py-1 flex items-center gap-2 max-w-md w-full">
                              <Lock className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-gray-400 font-mono">app.askyourdatabase.io</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Chat Interface */}
                        <div className="p-6 space-y-5 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-[500px] relative overflow-hidden">
                          {/* Subtle grid pattern */}
                          <div className="absolute inset-0 opacity-5" style={{
                            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                          }}></div>

                          {/* Header */}
                          <div className="relative flex items-center justify-between pb-4 border-b border-gray-700/50">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-semibold text-gray-300">Connected to production_db</span>
                            </div>
                            <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
                              <span className="text-xs font-semibold text-purple-300">AI Active</span>
                            </div>
                          </div>

                          {/* User Query */}
                          <div className="relative flex justify-end animate-slide-in-right">
                            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl rounded-tr-md px-5 py-3 max-w-[85%] shadow-xl shadow-purple-500/30">
                              <p className="text-sm text-white font-medium">Show me the top 5 customers by revenue this quarter</p>
                            </div>
                          </div>

                          {/* AI Processing */}
                          <div className="relative flex justify-start animate-slide-in-left animation-delay-500">
                            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl rounded-tl-md px-5 py-3 shadow-xl">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-200"></div>
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-400"></div>
                                </div>
                                <span className="text-xs text-gray-400">Analyzing query...</span>
                              </div>
                            </div>
                          </div>

                          {/* SQL Response */}
                          <div className="relative flex justify-start animate-slide-in-left animation-delay-1000">
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl rounded-tl-md px-5 py-4 max-w-[95%] shadow-2xl backdrop-blur-sm">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-700/50">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
                                    <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-green-400 uppercase tracking-wide">Query Generated</div>
                                    <div className="text-xs text-gray-500">Executed in 1.2s</div>
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white h-7 px-2">
                                  <Code2 className="w-3 h-3" />
                                </Button>
                              </div>

                              {/* SQL Code Block */}
                              <div className="relative group mb-4">
                                <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative bg-black/50 rounded-lg p-4 border border-gray-700/50">
                                  <pre className="text-xs font-mono leading-relaxed">
                                    <code>
                                      <span className="text-purple-400">SELECT</span>{' '}
                                      <span className="text-blue-300">c.customer_name</span>,{'\n'}
                                      {'       '}<span className="text-yellow-300">SUM</span>
                                      <span className="text-gray-400">(</span>
                                      <span className="text-blue-300">o.amount</span>
                                      <span className="text-gray-400">)</span>{' '}
                                      <span className="text-purple-400">AS</span>{' '}
                                      <span className="text-blue-300">total_revenue</span>{'\n'}
                                      <span className="text-purple-400">FROM</span>{' '}
                                      <span className="text-blue-300">customers</span>{' '}
                                      <span className="text-blue-300">c</span>{'\n'}
                                      <span className="text-purple-400">JOIN</span>{' '}
                                      <span className="text-blue-300">orders</span>{' '}
                                      <span className="text-blue-300">o</span>{' '}
                                      <span className="text-purple-400">ON</span>{' '}
                                      <span className="text-blue-300">c.id</span>{' '}
                                      <span className="text-gray-400">=</span>{' '}
                                      <span className="text-blue-300">o.customer_id</span>{'\n'}
                                      <span className="text-purple-400">WHERE</span>{' '}
                                      <span className="text-blue-300">o.date</span>{' '}
                                      <span className="text-gray-400">&gt;=</span>{' '}
                                      <span className="text-green-300">DATE_TRUNC</span>
                                      <span className="text-gray-400">(</span>
                                      <span className="text-orange-300">'quarter'</span>,{' '}
                                      <span className="text-yellow-300">CURRENT_DATE</span>
                                      <span className="text-gray-400">)</span>{'\n'}
                                      <span className="text-purple-400">GROUP BY</span>{' '}
                                      <span className="text-blue-300">c.customer_name</span>{'\n'}
                                      <span className="text-purple-400">ORDER BY</span>{' '}
                                      <span className="text-blue-300">total_revenue</span>{' '}
                                      <span className="text-purple-400">DESC</span>{'\n'}
                                      <span className="text-purple-400">LIMIT</span>{' '}
                                      <span className="text-orange-300">5</span>;
                                    </code>
                                  </pre>
                                </div>
                              </div>

                              {/* Results Preview */}
                              <div>
                                <div className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2">
                                  <BarChart3 className="w-3 h-3" />
                                  Top 5 Results
                                </div>
                                <div className="space-y-2.5">
                                  {[
                                    { name: 'Acme Corp', amount: 245000, color: 'from-purple-500 to-purple-600' },
                                    { name: 'TechVision Inc', amount: 198000, color: 'from-blue-500 to-blue-600' },
                                    { name: 'Global Solutions', amount: 176000, color: 'from-indigo-500 to-indigo-600' },
                                    { name: 'DataFlow Systems', amount: 154000, color: 'from-cyan-500 to-cyan-600' },
                                    { name: 'CloudFirst Ltd', amount: 142000, color: 'from-teal-500 to-teal-600' }
                                  ].map((item, i) => (
                                    <div key={i} className="group/item hover:bg-gray-700/30 rounded-lg p-2 transition-all duration-300">
                                      <div className="flex items-center gap-3 mb-1.5">
                                        <div className="w-6 h-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded flex items-center justify-center border border-gray-600 group-hover/item:border-purple-500 transition-colors">
                                          <span className="text-xs font-bold text-gray-300">{i + 1}</span>
                                        </div>
                                        <span className="text-xs text-gray-300 font-medium flex-1">{item.name}</span>
                                        <span className="text-xs font-bold text-green-400">${(item.amount / 1000).toFixed(0)}K</span>
                                      </div>
                                      <div className="ml-9 bg-gray-800/50 rounded-full h-2 overflow-hidden border border-gray-700/50">
                                        <div 
                                          className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-700 shadow-lg`}
                                          style={{ 
                                            width: `${(item.amount / 245000) * 100}%`,
                                            boxShadow: `0 0 10px ${i === 0 ? '#a855f7' : '#3b82f6'}`
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Export Options */}
                              <div className="mt-4 pt-4 border-t border-gray-700/50 flex gap-2">
                                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-700/50 h-7 text-xs">
                                  <Download className="w-3 h-3 mr-1" />
                                  Export CSV
                                </Button>
                                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-700/50 h-7 text-xs">
                                  <FileText className="w-3 h-3 mr-1" />
                                  View Full Report
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Input Bar */}
                          <div className="relative pt-4 animate-slide-in-up animation-delay-1500">
                            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl">
                              <MessageSquare className="w-4 h-4 text-gray-500" />
                              <input 
                                type="text" 
                                placeholder="Ask another question..."
                                className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none"
                                disabled
                              />
                              <div className="flex gap-2">
                                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-8 px-4 text-xs shadow-lg shadow-purple-500/30">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Ask AI
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Laptop base */}
                      <div className="h-2 bg-gradient-to-b from-gray-200 to-gray-300 rounded-b-xl"></div>
                    </div>

                    {/* Keyboard shadow */}
                    <div className="h-1 bg-gradient-to-b from-gray-400/50 to-transparent rounded-full mx-8 mt-1"></div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -right-8 top-20 animate-float">
                    <div className="bg-white rounded-2xl p-4 shadow-2xl border border-purple-100 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                          <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">Performance</div>
                          <div className="text-lg font-bold text-gray-900">+127%</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">Query efficiency improved</div>
                    </div>
                  </div>

                  <div className="absolute -left-8 top-1/3 animate-float animation-delay-1000">
                    <div className="bg-white rounded-2xl p-4 shadow-2xl border border-blue-100 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                          <Clock className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">Avg Response</div>
                          <div className="text-lg font-bold text-gray-900">1.8s</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">Lightning fast queries</div>
                    </div>
                  </div>

                  <div className="absolute -right-6 bottom-24 animate-float animation-delay-2000">
                    <div className="bg-white rounded-2xl p-4 shadow-2xl border border-purple-100 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                          <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">Active Users</div>
                          <div className="text-lg font-bold text-gray-900">2.4K</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">Developers using now</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Banner */}
        <section className="py-12 px-4 bg-gradient-to-r from-purple-600 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}></div>
          </div>
          <div className="max-w-7xl mx-auto relative">
            <div className="flex flex-wrap items-center justify-center gap-12 text-white">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">10,000+</div>
                <div className="text-sm text-purple-100">Queries Generated</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">5,000+</div>
                <div className="text-sm text-purple-100">Active Developers</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">99.9%</div>
                <div className="text-sm text-purple-100">Uptime SLA</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">&lt;2s</div>
                <div className="text-sm text-purple-100">Avg Response Time</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Revolutionary Design */}
        <section id="how-it-works" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, gray 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-full mb-6">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-900">Simple 3-Step Process</span>
              </div>
              <h2 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                From connection to visualization in under 60 seconds. Experience the future of database querying.
              </p>
            </div>

            {/* Steps */}
            <div className="relative">
              {/* Connection line */}
              <div className="hidden lg:block absolute left-1/2 top-20 bottom-20 w-0.5 bg-gradient-to-b from-purple-200 via-blue-200 to-purple-200"></div>

              <div className="space-y-32">
                {/* Step 1 */}
                <div className="relative grid lg:grid-cols-2 gap-12 items-center">
                  <div className="lg:text-right space-y-6">
                    <div className="inline-flex items-center gap-3 lg:float-right">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/40 ring-4 ring-purple-100">
                        <Database className="w-8 h-8 text-white" strokeWidth={2.5} />
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center font-bold text-2xl text-purple-700 shadow-lg">
                        01
                      </div>
                    </div>
                    <div className="clear-both"></div>
                    <h3 className="text-3xl font-bold text-gray-900">Connect Your Database</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Securely connect to MySQL, PostgreSQL, MongoDB, or Snowflake with SSL encryption. One-click setup with environment variables or connection strings.
                    </p>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-center gap-3 lg:justify-end">
                        <span>SSL/TLS encryption support</span>
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      </li>
                      <li className="flex items-center gap-3 lg:justify-end">
                        <span>Read-only mode by default</span>
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      </li>
                      <li className="flex items-center gap-3 lg:justify-end">
                        <span>Environment variable support</span>
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      </li>
                    </ul>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-200 to-blue-200 rounded-3xl blur-2xl opacity-30"></div>
                    <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                          <Database className="w-6 h-6 text-purple-600" />
                          <span className="font-semibold text-gray-900">Database Connection</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Database Type</label>
                            <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 font-mono text-sm text-gray-900">
                              MySQL
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Connection String</label>
                            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 font-mono text-xs text-gray-600">
                              mysql://user:****@host:3306/db
                            </div>
                          </div>
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Connected Successfully
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative grid lg:grid-cols-2 gap-12 items-center">
                  <div className="lg:order-2 space-y-6">
                    <div className="inline-flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center font-bold text-2xl text-blue-700 shadow-lg">
                        02
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 ring-4 ring-blue-100">
                        <MessageSquare className="w-8 h-8 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">Ask in Natural Language</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Type your questions as if you're talking to a colleague. Our AI understands context, relationships, and complex aggregations.
                    </p>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>Context-aware query understanding</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>Support for complex joins & aggregations</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>Multi-language support</span>
                      </li>
                    </ul>
                  </div>
                  <div className="lg:order-1 relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded-3xl blur-2xl opacity-30"></div>
                    <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                          <MessageSquare className="w-6 h-6 text-blue-600" />
                          <span className="font-semibold text-gray-900">Ask Your Question</span>
                        </div>
                        <div className="space-y-3">
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                            <p className="text-sm text-gray-700 italic">
                              "Show me the top 10 products by sales in Q4 2025, grouped by category"
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 cursor-pointer hover:bg-gray-200 transition">
                              Revenue analysis
                            </div>
                            <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 cursor-pointer hover:bg-gray-200 transition">
                              User metrics
                            </div>
                            <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 cursor-pointer hover:bg-gray-200 transition">
                              Inventory check
                            </div>
                          </div>
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate SQL Query
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative grid lg:grid-cols-2 gap-12 items-center">
                  <div className="lg:text-right space-y-6">
                    <div className="inline-flex items-center gap-3 lg:float-right">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/40 ring-4 ring-green-100">
                        <BarChart3 className="w-8 h-8 text-white" strokeWidth={2.5} />
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center font-bold text-2xl text-green-700 shadow-lg">
                        03
                      </div>
                    </div>
                    <div className="clear-both"></div>
                    <h3 className="text-3xl font-bold text-gray-900">Get Instant Results</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Receive optimized SQL queries with automatic visualization. Export to CSV, JSON, or integrate with your BI tools.
                    </p>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-center gap-3 lg:justify-end">
                        <span>Auto-generated charts & graphs</span>
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      </li>
                      <li className="flex items-center gap-3 lg:justify-end">
                        <span>Multiple export formats</span>
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      </li>
                      <li className="flex items-center gap-3 lg:justify-end">
                        <span>Query optimization suggestions</span>
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      </li>
                    </ul>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-green-200 to-emerald-200 rounded-3xl blur-2xl opacity-30"></div>
                    <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <BarChart3 className="w-6 h-6 text-green-600" />
                            <span className="font-semibold text-gray-900">Query Results</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="h-8">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {[
                            { label: 'Electronics', value: 95, color: 'purple' },
                            { label: 'Clothing', value: 78, color: 'blue' },
                            { label: 'Home & Garden', value: 62, color: 'green' }
                          ].map((item, i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">{item.label}</span>
                                <span className="font-bold text-gray-900">${item.value}K</span>
                              </div>
                              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 rounded-full transition-all duration-1000 shadow-lg`}
                                  style={{ width: `${item.value}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-sm text-gray-500">Query executed in 1.2s</span>
                          <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-8">
                            View Full Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features - Bento Grid */}
        <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-900">Production-Grade Features</span>
              </div>
              <h2 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                Everything You Need
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Enterprise-ready features designed for modern development teams.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 - Large */}
              <div className="lg:col-span-2 group relative bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-10 overflow-hidden hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] group-hover:scale-105 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Natural Language to SQL</h3>
                  <p className="text-lg text-purple-100 mb-6 leading-relaxed">
                    Advanced AI converts your questions into optimized SQL queries. Supports complex joins, aggregations, and nested queries with 99.9% accuracy.
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium">Context-Aware</span>
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium">Multi-Table Support</span>
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium">Query Optimization</span>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative bg-white rounded-3xl p-8 border border-gray-200 hover:border-purple-300 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Shield className="w-7 h-7 text-purple-600" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise Security</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Bank-level encryption with SSL/TLS. Read-only mode by default. SOC 2 compliant infrastructure.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    SOC 2 Type II Certified
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative bg-white rounded-3xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <BarChart3 className="w-7 h-7 text-blue-600" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Auto Visualization</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Instant charts and graphs. Bar, line, pie, and custom visualizations generated automatically.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                    <Sparkles className="w-4 h-4" />
                    10+ Chart Types
                  </div>
                </div>
              </div>

              {/* Feature 4 - Large */}
              <div className="lg:col-span-2 group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 overflow-hidden hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] group-hover:scale-105 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Code2 className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Query Explanation</h3>
                  <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                    Understand every generated SQL query with plain English explanations. Learn as you query with inline documentation and optimization tips.
                  </p>
                  <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <code className="text-sm text-green-400 font-mono">
                      💡 This query uses an indexed JOIN on customer_id for optimal performance
                    </code>
                  </div>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="group relative bg-white rounded-3xl p-8 border border-gray-200 hover:border-green-300 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Download className="w-7 h-7 text-green-600" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Multi-Format Export</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Export results to CSV, JSON, and Excel.
                  </p>
                  
                </div>
              </div>

              {/* Feature 6 */}
              <div className="group relative bg-white rounded-3xl p-8 border border-gray-200 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Clock className="w-7 h-7 text-orange-600" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Query History</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Full audit logs with timestamps. Rerun previous queries or build on past results instantly.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-orange-600 font-semibold">
                    <Clock className="w-4 h-4" />
                    Unlimited History
                  </div>
                </div>
              </div>

              {/* Feature 7 */}
              <div className="group relative bg-white rounded-3xl p-8 border border-gray-200 hover:border-indigo-300 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Users className="w-7 h-7 text-indigo-600" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Chat Tabs & Favorites</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Oragnize your conversations with pinned chats and tabs.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-indigo-600 font-semibold">
                    
                    
                  </div>
                </div>
              </div>
               <div className="group relative bg-white rounded-3xl p-8 border border-gray-200 hover:border-indigo-300 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Users className="w-7 h-7 text-indigo-600" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Database Switching</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Swith between multiple MySQL database instantly.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-indigo-600 font-semibold">
                    
                    
                  </div>
                </div>
              </div>

              <div className="group relative bg-white rounded-3xl p-8 border border-gray-200 hover:border-indigo-300 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <LayoutDashboard className="w-7 h-7 text-indigo-600" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    View and manage your database insights in one place.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-indigo-600 font-semibold">
                    
                    
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </section>
        

        {/* CTA Section - Premium */}
        <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-700 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent)]"></div>
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10">
            
            <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
              Ready to Transform Your
              <span className="block mt-2">Database Workflow?</span>
            </h2>
            
            <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of developers who've eliminated SQL complexity. Start querying in plain English today—free forever for personal projects.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-white hover:bg-gray-100 text-purple-600 font-bold px-10 py-7 text-lg shadow-2xl hover:shadow-white/20 transition-all duration-300 group"
                onClick={() => navigate('/auth')}
              >
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white hover:bg-gray-100 text-purple-600 font-bold px-10 py-7 text-lg shadow-2xl hover:shadow-white/20 transition-all duration-300 group"
              
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            
          </div>
        </section>

        {/* Footer - Premium */}
        <footer className="bg-gray-950 text-gray-400 py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
              {/* Brand */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative">
                    
                    <div className="w-12 h-12 flex items-center justify-center">
                     <img src={logo} alt="Query Genie Logo"  />
                    </div>
                  </div>
                  <span className="text-xl font-bold text-white">Query Genie</span>
                </div>
                <p className="text-gray-500 leading-relaxed mb-6 max-w-sm">
                  Transform natural language into production-ready SQL queries. Built by developers, for developers.
                </p>
                <div className="flex gap-4">
                 
                  <a href="#" className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded-xl flex items-center justify-center transition-colors">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  </a>
                </div>
              </div>

             
             

              {/* Company */}
              <div>
                <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wider">Company</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
      
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-gray-900 pt-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-500">
                  &copy; 2026 Query Genie Team. All rights reserved.
                </div>
               
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-25px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out forwards;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out forwards;
        }
        .animate-slide-in-up {
          animation: slide-in-up 0.5s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-white\/10 {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .bg-grid-white\/5 {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
        }
      `}</style>
    </div>
  );
};

export default Index;
