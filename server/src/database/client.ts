import { config } from "../config/index.js";

let supabase: any;
let supabaseAdmin: any;

if (config.APP_MODE === "local") {
  type Row = Record<string, any>;

  const store = new Map<string, Row[]>();

  // Foreign key map: table.column -> referenced table
  const FK_MAP: Record<string, string> = {
    "interviews.candidate_id": "candidates",
    "interviews.job_id": "jobs",
    "interviews.organization_id": "organizations",
    "candidates.organization_id": "organizations",
    "candidates.user_id": "profiles",
    "jobs.organization_id": "organizations",
    "jobs.created_by": "profiles",
    "interview_events.interview_id": "interviews",
    "organization_members.user_id": "profiles",
    "organization_members.organization_id": "organizations",
  };

  // Seed demo data
  const now = new Date().toISOString();
  const orgId = "64222f0d-6725-4f94-809c-427ada4700d1";
  const userId = "5f0cf71a-6b3e-4d8a-9c2f-1a3b5c7d9e0f";
  const candidateId = "a49f80c2-9826-4a5f-8da1-c0e25a84990f";
  const jobId = "75d64f12-c9a7-4b6b-bd14-48a2656ef0a5";

  store.set("profiles", [{
    id: userId, email: "recruiter@demo.com", full_name: "Demo Recruiter",
    role: "recruiter", language: "en", created_at: now, updated_at: now,
  }]);
  store.set("organizations", [{
    id: orgId, name: "Demo Corp", slug: "demo-corp", created_by: userId,
    created_at: now, updated_at: now,
  }]);
  store.set("organization_members", [{
    id: "mem-1", organization_id: orgId, user_id: userId,
    role: "recruiter", created_at: now,
  }]);
  store.set("candidates", [{
    id: candidateId, organization_id: orgId, name: "Priya Sharma",
    email: "priya@example.com", skills: ["React", "TypeScript", "Node.js"],
    experience: "3 years", created_at: now, updated_at: now,
  }]);
  store.set("jobs", [{
    id: jobId, organization_id: orgId, created_by: userId,
    title: "Senior Frontend Developer", department: "Engineering",
    description: "Build amazing UIs with React and TypeScript",
    required_skills: ["React", "TypeScript", "CSS"], preferred_skills: ["Next.js", "Tailwind"],
    tech_stack: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    interview_language: "en", difficulty: 3, duration: 60,
    status: "active", created_at: now, updated_at: now,
  }]);
  store.set("interviews", []);
  store.set("interview_events", []);
  store.set("interview_questions", []);
  store.set("interview_answers", []);
  store.set("assessments", []);
  store.set("assessment_answers", []);
  store.set("projects", []);
  store.set("documents", []);
  store.set("interview_reports", []);
  store.set("subscriptions", []);
  store.set("usage_records", []);

  function getTable(name: string): Row[] {
    if (!store.has(name)) store.set(name, []);
    return store.get(name)!;
  }

  function resolveJoins(row: Row, joinSpecs: { table: string; alias: string; cols: string[] }[]): Row {
    const result = { ...row };
    for (const js of joinSpecs) {
      // Find the FK column in the row that points to the joined table
      const fkCol = Object.keys(FK_MAP).find(
        (k) => k.startsWith(row.constructor.name) || true
      );
      // Try common FK patterns
      const fkCandidates = [
        `${js.alias}_id`,      // candidate_id, job_id, etc
        `${js.table}_id`,      // candidates_id -> wrong, but try
        `${js.alias.replace(/s$/, "")}_id`, // candidate_id from candidates
      ];

      let refId: any = null;
      for (const fk of fkCandidates) {
        if (row[fk] !== undefined) {
          refId = row[fk];
          break;
        }
      }

      // Also check FK_MAP for reverse lookup
      if (!refId) {
        for (const [key, table] of Object.entries(FK_MAP)) {
          if (table === js.table || table === js.alias) {
            const col = key.split(".")[1];
            if (row[col] !== undefined) {
              refId = row[col];
              break;
            }
          }
        }
      }

      if (refId) {
        const refTable = getTable(js.table);
        const refRow = refTable.find((r) => r.id === refId);
        if (refRow) {
          const picked: Row = {};
          if (js.cols.includes("*")) {
            Object.assign(picked, refRow);
          } else {
            for (const c of js.cols) {
              picked[c] = refRow[c];
            }
          }
          result[js.alias] = picked;
        } else {
          result[js.alias] = null;
        }
      } else {
        result[js.alias] = null;
      }
    }
    return result;
  }

  function parseSelect(cols: string): { plain: string[]; joins: { table: string; alias: string; cols: string[] }[] } {
    const plain: string[] = [];
    const joins: { table: string; alias: string; cols: string[] }[] = [];
    // Split on commas, but only those NOT inside parentheses
    const parts: string[] = [];
    let depth = 0;
    let current = "";
    for (const ch of cols) {
      if (ch === "(") { depth++; current += ch; }
      else if (ch === ")") { depth--; current += ch; }
      else if (ch === "," && depth === 0) { parts.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    if (current.trim()) parts.push(current.trim());

    for (const part of parts) {
      const joinMatch = part.match(/^(\w+)\((.+)\)$/);
      if (joinMatch) {
        const [, alias, innerCols] = joinMatch;
        joins.push({ table: alias, alias, cols: innerCols.split(",").map((s) => s.trim()) });
      } else {
        plain.push(part);
      }
    }
    return { plain, joins };
  }

  class MockQuery {
    private table: string;
    private rows: Row[];
    private filters: { column: string; op: string; value: any }[] = [];
    private orderByCol: string | null = null;
    private orderAsc = true;
    private limitN: number | null = null;
    private singleRow = false;
    private insertData: Row | Row[] | null = null;
    private updateData: Row | null = null;
    private deleteMode = false;
    private selectCols: string = "*";

    constructor(table: string) {
      this.table = table;
      this.rows = getTable(table);
    }

    select(cols: string = "*") { this.selectCols = cols; return this; }
    eq(col: string, val: any) { this.filters.push({ column: col, op: "eq", value: val }); return this; }
    order(col: string, opts: { ascending: boolean }) { this.orderByCol = col; this.orderAsc = opts.ascending; return this; }
    single() { this.singleRow = true; return this; }
    limit(n: number) { this.limitN = n; return this; }
    insert(data: Row | Row[]) { this.insertData = data; return this; }
    update(data: Row) { this.updateData = data; return this; }
    delete() { this.deleteMode = true; return this; }

    then(resolve: (result: { data: any; error: any }) => void) {
      try {
        if (this.insertData) {
          const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
          const inserted = items.map((item) => {
            const row = { ...item, id: item.id || crypto.randomUUID(), created_at: item.created_at || new Date().toISOString() };
            this.rows.push(row);
            return row;
          });
          // Apply joins to inserted
          const { joins } = parseSelect(this.selectCols);
          const resolved = inserted.map((r) => joins.length ? resolveJoins(r, joins) : r);
          resolve({ data: this.singleRow ? resolved[0] : resolved, error: null });
          return;
        }
        if (this.updateData) {
          let updated: Row | null = null;
          for (const row of this.rows) {
            if (this.filters.every((f) => row[f.column] === f.value)) {
              Object.assign(row, this.updateData);
              updated = row;
              break;
            }
          }
          resolve({ data: updated, error: updated ? null : { message: "Not found" } });
          return;
        }
        if (this.deleteMode) {
          const before = this.rows.length;
          this.rows = this.rows.filter((r) => !this.filters.every((f) => r[f.column] === f.value));
          resolve({ data: null, error: this.rows.length === before ? { message: "Not found" } : null });
          return;
        }
        // SELECT
        let result = [...this.rows];
        for (const f of this.filters) {
          result = result.filter((r) => r[f.column] === f.value);
        }
        if (this.orderByCol) {
          result.sort((a, b) => {
            const va = a[this.orderByCol!], vb = b[this.orderByCol!];
            if (va == null) return 1;
            if (vb == null) return -1;
            return this.orderAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
          });
        }
        if (this.limitN) result = result.slice(0, this.limitN);

        // Apply joins
        const { joins } = parseSelect(this.selectCols);
        if (joins.length) {
          result = result.map((r) => resolveJoins(r, joins));
        }

        if (this.singleRow) {
          resolve({ data: result[0] || null, error: result[0] ? null : { message: "Not found" } });
          return;
        }
        resolve({ data: result, error: null });
      } catch (err: any) {
        resolve({ data: null, error: { message: err.message } });
      }
    }
  }

  supabase = { from(table: string) { return new MockQuery(table); } };
  supabaseAdmin = supabase;
} else {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(config.SUPABASE_URL || "http://localhost", config.SUPABASE_ANON_KEY || "anon", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  supabase = client;
  supabaseAdmin = config.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(config.SUPABASE_URL || "http://localhost", config.SUPABASE_SERVICE_ROLE_KEY)
    : client;
}

export { supabase, supabaseAdmin };
