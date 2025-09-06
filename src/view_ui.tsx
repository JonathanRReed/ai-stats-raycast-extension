import { Action, ActionPanel, Color, Detail, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@raycast/utils";
import { sb } from "./lib/supabase";
import type { Model } from "./lib/types";

// Model type imported from ./lib/types

type Mode = "search" | "leaderboards";

const METRICS = [
  { key: "mmlu_pro", label: "MMLU Pro (desc)" },
  { key: "gpqa", label: "GPQA (desc)" },
  { key: "livecodebench", label: "LiveCodeBench (desc)" },
  { key: "median_output_tokens_per_second", label: "Median TPS (desc)" },
  { key: "median_time_to_first_token_seconds", label: "Median TTFT (asc)" },
  { key: "price_1m_input_tokens", label: "Price per 1M Input Tokens (asc)" },
  { key: "price_1m_output_tokens", label: "Price per 1M Output Tokens (asc)" },
  { key: "price_1m_blended_3_to_1", label: "Blended Price (3:1) (asc)" }
] as const;

type MetricKey = typeof METRICS[number]["key"];

export default function View() {
  const { value: mode = "search", setValue: setMode } = useLocalStorage<Mode>("ai-stats-mode", "search");
  const { value: metric = "mmlu_pro", setValue: setMetric } = useLocalStorage<MetricKey>(
    "ai-stats-metric",
    "mmlu_pro"
  );
  const { value: searchText = "", setValue: setSearchText } = useLocalStorage<string>(
    "ai-stats-search",
    ""
  );
  const { value: creatorFilter = "", setValue: setCreatorFilter } = useLocalStorage<string>(
    "ai-stats-creator",
    ""
  );

  return (
    <List
      searchBarPlaceholder={mode === "search" ? "Search models by name, slug, or creator…" : ""}
      onSearchTextChange={(t) => setSearchText(t)}
      searchText={searchText}
      searchBarAccessory={
        <>
          <List.Dropdown tooltip="Mode" onChange={(v) => setMode(v as Mode)} storeValue>
            <List.Dropdown.Item value="search" title="Search" />
            <List.Dropdown.Item value="leaderboards" title="Leaderboards" />
          </List.Dropdown>
          {mode === "search" && (
            <CreatorFilterDropdown value={creatorFilter} onChange={setCreatorFilter} />
          )}
          {mode === "leaderboards" && (
            <List.Dropdown tooltip="Metric" onChange={(v) => setMetric(v as MetricKey)}>
              {METRICS.map((m) => (
                <List.Dropdown.Item key={m.key} value={m.key} title={m.label} />
              ))}
            </List.Dropdown>
          )}
        </>
      }
    >
      {mode === "search" ? (
        <SearchSection setMode={setMode} setMetric={setMetric} searchText={searchText} creatorFilter={creatorFilter} />
      ) : (
        <LeaderboardSection metric={metric} setMode={setMode} setMetric={setMetric} />
      )}
    </List>
  );
}

function SearchSection({
  setMode,
  setMetric,
  searchText,
  creatorFilter,
}: {
  setMode: (m: Mode) => void;
  setMetric: (m: MetricKey) => void;
  searchText: string;
  creatorFilter: string;
}) {
  const [q, setQ] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [rows, setRows] = useState<Model[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectColumns = useMemo(
    () =>
      `
      id,name,slug,creator_name,creator_slug,
      aa_intelligence_index,aa_coding_index,aa_math_index,
      mmlu_pro,gpqa,livecodebench,scicode,math_500,aime,hle,
      median_output_tokens_per_second,median_time_to_first_token_seconds,
      price_1m_input_tokens,price_1m_output_tokens,price_1m_blended_3_to_1,
      pricing,evaluations,first_seen,last_seen
    `.replace(/\s+/g, " "),
    []
  );

  async function load(query: string) {
    try {
      setLoading(true);
      const client = sb();
      let base = client.from("aa_models").select(selectColumns).limit(100);
      if (query) {
        base = base.or(`name.ilike.*${query}*,slug.ilike.*${query}*,creator_name.ilike.*${query}*`);
      }
      if (creatorFilter) {
        base = base.eq("creator_name", creatorFilter);
      }
      base = base.order("last_seen", { ascending: false });
      const { data, error } = await base;
      if (error) throw error;
      setRows(((data ?? []) as unknown) as Model[]);
    } catch (e: unknown) {
      console.error(e);
      let message = "Unknown error";
      if (e && typeof e === "object" && "message" in e) {
        const m = (e as { message?: unknown }).message;
        message = typeof m === "string" ? m : JSON.stringify(m);
      }
      void showToast({ style: Toast.Style.Failure, title: "Failed to load models", message });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
  }, []);

  // React to parent search text or creator filter changes
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    setQ(searchText);
    debounce.current = setTimeout(() => void load(searchText), 250);
  }, [searchText, creatorFilter]);

  return (
    <>
      {isLoading && rows.length === 0 ? (
        <List.EmptyView title="Loading…" />
      ) : null}
      {!isLoading && rows.length === 0 ? (
        <List.EmptyView title="No models found" description="Try another search term" />
      ) : null}
      <List.Section title="Models" subtitle={q}>
      {rows.map((m) => {
        const accessories: List.Item.Accessory[] = [];
        if (m.slug) accessories.push({ text: m.slug });
        if (m.price_1m_blended_3_to_1 != null)
          accessories.push({ tag: { value: `${formatPrice(m.price_1m_blended_3_to_1)}/1M`, color: Color.Orange } });
        if (m.median_output_tokens_per_second != null)
          accessories.push({ tag: { value: `${m.median_output_tokens_per_second} tps`, color: Color.Red } });
        return (
        <List.Item
          key={m.id}
          title={m.name ?? m.slug ?? "Unnamed"}
          subtitle={m.creator_name ?? ""}
          accessories={accessories}
          actions={
            <ActionPanel>
              <Action.Push title="Open Details" icon={Icon.Sidebar} target={<ModelDetail model={m} />} />
              <Action.CopyToClipboard title="Copy Name" content={m.name ?? ""} />
              <Action.CopyToClipboard title="Copy Slug" content={m.slug ?? ""} />
              <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={() => void load(q)} />
              <ActionPanel.Submenu title="Quick Switcher" shortcut={{ modifiers: ["cmd"], key: "k" }}>
                <Action title="Go to Leaderboards" onAction={() => setMode("leaderboards")} />
                <ActionPanel.Section title="Leaderboard Metric">
                  {METRICS.map((opt) => (
                    <Action key={opt.key} title={opt.label} onAction={() => setMetric(opt.key as MetricKey)} />
                  ))}
                </ActionPanel.Section>
              </ActionPanel.Submenu>
            </ActionPanel>
          }
        />
        );
      })}
      </List.Section>
    </>
  );
}

