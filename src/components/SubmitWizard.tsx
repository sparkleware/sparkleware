'use client';

import { useMemo, useState } from 'react';
import styles from './SubmitWizard.module.css';

const CATEGORIES = ['research', 'crypto', 'dev', 'social', 'productivity', 'meta'] as const;
const LICENSE_SUGGESTIONS = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Unlicense'];

type Category = typeof CATEGORIES[number];

interface SkillRow {
  id: number;
  name: string;
  description: string;
}

const NAME_RE = /^[a-z0-9][a-z0-9-_]*$/;
const HANDLE_RE = /^[a-zA-Z0-9][a-zA-Z0-9-_]*$/;

let skillIdCounter = 1;

function newSkill(): SkillRow {
  return { id: skillIdCounter++, name: '', description: '' };
}

export function SubmitWizard() {
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('research');
  const [tagsInput, setTagsInput] = useState('');
  const [version, setVersion] = useState('0.1.0');
  const [license, setLicense] = useState('MIT');
  const [skills, setSkills] = useState<SkillRow[]>([newSkill()]);
  const [copied, setCopied] = useState(false);

  const tags = useMemo(
    () =>
      tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    [tagsInput]
  );

  const validSkills = skills.filter(
    (s) => s.name.trim() && s.description.trim() && NAME_RE.test(s.name.trim())
  );

  const errors: string[] = [];
  if (!name) errors.push('pack name is required');
  else if (!NAME_RE.test(name)) errors.push('pack name must be lowercase kebab-case (a-z, 0-9, -, _)');
  if (!author) errors.push('github handle is required');
  else if (!HANDLE_RE.test(author)) errors.push('github handle has invalid characters');
  if (description.length < 10) errors.push('description must be at least 10 characters');
  if (description.length > 280) errors.push('description must be at most 280 characters');
  if (!/^\d+\.\d+\.\d+/.test(version)) errors.push('version must look like 0.1.0');
  if (!license.trim()) errors.push('license is required');

  const manifest = useMemo(() => {
    return {
      name: name || 'your-pack-name',
      author: author || 'your-handle',
      repo: `${author || 'your-handle'}/${name || 'your-pack-name'}`,
      description: description || 'short description (10-280 chars)',
      category,
      ...(tags.length > 0 ? { tags } : {}),
      version,
      skills_count: validSkills.length,
      ...(validSkills.length > 0
        ? {
            skills: validSkills.map((s) => ({
              name: s.name.trim(),
              description: s.description.trim(),
            })),
          }
        : {}),
      install_command: `./install-skill-pack ${author || 'your-handle'}/${name || 'your-pack-name'}`,
      submitted_at: new Date().toISOString(),
      license,
    };
  }, [name, author, description, category, tags, version, license, validSkills]);

  const manifestJson = JSON.stringify(manifest, null, 2);

  const githubUrl = useMemo(() => {
    if (errors.length > 0) return null;
    const filename = `registry/packs/${author}/${name}.json`;
    const encoded = encodeURIComponent(manifestJson);
    return `https://github.com/sparkleware/sparkleware/new/main?filename=${encodeURIComponent(filename)}&value=${encoded}`;
  }, [errors.length, author, name, manifestJson]);

  function updateSkill(id: number, patch: Partial<SkillRow>) {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function addSkill() {
    setSkills((prev) => [...prev, newSkill()]);
  }
  function removeSkill(id: number) {
    setSkills((prev) => (prev.length === 1 ? prev : prev.filter((s) => s.id !== id)));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(manifestJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className={styles.wizard}>
      <div className={styles.form}>
        <Field label="pack name *" hint="lowercase, kebab-case (e.g. arxiv-digest)">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="arxiv-digest"
            className={styles.input}
          />
        </Field>

        <Field label="github handle *" hint="your GitHub username or org">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value.trim())}
            placeholder="your-handle"
            className={styles.input}
          />
        </Field>

        <Field
          label={`description * (${description.length}/280)`}
          hint="one sentence — what does this pack do?"
        >
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Daily digest of new arXiv papers in your field of interest."
            className={styles.textarea}
            rows={2}
            maxLength={280}
          />
        </Field>

        <div className={styles.row}>
          <Field label="category *" hint="pick one">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={styles.input}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="version *" hint="semver">
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="0.1.0"
              className={styles.input}
            />
          </Field>

          <Field label="license *" hint="SPDX id">
            <input
              type="text"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              list="licenses"
              placeholder="MIT"
              className={styles.input}
            />
            <datalist id="licenses">
              {LICENSE_SUGGESTIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </Field>
        </div>

        <Field label="tags" hint="optional, comma-separated (lowercase)">
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="papers, research, daily"
            className={styles.input}
          />
        </Field>

        <div className={styles.skillsHeader}>
          <span className={styles.label}>skills</span>
          <button type="button" onClick={addSkill} className={styles.addBtn}>
            + add skill
          </button>
        </div>
        <div className={styles.skills}>
          {skills.map((s, i) => (
            <div key={s.id} className={styles.skillCard}>
              <div className={styles.skillHead}>
                <span className={styles.skillNum}>#{i + 1}</span>
                {skills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSkill(s.id)}
                    className={styles.removeBtn}
                    aria-label={`Remove skill ${i + 1}`}
                  >
                    ×
                  </button>
                )}
              </div>
              <input
                type="text"
                value={s.name}
                onChange={(e) =>
                  updateSkill(s.id, {
                    name: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                  })
                }
                placeholder="skill-name"
                className={styles.input}
              />
              <input
                type="text"
                value={s.description}
                onChange={(e) => updateSkill(s.id, { description: e.target.value })}
                placeholder="What does this skill do?"
                className={styles.input}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.preview}>
        <div className={styles.previewHead}>
          <span className={styles.previewLabel}>✦ live manifest preview ✦</span>
          <button type="button" onClick={handleCopy} className={styles.copyBtn}>
            {copied ? 'copied ✦' : 'copy JSON'}
          </button>
        </div>
        <pre className={styles.previewCode}>{manifestJson}</pre>

        {errors.length > 0 ? (
          <div className={styles.errors}>
            <strong>fix before submitting:</strong>
            <ul>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className={styles.ok}>✓ looks valid — ready to open a pre-filled PR</p>
        )}

        <a
          href={githubUrl ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!githubUrl}
          onClick={(e) => {
            if (!githubUrl) e.preventDefault();
          }}
          className={`${styles.ctaBig} ${!githubUrl ? styles.ctaDisabled : ''}`}
        >
          open pre-filled PR on github →
        </a>
        <p className={styles.helper}>
          Opens GitHub&apos;s &ldquo;new file&rdquo; editor with your manifest pre-populated. You
          fork on submit, CI runs schema validation, a maintainer reviews.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
      {children}
    </label>
  );
}
