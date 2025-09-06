import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { sb } from "./lib/supabase";

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

type Row = {
  id: string;
  name: string | null;
  slug: string | null;
  creator_name: string | null;
} & Partial<Record<MetricKey, number | null>>;

export default function Command() {
  const [metric, setMetric] = useState<MetricKey>("mmlu_pro");
  const [rows, setRows] = useState<Row[]>([]);
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
      setRows((data as Row[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [metric]);

  return (
    <List
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip="Select Metric" onChange={(v) => setMetric(v as MetricKey)}>
          {METRICS.map((m) => (
            <List.Dropdown.Item key={m.key} value={m.key} title={m.label} />
          ))}
        </List.Dropdown>
      }
    >
      <List.Section title={`Top by ${metric}`}>
        {rows.map((r) => (
          <List.Item
            key={r.id}
            title={r.name ?? r.slug ?? "Model"}
            subtitle={r.creator_name ?? ""}
            accessories={[
              r.slug ? { text: r.slug } : undefined,
              r[metric] != null ? { tag: String(r[metric]) } : undefined,
            ].filter(Boolean)}
            actions={
              <ActionPanel>
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  onAction={() => void load()}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
