from __future__ import annotations
import os
import psycopg2
import psycopg2.extras
import uuid
import json
import time
from datetime import datetime, timezone
from typing import Any, Optional
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

NEON_URL = os.getenv("DATABASE_URL", "")


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Database:
    def __init__(self):
        self._conn = None
        self._seeded = False

    def _connect(self):
        if self._conn and not self._conn.closed:
            try:
                cur = self._conn.cursor()
                cur.execute("SELECT 1")
                cur.close()
                return
            except Exception:
                self._conn = None
        self._conn = psycopg2.connect(NEON_URL, connect_timeout=5)
        self._conn.autocommit = True

    def _ensure(self):
        self._connect()
        if not self._seeded:
            self._create_tables()
            self._seed_if_empty()
            self._seeded = True

    def _create_tables(self):
        cur = self._conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY, email TEXT NOT NULL, full_name TEXT DEFAULT '',
                role TEXT DEFAULT 'candidate', language TEXT DEFAULT 'en',
                created_at TEXT, updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS organizations (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE,
                description TEXT, logo_url TEXT, website TEXT, industry TEXT,
                created_by TEXT, created_at TEXT, updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS organization_members (
                id TEXT PRIMARY KEY, organization_id TEXT, user_id TEXT,
                role TEXT DEFAULT 'recruiter', created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY, organization_id TEXT, created_by TEXT,
                title TEXT NOT NULL, department TEXT, location TEXT,
                work_mode TEXT DEFAULT 'remote', experience TEXT, description TEXT,
                required_skills TEXT DEFAULT '[]', preferred_skills TEXT DEFAULT '[]',
                tech_stack TEXT DEFAULT '[]', interview_language TEXT DEFAULT 'en',
                difficulty INTEGER DEFAULT 3, duration INTEGER DEFAULT 60,
                status TEXT DEFAULT 'active', created_at TEXT, updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS candidates (
                id TEXT PRIMARY KEY, organization_id TEXT, user_id TEXT,
                name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT,
                skills TEXT DEFAULT '[]', experience TEXT, education TEXT,
                github_url TEXT, cv_text TEXT, created_at TEXT, updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS interviews (
                id TEXT PRIMARY KEY, organization_id TEXT, candidate_id TEXT,
                job_id TEXT, type TEXT DEFAULT 'comprehensive',
                language TEXT DEFAULT 'en', status TEXT DEFAULT 'scheduled',
                context TEXT DEFAULT '{}', started_at TEXT, completed_at TEXT,
                duration_seconds INTEGER, invitation_token TEXT UNIQUE,
                invitation_expires_at TEXT, max_duration_minutes INTEGER DEFAULT 60,
                evaluation TEXT DEFAULT '{}', created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS interview_events (
                id TEXT PRIMARY KEY, interview_id TEXT, event_type TEXT,
                payload TEXT DEFAULT '{}', timestamp TEXT, created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS interview_reports (
                id TEXT PRIMARY KEY, interview_id TEXT, organization_id TEXT,
                candidate_summary TEXT, technical_score REAL,
                communication_score REAL, problem_solving_score REAL,
                project_understanding_score REAL, overall_score REAL,
                strengths TEXT DEFAULT '[]', improvements TEXT DEFAULT '[]',
                summary TEXT, created_at TEXT
            );
        """)

    def _seed_if_empty(self):
        cur = self._conn.cursor()
        cur.execute("SELECT COUNT(*) FROM profiles")
        if cur.fetchone()[0] > 0:
            return
        now = _now()
        org_id = "64222f0d-6725-4f94-809c-427ada4700d1"
        user_id = "5f0cf71a-6b3e-4d8a-9c2f-1a3b5c7d9e0f"
        candidate_id = "a49f80c2-9826-4a5f-8da1-c0e25a84990f"
        job_id = "75d64f12-c9a7-4b6b-bd14-48a2656ef0a5"
        cur.execute("INSERT INTO profiles VALUES (%s,%s,%s,%s,%s,%s,%s)", (user_id, "recruiter@demo.com", "Demo Recruiter", "recruiter", "en", now, now))
        cur.execute("INSERT INTO organizations VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", (org_id, "Demo Corp", "demo-corp", None, None, None, None, user_id, now, now))
        cur.execute("INSERT INTO organization_members VALUES (%s,%s,%s,%s,%s)", ("mem-1", org_id, user_id, "recruiter", now))
        cur.execute("INSERT INTO candidates VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", (candidate_id, org_id, None, "Priya Sharma", "priya@example.com", "+91 98765 43210", json.dumps(["React", "TypeScript", "Node.js"]), "3 years", "B.Tech Computer Science", "https://github.com/priyasharma", None, now, now))
        cur.execute("INSERT INTO jobs VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", (job_id, org_id, user_id, "Senior Frontend Developer", "Engineering", "Remote", "remote", "3-5 years", "Build amazing UIs with React and TypeScript", json.dumps(["React", "TypeScript", "CSS"]), json.dumps(["Next.js", "Tailwind"]), json.dumps(["React", "TypeScript", "Node.js", "PostgreSQL"]), "en", 3, 60, "active", now, now))

    def fetchone(self, sql: str, params: tuple = ()) -> Optional[dict]:
        self._ensure()
        cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, params)
        row = cur.fetchone()
        return dict(row) if row else None

    def fetchall(self, sql: str, params: tuple = ()) -> list[dict]:
        self._ensure()
        cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, params)
        return [dict(r) for r in cur.fetchall()]

    def execute(self, sql: str, params: tuple = ()):
        self._ensure()
        cur = self._conn.cursor()
        cur.execute(sql, params)
        return cur

    def insert(self, table: str, data: dict[str, Any]) -> dict[str, Any]:
        self._ensure()
        row = dict(data)
        if not row.get("id"):
            row["id"] = _uuid()
        if "created_at" not in row:
            row["created_at"] = _now()
        cols = ", ".join(row.keys())
        ph = ", ".join(["%s"] * len(row))
        cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"INSERT INTO {table} ({cols}) VALUES ({ph}) RETURNING *", tuple(row.values()))
        r = cur.fetchone()
        return dict(r) if r else row

    def update(self, table: str, data: dict[str, Any], where: str, where_params: tuple) -> Optional[dict]:
        self._ensure()
        sets = ", ".join(f"{k} = %s" for k in data.keys())
        cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"UPDATE {table} SET {sets} WHERE {where} RETURNING *", tuple(data.values()) + where_params)
        r = cur.fetchone()
        return dict(r) if r else None

    def query_interviews(self, org_id: str = None, filters: dict = None, single: bool = False, order_by: str = "created_at", ascending: bool = False):
        sql = """SELECT i.*, c.name AS candidate_name, c.email AS candidate_email, c.github_url AS candidate_github_url,
                 j.title AS job_title, j.required_skills AS job_required_skills, j.description AS job_description
            FROM interviews i LEFT JOIN candidates c ON c.id = i.candidate_id LEFT JOIN jobs j ON j.id = i.job_id WHERE 1=1"""
        params = []
        if org_id:
            sql += " AND i.organization_id = %s"
            params.append(org_id)
        if filters:
            for k, v in filters.items():
                sql += f" AND i.{k} = %s"
                params.append(v)
        sql += f" ORDER BY i.{order_by} {'ASC' if ascending else 'DESC'}"
        self._ensure()
        cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, tuple(params))
        if single:
            row = cur.fetchone()
            return self._fmt(dict(row)) if row else None
        return [self._fmt(dict(r)) for r in cur.fetchall()]

    def _fmt(self, r: dict) -> dict:
        r = dict(r)
        if r.get("candidate_name"):
            r["candidates"] = {"name": r.pop("candidate_name"), "email": r.pop("candidate_email")}
            if r.get("candidate_github_url"):
                r["candidates"]["github_url"] = r.pop("candidate_github_url")
        else:
            for k in ["candidate_name", "candidate_email", "candidate_github_url"]:
                r.pop(k, None)
        if r.get("job_title"):
            s = r.get("job_required_skills")
            if isinstance(s, str):
                try: s = json.loads(s)
                except: s = []
            r["jobs"] = {"title": r.pop("job_title"), "required_skills": s or [], "description": r.pop("job_description", None)}
        else:
            for k in ["job_title", "job_required_skills", "job_description"]:
                r.pop(k, None)
        for f in ["context", "evaluation", "required_skills", "preferred_skills", "tech_stack", "skills"]:
            if f in r and isinstance(r[f], str):
                try: r[f] = json.loads(r[f])
                except: pass
        return r

    def close(self):
        if self._conn and not self._conn.closed:
            self._conn.close()


db = Database()
