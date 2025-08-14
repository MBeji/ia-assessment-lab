import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import fs from 'fs';

type Data = {
  templates: any[];
  assessments: any[];
  responses: any[]; // flattened
  scoreplans?: { assessmentId: string; scorecard: any; plan: any; savedAt: string }[];
};

const dataDir = path.join(process.cwd(), 'data');
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const adapter = new JSONFile<Data>(path.join(dataDir, 'db.json'));
const db = new Low<Data>(adapter, { templates: [], assessments: [], responses: [], scoreplans: [] });
await db.read();
if(!db.data) db.data = { templates: [], assessments: [], responses: [] };

export async function upsertTemplate(tpl: any){
  const existing = db.data!.templates.find(t => t.id === tpl.id);
  if (existing) Object.assign(existing, tpl, { updatedAt: new Date().toISOString() }); else db.data!.templates.push({ ...tpl, updatedAt: new Date().toISOString() });
  await db.write();
}

export async function saveAssessment(a:any){
  const existing = db.data!.assessments.find(x => x.id === a.id);
  if(existing) Object.assign(existing, a); else db.data!.assessments.push(a);
  await db.write();
}

export async function bulkSaveResponses(rows:any[]){
  const byId = new Map(rows.map(r => [r.id, r]));
  db.data!.responses = db.data!.responses.filter(r => !byId.has(r.id));
  db.data!.responses.push(...rows);
  await db.write();
}

export function listAssessments(){
  return [...db.data!.assessments].sort((a,b)=> new Date(b.startedAt).getTime()-new Date(a.startedAt).getTime());
}

export function getAssessment(id:string){
  return db.data!.assessments.find(a => a.id === id) || null;
}

export function listResponses(assessmentId:string){
  return db.data!.responses.filter(r => r.assessmentId === assessmentId);
}

export async function saveScorePlan(assessmentId:string, scorecard:any, plan:any){
  const arr = db.data!.scoreplans || (db.data!.scoreplans = []);
  const existing = arr.find(x => x.assessmentId === assessmentId);
  if(existing) { existing.scorecard = scorecard; existing.plan = plan; existing.savedAt = new Date().toISOString(); }
  else arr.push({ assessmentId, scorecard, plan, savedAt: new Date().toISOString() });
  await db.write();
}
