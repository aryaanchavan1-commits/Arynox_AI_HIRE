import { config } from "../config/index.js";

// In-memory mock database for local development (no Supabase/Docker required)
type Row = Record<string, any>;

class MockQuery {
  private table: string;
  private rows: Row[];
  private filters: { column: string; op: string; value: any }[] = [];
  private selectCols: string | null = null;
  private orderByCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;
  private singleRow = false;
  private insertData: Row | Row[] | null = null;
  private updateData: Row | null = null;
  private deleteMode = false;

  constructor(table: string, store: Map<string, Row[]>) {
    this.table = table;
    if (!store.has(table)) store.set(table, []);
    this.rows = store.get(table)!;
  }

  select(cols: string = "*") {
    this.selectCols = cols;
    return this;
  }
  eq(col: string, val: any) { this.filters.push({ column: col, op: "eq", value: val }); return this; }
  order(col: string, opts: { ascending: boolean }) { this.orderByCol = col; this.orderAsc = opts.ascending; return this; }
  single() { this.singleRow = true; return this; }
  limit(n: number) { this.limitN = n; return this; }

  insert(data: Row | Row[]) {
    this.insertData = data;
    return this;
  }
  update(data: Row) {
    this.updateData = data;
    return this;
  }
  delete() {
    this.deleteMode = true;
    return this;
  }

  then(resolve: (result: { data: any; error: any }) => void) {
    try {
      if (this.insertData) {
        const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        const inserted = items.map((item) => {
          const row = { id: item.id || crypto.randomUUID(), ...item, created_at: item.created_at || new Date().toISOString() };
          this.rows.push(row);
          return row;
        });
        resolve({ data: this.singleRow ? inserted[0] : inserted, error: null });
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
          return this.orderAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
        });
      }
      if (this.limitN) result = result.slice(0, this.limitN);
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

const store = new Map<string, Row[]>();

// Seed demo data
const now = new Date().toISOString();
const orgId = crypto.randomUUID();
const userId = crypto.randomUUID();
const candidateId = crypto.randomUUID();
const jobId = crypto.randomUUID();

store.set("profiles", [{
  id: userId, email: "recruiter@demo.com", full_name: "Demo Recruiter",
  role: "recruiter", language: "en", created_at: now, updated_at: now,
}]);

store.set("organizations", [{
  id: orgId, name: "Demo Corp", slug: "demo-corp", created_by: userId,
  created_at: now, updated_at: now,
}]);

store.set("organization_members", [{
  id: crypto.randomUUID(), organization_id: orgId, user_id: userId,
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

export const supabaseAdmin = {
  from(table: string) {
    const q = new MockQuery(table, store);
    return q;
  },
};

export const supabase = supabaseAdmin;

// Expose store for debugging
export const _store = store;