function LeaderboardSection({
  metric,
  setMode,
  setMetric,
}: {
  metric: MetricKey;
  setMode: (m: Mode) => void;
  setMetric: (m: MetricKey) => void;
}) {
  const [rows, setRows] = useState<Model[]>([]);
  const [isLoading, setLoading] = useState(false);

  const isAsc = useMemo(
    () => metric === "median_time_to_first_token_seconds" || metric.startsWith("price_"),
    [metric]
  );

  async function load() {
    setLoading(true);
    const client = sb();
    const columns = `id,name,slug,creator_name,${metric}`;
    const { data, error } = await client
      .from("aa_models")
      .select(columns)
      .not(metric, "is", null)
      .order(metric, { ascending: isAsc })
      .limit(50);
    if (error) {
      console.error(error);
      setRows([]);
    } else {
      setRows(((data ?? []) as unknown) as Model[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [metric]);

  return (
    <>
      {isLoading && rows.length === 0 ? <List.EmptyView title="Loading…" /> : null}
      <List.Section title={`Top by ${metric}`} subtitle={isAsc ? "ascending" : "descending"}>
      {rows.map((r) => {
        const accessories: List.Item.Accessory[] = [];
        if (r.slug) accessories.push({ text: r.slug });
        const value = (r as unknown as Record<string, number | null>)[metric];
        if (value != null) accessories.push({ tag: { value: String(value), color: isAsc ? Color.Orange : Color.Red } });
        return (
          <List.Item
            key={r.id}
            title={r.name ?? r.slug ?? "Model"}
            subtitle={r.creator_name ?? ""}
            accessories={accessories}
            actions={
              <ActionPanel>
                <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={() => void load()} />
                <ActionPanel.Submenu title="Quick Switcher" shortcut={{ modifiers: ["cmd"], key: "k" }}>
                  <Action title="Go to Search" onAction={() => setMode("search")} />
                  <ActionPanel.Section title="Leaderboard Metric">
                    {METRICS.map((opt) => (
                      <Action key={opt.key} title={opt.label} onAction={() => setMetric(opt.key as MetricKey)} />
                    ))}
                  </ActionPanel.Section>
                </ActionPanel.Submenu>
              </ActionPanel>
            }
          />
        );
      })}
      </List.Section>
    </>
  );
}

function CreatorFilterDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void | Promise<void>;
}) {
  const [creators, setCreators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const client = sb();
        // Fetch distinct creator names
        const { data, error } = await client
          .from("aa_models")
          .select("creator_name")
          .not("creator_name", "is", null)
          .order("creator_name", { ascending: true });
        if (error) throw error;
        const names = Array.from(new Set(((data ?? []) as { creator_name: string }[]).map((d) => d.creator_name)));
        setCreators(names);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <List.Dropdown tooltip="Filter by Creator" storeValue value={value} onChange={onChange} isLoading={loading}>
      <List.Dropdown.Item title="All Creators" value="" />
      {creators.map((c) => (
        <List.Dropdown.Item key={c} title={c} value={c} />
      ))}
    </List.Dropdown>
  );
}

function modelMarkdown(model: Model) {
  const pricing = fencedJson(model.pricing ?? {});
  const evals = fencedJson(model.evaluations ?? {});
  return `# ${model.name ?? model.slug ?? "Model"}
**Slug:** ${model.slug ?? "-"}  
**Creator:** ${model.creator_name ?? "-"} (${model.creator_slug ?? "-"})  
**Seen:** first ${model.first_seen ?? "-"} • last ${model.last_seen ?? "-"}

## Benchmarks
- MMLU Pro: ${model.mmlu_pro ?? "-"}
- GPQA: ${model.gpqa ?? "-"}
- LiveCodeBench: ${model.livecodebench ?? "-"}
- SciCode: ${model.scicode ?? "-"}
- Math 500: ${model.math_500 ?? "-"}
- AIME: ${model.aime ?? "-"}
- HLE: ${model.hle ?? "-"}

## Throughput & Latency
- Median TPS: ${model.median_output_tokens_per_second ?? "-"}
- Median TTFT (s): ${model.median_time_to_first_token_seconds ?? "-"}

## Pricing (JSON)
${pricing}

## Evaluations (JSON)
${evals}
`;
}

function fencedJson(val: unknown) {
  return `\n\`\`\`json\n${JSON.stringify(val, null, 2)}\n\`\`\`\n`;
}

function ModelDetail({ model }: { model: Model }) {
  const md = modelMarkdown(model);
  return <Detail markdown={md} />;
}

function formatPrice(n: number) {
  // formats 0.15 -> $0.15, 12 -> $12
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(
      n
    );
  } catch {
    return `$${n}`;
  }
}
