import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { ProfilePopover } from '@/components/ProfilePopover';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

// Types
type HabitKind = "good" | "bad" | "both";

interface Habit {
  id: string;
  title: string;
  kind: HabitKind;
  notes?: string;
  value: number;
  goal?: number; // Goal Setting feature
  completionHistory: Date[]; // For calendar and analytics
}

interface Daily {
  id: string;
  title: string;
  notes?: string;
  done: boolean;
  streak: number;
  completionHistory: Date[]; // For calendar and analytics
  bestStreak: number; // Enhanced streak tracking
}

interface Todo {
  id: string;
  title: string;
  notes?: string;
  done: boolean;
}

interface Reward {
  id: string;
  title: string;
  cost: number;
  notes?: string;
}

interface Player {
  level: number;
  xp: number;
  hp: number;
  gold: number;
}

interface SaveState {
  player: Player;
  habits: Habit[];
  dailies: Daily[];
  todos: Todo[];
  rewards: Reward[];
  lastResetISO?: string;
}

const STORAGE_KEY = "heago-habits-save-v1";

const newId = () => Math.random().toString(36).slice(2, 9);

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const levelXp = (lvl: number) => 100 + (lvl - 1) * 30; // XP needed for next level

const defaultState: SaveState = {
  player: { level: 1, xp: 0, hp: 50, gold: 0 },
  habits: [
    { id: newId(), title: "Drink water", kind: "good", value: 0, goal: 8, completionHistory: [] },
    { id: newId(), title: "Mindless scrolling", kind: "bad", value: 0, completionHistory: [] },
  ],
  dailies: [
    { id: newId(), title: "10 min stretch", done: false, streak: 0, completionHistory: [], bestStreak: 0 },
    { id: newId(), title: "Read 5 pages", done: false, streak: 0, completionHistory: [], bestStreak: 0 },
  ],
  todos: [
    { id: newId(), title: "Plan weekly meals", done: false },
  ],
  rewards: [
    { id: newId(), title: "Episode break", cost: 10 },
    { id: newId(), title: "Chocolate square", cost: 5 },
  ],
  lastResetISO: new Date().toISOString(),
};

function useSaveState() {
  const [state, setState] = useState<SaveState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migrate existing data to ensure completionHistory exists
        return {
          ...parsed,
          habits: (parsed.habits || []).map((h: any) => ({
            ...h,
            completionHistory: h.completionHistory || []
          })),
          dailies: (parsed.dailies || []).map((d: any) => ({
            ...d,
            completionHistory: d.completionHistory || [],
            bestStreak: d.bestStreak || 0
          }))
        };
      }
      return defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Daily auto-reset at local midnight
  useEffect(() => {
    const now = new Date();
    const last = state.lastResetISO ? new Date(state.lastResetISO) : new Date(0);
    if (now.toDateString() !== last.toDateString()) {
      setState((s) => ({
        ...s,
        dailies: s.dailies.map((d) => ({ ...d, done: false })),
        lastResetISO: now.toISOString(),
      }));
    }
  }, [state.lastResetISO]);

  return [state, setState] as const;
}

