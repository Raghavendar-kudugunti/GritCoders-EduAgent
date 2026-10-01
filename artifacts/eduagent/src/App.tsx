import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp, UserButton, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Flame,
  Layers3,
  Lightbulb,
  Loader2,
  Menu,
  Network,
  Paperclip,
  PenLine,
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
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
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
  profile: { userName?: string; gender?: string; ageGroup?: string; role?: string; focus?: string };
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
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-accent text-foreground">
        <span className="absolute -right-2 -top-2 h-6 w-6 rounded-full border-2 border-primary/30" />
        <BrainCircuit className="relative h-5 w-5" strokeWidth={2.3} />
      </span>
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
    <h3 className="mt-6 font-display text-lg font-bold">Key ideas</h3>
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">{lesson.keyIdeas.map((idea) => <li key={idea}>{idea}</li>)}</ul>
    <div className="mt-6 rounded-xl bg-secondary/60 p-4"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-primary">Worked example</p><p className="mt-2 whitespace-pre-line text-sm leading-6">{lesson.workedExample}</p></div>
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
  const [result, setResult] = useState<Awaited<ReturnType<typeof complete.mutateAsync>> | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<Awaited<ReturnType<typeof diagnostic.mutateAsync>> | null>(null);
  const [claimedLevel, setClaimedLevel] = useState('working knowledge');
  if (query.isLoading) return <LoadingState label="Preparing today's prompt" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} label="Today's practice is taking a breath." />;
  const prompt = query.data;
  const submitPractice = async () => {
    if (!answer) return;
    const response = await complete.mutateAsync({ data: { promptId: prompt.id, answer } });
    setResult(response);
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  };
  const submitDiagnostic = async () => {
    if (!answer) return;
    const response = await diagnostic.mutateAsync({ data: { topic: prompt.topic, answer, claimedLevel } });
    setDiagnosticResult(response);
    queryClient.invalidateQueries({ queryKey: getGetLearningPathQueryKey() });
  };
  return <div><PageIntro eyebrow="Daily practice" title="One good question, then stop." description="Practice is where ideas become yours. Choose the answer that feels most honest; this is a signal, not a test." action={<span className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2 font-mono text-[11px] text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> {prompt.minutes} min</span>} /><div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><section className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)] md:p-9"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[.13em]">{prompt.topic}</span><span className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground">{prompt.difficulty}</span></div><p className="mt-10 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Prompt</p><h2 data-testid="text-practice-title" className="mt-3 max-w-2xl font-display text-2xl font-bold leading-tight tracking-[-.045em] md:text-3xl">{prompt.title}</h2><p data-testid="text-practice-prompt" className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{prompt.prompt}</p><div className="mt-8 space-y-3">{prompt.options.map((option, i) => <button key={option} data-testid={`button-answer-${i}`} onClick={() => setAnswer(option)} className={cx('focus-ring flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all', answer === option ? 'border-primary bg-[#edf3e9] text-foreground shadow-sm' : 'border-border bg-background hover:border-primary/40 hover:bg-secondary/45')}><span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]', answer === option ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground')}>{answer === option ? <Check className="h-3 w-3" /> : String.fromCharCode(65 + i)}</span><span className="pt-0.5 leading-5">{option}</span></button>)}</div><div className="mt-8 flex flex-col items-start gap-3 border-t border-border pt-6 sm:flex-row sm:items-center"><button data-testid="button-submit-practice" disabled={!answer || complete.isPending} onClick={submitPractice} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45">{complete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Check my answer</button>{answer && !result && <button data-testid="button-submit-diagnostic" disabled={diagnostic.isPending} onClick={submitDiagnostic} className="focus-ring rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground">{diagnostic.isPending ? 'Reading your answer...' : 'Calibrate my path instead'}</button>}</div>{result && <div className={cx('mt-6 rounded-2xl p-5 animate-scale-in', result.correct ? 'bg-[#e5f0df]' : 'bg-[#fae8dc]')}><div className="flex items-start gap-3">{result.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" /> : <XCircle className="mt-0.5 h-5 w-5 text-[#b15f3e]" />}<div><p className="font-display text-lg font-bold">{result.correct ? 'That landed.' : 'Useful miss.'} <span className="ml-2 font-mono text-xs font-medium text-muted-foreground">{result.scorePercent}%</span></p><p data-testid="text-practice-feedback" className="mt-2 text-sm leading-6 text-foreground/75">{result.feedback}</p><p className="mt-3 text-xs font-semibold text-primary">Next: {result.nextStep}</p></div></div></div>}{diagnosticResult && <div className="mt-6 rounded-2xl bg-[#e8edf0] p-5 animate-scale-in"><p className="font-display text-lg font-bold">Your path just got sharper.</p><p className="mt-2 text-sm leading-6 text-foreground/75">{diagnosticResult.message}</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold">{diagnosticResult.evaluatedLevel}</span><span className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold">{diagnosticResult.accuracyPercent}% accuracy</span></div></div>}</section><aside className="space-y-5"><div className="rounded-3xl bg-[#21363b] p-6 text-[#f4f0e7]"><Sparkles className="h-5 w-5 text-accent" /><h3 className="mt-8 font-display text-xl font-bold tracking-[-.04em]">Aim for a clear reason.</h3><p className="mt-3 text-sm leading-6 text-[#f4f0e7]/65">If you can explain why the other options are less useful, you are learning the shape of the idea.</p></div><div className="rounded-3xl border border-border/70 bg-card p-6"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">How do you feel about this topic?</p><div className="mt-4 space-y-2">{['just starting', 'working knowledge', 'comfortable'].map((level) => <button key={level} data-testid={`button-level-${level.replace(' ', '-')}`} onClick={() => setClaimedLevel(level)} className={cx('focus-ring flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors', claimedLevel === level ? 'border-primary bg-secondary font-semibold' : 'border-border hover:bg-secondary/50')}><span>{level}</span>{claimedLevel === level && <Check className="h-4 w-4 text-primary" />}</button>)}</div></div></aside></div></div>;
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
  const query = useGetPeers({ query: { queryKey: getGetPeersQueryKey() } });
  const [connected, setConnected] = useState<string[]>([]);
  if (query.isLoading) return <LoadingState label="Finding your learning neighbors" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  return <div><PageIntro eyebrow="Learning together" title="You are not the only one following this thread." description="Find people close to your current edge. No feeds, no performance — just the gentle pull of seeing someone else keep going." /><div className="mb-7 flex items-center gap-2 rounded-xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground"><UsersRound className="h-4 w-4 text-primary" /><span><strong className="text-foreground">{query.data.length} learners</strong> are exploring nearby ideas this week.</span></div><div className="grid gap-4 md:grid-cols-2">{query.data.map((peer, i) => { const isConnected = connected.includes(peer.id); return <div key={peer.id} data-testid={`card-peer-${peer.id}`} className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 animate-rise-in" style={{ animationDelay: `${i * 70}ms` }}><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold" style={{ backgroundColor: peer.accent || '#dce9e0', color: '#21363b' }}>{peer.initials}</div><div className="min-w-0"><h2 className="font-display text-lg font-bold tracking-[-.035em]">{peer.name}</h2><p className="mt-0.5 text-xs text-muted-foreground">{peer.role} · {peer.level}</p></div><span className="ml-auto rounded-full bg-[#e5f0df] px-2.5 py-1 font-mono text-[10px] font-bold text-primary">{peer.matchPercent}% fit</span></div><div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.13em] text-muted-foreground">Currently exploring</p><p className="mt-1 text-sm font-semibold">{peer.focus}</p></div><button data-testid={`button-connect-${peer.id}`} onClick={() => setConnected((current) => isConnected ? current.filter((id) => id !== peer.id) : [...current, peer.id])} className={cx('focus-ring rounded-lg px-3 py-2 text-xs font-bold transition-colors', isConnected ? 'border border-primary/25 bg-secondary text-primary' : 'bg-primary text-primary-foreground hover:bg-foreground')}>{isConnected ? 'Connected' : 'Say hello'}</button></div></div>; })}</div></div>;
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
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'tutor'; text: string; topic?: string; route?: string; citations?: Array<{ label: string; relation: string }> }>>([{ role: 'tutor', text: 'Bring me the idea that feels just out of reach. We can make it smaller together.' }]);
  const documents = useQuery({
    queryKey: ['tutor-documents'],
    queryFn: () => customFetch<Array<{ id: string; filename: string; createdAt: string | null }>>('/api/tutor/documents'),
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
  return <div><PageIntro eyebrow="Your tutor" title="A patient second brain for the hard bits." description="Ask in plain language. EduAgent routes concepts through connected curriculum knowledge and searches your files for precise lookups." /><div className="grid gap-6 lg:grid-cols-[1fr_320px]"><section className="flex min-h-[560px] flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[var(--shadow-soft)]"><div className="flex items-center gap-3 border-b border-border p-5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent"><Sparkles className="h-4 w-4" /></div><div><p className="text-sm font-bold">EduAgent tutor</p><p className="text-xs text-muted-foreground">Ask, explore, try again</p></div><span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.1em] text-primary"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Ready</span></div><div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-7">{messages.map((item, i) => <div key={`${item.role}-${i}`} data-testid={`message-${item.role}-${i}`} className={cx('flex max-w-[88%] gap-3 animate-rise-in', item.role === 'user' ? 'ml-auto flex-row-reverse' : '')}><div className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs', item.role === 'tutor' ? 'bg-primary text-primary-foreground' : 'bg-secondary font-bold text-foreground')}>{item.role === 'tutor' ? <BrainCircuit className="h-3.5 w-3.5" /> : currentInitials}</div><div className={cx('rounded-2xl px-4 py-3 text-sm leading-6', item.role === 'tutor' ? 'rounded-tl-sm bg-secondary text-foreground' : 'rounded-tr-sm bg-primary text-primary-foreground')}><p className="whitespace-pre-wrap">{item.text}</p>{item.topic && <p className="mt-2 font-mono text-[10px] uppercase tracking-[.1em] opacity-60">Topic: {item.topic}</p>}{item.route && <p className="mt-2 font-mono text-[10px] uppercase tracking-[.1em] text-primary">Routed to {item.route === 'graph_rag' ? 'GraphRAG · connected concepts' : 'Document RAG · uploaded files'}</p>}{item.citations?.length ? <div className="mt-2 border-t border-border/60 pt-2 text-xs"><span className="font-semibold">Sources: </span>{item.citations.map((citation) => citation.label).filter((label, index, all) => all.indexOf(label) === index).join(' · ')}</div> : null}</div></div>)}</div><div className="border-t border-border bg-background p-4"><div className="mb-3 flex gap-2 overflow-x-auto">{prompts.map((prompt) => <button key={prompt} data-testid={`button-suggested-${prompt.slice(0, 10).replaceAll(' ', '-')}`} onClick={() => { setMessage(prompt); }} className="focus-ring shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">{prompt}</button>)}</div><div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-primary/50"><button title="Attach document" onClick={() => document.getElementById('tutor-file-input')?.click()} className="focus-ring mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-primary"><Paperclip className="h-4 w-4" /></button><input id="tutor-file-input" type="file" accept=".txt,.md,.markdown,.csv,.html,.htm" className="hidden" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) upload.mutate(file); event.currentTarget.value = ''; }} /><textarea data-testid="input-tutor-message" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void ask(); } }} placeholder="What are you trying to understand?" rows={2} className="focus-ring min-h-[52px] flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70" /><button data-testid="button-send-tutor" onClick={() => void ask()} disabled={!message.trim()} className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-40"><Send className="h-4 w-4" /></button></div><p className="mt-2 text-[11px] text-muted-foreground">Enter to send · Shift+Enter for a new line {upload.isPending && '· Reading file…'}</p>{uploadError && <p role="alert" className="mt-2 text-xs text-destructive">{uploadError}</p>}</div></section><aside className="space-y-5"><div className="rounded-3xl bg-primary p-6 text-primary-foreground"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary-foreground/60">Set the context</p><h3 className="mt-4 font-display text-xl font-bold tracking-[-.04em]">What are you working on?</h3><form onSubmit={(event) => { event.preventDefault(); setSavedTopic(topic.trim()); }} className="mt-5 flex gap-2"><input data-testid="input-tutor-topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. transformers" className="focus-ring min-w-0 flex-1 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-3 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/45" /><button type="submit" disabled={!topic.trim()} className="focus-ring rounded-xl bg-accent px-3 text-xs font-bold text-accent-foreground disabled:opacity-50">Use topic</button></form>{savedTopic && <p className="mt-3 text-xs text-primary-foreground/80">Context set to: {savedTopic}</p>}</div><div className="rounded-3xl border border-border/70 bg-card p-6"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Your documents</p><p className="mt-1 text-xs text-muted-foreground">Private to your account</p></div><button onClick={() => document.getElementById('tutor-file-input')?.click()} className="focus-ring flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-2 text-xs font-semibold text-primary"><Paperclip className="h-3.5 w-3.5" /> Add file</button></div>{documents.isLoading ? <p className="mt-4 text-xs text-muted-foreground">Loading your files…</p> : documents.data?.length ? <ul className="mt-4 space-y-2">{documents.data.map((file) => <li key={file.id} className="flex items-center gap-2 rounded-xl bg-secondary/60 p-2 text-xs"><span className="min-w-0 flex-1 truncate">{file.filename}</span><button aria-label={`Remove ${file.filename}`} onClick={() => removeDocument.mutate(file.id)} className="focus-ring rounded p-1 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button></li>)}</ul> : <p className="mt-4 text-xs leading-5 text-muted-foreground">Add TXT, Markdown, CSV, or HTML notes, then ask for facts or quotes.</p>}</div><div className="rounded-3xl border border-border/70 bg-card p-6"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">A useful prompt has</p><div className="mt-5 space-y-4">{[['A snag', 'Name the exact part that is fuzzy.'], ['A hunch', 'Tell me what you think might be true.'], ['A goal', 'Say what you want to do with it.']].map(([title, copy], i) => <div key={title} className="flex gap-3"><span className="font-mono text-xs text-primary">0{i + 1}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p></div></div>)}</div></div></aside></div></div>;
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
