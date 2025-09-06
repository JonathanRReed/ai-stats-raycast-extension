import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { sb } from "./lib/supabase";

export type Model = {
  id: string;
  name: string | null;
  slug: string | null;
  creator_name: string | null;
  creator_slug: string | null;
  aa_intelligence_index: number | null;
  aa_coding_index: number | null;
  aa_math_index: number | null;
  mmlu_pro: number | null;
  gpqa: number | null;
  livecodebench: number | null;
  scicode: number | null;
  math_500: number | null;
  aime: number | null;
  hle: number | null;
  median_output_tokens_per_second: number | null;
  median_time_to_first_token_seconds: number | null;
  price_1m_input_tokens: number | null;
  price_1m_output_tokens: number | null;
  price_1m_blended_3_to_1: number | null;
  pricing: unknown | null;
  evaluations: unknown | null;
  first_seen: string;
  last_seen: string;
};

export default function Command() {
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
    [],
  );

  async function load(query: string) {
    try {
      setLoading(true);
      const client = sb();
      let base = client.from("aa_models").select(selectColumns).limit(100);

      if (query) {
        base = base.or(`name.ilike.*${query}*,slug.ilike.*${query}*,creator_name.ilike.*${query}*`);
      }

      const { data, error } = await base;
      if (error) throw error;
      setRows((data ?? []) as unknown as Model[]);
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

  function onSearchTextChange(text: string) {
    setQ(text);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void load(text), 300);
  }

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={onSearchTextChange}
      searchBarPlaceholder="Search models by name, slug, or creator…"
      searchText={q}
    >
      <List.Section title="Models">
        {rows.map((m) => {
          const accessories: List.Item.Accessory[] = [];
          if (m.slug) accessories.push({ text: m.slug });
          if (m.mmlu_pro != null) accessories.push({ tag: `${m.mmlu_pro} MMLU` });
          if (m.median_output_tokens_per_second != null)
            accessories.push({ tag: `${m.median_output_tokens_per_second} tps` });
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
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}

function ModelDetail({ model }: { model: Model }) {
  const pricing = fencedJson(model.pricing ?? {});
  const evals = fencedJson(model.evaluations ?? {});
  const md = `# ${model.name ?? model.slug ?? "Model"}
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
  return <List.Item.Detail markdown={md} />;
}

function fencedJson(val: unknown) {
  return `\n\`\`\`json\n${JSON.stringify(val, null, 2)}\n\`\`\`\n`;
}
