import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp, UserButton, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Code2,
  Flame,
  ExternalLink,
  Layers3,
  Lightbulb,
  Loader2,
  Menu,
  Network,
  Paperclip,
  PenLine,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  UsersRound,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import {
  getGetDailyPracticeQueryKey,
  getGetDashboardQueryKey,
  getGetLearningPathQueryKey,
  getGetPeersQueryKey,
  getGetTopicsQueryKey,
  useCompleteOnboarding,
  useCompletePractice,
  useGetDailyPractice,
  useGetDashboard,
  useGetLearningPath,
  useGetPeers,
  useGetTopics,
  useSubmitDiagnostic,
} from '@workspace/api-client-react';
import { customFetch, setAuthTokenGetter } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg?v=3`,
  },
  variables: {
    colorPrimary: '#2d716b',
    colorForeground: '#233039',
    colorMutedForeground: '#687579',
    colorDanger: '#bd5f4d',
    colorBackground: '#fffdfa',
    colorInput: '#f3f0e8',
    colorInputForeground: '#233039',
    colorNeutral: '#ddd9cf',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffdfa] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#ddd9cf]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#233039] font-bold',
    headerSubtitle: 'text-[#687579]',
    socialButtonsBlockButtonText: 'text-[#233039] font-semibold',
    formFieldLabel: 'text-[#233039] font-semibold',
    footerActionLink: 'text-[#2d716b] font-semibold',
    footerActionText: 'text-[#687579]',
    dividerText: 'text-[#687579]',
    identityPreviewEditButton: 'text-[#2d716b]',
    formFieldSuccessText: 'text-[#2d716b]',
    alertText: 'text-[#233039]',
    logoBox: 'mb-2',
    logoImage: 'max-h-10',
    socialButtonsBlockButton: 'border-[#ddd9cf] bg-[#fffdfa] hover:bg-[#f3f0e8]',
    formButtonPrimary: 'bg-[#2d716b] text-[#fffdfa] hover:bg-[#233039]',
    formFieldInput: 'bg-[#f3f0e8] border-[#ddd9cf] text-[#233039]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#ddd9cf]',
    alert: 'bg-[#fae8dc] border-[#bd5f4d]',
    otpCodeFieldInput: 'border-[#ddd9cf] bg-[#f3f0e8]',
    formFieldRow: 'mb-4',
    main: 'px-2',
  },
};

const navItems = [
  { href: '/dashboard', label: 'Today', icon: Compass },
  { href: '/path', label: 'Your path', icon: Network },
  { href: '/practice', label: 'Practice', icon: PenLine },
  { href: '/topics', label: 'Topic map', icon: Layers3 },
  { href: '/peers', label: 'Peers', icon: UsersRound },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function AuthLoading() {
  return (
    <div className="grain flex min-h-[100dvh] items-center justify-center bg-background p-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Opening your learning space
      </div>
    </div>
  );
}

function PublicLanding() {
  return (
    <div className="grain min-h-[100dvh] overflow-hidden bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground">
            Sign in
          </Link>
          <Link href="/sign-up" className="focus-ring rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">
            Start learning
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-14 px-6 pb-16 pt-12 md:grid-cols-[1.05fr_.95fr] md:items-center md:px-10 md:pb-24 md:pt-20">
        <section className="animate-rise-in">
          <p className="mb-5 font-mono text-[10px] font-medium uppercase tracking-[.2em] text-primary">A quieter way into AI</p>
          <h1 className="max-w-2xl font-display text-5xl font-bold leading-[.98] tracking-[-.07em] text-foreground md:text-[72px]">
            Learn the whole field.
            <span className="block text-primary">At your pace.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            EduAgent meets you where you are, finds the right starting point, and builds a learning path across everything under AI.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/sign-up" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5">
              Find my starting point <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-xs text-muted-foreground">A short profile + diagnostic</span>
          </div>
          <div className="mt-12 flex flex-wrap gap-2">
            {['Foundations', 'Machine learning', 'Generative AI', 'Agents', 'MLOps'].map((label) => (
              <span key={label} className="rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">{label}</span>
            ))}
          </div>
        </section>
        <section className="relative animate-scale-in delay-1">
          <div className="absolute -right-8 -top-10 h-48 w-48 rounded-full border-[28px] border-accent/30" />
          <div className="relative rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-[var(--shadow-soft)] md:p-8">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.14em]">Your first session</span>
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-12 max-w-sm font-display text-3xl font-bold leading-tight tracking-[-.055em]">A path shaped around your real starting point.</p>
            <div className="mt-10 space-y-3">
              {['Tell us who you are', 'Choose your current edge', 'Try a few questions', 'Get your first route'].map((label, index) => (
                <div key={label} className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 px-4 py-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent font-mono text-[10px] font-bold text-accent-foreground">0{index + 1}</span>
                  <span className="text-sm font-medium">{label}</span>
                  {index === 0 && <Check className="ml-auto h-4 w-4 text-accent" />}
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm leading-6 text-primary-foreground/65">No fixed syllabus. No assumed background. Just the next useful idea.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <AuthLoading />;
  if (!isSignedIn) return <PublicLanding />;
  return <LearnerStatusGate mode="home" />;
}

function OnboardedOnly({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <AuthLoading />;
  if (!isSignedIn) return <Redirect to="/" />;
  return <LearnerStatusGate mode="protected">{children}</LearnerStatusGate>;
}

type LearnerProfileStatus = {
  onboardingComplete: boolean;
  profile: { userName?: string; gender?: string; ageGroup?: string; role?: string; focus?: string; tutorTopic?: string };
};

function useLearnerProfileStatus() {
  const { user } = useUser();
  return useQuery({
    queryKey: ['learner-profile', user?.id],
    enabled: Boolean(user),
    queryFn: () => customFetch<LearnerProfileStatus>('/api/profile'),
  });
}

function LearnerStatusGate({ mode, children }: { mode: 'home' | 'onboarding' | 'protected'; children?: ReactNode }) {
  const profileQuery = useLearnerProfileStatus();
  if (profileQuery.isLoading) return <AuthLoading />;
  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorState label="We could not load your saved learner profile." onRetry={() => profileQuery.refetch()} />;
  }
  const complete = profileQuery.data.onboardingComplete;
  if (mode === 'home') return <Redirect to={complete ? '/dashboard' : '/onboarding'} />;
  if (mode === 'onboarding') return complete ? <Redirect to="/dashboard" /> : <>{children}</>;
  return complete ? <>{children}</> : <Redirect to="/onboarding" />;
}

function SignInPage() {
  return (
    <div className="grain flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="grain flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkApiTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cx('animate-pulse-soft rounded-lg bg-secondary/70', className)} />;
}

function LoadingState({ label = 'Finding your next step' }: { label?: string }) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="grid gap-5 md:grid-cols-3"><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {label}</div>
    </div>
  );
}

function ErrorState({ onRetry, label = 'We could not load this space.' }: { onRetry?: () => void; label?: string }) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center animate-scale-in">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive"><XCircle className="h-5 w-5" /></div>
      <p className="font-semibold">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">Give it another try. Your place in the path is safe.</p>
      {onRetry && <button data-testid="button-retry" onClick={onRetry} className="focus-ring mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"><RefreshCw className="h-4 w-4" /> Try again</button>}
    </div>
  );
}

function Logo() {
  return (
    <Link href="/dashboard" data-testid="link-logo" className="focus-ring flex items-center gap-3 rounded-md">
      <img src={`${basePath}/favicon.svg?v=3`} alt="" aria-hidden="true" className="h-9 w-9" />
      <span className="font-display text-[17px] font-bold tracking-[-.04em]">EduAgent</span>
    </Link>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileQuery = useLearnerProfileStatus();
  const { user } = useUser();
  const displayName = profileQuery.data?.profile.userName || user?.fullName || user?.firstName || 'Learner';
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const pageLabel = navItems.find((item) => item.href === location)?.label ?? 'EduAgent';
  return (
    <div className="grain min-h-[100dvh] bg-background">
      <aside className={cx('fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-300 md:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between px-2"><Logo /><button data-testid="button-close-sidebar" onClick={() => setSidebarOpen(false)} className="focus-ring rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"><X className="h-4 w-4" /></button></div>
        <div className="mt-12 px-2 text-[10px] font-semibold uppercase tracking-[.18em] text-sidebar-foreground/40">Learn</div>
        <nav className="mt-3 space-y-1" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = location === item.href;
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setSidebarOpen(false)} className={cx('focus-ring group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors', active ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground')}><Icon className={cx('h-[17px] w-[17px]', active ? '' : 'opacity-75')} /><span>{item.label}</span>{active && <ChevronRight className="ml-auto h-4 w-4 opacity-60" />}</Link>;
          })}
        </nav>
        <div className="mt-auto">
          <Link href="/tutor" data-testid="link-tutor-card" className="group block rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-foreground"><Sparkles className="h-3.5 w-3.5" /></span><ArrowUpRight className="h-4 w-4 text-sidebar-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
            <p className="mt-4 text-sm font-semibold">Ask your tutor</p><p className="mt-1 text-xs leading-5 text-sidebar-foreground/55">Unstick the idea that is slowing you down.</p>
          </Link>
          <div className="mt-5 flex items-center gap-3 border-t border-sidebar-border px-2 pt-5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8e58b] text-xs font-bold text-[#263b3d]">{initials}</div><div className="min-w-0"><p className="truncate text-xs font-semibold">{displayName}</p><p className="text-[11px] text-sidebar-foreground/45">Your learning profile</p></div></div>
        </div>
      </aside>
      {sidebarOpen && <button aria-label="Close navigation" data-testid="button-sidebar-backdrop" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-foreground/25 md:hidden" />}
      <main className="min-h-[100dvh] md:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-10">
          <div className="flex items-center gap-3"><button data-testid="button-open-sidebar" onClick={() => setSidebarOpen(true)} className="focus-ring rounded-lg p-2 text-muted-foreground hover:bg-secondary md:hidden"><Menu className="h-5 w-5" /></button><span className="text-sm font-medium text-muted-foreground md:hidden">{pageLabel}</span><div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Your quiet corner for AI</div></div>
          <div className="flex items-center gap-3"><Link href="/tutor" data-testid="link-header-tutor" className="focus-ring hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:flex"><CircleHelp className="h-4 w-4" /> Need a nudge?</Link><UserButton /></div>
        </header>
        <div className="mx-auto max-w-[1360px] px-5 py-8 pb-24 md:px-10 md:py-10 md:pb-12">{children}</div>
      </main>
      <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl border border-border/80 bg-card/95 p-2 shadow-[0_12px_30px_rgba(31,54,59,.13)] backdrop-blur-md md:hidden">
        {navItems.slice(0, 5).map((item) => { const active = location === item.href; const Icon = item.icon; return <Link key={item.href} href={item.href} data-testid={`link-mobile-${item.label.toLowerCase().replaceAll(' ', '-')}`} className={cx('focus-ring flex flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-medium', active ? 'bg-accent text-foreground' : 'text-muted-foreground')}><Icon className="h-4 w-4" /><span>{item.label === 'Your path' ? 'Path' : item.label}</span></Link>; })}
      </nav>
    </div>
  );
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="animate-rise-in"><p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[.2em] text-primary">{eyebrow}</p><h1 className="font-display max-w-2xl text-3xl font-bold tracking-[-.055em] text-foreground md:text-[42px] md:leading-[1.08]">{title}</h1><p className="mt-3 max-w-xl text-[15px] leading-6 text-muted-foreground">{description}</p></div>{action && <div className="animate-rise-in delay-1">{action}</div>}</div>;
}

function SectionTitle({ eyebrow, title, href, linkLabel = 'See all' }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return <div className="mb-4 flex items-end justify-between gap-4"><div>{eyebrow && <p className="mb-1 font-mono text-[10px] uppercase tracking-[.17em] text-muted-foreground">{eyebrow}</p>}<h2 className="font-display text-lg font-bold tracking-[-.035em]">{title}</h2></div>{href && <Link href={href} data-testid={`link-see-${title.toLowerCase().replaceAll(' ', '-')}`} className="focus-ring flex items-center gap-1 rounded-md text-xs font-semibold text-primary hover:text-foreground">{linkLabel}<ArrowRight className="h-3.5 w-3.5" /></Link>}</div>;
}

function ProgressBar({ value, className = '', color = 'bg-primary' }: { value: number; className?: string; color?: string }) {
  return <div className={cx('h-2 overflow-hidden rounded-full bg-secondary', className)}><div className={cx('h-full rounded-full transition-[width] duration-700 ease-out', color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function HomePage() {
  const dashboardQuery = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const practiceQuery = useGetDailyPractice({ query: { queryKey: getGetDailyPracticeQueryKey() } });
  if (dashboardQuery.isLoading) return <LoadingState />;
  if (dashboardQuery.isError || !dashboardQuery.data) return <ErrorState onRetry={() => dashboardQuery.refetch()} />;
  const d = dashboardQuery.data;
  const practice = practiceQuery.data;
  const activity = d.weeklyActivity ?? [];
  const maxMinutes = Math.max(...activity.map((day) => day.minutes), 1);
  return <div>
    <div className="mb-9 flex flex-col justify-between gap-6 md:flex-row md:items-start">
      <div className="animate-rise-in"><p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-primary">{d.greeting || 'Good to see you'}</p><h1 data-testid="text-dashboard-greeting" className="font-display text-4xl font-bold tracking-[-.06em] md:text-[52px] md:leading-[1]">Keep the thread,<br /><span className="text-primary">{d.learnerName}.</span></h1><p className="mt-4 max-w-md text-[15px] leading-6 text-muted-foreground">A little progress today keeps the bigger picture moving.</p></div>
      <div className="animate-rise-in delay-1 flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-[var(--shadow-soft)]"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fae4bf] text-[#a35d28]"><Flame className="h-5 w-5" /></div><div><p data-testid="text-streak-days" className="font-display text-lg font-bold">{d.streakDays} day{d.streakDays === 1 ? '' : 's'}</p><p className="text-xs text-muted-foreground">learning streak</p></div></div>
    </div>
    <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
      <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-[var(--shadow-soft)] md:p-8 animate-rise-in delay-1">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border-[32px] border-accent/20" /><div className="absolute bottom-[-80px] right-[110px] h-48 w-48 rounded-full border-[20px] border-primary-foreground/10" />
        <div className="relative"><div className="flex items-center justify-between"><span className="rounded-full bg-primary-foreground/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.14em]">In progress</span><span className="font-mono text-xs text-primary-foreground/60">{d.progressPercent}% overall</span></div><h2 data-testid="text-current-topic" className="mt-10 max-w-lg font-display text-3xl font-bold tracking-[-.055em] md:text-[39px] md:leading-[1.08]">{d.currentTopicLabel || d.currentTopic}</h2><p className="mt-3 max-w-md text-sm leading-6 text-primary-foreground/70">You have enough context now to make this idea click. Stay with it for one more focused session.</p><div className="mt-8 flex items-center gap-4"><ProgressBar value={d.progressPercent} className="max-w-[260px] flex-1 bg-primary-foreground/15" color="bg-accent" /><span className="font-mono text-xs text-primary-foreground/70">{d.completedTopics}/{d.totalTopics} topics</span></div><Link href="/path" data-testid="link-continue-path" className="focus-ring mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5">Continue your path <ArrowRight className="h-4 w-4" /></Link></div>
      </section>
      <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)] md:p-7 animate-rise-in delay-2"><SectionTitle eyebrow="Today" title="Your next move" /><div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Zap className="h-6 w-6" /></div><p data-testid="text-next-action" className="mt-5 font-display text-2xl font-bold leading-tight tracking-[-.045em]">{d.nextAction}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">A small, specific action beats a perfect plan.</p><Link href="/practice" data-testid="link-start-practice" className="focus-ring mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-foreground">Start a practice <ArrowRight className="h-4 w-4" /></Link>{practice && <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{practice.minutes} min</span> · {practice.difficulty} · {practice.topic}</p>}</section>
    </div>
    <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)] md:p-7 animate-rise-in delay-2"><SectionTitle eyebrow="This week" title="Your learning rhythm" /><div className="mt-7 flex h-36 items-end justify-between gap-2">{activity.map((day, index) => <div key={`${day.day}-${index}`} className="flex flex-1 flex-col items-center gap-2"><div className="flex h-28 w-full items-end justify-center"><div data-testid={`bar-activity-${index}`} className={cx('w-full max-w-[34px] rounded-t-md transition-[height] duration-700', day.isToday ? 'bg-accent' : 'bg-secondary')} style={{ height: `${Math.max(8, (day.minutes / maxMinutes) * 100)}%` }} title={`${day.minutes} minutes`} /></div><span className={cx('font-mono text-[10px]', day.isToday ? 'font-bold text-foreground' : 'text-muted-foreground')}>{day.day.slice(0, 3)}</span></div>)}</div><div className="mt-5 flex items-center gap-5 border-t border-border pt-4"><div><p data-testid="text-weekly-minutes" className="font-display text-2xl font-bold">{d.weeklyMinutes}</p><p className="text-xs text-muted-foreground">minutes this week</p></div><div className="h-8 w-px bg-border" /><p className="text-xs leading-5 text-muted-foreground">Consistency is a feature.<br />Keep showing up.</p></div></section>
      <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)] md:p-7 animate-rise-in delay-3"><SectionTitle eyebrow="Personal signal" title="Focus areas" href="/topics" /><div className="mt-6 space-y-4">{(d.focusAreas ?? []).length ? (d.focusAreas ?? []).slice(0, 4).map((focus, i) => <Link key={focus} href="/topics" data-testid={`link-focus-${i}`} className="focus-ring group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary"><span className={cx('flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold', i % 2 ? 'bg-[#dce9e0] text-primary' : 'bg-[#fae4bf] text-[#a35d28]')}>{String(i + 1).padStart(2, '0')}</span><span className="text-sm font-semibold">{focus}</span><ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>) : <div className="rounded-xl bg-secondary/60 p-5 text-sm text-muted-foreground">Your focus areas will appear as you practice.</div>}</div></section>
    </div>
  </div>;
}

const profileSteps = [
  { label: 'Name', eyebrow: 'Step 1 of 5' },
  { label: 'Gender', eyebrow: 'Step 2 of 5' },
  { label: 'Age group', eyebrow: 'Step 3 of 5' },
  { label: 'Role', eyebrow: 'Step 4 of 5' },
  { label: 'AI starting point', eyebrow: 'Step 5 of 5' },
];

const focusOptions = [
  { value: 'programming', label: 'Programming', detail: 'Python, code, and building blocks', icon: '01' },
  { value: 'fundamentals', label: 'AI fundamentals', detail: 'The big picture and core ideas', icon: '02' },
  { value: 'math', label: 'Math & statistics', detail: 'The language models use to learn', icon: '03' },
  { value: 'machineLearning', label: 'Machine learning', detail: 'Models, data, and prediction', icon: '04' },
  { value: 'deepLearning', label: 'Deep learning', detail: 'Neural networks and representation', icon: '05' },
  { value: 'nlp', label: 'Language & NLP', detail: 'How machines work with language', icon: '06' },
  { value: 'generativeAI', label: 'Generative AI', detail: 'Language models and generated content', icon: '07' },
  { value: 'rag', label: 'RAG & retrieval', detail: 'Grounding models in useful knowledge', icon: '08' },
  { value: 'dataEngineering', label: 'Data engineering', detail: 'Building reliable data pipelines', icon: '09' },
  { value: 'agents', label: 'Agents', detail: 'Systems that reason and take action', icon: '10' },
  { value: 'mlops', label: 'MLOps', detail: 'Putting models to work responsibly', icon: '11' },
];

function OnboardingPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const complete = useCompleteOnboarding();
  const [step, setStep] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedQuiz, setSelectedQuiz] = useState<{ label: string; correct: boolean } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Array<{ prompt: string; options: Array<{ label: string; correct: boolean }> }>>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [result, setResult] = useState<Awaited<ReturnType<typeof complete.mutateAsync>> | null>(null);
  const [profile, setProfile] = useState({
    userName: '',
    gender: '',
    ageGroup: '',
    role: '',
    focus: '',
  });

  const update = (key: keyof typeof profile, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };
  const activeQuestion = questions[quizIndex];
  const isProfileStep = step < profileSteps.length;
  const canContinue = isProfileStep
    ? Object.values(profile).at(step) !== ''
    : selectedQuiz !== null;

  const startDiagnostic = async () => {
    setQuestionLoading(true);
    setQuestionError('');
    try {
      const generated = await customFetch<{ questions: typeof questions }>('/api/onboarding/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: profile.role, ageGroup: profile.ageGroup, focus: profile.focus }),
      });
      if (generated.questions.length < 3) throw new Error('The diagnostic was incomplete.');
      setQuestions(generated.questions);
      setStep(profileSteps.length);
    } catch {
      setQuestionError('We could not create your focus-specific questions. Please try again.');
    } finally {
      setQuestionLoading(false);
    }
  };

  const finishQuizStep = async () => {
    if (!selectedQuiz) return;
    const answers = [...quizAnswers, `${selectedQuiz.correct ? 'correct' : 'miss'}:${selectedQuiz.label}`];
    if (quizIndex < questions.length - 1) {
      setQuizAnswers(answers);
      setQuizIndex((current) => current + 1);
      setSelectedQuiz(null);
      return;
    }
    const response = await complete.mutateAsync({ data: { ...profile, answers } });
    setQuizAnswers(answers);
    setResult(response);
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['learner-profile', user.id] });
    }
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetLearningPathQueryKey() });
  };

  if (result) {
    return (
      <div className="mx-auto flex min-h-[72vh] max-w-2xl items-center justify-center">
        <section className="w-full rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-[var(--shadow-soft)] md:p-12 animate-scale-in">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><CheckCircle2 className="h-6 w-6" /></span>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[.18em] text-primary-foreground/60">Your path is ready</p>
          <h1 className="mt-3 max-w-xl font-display text-4xl font-bold leading-tight tracking-[-.06em] md:text-5xl">Good to meet you, {profile.userName}.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-primary-foreground/75">{result.message}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-primary-foreground/10 p-4"><p className="font-mono text-[10px] uppercase tracking-[.13em] text-primary-foreground/55">Level</p><p className="mt-2 font-display text-xl font-bold capitalize">{result.evaluatedLevel}</p></div>
            <div className="rounded-2xl bg-primary-foreground/10 p-4"><p className="font-mono text-[10px] uppercase tracking-[.13em] text-primary-foreground/55">Focus</p><p className="mt-2 font-display text-xl font-bold">{result.focusLabel}</p></div>
            <div className="rounded-2xl bg-primary-foreground/10 p-4"><p className="font-mono text-[10px] uppercase tracking-[.13em] text-primary-foreground/55">Calibration</p><p className="mt-2 font-display text-xl font-bold">{result.accuracyPercent}%</p></div>
          </div>
          <p className="mt-8 max-w-xl text-sm leading-6 text-primary-foreground/70">{result.pathSummary}</p>
          <button onClick={() => window.location.assign('/dashboard')} className="focus-ring mt-9 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5">See my learning path <ArrowRight className="h-4 w-4" /></button>
        </section>
      </div>
    );
  }

  const renderChoice = (value: string, label: string, detail?: string) => (
    <button key={value} onClick={() => update(step === 1 ? 'gender' : step === 2 ? 'ageGroup' : 'role', value)} className={cx('focus-ring flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5', profile[step === 1 ? 'gender' : step === 2 ? 'ageGroup' : 'role'] === value ? 'border-primary bg-[#edf3e9] shadow-sm' : 'border-border bg-card hover:border-primary/35')}>
      <span><span className="block text-sm font-bold">{label}</span>{detail && <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>}</span>
      {profile[step === 1 ? 'gender' : step === 2 ? 'ageGroup' : 'role'] === value && <Check className="h-4 w-4 text-primary" />}
    </button>
  );

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <div className="mb-9 flex items-center justify-between gap-5">
        <Link href="/dashboard" className="focus-ring flex items-center gap-2 text-sm font-bold text-primary"><X className="h-4 w-4" /> Exit</Link>
        <div className="flex flex-1 items-center justify-end gap-2">
          {Array.from({ length: profileSteps.length + 1 }).map((_, index) => <span key={index} className={cx('h-1.5 rounded-full transition-all', index <= (isProfileStep ? step : profileSteps.length) ? 'w-8 bg-primary' : 'w-3 bg-border')} />)}
        </div>
      </div>
      <div className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)] md:p-10">
        {isProfileStep ? (
          <>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">{profileSteps[step].eyebrow}</p>
            {step === 0 && <><h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight tracking-[-.06em]">What should we call you?</h1><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Your path should feel like it belongs to you.</p><input autoFocus value={profile.userName} onChange={(event) => update('userName', event.target.value)} placeholder="Your first name" className="focus-ring mt-9 w-full rounded-2xl border border-border bg-background px-4 py-4 text-lg outline-none placeholder:text-muted-foreground/60" /> </>}
            {step === 1 && <><h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight tracking-[-.06em]">How do you identify?</h1><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">This helps us make the learning space feel more personal. Choose what feels right.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{[['woman', 'Woman'], ['man', 'Man'], ['nonBinary', 'Non-binary'], ['preferNot', 'Prefer not to say']].map(([value, label]) => renderChoice(value, label))}</div></>}
            {step === 2 && <><h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight tracking-[-.06em]">Which age group are you in?</h1><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">We use this only to tune examples and pacing.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{[['under18', 'Under 18'], ['18-24', '18–24'], ['25-34', '25–34'], ['35-44', '35–44'], ['45-plus', '45+']].map(([value, label]) => renderChoice(value, label))}</div></>}
            {step === 3 && <><h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight tracking-[-.06em]">Who are you learning as?</h1><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">AI has room for every kind of learner.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{[['student', 'Student', 'Building a foundation'], ['engineer', 'Engineer', 'Putting ideas into systems'], ['entrepreneur', 'Entrepreneur', 'Finding useful possibilities'], ['teacher', 'Teacher', 'Making AI understandable'], ['parent', 'Parent or guardian', 'Learning alongside a child'], ['curious', 'Just curious', 'Following a question']].map(([value, label, detail]) => renderChoice(value, label, detail))}</div></>}
            {step === 4 && <><h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight tracking-[-.06em]">Where are you right now in AI?</h1><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Pick the idea that feels closest. We’ll check the details next.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{focusOptions.map((option) => <button key={option.value} onClick={() => update('focus', option.value)} className={cx('focus-ring flex items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5', profile.focus === option.value ? 'border-primary bg-[#edf3e9] shadow-sm' : 'border-border bg-card hover:border-primary/35')}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono text-[10px] font-bold text-primary">{option.icon}</span><span><span className="block text-sm font-bold">{option.label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.detail}</span></span>{profile.focus === option.value && <Check className="ml-auto mt-1 h-4 w-4 shrink-0 text-primary" />}</button>)}</div></>}
          </>
        ) : (
          <>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">Calibration · Question {quizIndex + 1} of {questions.length}</p>
            <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight tracking-[-.06em]">Let’s find your real starting point.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">There are no wrong identities here. These questions simply help us avoid teaching above or below you.</p>
            {activeQuestion ? <><div className="mt-9 rounded-2xl bg-secondary/55 p-5 md:p-6"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Question</p><p className="mt-3 font-display text-2xl font-bold leading-tight tracking-[-.04em]">{activeQuestion.prompt}</p></div>
            <div className="mt-5 space-y-3">{activeQuestion.options.map((option, index) => <button key={option.label} onClick={() => setSelectedQuiz(option)} className={cx('focus-ring flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-sm transition-all hover:-translate-y-0.5', selectedQuiz?.label === option.label ? 'border-primary bg-[#edf3e9] shadow-sm' : 'border-border bg-card hover:border-primary/35')}><span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono text-[10px]', selectedQuiz?.label === option.label ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground')}>{selectedQuiz?.label === option.label ? <Check className="h-3 w-3" /> : String.fromCharCode(65 + index)}</span><span className="pt-1 leading-5">{option.label}</span></button>)}</div></> : <div className="mt-9 text-sm text-muted-foreground">Preparing your questions…</div>}
          </>
        )}
        {questionError && <p role="alert" className="mt-5 text-sm text-destructive">{questionError}</p>}
        <div className="mt-9 flex items-center justify-between border-t border-border pt-6">
          <button disabled={step === 0} onClick={() => { setStep((current) => current - 1); setSelectedQuiz(null); }} className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary disabled:invisible">Back</button>
          <button disabled={!canContinue || complete.isPending || questionLoading} onClick={() => { if (isProfileStep && step === profileSteps.length - 1) { void startDiagnostic(); } else if (isProfileStep) { setStep((current) => current + 1); } else { void finishQuizStep(); } }} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">{complete.isPending || questionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{isProfileStep ? (step === profileSteps.length - 1 ? 'Create my questions' : 'Continue') : quizIndex < questions.length - 1 ? 'Continue' : 'Build my path'} <ArrowRight className="h-4 w-4" /></>}</button>
        </div>
      </div>
    </div>
  );
}

function PathPage() {
  const query = useGetLearningPath({ query: { queryKey: getGetLearningPathQueryKey() } });
  const [selected, setSelected] = useState<string | null>(null);
  if (query.isLoading) return <LoadingState label="Mapping your learning path" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const nodes = [...query.data].sort((a, b) => a.order - b.order);
  const completed = nodes.filter((node) => node.status === 'completed').length;
  const currentIndex = Math.max(nodes.findIndex((node) => node.status === 'current'), 0);
  return <div><PageIntro eyebrow="Adaptive path" title="A route that meets you where you are." description="Not a syllabus. A living sequence of ideas, tuned to what you already know and what will unlock the most next." action={<div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm"><span className="font-display text-2xl font-bold text-primary">{completed}</span><span className="text-xs leading-4 text-muted-foreground">of {nodes.length}<br />steps complete</span></div>} /><div className="relative mx-auto max-w-4xl"><div className="absolute bottom-8 left-[23px] top-8 w-px bg-border md:left-1/2 md:-translate-x-1/2" />{nodes.map((node, i) => { const isSelected = selected === node.id; const isCurrent = node.status === 'current'; const isDone = node.status === 'completed'; const isLocked = node.status === 'locked'; return <div key={node.id} className={cx('relative mb-5 flex animate-rise-in', i % 2 ? 'md:justify-end' : 'md:justify-start')} style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}><div className={cx('w-full pl-14 md:w-[calc(50%+1px)] md:pl-0', i % 2 ? 'md:pl-8' : 'md:pr-8')}><button data-testid={`button-path-node-${node.id}`} onClick={() => setSelected(isSelected ? null : node.id)} className={cx('focus-ring relative w-full rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5', isCurrent ? 'border-primary/50 bg-[#edf3e9] shadow-[0_10px_28px_rgba(47,103,93,.09)]' : 'border-border/70 bg-card hover:border-primary/30', isLocked && 'opacity-65')}><span className={cx('absolute -left-[42px] top-6 z-10 flex h-7 w-7 items-center justify-center rounded-full border-4 border-background text-xs md:left-auto md:right-[-42px]', i % 2 ? 'md:left-[-42px] md:right-auto' : '', isDone ? 'bg-accent text-foreground' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>{isDone ? <Check className="h-3.5 w-3.5" /> : <span>{String(i + 1).padStart(2, '0')}</span>}</span><div className="flex items-start justify-between gap-4"><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground">{node.category}</span>{isCurrent && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-foreground">Now</span>}</div><h2 className="font-display text-xl font-bold tracking-[-.04em]">{node.title}</h2></div><Clock3 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /></div><p className="mt-2 text-sm leading-5 text-muted-foreground">{node.description}</p><div className="mt-5 flex items-center justify-between text-xs"><span className="flex items-center gap-1 text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> {node.durationMinutes} min</span>{node.confidence !== undefined && <span className="font-mono text-primary">{node.confidence}% fit</span>}{isLocked ? <span className="text-muted-foreground">Unlocks later</span> : <span className="flex items-center gap-1 font-semibold text-primary">{isDone ? 'Review' : 'Open'} <ChevronRight className="h-3.5 w-3.5" /></span>}</div>{isSelected && <div className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground animate-scale-in">{isCurrent ? 'This is your active edge. Spend a focused session here, then let practice tell us what to adjust.' : isDone ? 'You have already built this layer. Revisit it when a later concept needs a refresher.' : 'This step is waiting in the sequence. Keep your attention on the current node for now.'}</div>}</button></div></div>; })}</div><div className="mx-auto mt-4 max-w-4xl rounded-2xl border border-dashed border-border bg-secondary/35 p-5 text-center text-sm text-muted-foreground"><Lightbulb className="mx-auto mb-2 h-5 w-5 text-primary" />The path adapts after practice. There is no penalty for taking the scenic route.</div></div>;
}

type LessonContent = {
  conceptId: string;
  title: string;
  objective: string;
  explanation: string;
  keyIdeas: string[];
  workedExample: string;
  practiceQuestion: string;
  checkAnswer: string;
  visualSteps?: string[];
  codeExample?: { language: string; code: string; explanation: string; tryIt: string } | null;
  miniProject?: { title: string; brief: string; steps: string[]; stretchGoal: string };
  recommendedResources?: Array<{ title: string; url: string; kind: string; description: string }>;
};

function PathLesson({ node, onComplete }: { node: { id: string; status: string }; onComplete: () => void }) {
  const queryClient = useQueryClient();
  const lessonQuery = useQuery({
    queryKey: ['lesson', node.id],
    queryFn: () => customFetch<LessonContent>(`/api/learning-path/${encodeURIComponent(node.id)}/lesson`),
  });
  const finishLesson = useMutation({
    mutationFn: () => customFetch(`/api/learning-path/${encodeURIComponent(node.id)}/complete`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetLearningPathQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      onComplete();
    },
  });
  if (lessonQuery.isLoading) return <div className="mt-3 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Preparing your lesson for this level…</div>;
  if (lessonQuery.isError || !lessonQuery.data) return <div className="mt-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm">We could not load this lesson. <button className="ml-2 font-bold text-primary" onClick={() => void lessonQuery.refetch()}>Try again</button></div>;
  const lesson = lessonQuery.data;
  return <section className="mt-3 rounded-2xl border border-primary/20 bg-card p-5 shadow-sm md:p-7">
    <p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Lesson objective</p>
    <p className="mt-2 text-sm font-semibold leading-6">{lesson.objective}</p>
    <div className="mt-5 whitespace-pre-line text-sm leading-7 text-foreground/80">{lesson.explanation}</div>
    {lesson.visualSteps?.length ? <div className="mt-6 rounded-2xl border border-primary/15 bg-gradient-to-br from-[#edf3e9] via-card to-[#e7f0ef] p-5 md:p-6"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h3 className="font-display text-lg font-bold">See the idea</h3></div><p className="mt-1 text-xs text-muted-foreground">Follow the concept from its starting point to its result.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{lesson.visualSteps.map((step, index) => <div key={`${index}-${step}`} className="relative min-h-24 rounded-xl border border-primary/15 bg-card/90 p-4 shadow-sm"><span className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-primary">Step {String(index + 1).padStart(2, '0')}</span><p className="mt-2 text-sm leading-5">{step}</p>{index < (lesson.visualSteps?.length ?? 0) - 1 && <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-accent p-0.5 text-primary xl:block" />}</div>)}</div></div> : null}
    <h3 className="mt-6 font-display text-lg font-bold">Key ideas</h3>
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">{lesson.keyIdeas.map((idea) => <li key={idea}>{idea}</li>)}</ul>
    <div className="mt-6 rounded-xl bg-secondary/60 p-4"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-primary">Worked example</p><p className="mt-2 whitespace-pre-line text-sm leading-6">{lesson.workedExample}</p></div>
    {lesson.codeExample && <div className="mt-5 overflow-hidden rounded-2xl border border-[#21363b]/15"><div className="flex items-center gap-2 bg-[#21363b] px-4 py-3 text-[#f4f0e7]"><Code2 className="h-4 w-4 text-accent" /><span className="text-sm font-bold">Code example</span><span className="ml-auto rounded-full bg-white/10 px-2 py-1 font-mono text-[10px] uppercase">{lesson.codeExample.language}</span></div><pre className="overflow-x-auto bg-[#17282c] p-4 text-xs leading-6 text-[#e4f0e7] md:p-5"><code>{lesson.codeExample.code}</code></pre><div className="bg-secondary/50 p-4"><p className="text-sm leading-6">{lesson.codeExample.explanation}</p><p className="mt-2 text-xs leading-5 text-muted-foreground"><strong>Try this:</strong> {lesson.codeExample.tryIt}</p></div></div>}
    {lesson.miniProject && <div className="mt-5 rounded-2xl border border-accent/60 bg-[#f7f4e9] p-5 md:p-6"><div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /><p className="font-mono text-[10px] uppercase tracking-[.14em] text-primary">Make something</p></div><h3 className="mt-2 font-display text-xl font-bold">{lesson.miniProject.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{lesson.miniProject.brief}</p><ol className="mt-4 space-y-2">{lesson.miniProject.steps.map((step, index) => <li key={`${index}-${step}`} className="flex gap-3 text-sm leading-5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-bold">{index + 1}</span><span className="pt-0.5">{step}</span></li>)}</ol><p className="mt-4 rounded-xl bg-card/80 p-3 text-xs leading-5"><strong>Stretch:</strong> {lesson.miniProject.stretchGoal}</p></div>}
    {lesson.recommendedResources?.length ? <div className="mt-5"><div className="flex items-center gap-2"><Play className="h-4 w-4 text-primary" /><h3 className="font-display text-lg font-bold">Go deeper</h3></div><p className="mt-1 text-xs text-muted-foreground">Selected courses and video resources for this concept.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{lesson.recommendedResources.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="focus-ring group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/45"><div className="flex items-start justify-between gap-3"><span className="font-mono text-[9px] uppercase tracking-[.14em] text-primary">{resource.kind}</span><ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" /></div><p className="mt-2 text-sm font-bold">{resource.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{resource.description}</p></a>)}</div></div> : null}
    <div className="mt-5 border-t border-border pt-5"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Check your understanding</p><p className="mt-2 text-sm font-semibold leading-6">{lesson.practiceQuestion}</p><details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-primary">Show an example answer</summary><p className="mt-2 whitespace-pre-line leading-6 text-muted-foreground">{lesson.checkAnswer}</p></details></div>
    {node.status !== 'completed' ? <button disabled={finishLesson.isPending} onClick={() => finishLesson.mutate()} className="focus-ring mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">{finishLesson.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Mark this lesson complete</button> : <p className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary"><CheckCircle2 className="h-4 w-4" />Saved as complete</p>}
  </section>;
}

function InteractivePathPage() {
  const query = useGetLearningPath({ query: { queryKey: getGetLearningPathQueryKey() } });
  const [selected, setSelected] = useState<string | null>(null);
  if (query.isLoading) return <LoadingState label="Building your personalized curriculum" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const nodes = [...query.data].sort((a, b) => a.order - b.order);
  const completed = nodes.filter((node) => node.status === 'completed').length;
  return <div>
    <PageIntro eyebrow="Your adaptive curriculum" title="A path built from what you know." description="Your assessment, chosen focus, and role shape this sequence. Open a lesson to learn the concept, then mark it complete to save your progress." action={<div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm"><span className="font-display text-2xl font-bold text-primary">{completed}</span><span className="text-xs leading-4 text-muted-foreground">of {nodes.length}<br />lessons complete</span></div>} />
    <div className="mx-auto max-w-4xl space-y-4">{nodes.map((node, index) => {
      const isSelected = selected === node.id;
      const statusLabel = node.status === 'completed' ? 'Completed' : node.status === 'current' ? 'Your next lesson' : 'Up next';
      const fitNote = (node as typeof node & { fitNote?: string }).fitNote;
      return <article key={node.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
        <button data-testid={`button-path-node-${node.id}`} onClick={() => setSelected(isSelected ? null : node.id)} className="focus-ring w-full text-left">
          <div className="flex items-start gap-4"><span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold', node.status === 'completed' ? 'bg-accent text-foreground' : 'bg-secondary text-primary')}>{node.status === 'completed' ? <Check className="h-4 w-4" /> : String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground">{node.category}</span><span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">{statusLabel}</span></div><h2 className="mt-2 font-display text-xl font-bold tracking-[-.04em]">{node.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{node.description}</p>{fitNote && <p className="mt-2 text-xs leading-5 text-primary">Why it fits you: {fitNote}</p>}<div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span><Clock3 className="mr-1 inline h-3.5 w-3.5" />{node.durationMinutes} min</span><span className="font-semibold text-primary">{isSelected ? 'Close lesson' : node.status === 'completed' ? 'Review lesson' : 'Start lesson'} <ChevronRight className="ml-1 inline h-3.5 w-3.5" /></span></div></div></div>
        </button>
        {isSelected && <PathLesson node={node} onComplete={() => setSelected(node.id)} />}
      </article>;
    })}</div>
  </div>;
}

function PracticePage() {
  const query = useGetDailyPractice({ query: { queryKey: getGetDailyPracticeQueryKey() } });
  const complete = useCompletePractice();
  const diagnostic = useSubmitDiagnostic();
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState('');
  const [activityId, setActivityId] = useState('multiple_choice');
  const [scenarioReason, setScenarioReason] = useState('');
  const [orderedSteps, setOrderedSteps] = useState<string[]>([]);
  const [result, setResult] = useState<Awaited<ReturnType<typeof complete.mutateAsync>> | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<Awaited<ReturnType<typeof diagnostic.mutateAsync>> | null>(null);
  const [claimedLevel, setClaimedLevel] = useState('working knowledge');
  useEffect(() => {
    setActivityId('multiple_choice');
    setAnswer('');
    setScenarioReason('');
    setResult(null);
    setDiagnosticResult(null);
  }, [query.data?.id]);
  if (query.isLoading) return <LoadingState label="Preparing today's prompt" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} label="Today's practice is taking a breath." />;
  const prompt = query.data;
  type Activity = { id: string; type: 'explain' | 'scenario' | 'order'; title: string; prompt: string; options?: string[]; steps?: string[] };
  const activities = ((prompt as typeof prompt & { activities?: Activity[] }).activities ?? []);
  const activeActivity = activities.find((activity) => activity.id === activityId);
  const activityPrompt = activeActivity?.prompt ?? prompt.prompt;
  const submitPractice = async () => {
    if (!(activeActivity?.type === 'order' ? orderedSteps.length > 0 : answer)) return;
    const submittedAnswer = activeActivity?.type === 'scenario'
      ? `Choice: ${answer}\nReason: ${scenarioReason}`
      : activeActivity?.type === 'order' ? JSON.stringify(orderedSteps) : answer;
    const response = await complete.mutateAsync({ data: { promptId: prompt.id, answer: submittedAnswer, activityId: activeActivity?.id } });
    setResult(response);
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  };
  const submitDiagnostic = async () => {
    if (!answer) return;
    const response = await diagnostic.mutateAsync({ data: { topic: prompt.topic, answer, claimedLevel } });
    setDiagnosticResult(response);
    queryClient.invalidateQueries({ queryKey: getGetLearningPathQueryKey() });
  };
  const setActivity = (id: string) => {
    const next = activities.find((activity) => activity.id === id);
    setActivityId(id);
    setAnswer('');
    setScenarioReason('');
    setResult(null);
    setDiagnosticResult(null);
    if (next?.type === 'order') setOrderedSteps([...(next.steps ?? [])].reverse());
  };
  const moveStep = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= orderedSteps.length) return;
    const reordered = [...orderedSteps];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setOrderedSteps(reordered);
    setAnswer(JSON.stringify(reordered));
  };
  const answerValue = activeActivity?.type === 'order' ? JSON.stringify(orderedSteps) : answer;
  return <div><PageIntro eyebrow="Daily practice" title="Practice it a few different ways." description="Choose a quick check, explain the idea, solve a scenario, or arrange the steps. Each activity helps you use the same concept differently." action={<span className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2 font-mono text-[11px] text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> {prompt.minutes} min</span>} /><div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><section className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)] md:p-9"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[.13em]">{prompt.topic}</span><span className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground">{prompt.difficulty}</span></div><h2 data-testid="text-practice-title" className="mt-6 max-w-2xl font-display text-2xl font-bold leading-tight tracking-[-.045em] md:text-3xl">{prompt.title}</h2><div className="mt-7 flex flex-wrap gap-2"><button onClick={() => setActivity('multiple_choice')} className={cx('focus-ring rounded-full border px-4 py-2 text-xs font-semibold', activityId === 'multiple_choice' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-secondary')}>Quick check</button>{activities.map((activity) => <button key={activity.id} onClick={() => setActivity(activity.id)} className={cx('focus-ring rounded-full border px-4 py-2 text-xs font-semibold', activityId === activity.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-secondary')}>{activity.title}</button>)}</div><div className="mt-7 rounded-2xl bg-secondary/50 p-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">{activeActivity?.title ?? 'Quick check'}</p><p data-testid="text-practice-prompt" className="mt-2 text-base font-semibold leading-7">{activityPrompt}</p></div>{(!activeActivity || activeActivity.type === 'scenario') && (activeActivity?.options ?? prompt.options).map((option, index) => <button key={option} data-testid={`button-answer-${index}`} onClick={() => setAnswer(option)} className={cx('focus-ring mt-3 flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all', answer === option ? 'border-primary bg-[#edf3e9] shadow-sm' : 'border-border bg-background hover:border-primary/40 hover:bg-secondary/45')}><span className="font-mono text-xs text-primary">{String.fromCharCode(65 + index)}</span><span className="leading-5">{option}</span></button>)}{activeActivity?.type === 'scenario' && <textarea value={scenarioReason} onChange={(event) => setScenarioReason(event.target.value)} rows={3} placeholder="Why would you choose this? Add your reasoning…" className="mt-4 w-full resize-y rounded-xl border border-border bg-background p-4 text-sm leading-6 outline-none focus:border-primary" />}{activeActivity?.type === 'explain' && <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={6} placeholder="Write your explanation. Try to include an example…" className="mt-4 w-full resize-y rounded-xl border border-border bg-background p-4 text-sm leading-6 outline-none focus:border-primary" />}{activeActivity?.type === 'order' && <div className="mt-4 space-y-2">{orderedSteps.map((step, index) => <div key={`${step}-${index}`} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"><span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, '0')}</span><span className="flex-1 text-sm leading-5">{step}</span><button aria-label="Move step up" disabled={index === 0} onClick={() => moveStep(index, -1)} className="rounded-md p-2 hover:bg-secondary disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button aria-label="Move step down" disabled={index === orderedSteps.length - 1} onClick={() => moveStep(index, 1)} className="rounded-md p-2 hover:bg-secondary disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button></div>)}</div>}<div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6"><button data-testid="button-submit-practice" disabled={!answerValue || (activeActivity?.type === 'scenario' && !scenarioReason.trim()) || complete.isPending || !!result} onClick={submitPractice} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45">{complete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Check my answer</button>{answer && !result && !activeActivity && <button data-testid="button-submit-diagnostic" disabled={diagnostic.isPending} onClick={submitDiagnostic} className="focus-ring rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary">{diagnostic.isPending ? 'Reading your answer…' : 'Calibrate my path instead'}</button>}</div>{result && <div className={cx('mt-6 rounded-2xl p-5 animate-scale-in', result.correct ? 'bg-[#e5f0df]' : 'bg-[#fae8dc]')}><div className="flex items-start gap-3">{result.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" /> : <XCircle className="mt-0.5 h-5 w-5 text-[#b15f3e]" />}<div><p className="font-display text-lg font-bold">{result.correct ? 'That landed.' : 'A useful attempt.'} <span className="ml-2 font-mono text-xs font-medium text-muted-foreground">{result.scorePercent}%</span></p><p data-testid="text-practice-feedback" className="mt-2 text-sm leading-6 text-foreground/75">{result.feedback}</p><p className="mt-3 text-xs font-semibold text-primary">Next: {result.nextStep}</p></div></div></div>}{diagnosticResult && <div className="mt-6 rounded-2xl bg-[#e8edf0] p-5"><p className="font-display text-lg font-bold">Your path just got sharper.</p><p className="mt-2 text-sm leading-6 text-foreground/75">{diagnosticResult.message}</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold">{diagnosticResult.evaluatedLevel}</span><span className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold">{diagnosticResult.accuracyPercent}% accuracy</span></div></div>}</section><aside className="space-y-5"><div className="rounded-3xl bg-[#21363b] p-6 text-[#f4f0e7]"><Sparkles className="h-5 w-5 text-accent" /><h3 className="mt-8 font-display text-xl font-bold tracking-[-.04em]">Practice is more than recall.</h3><p className="mt-3 text-sm leading-6 text-[#f4f0e7]/65">Explain, decide, and build a process. Your answer is reviewed for reasoning, not just exact wording.</p></div><div className="rounded-3xl border border-border/70 bg-card p-6"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">How do you feel about this topic?</p><div className="mt-4 space-y-2">{['just starting', 'working knowledge', 'comfortable'].map((level) => <button key={level} data-testid={`button-level-${level.replace(' ', '-')}`} onClick={() => setClaimedLevel(level)} className={cx('focus-ring flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors', claimedLevel === level ? 'border-primary bg-secondary font-semibold' : 'border-border hover:bg-secondary/50')}><span>{level}</span>{claimedLevel === level && <Check className="h-4 w-4 text-primary" />}</button>)}</div></div></aside></div></div>;
}

type TopicConcept = { id: string; title: string; category: string; description: string; durationMinutes: number; status: string };

function TopicConceptList({ trackId, onClose }: { trackId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['topic-concepts', trackId],
    queryFn: () => customFetch<TopicConcept[]>(`/api/topics/${encodeURIComponent(trackId)}/concepts`),
  });
  if (query.isLoading) return <div className="mt-7"><LoadingState label="Opening concepts" /></div>;
  if (query.isError || !query.data) return <div className="mt-7"><ErrorState label="We could not load these concepts." onRetry={() => query.refetch()} /></div>;
  return <section className="mt-8 rounded-3xl border border-border/70 bg-secondary/30 p-5 md:p-7">
    <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">Concept library</p><h2 className="mt-2 font-display text-2xl font-bold">Explore any lesson</h2><p className="mt-2 text-sm text-muted-foreground">Lessons adapt to your saved level. Finishing an extra concept will save it to your learning record.</p></div><button onClick={onClose} className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary">Close</button></div>
    <div className="mt-5 space-y-3">{query.data.map((concept) => <article key={concept.id} className="rounded-2xl border border-border/70 bg-card p-4">
      <button onClick={() => setSelected(selected === concept.id ? null : concept.id)} className="focus-ring flex w-full items-center gap-3 text-left"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-primary">{concept.status === 'completed' ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{concept.title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{concept.description}</span></span><span className="shrink-0 text-xs text-muted-foreground">{concept.durationMinutes} min</span></button>
      {selected === concept.id && <PathLesson node={concept} onComplete={() => { setSelected(concept.id); queryClient.invalidateQueries({ queryKey: ['topic-concepts', trackId] }); queryClient.invalidateQueries({ queryKey: getGetTopicsQueryKey() }); }} />}
    </article>)}</div>
  </section>;
}

function TopicsPage() {
  const query = useGetTopics({ query: { queryKey: getGetTopicsQueryKey() } });
  const [filter, setFilter] = useState('All');
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const categories = useMemo(() => ['All', ...Array.from(new Set((query.data ?? []).map((topic) => topic.category)))], [query.data]);
  if (query.isLoading) return <LoadingState label="Opening the topic map" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const topics = query.data.filter((topic) => filter === 'All' || topic.category === filter);
  const selectedTopic = topics.find((topic) => topic.id === selectedTrack);
  return <div><PageIntro eyebrow="Topic map" title="The field is wide. Your curiosity can be specific." description="Browse every curriculum track. Open a concept to learn it at your level; your completed lessons are saved to your account." /><div className="mb-7 flex gap-2 overflow-x-auto pb-1">{categories.map((category) => <button key={category} data-testid={`button-filter-${category.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setFilter(category)} className={cx('focus-ring shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors', filter === category ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:bg-secondary')}>{category}</button>)}</div>{topics.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{topics.map((topic) => <button type="button" onClick={() => setSelectedTrack(selectedTrack === topic.id ? null : topic.id)} key={topic.id} data-testid={`card-topic-${topic.id}`} className="focus-ring group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 text-left shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:border-primary/35"><div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[60px] opacity-30" style={{ backgroundColor: topic.color || '#dce9e0' }} /><div className="relative"><div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">{topic.category}</span><ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div><h2 className="mt-8 font-display text-2xl font-bold tracking-[-.045em]">{topic.title}</h2><p className="mt-2 min-h-[48px] text-sm leading-6 text-muted-foreground">{topic.description}</p><div className="mt-7 flex items-center gap-3"><ProgressBar value={topic.progressPercent ?? 0} className="flex-1" color="bg-primary" /><span className="font-mono text-[10px] text-muted-foreground">{topic.progressPercent ?? 0}%</span></div><div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>{topic.lessonCount} concepts</span><span className="font-semibold text-primary">{selectedTrack === topic.id ? 'Close concepts' : 'Explore concepts'}</span></div></div></button>)}</div> : <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No topics in this corner yet. Try another filter.</div>}{selectedTopic && <TopicConceptList trackId={selectedTopic.id} onClose={() => setSelectedTrack(null)} />}</div>;
}
function PeersPage() {
  type PeerConversation = { id: string; name: string; isGroup: boolean; members: Array<{ id: string; name: string }>; lastMessage: string; updatedAt: string | null };
  type PeerChatMessage = { id: string; senderId: string; senderName: string; isMine: boolean; body: string; createdAt: string | null };
  const query = useGetPeers({ query: { queryKey: getGetPeersQueryKey() } });
  const queryClient = useQueryClient();
  const [selectedPeers, setSelectedPeers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversations = useQuery({
    queryKey: ['peer-conversations'],
    queryFn: () => customFetch<PeerConversation[]>('/api/peers/conversations'),
    refetchInterval: 5000,
  });
  const chatMessages = useQuery({
    queryKey: ['peer-messages', activeConversationId],
    queryFn: () => customFetch<PeerChatMessage[]>(`/api/peers/conversations/${encodeURIComponent(activeConversationId!)}/messages`),
    enabled: !!activeConversationId,
    refetchInterval: 2500,
  });
  const startConversation = useMutation({
    mutationFn: (input: { memberIds: string[]; name?: string }) => customFetch<{ id: string }>('/api/peers/conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
    }),
    onSuccess: (conversation) => {
      setActiveConversationId(conversation.id);
      setSelectedPeers([]);
      setGroupName('');
      void queryClient.invalidateQueries({ queryKey: ['peer-conversations'] });
    },
  });
  const sendMessage = useMutation({
    mutationFn: (body: string) => customFetch<PeerChatMessage>(`/api/peers/conversations/${encodeURIComponent(activeConversationId!)}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }),
    }),
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({ queryKey: ['peer-messages', activeConversationId] });
      void queryClient.invalidateQueries({ queryKey: ['peer-conversations'] });
    },
  });
  useEffect(() => {
    if (!activeConversationId && conversations.data?.length) setActiveConversationId(conversations.data[0].id);
  }, [activeConversationId, conversations.data]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages.data]);
  if (query.isLoading) return <LoadingState label="Finding your learning neighbors" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const activeConversation = conversations.data?.find((conversation) => conversation.id === activeConversationId);
  const togglePeer = (id: string) => setSelectedPeers((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const send = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const text = draft.trim(); if (text && activeConversationId) sendMessage.mutate(text); };
  return <div><PageIntro eyebrow="Learning together" title="Learn with people on a similar path." description="Find learners working on related topics, start a private conversation, or bring a few people together to clarify a question." /><div className="mb-6 flex items-center gap-2 rounded-xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground"><UsersRound className="h-4 w-4 text-primary" /><span><strong className="text-foreground">{query.data.length} learners</strong> with saved profiles are available to connect.</span></div><div className="grid gap-5 xl:grid-cols-[350px_minmax(0,1fr)]"><aside className="space-y-5"><section className="rounded-2xl border border-border/70 bg-card p-4"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Your conversations</h2>{conversations.isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}</div><div className="mt-3 space-y-2">{(conversations.data ?? []).map((conversation) => <button key={conversation.id} onClick={() => setActiveConversationId(conversation.id)} className={cx('focus-ring w-full rounded-xl p-3 text-left transition-colors', activeConversationId === conversation.id ? 'bg-secondary' : 'hover:bg-secondary/60')}><span className="flex items-center gap-2 text-sm font-bold"><UsersRound className="h-4 w-4 text-primary" />{conversation.name}{conversation.isGroup && <span className="rounded-full bg-accent px-2 py-0.5 text-[9px]">GROUP</span>}</span><span className="mt-1 block truncate pl-6 text-xs text-muted-foreground">{conversation.lastMessage}</span></button>)}{!conversations.isLoading && !conversations.data?.length && <p className="rounded-xl bg-secondary/40 p-3 text-xs leading-5 text-muted-foreground">Your conversations will appear here. Choose a learner below to say hello.</p>}</div></section><section className="rounded-2xl border border-border/70 bg-card p-4"><h2 className="font-display text-lg font-bold">Learners to meet</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Matches are based on saved learning topics and interests.</p>{query.data.length === 0 ? <p className="mt-4 rounded-xl bg-secondary/40 p-4 text-sm leading-6 text-muted-foreground">No other learners have completed a profile yet. Check back when more people join.</p> : <div className="mt-3 max-h-[430px] space-y-2 overflow-y-auto">{query.data.map((peer) => <div key={peer.id} data-testid={`card-peer-${peer.id}`} className="rounded-xl border border-border/60 p-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold" style={{ backgroundColor: peer.accent, color: '#21363b' }}>{peer.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{peer.name}</p><p className="truncate text-xs text-muted-foreground">{peer.focus} · {peer.level}</p></div><span className="font-mono text-[10px] font-bold text-primary">{peer.matchPercent}%</span></div><div className="mt-3 flex items-center justify-between"><button onClick={() => startConversation.mutate({ memberIds: [peer.id] })} disabled={startConversation.isPending} className="focus-ring rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">Message</button><label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={selectedPeers.includes(peer.id)} onChange={() => togglePeer(peer.id)} className="accent-primary" />Add to group</label></div></div>)}</div>}{selectedPeers.length > 0 && <div className="mt-4 space-y-2 border-t border-border pt-4"><p className="text-xs font-semibold">{selectedPeers.length} learner{selectedPeers.length === 1 ? '' : 's'} selected</p><input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name (optional)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary" /><button disabled={selectedPeers.length < 2 || startConversation.isPending} onClick={() => startConversation.mutate({ memberIds: selectedPeers, name: groupName.trim() || undefined })} className="focus-ring w-full rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-45">{startConversation.isPending ? 'Creating…' : selectedPeers.length < 2 ? 'Select one more learner for a group' : 'Start group conversation'}</button></div>}{startConversation.isError && <p className="mt-3 break-words text-xs text-destructive">{startConversation.error instanceof Error ? startConversation.error.message : 'Could not start that conversation.'}</p>}</section></aside><section className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-display text-lg font-bold">{activeConversation?.name ?? 'Peer chat'}</h2><p className="mt-1 text-xs text-muted-foreground">{activeConversation ? `${activeConversation.isGroup ? 'Group' : 'Private'} conversation · ${activeConversation.members.length} learners` : 'Choose a conversation or message a learner'}</p></div><UsersRound className="h-5 w-5 text-primary" /></div>{activeConversationId ? <><div className="flex-1 space-y-3 overflow-y-auto bg-secondary/20 p-4 md:p-6">{chatMessages.isLoading && <LoadingState label="Loading conversation" />}{chatMessages.isError && <button onClick={() => void chatMessages.refetch()} className="text-sm text-primary">Could not load messages. Try again.</button>}{chatMessages.data?.map((message) => <div key={message.id} className={cx('flex', message.isMine ? 'justify-end' : 'justify-start')}><div className={cx('max-w-[85%] rounded-2xl px-4 py-3', message.isMine ? 'bg-primary text-primary-foreground' : 'border border-border bg-card')}><p className={cx('mb-1 text-[10px] font-bold', message.isMine ? 'text-primary-foreground/70' : 'text-primary')}>{message.isMine ? 'You' : message.senderName}</p><p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p><p className={cx('mt-2 text-right font-mono text-[9px]', message.isMine ? 'text-primary-foreground/60' : 'text-muted-foreground')}>{message.createdAt ? new Date(message.createdAt).toLocaleString() : ''}</p></div></div>)}{!chatMessages.isLoading && !chatMessages.data?.length && <p className="py-12 text-center text-sm text-muted-foreground">Start with the question you are working through.</p>}<div ref={messagesEndRef} /></div><form onSubmit={send} className="flex items-end gap-3 border-t border-border p-4"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); const text = draft.trim(); if (text && activeConversationId) sendMessage.mutate(text); } }} rows={2} maxLength={4000} placeholder="Ask a question or share an explanation…" className="min-h-12 flex-1 resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" /><button type="submit" disabled={!draft.trim() || sendMessage.isPending} aria-label="Send message" className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-45">{sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></form>{sendMessage.isError && <p className="px-4 pb-3 text-xs text-destructive">Message could not be sent. Please try again.</p>}</> : <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><UsersRound className="h-6 w-6" /></div><h3 className="mt-4 font-display text-xl font-bold">Questions are easier together.</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Start a private chat with one learner, or select at least two learners to create a group.</p></div>}</section></div></div>;
}

function TutorPage() {
  const profileQuery = useLearnerProfileStatus();
  const { user } = useUser();
  const currentName = profileQuery.data?.profile.userName || user?.fullName || user?.firstName || 'Learner';
  const currentInitials = currentName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [topic, setTopic] = useState('');
  const [savedTopic, setSavedTopic] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [contextError, setContextError] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'tutor'; text: string; topic?: string; route?: string; citations?: Array<{ label: string; relation: string }> }>>([{ role: 'tutor', text: 'Bring me the idea that feels just out of reach. We can make it smaller together.' }]);
  const documents = useQuery({
    queryKey: ['tutor-documents'],
    queryFn: () => customFetch<Array<{ id: string; filename: string; createdAt: string | null }>>('/api/tutor/documents'),
  });
  useEffect(() => {
    const persistedTopic = profileQuery.data?.profile.tutorTopic;
    if (persistedTopic && !savedTopic) {
      setTopic(persistedTopic);
      setSavedTopic(persistedTopic);
    }
  }, [profileQuery.data?.profile.tutorTopic, savedTopic]);
  const saveContext = useMutation({
    mutationFn: (value: string) => customFetch<{ topic: string }>('/api/tutor/context', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: value }),
    }),
    onSuccess: (result) => { setContextError(''); setTopic(result.topic); setSavedTopic(result.topic); },
    onError: () => setContextError('Could not save this topic. Please try again.'),
  });
  const upload = useMutation({
    mutationFn: (file: File) => {
      return customFetch<{ id: string; filename: string }>('/api/tutor/documents', {
        method: 'POST', body: file,
        headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) },
      });
    },
    onSuccess: () => { setUploadError(''); void queryClient.invalidateQueries({ queryKey: ['tutor-documents'] }); },
    onError: (error) => setUploadError(error instanceof Error ? error.message : 'Could not add that file.'),
  });
  const removeDocument = useMutation({
    mutationFn: (id: string) => customFetch(`/api/tutor/documents/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['tutor-documents'] }),
  });
  const prompts = ['Explain attention like I am five', 'When should I use RAG?', 'Help me understand overfitting'];
  const ask = async (value = message) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setMessage('');
    try {
      const response = await customFetch<{ reply: string; topic: string; route: string; citations: Array<{ label: string; relation: string }> }>('/api/tutor/message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, topic: savedTopic || topic || null }),
      });
      setMessages((current) => [...current, { role: 'tutor', text: response.reply, topic: response.topic, route: response.route, citations: response.citations }]);
    } catch { setMessages((current) => [...current, { role: 'tutor', text: 'I missed that connection. Try asking once more, with the specific idea you are holding.' }]); }
  };
  return <div><PageIntro eyebrow="Your tutor" title="A patient second brain for the hard bits." description="Ask in plain language. EduAgent routes concepts through connected curriculum knowledge and searches your files for precise lookups." /><div className="grid gap-6 lg:grid-cols-[1fr_320px]"><section className="flex min-h-[560px] flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[var(--shadow-soft)]"><div className="flex items-center gap-3 border-b border-border p-5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent"><Sparkles className="h-4 w-4" /></div><div><p className="text-sm font-bold">EduAgent tutor</p><p className="text-xs text-muted-foreground">Ask, explore, try again</p></div><span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.1em] text-primary"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Ready</span></div><div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-7">{messages.map((item, i) => <div key={`${item.role}-${i}`} data-testid={`message-${item.role}-${i}`} className={cx('flex max-w-[88%] gap-3 animate-rise-in', item.role === 'user' ? 'ml-auto flex-row-reverse' : '')}><div className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs', item.role === 'tutor' ? 'bg-primary text-primary-foreground' : 'bg-secondary font-bold text-foreground')}>{item.role === 'tutor' ? <BrainCircuit className="h-3.5 w-3.5" /> : currentInitials}</div><div className={cx('rounded-2xl px-4 py-3 text-sm leading-6', item.role === 'tutor' ? 'rounded-tl-sm bg-secondary text-foreground' : 'rounded-tr-sm bg-primary text-primary-foreground')}><p className="whitespace-pre-wrap">{item.text}</p>{item.topic && <p className="mt-2 font-mono text-[10px] uppercase tracking-[.1em] opacity-60">Topic: {item.topic}</p>}{item.route && <p className="mt-2 font-mono text-[10px] uppercase tracking-[.1em] text-primary">Routed to {item.route === 'graph_rag' ? 'GraphRAG · connected concepts' : 'Document RAG · uploaded files'}</p>}{item.citations?.length ? <div className="mt-2 border-t border-border/60 pt-2 text-xs"><span className="font-semibold">Sources: </span>{item.citations.map((citation) => citation.label).filter((label, index, all) => all.indexOf(label) === index).join(' · ')}</div> : null}</div></div>)}</div><div className="border-t border-border bg-background p-4"><div className="mb-3 flex gap-2 overflow-x-auto">{prompts.map((prompt) => <button key={prompt} data-testid={`button-suggested-${prompt.slice(0, 10).replaceAll(' ', '-')}`} onClick={() => { setMessage(prompt); }} className="focus-ring shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">{prompt}</button>)}</div><div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-primary/50"><button title="Attach document" onClick={() => document.getElementById('tutor-file-input')?.click()} className="focus-ring mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-primary"><Paperclip className="h-4 w-4" /></button><input id="tutor-file-input" type="file" accept=".txt,.md,.markdown,.csv,.html,.htm" className="hidden" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) upload.mutate(file); event.currentTarget.value = ''; }} /><textarea data-testid="input-tutor-message" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void ask(); } }} placeholder="What are you trying to understand?" rows={2} className="focus-ring min-h-[52px] flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70" /><button data-testid="button-send-tutor" onClick={() => void ask()} disabled={!message.trim()} className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-40"><Send className="h-4 w-4" /></button></div><p className="mt-2 text-[11px] text-muted-foreground">Enter to send · Shift+Enter for a new line {upload.isPending && '· Reading file…'}</p>{uploadError && <p role="alert" className="mt-2 text-xs text-destructive">{uploadError}</p>}</div></section><aside className="space-y-5"><div className="rounded-3xl bg-primary p-6 text-primary-foreground"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary-foreground/60">Set the context</p><h3 className="mt-4 font-display text-xl font-bold tracking-[-.04em]">What are you working on?</h3><form onSubmit={(event) => { event.preventDefault(); saveContext.mutate(topic.trim()); }} className="mt-5 flex gap-2"><input data-testid="input-tutor-topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. transformers" className="focus-ring min-w-0 flex-1 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-3 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/45" /><button type="submit" disabled={!topic.trim() || saveContext.isPending} className="focus-ring rounded-xl bg-accent px-3 text-xs font-bold text-accent-foreground disabled:opacity-50">{saveContext.isPending ? 'Saving…' : 'Use topic'}</button></form>{savedTopic && <p className="mt-3 text-xs text-primary-foreground/80">Tutor context saved: {savedTopic}</p>}{contextError && <p role="alert" className="mt-2 text-xs text-[#ffe0dc]">{contextError}</p>}</div><div className="rounded-3xl border border-border/70 bg-card p-6"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Your documents</p><p className="mt-1 text-xs text-muted-foreground">Private to your account</p></div><button onClick={() => document.getElementById('tutor-file-input')?.click()} className="focus-ring flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-2 text-xs font-semibold text-primary"><Paperclip className="h-3.5 w-3.5" /> Add file</button></div>{documents.isLoading ? <p className="mt-4 text-xs text-muted-foreground">Loading your files…</p> : documents.data?.length ? <ul className="mt-4 space-y-2">{documents.data.map((file) => <li key={file.id} className="flex items-center gap-2 rounded-xl bg-secondary/60 p-2 text-xs"><span className="min-w-0 flex-1 truncate">{file.filename}</span><button aria-label={`Remove ${file.filename}`} onClick={() => removeDocument.mutate(file.id)} className="focus-ring rounded p-1 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button></li>)}</ul> : <p className="mt-4 text-xs leading-5 text-muted-foreground">Add TXT, Markdown, CSV, or HTML notes, then ask for facts or quotes.</p>}</div><div className="rounded-3xl border border-border/70 bg-card p-6"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">A useful prompt has</p><div className="mt-5 space-y-4">{[['A snag', 'Name the exact part that is fuzzy.'], ['A hunch', 'Tell me what you think might be true.'], ['A goal', 'Say what you want to do with it.']].map(([title, copy], i) => <div key={title} className="flex gap-3"><span className="font-mono text-xs text-primary">0{i + 1}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p></div></div>)}</div></div></aside></div></div>;
}

function OnboardingRoute() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <AuthLoading />;
  if (!isSignedIn) return <Redirect to="/" />;
  return <LearnerStatusGate mode="onboarding">
    <div className="grain min-h-[100dvh] bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 md:px-10">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-secondary px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Your first session</span>
          <UserButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-12 md:px-10"><OnboardingPage /></main>
    </div>
  </LearnerStatusGate>;
}

function DashboardRoute() {
  return <OnboardedOnly><Shell><HomePage /></Shell></OnboardedOnly>;
}

function PathRoute() {
  return <OnboardedOnly><Shell><InteractivePathPage /></Shell></OnboardedOnly>;
}

function PracticeRoute() {
  return <OnboardedOnly><Shell><PracticePage /></Shell></OnboardedOnly>;
}

function TopicsRoute() {
  return <OnboardedOnly><Shell><TopicsPage /></Shell></OnboardedOnly>;
}

function PeersRoute() {
  return <OnboardedOnly><Shell><PeersPage /></Shell></OnboardedOnly>;
}

function TutorRoute() {
  return <OnboardedOnly><Shell><TutorPage /></Shell></OnboardedOnly>;
}

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/onboarding" component={OnboardingRoute} />
        <Route path="/dashboard" component={DashboardRoute} />
        <Route path="/path" component={PathRoute} />
        <Route path="/practice" component={PracticeRoute} />
        <Route path="/topics" component={TopicsRoute} />
        <Route path="/peers" component={PeersRoute} />
        <Route path="/tutor" component={TutorRoute} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ClerkApiTokenBridge />
        <TooltipProvider><WouterRouter base={basePath}><Router /></WouterRouter><Toaster /></TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
