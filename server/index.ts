import express from 'express';
import cors from 'cors';
import { upsertTemplate, saveAssessment, bulkSaveResponses, listAssessments, getAssessment, listResponses, saveScorePlan } from './db';
import { TEMPLATES } from '../src/data/templates';

const app = express();
app.use(cors());
app.use(express.json({limit:'2mb'}));

// Optional API key protection
const API_KEY = process.env.API_KEY;
app.use((req,res,next)=> {
  if (API_KEY && req.headers['x-api-key'] !== API_KEY) return res.status(401).json({error:'unauthorized'});
  next();
});

// Seed templates endpoint
app.post('/api/sync/templates', async (req,res)=>{
  try { for (const t of TEMPLATES) await upsertTemplate(t as any); res.json({ok:true, count: TEMPLATES.length}); }
  catch(e:any){ res.status(500).json({error:e.message}); }
});

app.get('/api/assessments', (req,res)=>{
  try { res.json(listAssessments()); } catch(e:any){ res.status(500).json({error:e.message}); }
});

app.get('/api/assessments/:id', (req,res)=>{
  const a = getAssessment(req.params.id);
  if(!a) return res.status(404).json({error:'not found'});
  res.json(a);
});

app.get('/api/assessments/:id/responses', (req,res)=>{
  try { res.json(listResponses(req.params.id)); } catch(e:any){ res.status(500).json({error:e.message}); }
});

// Upsert assessment & responses in one call
app.post('/api/assessments', async (req,res)=>{
  try {
    const { assessment, responses } = req.body;
    if(!assessment) return res.status(400).json({error:'assessment missing'});
    await saveAssessment(assessment);
    if(Array.isArray(responses) && responses.length) await bulkSaveResponses(responses);
    res.json({ok:true});
  } catch(e:any){ res.status(500).json({error:e.message}); }
});

// Persist scorecard + plan
app.post('/api/assessments/:id/scoreplan', async (req,res)=>{
  try {
    const { scorecard, plan } = req.body;
    await saveScorePlan(req.params.id, scorecard, plan);
    res.json({ok:true});
  } catch(e:any){ res.status(500).json({error:e.message}); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log('API server running on :' + PORT));