export default function HabitTracker() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useSaveState();
  const { player } = state;

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Derived
  const xpNeeded = useMemo(() => levelXp(player.level), [player.level]);
  const xpProgress = clamp(player.xp / xpNeeded, 0, 1);

  // Core mutations
  const grantXP = (amount: number) =>
    setState((s) => {
      let { level, xp, hp, gold } = s.player;
      xp += amount;
      while (xp >= levelXp(level)) {
        xp -= levelXp(level);
        level += 1;
        hp = Math.min(50 + level * 5, hp + 10); // small heal on level up
        gold += 5; // level-up bonus
      }
      return { ...s, player: { level, xp, hp, gold } };
    });

  const takeDamage = (amount: number) =>
    setState((s) => ({
      ...s,
      player: { ...s.player, hp: clamp(s.player.hp - amount, 0, 999) },
    }));

  const grantGold = (amount: number) =>
    setState((s) => ({
      ...s,
      player: { ...s.player, gold: s.player.gold + amount },
    }));

  // Habit +/-
  const tapHabit = (h: Habit, dir: "+" | "-") => {
    const delta = dir === "+" ? 1 : -1;
    const xp = dir === "+" ? 10 + Math.max(0, 5 - h.value) : 4; // positive gives more if value low
    const gold = dir === "+" ? 3 + Math.max(0, 3 - h.value) : 0;
    const dmg = dir === "-" ? 6 + Math.max(0, h.value) : 0;

    setState((s) => ({
      ...s,
      habits: s.habits.map((x) =>
        x.id === h.id ? { 
          ...x, 
          value: clamp(x.value + delta, -10, 10),
          completionHistory: dir === "+" ? [...x.completionHistory, new Date()] : x.completionHistory
        } : x
      ),
    }));

    if (dir === "+") {
      grantXP(xp);
      grantGold(gold);
    } else {
      takeDamage(dmg);
    }
  };

  // Daily toggle
  const toggleDaily = (d: Daily) => {
    setState((s) => {
      const next = s.dailies.map((x) =>
        x.id === d.id
          ? { 
              ...x, 
              done: !x.done, 
              streak: x.done ? x.streak : x.streak + 1,
              bestStreak: x.done ? x.bestStreak : Math.max(x.bestStreak, x.streak + 1),
              completionHistory: !x.done ? [...x.completionHistory, new Date()] : x.completionHistory
            }
          : x
      );
      return { ...s, dailies: next };
    });
    if (!d.done) {
      grantXP(15);
      grantGold(5);
    } else {
      // unchecking removes the reward softly
      takeDamage(2);
    }
  };

  // Todo complete
  const toggleTodo = (t: Todo) => {
    setState((s) => ({
      ...s,
      todos: s.todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
    }));
    if (!t.done) {
      grantXP(20);
      grantGold(8);
    } else {
      takeDamage(2);
    }
  };

  // Buy reward
  const buyReward = (r: Reward) => {
    if (player.gold < r.cost) return;
    setState((s) => ({
      ...s,
      player: { ...s.player, gold: s.player.gold - r.cost },
    }));
    // a tiny celebration via XP
    grantXP(5);
  };

  // CRUD helpers
  const addHabit = (title: string, kind: HabitKind, goal?: number) =>
    setState((s) => ({
      ...s,
      habits: [...s.habits, { id: newId(), title, kind, value: 0, goal, completionHistory: [] }],
    }));

  const addDaily = (title: string) =>
    setState((s) => ({
      ...s,
      dailies: [...s.dailies, { id: newId(), title, done: false, streak: 0, completionHistory: [], bestStreak: 0 }],
    }));

  const addTodo = (title: string) =>
    setState((s) => ({
      ...s,
      todos: [...s.todos, { id: newId(), title, done: false }],
    }));

  const addReward = (title: string, cost: number) =>
    setState((s) => ({
      ...s,
      rewards: [...s.rewards, { id: newId(), title, cost }],
    }));

  const remove = (listName: keyof Pick<SaveState, 'habits' | 'dailies' | 'todos' | 'rewards'>, id: string) =>
    setState((s) => ({
      ...s,
      [listName]: s[listName].filter((x) => x.id !== id),
    }));


  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <Header player={player} />
        <StatsBar player={player} xpProgress={xpProgress} xpNeeded={xpNeeded} />

        <div className="grid lg:grid-cols-3 gap-4 mt-6">
          <Card title="Habits">
            <AddHabit onAdd={addHabit} />
            <div className="space-y-2 mt-3">
              {state.habits.map((h) => (
                <HabitRow
                  key={h.id}
                  h={h}
                  onTap={tapHabit}
                  onRemove={() => remove("habits", h.id)}
                />
              ))}
              {state.habits.length === 0 && <Empty text="No habits yet. Add one!" />}
            </div>
          </Card>

          <Card title="Dailies">
            <AddSimple placeholder="Add a daily…" onAdd={addDaily} />
            <div className="space-y-2 mt-3">
              {state.dailies.map((d) => (
                <DailyRow
                  key={d.id}
                  d={d}
                  onToggle={() => toggleDaily(d)}
                  onRemove={() => remove("dailies", d.id)}
                />
              ))}
              {state.dailies.length === 0 && <Empty text="Nothing daily yet. Add one!" />}
            </div>
          </Card>

          <Card title="To‑dos">
            <AddSimple placeholder="Add a to‑do…" onAdd={addTodo} />
            <div className="space-y-2 mt-3">
              {state.todos.map((t) => (
                <TodoRow
                  key={t.id}
                  t={t}
                  onToggle={() => toggleTodo(t)}
                  onRemove={() => remove("todos", t.id)}
                />
              ))}
              {state.todos.length === 0 && <Empty text="To‑do list is empty. Add one!" />}
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <Card title="Rewards Shop">
            <AddReward onAdd={addReward} />
            <div className="space-y-2 mt-3">
              {state.rewards.map((r) => (
                <RewardRow
                  key={r.id}
                  r={r}
                  onBuy={() => buyReward(r)}
                  onRemove={() => remove("rewards", r.id)}
                />
              ))}
              {state.rewards.length === 0 && <Empty text="Add a treat to buy with Gold!" />}
            </div>
          </Card>

          <Card title="Progress Analytics">
            <ProgressAnalytics habits={state.habits} dailies={state.dailies} />
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <Card title="Habit Calendar">
            <HabitCalendar habits={state.habits} dailies={state.dailies} />
          </Card>

          <Card title="Community Support">
            <CommunitySupport />
          </Card>
        </div>

        <Footer />
      </div>
    </div>
  );
}

