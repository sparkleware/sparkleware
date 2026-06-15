/**
 * LOADOUT.md export — turn a Compose loadout into a loop-ready execution brief.
 *
 * The loadout layer of the Aeon stack: STRATEGY.md is direction, SOUL.md is
 * identity, LOADOUT.md is capability — which skill packs to install and how to
 * run them. Drop it into an agent runtime (Aeon, or Claude Code /loop) and the
 * agent reads it each iteration, works the checklist, self-assesses, and halts
 * on the explicit Done-When test.
 *
 * Design (from a 4-way template panel, synthesized): the checklist IS the
 * progress tracker AND the stop condition; Capabilities are verbatim skill
 * descriptions so the agent can't claim a tool it lacks; Gaps quarantine what
 * the loadout can't do so the loop never spins toward an unreachable outcome.
 *
 * renderLoadout is pure + total: same input → byte-identical output, no LLM at
 * runtime. Every interpolated value is a verbatim slice of the input or an
 * integer from counting — nothing is paraphrased.
 */

import type { ComposeResult } from './compose';
import type { CoverageData, CoreSkill } from './coverage';
import { loadoutCoverage } from './coverage';

export interface LoadoutPack {
  repo: string;
  name: string;
  covers: string[];
  install: string;
  skills: { name: string; description: string }[];
}

export interface LoadoutInput {
  goal: string;
  loadout: LoadoutPack[];
  coreCoverage: {
    coveredCount: number;
    total: number;
    covered: string[];
    partial: string[];
    missing: string[];
  };
  uncovered: string[];
  installBlock?: string;
  core?: CoreSkill[];
}

const SEP = '\n\n---\n\n';

function titleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export function renderLoadout(input: LoadoutInput): string {
  const { goal, loadout, coreCoverage, uncovered } = input;

  if (loadout.length === 0) {
    return (
      [
        `# LOADOUT — ${goal}`,
        '',
        '> No packs matched this goal — the loadout is empty. Nothing to loop on yet.',
        '>',
        '> Refine the goal in Sparkleware /compose, then re-export this LOADOUT.md.',
      ].join('\n') + '\n'
    );
  }

  const skillCount = loadout.reduce((n, p) => n + p.skills.length, 0);
  const taskCount = loadout.reduce((n, p) => n + p.covers.length, 0);
  const installBlock = input.installBlock ?? loadout.map((p) => p.install).join(' && ');
  const bySlug = new Map((input.core ?? []).map((c) => [c.slug, c.name]));
  const nameOf = (slug: string) => bySlug.get(slug) ?? titleCase(slug);

  const sections: string[] = [];

  // 1 — Title + banner (positions this as the loadout layer of the Aeon stack)
  sections.push(
    [
      `# LOADOUT — ${goal}`,
      '',
      `> **Goal (unedited):** ${goal}`,
      `> Sparkleware /compose · ${loadout.length} packs · ${skillCount} skills · core-15 ${coreCoverage.coveredCount}/${coreCoverage.total} · deterministic export (no LLM at runtime)`,
      '> The loadout layer — which packs to install + how to run them. Pairs with your STRATEGY.md (direction) + SOUL.md (identity).',
      '> This file is your loop memory. If it is not written here, it did not happen.',
    ].join('\n'),
  );

  // 2 — The Loop
  sections.push(
    [
      '## The Loop',
      '',
      'You are an agent running this file in a loop. Each iteration, do exactly this:',
      '',
      '1. **READ** this whole file. Recover state from **Objectives & Progress** and the **Iteration Log** — not from memory.',
      "2. **PICK** the lowest-numbered unchecked task `- [ ]` under **Objectives & Progress**. Use only the skills listed under that task's pack.",
      '3. **ACT** on it. If a step needs a capability not in **Capabilities**, stop and mark the task `→ BLOCKED: <reason>` — do not improvise or fabricate a result.',
      '4. **VERIFY** the outcome is true in the world (not just that the pack installed). Only then change `- [ ]` to `- [x]` and add `→ <one-line note>`.',
      '5. **UPDATE** the progress counter and append one row to the **Iteration Log**.',
      '6. **CHECK STOP.** If **Done When** is satisfied, write a final status line and halt. Otherwise loop again from step 1.',
      '',
      'Never check off anything under **Gaps** — those are not yours to complete.',
      '',
      taskCount > 0
        ? `**Termination test:** Stop when all ${taskCount} tasks are checked or blocked, or a Stop Condition fires.`
        : '**Termination test:** This loadout has no goal-tasks (capability brief only) — use the skills below as relevant and halt when the goal is met.',
    ].join('\n'),
  );

  // 3 — Objectives & Progress (the checklist == progress tracker == stop condition)
  {
    const lines: string[] = ['## Objectives & Progress', '', `**Progress: 0 / ${taskCount} done.**`];
    let id = 0;
    for (const p of loadout) {
      lines.push('');
      lines.push(`### ${p.name} · \`${p.repo}\``);
      lines.push(
        p.skills.length
          ? 'Skills: ' + p.skills.map((s) => `\`${s.name}\``).join(', ')
          : 'Skills: _(none documented)_',
      );
      if (p.covers.length === 0) {
        lines.push('');
        lines.push(
          '_(added directly from a shared loadout — no specific goal-clause attached; exercise its skills as relevant)_',
        );
      } else {
        lines.push('');
        const tools = p.skills.map((s) => s.name).join(', ');
        for (const c of p.covers) {
          id += 1;
          lines.push(`- [ ] **T${id}** ${c}${tools ? ` — _tools: ${tools}_` : ''}`);
        }
      }
    }
    sections.push(lines.join('\n'));
  }

  // 4 — Capabilities (verbatim skill descriptions; the agent's only tools)
  {
    const lines: string[] = [
      '## Capabilities (your only tools)',
      '',
      'This is the complete set of actions available to you. Anything not listed here is a gap (see below), not a license to improvise.',
      '',
    ];
    for (const p of loadout) {
      const coversTail = p.covers.length
        ? ' — covers: ' + p.covers.map((c) => `"${c}"`).join(', ')
        : '';
      lines.push(`- **${p.name}** (\`${p.repo}\`)${coversTail}`);
      if (p.skills.length) {
        for (const s of p.skills) lines.push(`  - \`${s.name}\` — ${s.description}`);
      } else {
        lines.push('  - _(no skills documented)_');
      }
    }
    sections.push(lines.join('\n'));
  }

  // 5 — Gaps (honest quarantine: uncovered clauses + missing/partial core-15)
  {
    const lines: string[] = [
      '## Gaps — not yours to complete',
      '',
      'Surfaced for honesty. Do NOT check these off and do NOT attempt them with this loadout — no installed skill covers them. To close a gap, install a pack that covers it (Sparkleware Skill Atlas) and re-export this LOADOUT.md.',
      '',
      '**Uncovered goal-clauses**',
    ];
    if (uncovered.length) {
      for (const c of uncovered) lines.push(`- ⛔ ${c} — no pack in this loadout covers it.`);
    } else {
      lines.push('None — every clause of your goal maps to a pack above. ✅');
    }
    lines.push('');
    if (coreCoverage.total > 0) {
      lines.push(
        `### Aeon core-15 not in this loadout (${coreCoverage.coveredCount}/${coreCoverage.total} covered)`,
      );
      lines.push('');
      if (coreCoverage.partial.length === 0 && coreCoverage.missing.length === 0) {
        lines.push('This loadout covers the full core-15. ✅');
      } else {
        for (const slug of coreCoverage.partial) {
          lines.push(`- [~] ${nameOf(slug)} — partial (below coverage threshold; do not rely on it)`);
        }
        for (const slug of coreCoverage.missing) lines.push(`- [~] ${nameOf(slug)} — missing`);
      }
      lines.push('');
      lines.push(`Core skills present: ${coreCoverage.covered.map(nameOf).join(', ') || 'none'}.`);
    } else {
      lines.push('_Core-15 coverage was not computed for this loadout._');
    }
    sections.push(lines.join('\n'));
  }

  // 6 — Done When (mechanical, inspectable termination test)
  sections.push(
    [
      '## Done When',
      '',
      'Stop the loop and report when ALL of the following hold:',
      '',
      taskCount > 0
        ? `1. Every task **T1–T${taskCount}** is either \`- [x]\` checked or carries a \`→ BLOCKED: <reason>\` note. (Currently 0 of ${taskCount} resolved.)`
        : '1. There are no goal-tasks in this loadout (capability brief only).',
      '2. Each checked box is verified working — the outcome is true in the world (e.g. a PR actually reviewed, a message actually delivered), not merely that the pack installed.',
      '3. No item under **Gaps** was silently attempted or claimed as done.',
      '',
      'Gaps do NOT count toward Done — do not loop forever trying to satisfy them. When all three hold, write a final status line and halt. Also halt and request a human if a task is BLOCKED with no path using the installed Capabilities.',
    ].join('\n'),
  );

  // 7 — Iteration Log (cross-iteration working memory, seeded at iter 0)
  sections.push(
    [
      '## Iteration Log',
      '',
      'Append one row per iteration. Newest at the bottom. Never delete past rows — this is your state across loops.',
      '',
      '| Iter | Done / total | Advanced | Blocked | Notes |',
      '|------|--------------|----------|---------|-------|',
      `| 0 | 0 / ${taskCount} | — | — | LOADOUT.md generated from loadout (${loadout.length} packs, ${skillCount} skills). Begin at T1. |`,
    ].join('\n'),
  );

  // 8 — Install (run once)
  sections.push(
    [
      '## Install (run once)',
      '',
      '```sh',
      installBlock,
      '```',
      '',
      'Mark setup complete in the Iteration Log once all packs install.',
    ].join('\n'),
  );

  return sections.join(SEP) + '\n';
}

/** Adapt live Compose + coverage state into renderLoadout's input shape. */
export function loadoutFromResult(
  goal: string,
  result: ComposeResult,
  coverage: CoverageData | null,
): string {
  const loadout: LoadoutPack[] = result.loadout.map((c) => ({
    repo: c.pack.repo,
    name: c.pack.name,
    covers: c.clauses,
    install: c.pack.install_command,
    skills: (c.pack.skills ?? []).map((s) => ({ name: s.name, description: s.description })),
  }));

  let coreCoverage = {
    coveredCount: 0,
    total: 0,
    covered: [] as string[],
    partial: [] as string[],
    missing: [] as string[],
  };
  let core: CoreSkill[] | undefined;

  if (coverage && loadout.length > 0) {
    const xr = loadoutCoverage(
      loadout.map((p) => p.repo),
      coverage,
    );
    coreCoverage = {
      coveredCount: xr.coveredCount,
      total: xr.total,
      covered: xr.cells.filter((c) => c.status === 'covered').map((c) => c.slug),
      partial: xr.cells.filter((c) => c.status === 'partial').map((c) => c.slug),
      missing: xr.cells.filter((c) => c.status === 'missing').map((c) => c.slug),
    };
    core = coverage.core;
  }

  return renderLoadout({
    goal: goal.trim() || 'your Aeon agent',
    loadout,
    coreCoverage,
    uncovered: result.uncovered,
    installBlock: result.installBlock,
    core,
  });
}