function Header({ player }: { player: Player }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Link to="/">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">
            Heago Quest
          </h1>
        </Link>
        <p className="text-muted-foreground text-sm">Level up your life with gamified habits</p>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/challenges">
          <Button variant="outline" size="sm" className="text-primary hover:bg-primary/10">
            Challenges
          </Button>
        </Link>
        <ThemeToggle />
        <ProfilePopover player={player} />
      </div>
    </div>
  );
}

function StatsBar({
  player,
  xpProgress,
  xpNeeded,
}: {
  player: Player;
  xpProgress: number;
  xpNeeded: number;
}) {
  return (
    <div className="grid sm:grid-cols-4 gap-3 mt-4">
      <Stat badge="LV" value={player.level} sub="Level" />
      <Bar label={`XP ${Math.floor(player.xp)}/${xpNeeded}`} ratio={xpProgress} />
      <Stat badge="HP" value={player.hp} sub="Health" kind="danger" />
      <Stat badge="✦" value={player.gold} sub="Gold" kind="gold" />
    </div>
  );
}

function Stat({
  badge,
  value,
  sub,
  kind,
}: {
  badge: string;
  value: number;
  sub: string;
  kind?: "danger" | "gold";
}) {
  const color =
    kind === "danger"
      ? "bg-destructive"
      : kind === "gold"
      ? "bg-gradient-to-r from-yellow-400 to-amber-500"
      : "bg-primary";
  
  return (
    <div className="p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} font-bold text-primary-foreground`}
        >
          {badge}
        </span>
        <div>
          <div className="text-xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, ratio }: { label: string; ratio: number }) {
  return (
    <div className="p-4 rounded-2xl bg-card border border-border">
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${Math.floor(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="font-semibold tracking-tight text-card-foreground mb-3">{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground p-2 italic">{text}</div>;
}

function IconBtn({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="px-2.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-sm transition-colors"
    >
      {children}
    </button>
  );
}

function HabitRow({
  h,
  onTap,
  onRemove,
}: {
  h: Habit;
  onTap: (habit: Habit, dir: "+" | "-") => void;
  onRemove: () => void;
}) {
  const color =
    h.kind === "good"
      ? "text-green-400"
      : h.kind === "bad"
      ? "text-red-400"
      : "text-accent";

  const todayCompletions = (h.completionHistory || []).filter(
    date => new Date(date).toDateString() === new Date().toDateString()
  ).length;

  const progressPercentage = h.goal ? Math.min((todayCompletions / h.goal) * 100, 100) : 0;

  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/50 border border-border">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{h.title}</div>
        <div className="text-xs text-muted-foreground">
          {h.kind.toUpperCase()} • value {h.value}
          {h.goal && (
            <span className="ml-2">
              Goal: {todayCompletions}/{h.goal} ({Math.round(progressPercentage)}%)
            </span>
          )}
        </div>
        {h.goal && (
          <div className="w-full h-1 bg-muted rounded-full mt-1">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {(h.kind === "good" || h.kind === "both") && (
          <IconBtn title="Positive" onClick={() => onTap(h, "+")}>
            ＋
          </IconBtn>
        )}
        {(h.kind === "bad" || h.kind === "both") && (
          <IconBtn title="Negative" onClick={() => onTap(h, "-")}>
            −
          </IconBtn>
        )}
        <IconBtn title="Remove" onClick={onRemove}>
          🗑
        </IconBtn>
        <span className={`text-xs ${color}`}>{h.kind}</span>
      </div>
    </div>
  );
}

function DailyRow({
  d,
  onToggle,
  onRemove,
}: {
  d: Daily;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/50 border border-border">
      <label className="flex items-center gap-3 min-w-0 cursor-pointer flex-1">
        <input
          type="checkbox"
          checked={d.done}
          onChange={onToggle}
          className="size-4 accent-primary"
        />
        <div className="min-w-0 flex-1">
          <div
            className={`truncate font-medium ${
              d.done ? "line-through text-muted-foreground" : ""
            }`}
          >
            {d.title}
          </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${
            d.streak >= 7 ? 'bg-orange-500/20 text-orange-500' :
            d.streak >= 3 ? 'bg-yellow-500/20 text-yellow-500' :
            d.streak >= 1 ? 'bg-blue-500/20 text-blue-500' :
            'bg-muted/50 text-muted-foreground'
          }`}>
            🔥 {d.streak}
          </div>
          <span className="text-accent">Best: {d.bestStreak}</span>
          <span>Total: {(d.completionHistory || []).length}</span>
        </div>
        </div>
      </label>
      <IconBtn title="Remove" onClick={onRemove}>
        🗑
      </IconBtn>
    </div>
  );
}

function TodoRow({
  t,
  onToggle,
  onRemove,
}: {
  t: Todo;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/50 border border-border">
      <label className="flex items-center gap-3 min-w-0 cursor-pointer">
        <input
          type="checkbox"
          checked={t.done}
          onChange={onToggle}
          className="size-4 accent-primary"
        />
        <div className="min-w-0">
          <div
            className={`truncate font-medium ${
              t.done ? "line-through text-muted-foreground" : ""
            }`}
          >
            {t.title}
          </div>
          <div className="text-xs text-muted-foreground">
            {t.done ? "Done" : "Pending"}
          </div>
        </div>
      </label>
      <IconBtn title="Remove" onClick={onRemove}>
        🗑
      </IconBtn>
    </div>
  );
}

function RewardRow({
  r,
  onBuy,
  onRemove,
}: {
  r: Reward;
  onBuy: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/50 border border-border">
      <div className="min-w-0">
        <div className="truncate font-medium">{r.title}</div>
        <div className="text-xs text-muted-foreground">Cost {r.cost}g</div>
      </div>
      <div className="flex items-center gap-2">
        <IconBtn title="Buy" onClick={onBuy}>
          Buy
        </IconBtn>
        <IconBtn title="Remove" onClick={onRemove}>
          🗑
        </IconBtn>
      </div>
    </div>
  );
}

function AddSimple({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (title: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <form
      className="flex items-center gap-2 mt-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onAdd(text.trim());
        setText("");
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 rounded-xl bg-background border border-input outline-none focus:ring-2 focus:ring-ring"
      />
      <button type="submit" className="px-3 py-2 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground transition-colors">
        Add
      </button>
    </form>
  );
}

function AddHabit({ onAdd }: { onAdd: (title: string, kind: HabitKind, goal?: number) => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<HabitKind>("both");
  const [goal, setGoal] = useState<number | undefined>(undefined);
  
  return (
    <form
      className="flex flex-col gap-2 mt-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd(title.trim(), kind, goal);
        setTitle("");
        setKind("both");
        setGoal(undefined);
      }}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a habit…"
          className="flex-1 px-3 py-2 rounded-xl bg-background border border-input outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as HabitKind)}
          className="px-3 py-2 rounded-xl bg-background border border-input"
        >
          <option value="good">Good (+)</option>
          <option value="bad">Bad (−)</option>
          <option value="both">Both (+/−)</option>
        </select>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={goal || ""}
          onChange={(e) => setGoal(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          placeholder="Daily goal (optional)"
          className="flex-1 px-3 py-2 rounded-xl bg-background border border-input outline-none focus:ring-2 focus:ring-ring"
        />
        <button type="submit" className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground transition-colors">
          Add
        </button>
      </div>
    </form>
  );
}

function AddReward({ onAdd }: { onAdd: (title: string, cost: number) => void }) {
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState(10);
  return (
    <form
      className="flex items-center gap-2 mt-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd(title.trim(), Math.max(1, Math.round(cost)));
        setTitle("");
        setCost(10);
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a reward…"
        className="flex-1 px-3 py-2 rounded-xl bg-background border border-input outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        type="number"
        value={cost}
        onChange={(e) => setCost(parseInt(e.target.value || "10", 10))}
        className="w-24 px-3 py-2 rounded-xl bg-background border border-input outline-none focus:ring-2 focus:ring-ring"
      />
      <button type="submit" className="px-3 py-2 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground transition-colors">
        Add
      </button>
    </form>
  );
}


function ProgressAnalytics({ habits, dailies }: { habits: Habit[]; dailies: Daily[] }) {
  const totalHabitCompletions = habits.reduce((sum, h) => sum + (h.completionHistory || []).length, 0);
  const totalDailyCompletions = dailies.reduce((sum, d) => sum + (d.completionHistory || []).length, 0);
  const avgDailyStreak = dailies.length > 0 ? (dailies.reduce((sum, d) => sum + d.streak, 0) / dailies.length).toFixed(1) : 0;
  const bestDailyStreak = Math.max(...dailies.map(d => d.bestStreak), 0);
  
  // Calculate weekly progress
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
  const weeklyCompletions = [...habits, ...dailies].reduce((sum, item) => {
    const weekCompletions = (item.completionHistory || []).filter(date => 
      new Date(date) >= thisWeek
    ).length;
    return sum + weekCompletions;
  }, 0);

  // Calculate consistency rate (days with at least one completion in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const allDates = new Set();
  [...habits, ...dailies].forEach(item => {
    (item.completionHistory || []).forEach(date => {
      if (new Date(date) >= thirtyDaysAgo) {
        allDates.add(new Date(date).toDateString());
      }
    });
  });
  
  const consistencyRate = Math.round((allDates.size / 30) * 100);

  // Get longest streak across all dailies
  const allStreaks = dailies.map(d => d.streak);
  const longestCurrentStreak = Math.max(...allStreaks, 0);

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-border/50">
          <div className="text-lg font-semibold text-primary">{totalHabitCompletions}</div>
          <div className="text-xs text-muted-foreground">Habit Actions</div>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-r from-secondary/10 to-accent/10 border border-border/50">
          <div className="text-lg font-semibold text-secondary">{totalDailyCompletions}</div>
          <div className="text-xs text-muted-foreground">Daily Completions</div>
        </div>
      </div>
      
      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-border/50">
          <div className="text-lg font-semibold text-orange-500">🔥 {longestCurrentStreak}</div>
          <div className="text-xs text-muted-foreground">Current Streak</div>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-border/50">
          <div className="text-lg font-semibold text-accent">🏆 {bestDailyStreak}</div>
          <div className="text-xs text-muted-foreground">Best Streak</div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="text-lg font-semibold">{weeklyCompletions}</div>
          <div className="text-xs text-muted-foreground">This Week</div>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-border/50">
          <div className="text-lg font-semibold text-green-500">{consistencyRate}%</div>
          <div className="text-xs text-muted-foreground">Consistency</div>
        </div>
      </div>

      {/* Streak Leaderboard */}
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          🏅 Streak Leaderboard
        </h4>
        <div className="space-y-2">
          {dailies
            .sort((a, b) => b.streak - a.streak)
            .slice(0, 3)
            .map((d, index) => (
              <div key={d.id} className="flex justify-between items-center text-xs p-2 rounded bg-gradient-to-r from-muted/50 to-transparent">
                <div className="flex items-center gap-2">
                  <span className={index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <span className="truncate">{d.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-500">🔥 {d.streak}</span>
                  <span className="text-muted-foreground text-[10px]">best: {d.bestStreak}</span>
                </div>
              </div>
            ))}
          {dailies.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Add some dailies to track streaks!</p>
          )}
        </div>
      </div>
    </div>
  );
}

function HabitCalendar({ habits, dailies }: { habits: Habit[]; dailies: Daily[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  
  const allCompletions = [
    ...habits.flatMap(h => (h.completionHistory || []).map(date => ({ date, type: 'habit', title: h.title }))),
    ...dailies.flatMap(d => (d.completionHistory || []).map(date => ({ date, type: 'daily', title: d.title })))
  ];

  const getCompletionsForDate = (date: number) => {
    const targetDate = new Date(currentYear, currentMonth, date);
    return allCompletions.filter(completion => 
      new Date(completion.date).toDateString() === targetDate.toDateString()
    );
  };

  const getActivityLevel = (completions: number) => {
    if (completions === 0) return 0;
    if (completions <= 2) return 1;
    if (completions <= 4) return 2;
    if (completions <= 6) return 3;
    return 4;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Calculate current streak
  const getCurrentStreak = () => {
    let streak = 0;
    const sortedDates = allCompletions
      .map(c => new Date(c.date))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const dayCompletions = sortedDates.filter(date => 
        date.toDateString() === currentDate.toDateString()
      );
      
      if (dayCompletions.length > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = getCurrentStreak();

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <h4 className="text-lg font-semibold">{monthNames[currentMonth]} {currentYear}</h4>
          <p className="text-xs text-muted-foreground">Current streak: 🔥 {currentStreak} days</p>
        </div>
        <button 
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          →
        </button>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-xs">
        {days.map(day => (
          <div key={day} className="p-2 text-center text-muted-foreground font-medium">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="p-2"></div>
        ))}
        
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = i + 1;
          const dayCompletions = getCompletionsForDate(date);
          const completionCount = dayCompletions.length;
          const activityLevel = getActivityLevel(completionCount);
          const isToday = date === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
          const dateObj = new Date(currentYear, currentMonth, date);
          
          const activityColors = [
            'bg-muted/30',
            'bg-accent/25',
            'bg-accent/50', 
            'bg-accent/75',
            'bg-accent'
          ];
          
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(selectedDate?.getTime() === dateObj.getTime() ? null : dateObj)}
              className={`relative p-2 text-center text-xs rounded-lg transition-all hover:scale-110 ${
                isToday ? 'ring-2 ring-primary font-bold' : ''
              } ${activityColors[activityLevel]} ${
                selectedDate?.getTime() === dateObj.getTime() ? 'ring-2 ring-accent' : ''
              }`}
            >
              <div className={isToday ? 'text-primary' : ''}>{date}</div>
              {completionCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center">
                  {completionCount}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Activity Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-muted/30 rounded-sm" title="0 activities"></div>
          <div className="w-3 h-3 bg-accent/25 rounded-sm" title="1-2 activities"></div>
          <div className="w-3 h-3 bg-accent/50 rounded-sm" title="3-4 activities"></div>
          <div className="w-3 h-3 bg-accent/75 rounded-sm" title="5-6 activities"></div>
          <div className="w-3 h-3 bg-accent rounded-sm" title="7+ activities"></div>
        </div>
        <span>More</span>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-border/50">
          <h5 className="text-sm font-medium mb-2">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h5>
          <div className="space-y-1">
            {getCompletionsForDate(selectedDate.getDate()).map((completion, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className={completion.type === 'habit' ? 'text-primary' : 'text-secondary'}>
                  {completion.type === 'habit' ? '💪' : '✅'}
                </span>
                <span>{completion.title}</span>
              </div>
            ))}
            {getCompletionsForDate(selectedDate.getDate()).length === 0 && (
              <p className="text-xs text-muted-foreground italic">No activities on this day</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CommunitySupport() {
  const tips = [
    "Start small - consistency beats perfection",
    "Stack habits with existing routines",
    "Celebrate small wins to build momentum",
    "Track your progress visually",
    "Share your journey with friends"
  ];

  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-border/50">
        <div className="text-sm font-medium text-primary mb-2">💡 Daily Tip</div>
        <div className="text-sm text-muted-foreground">{tips[currentTip]}</div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Community Features</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <span className="text-green-400">●</span>
            <span>10,234 users active today</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <span className="text-accent">🏆</span>
            <span>Join weekly challenges</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <span className="text-primary">💬</span>
            <span>Share progress & get support</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border/50">
        <div className="text-xs text-muted-foreground text-center">
          Coming soon: Friend challenges, leaderboards, and habit sharing!
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-8 text-center text-xs text-muted-foreground">
      Track your habits, level up your life ✨
    </div>
  );
}
