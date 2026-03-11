// ── Loom: calculate-compatibility Edge Function ──────────────────────────────
// Called after a user finishes answering questions.
// Computes pairwise compatibility scores between `userId` and every other
// user who has answered ≥ 10 questions, then upserts into compatibility_scores.
//
// Deploy: supabase functions deploy calculate-compatibility

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Question definitions (mirrors constants/questions.ts) ────────────────────
const QS = [
  {id:1,  cat:"Values",       type:"choice", opts:5, w:3},
  {id:2,  cat:"Values",       type:"choice", opts:5, w:3},
  {id:3,  cat:"Values",       type:"scale",          w:3},
  {id:4,  cat:"Values",       type:"choice", opts:5, w:2},
  {id:5,  cat:"Values",       type:"choice", opts:5, w:2},
  {id:6,  cat:"Values",       type:"scale",          w:2},
  {id:7,  cat:"Values",       type:"choice", opts:5, w:2},
  {id:8,  cat:"Values",       type:"scale",          w:1},
  {id:9,  cat:"Values",       type:"choice", opts:5, w:3},
  {id:10, cat:"Values",       type:"choice", opts:5, w:2},
  {id:11, cat:"Values",       type:"choice", opts:5, w:2},
  {id:12, cat:"Values",       type:"scale",          w:1},
  {id:13, cat:"Values",       type:"scale",          w:1},
  {id:14, cat:"Values",       type:"choice", opts:5, w:2},
  {id:15, cat:"Values",       type:"scale",          w:2},
  {id:16, cat:"Communication",type:"choice", opts:5, w:2},
  {id:17, cat:"Communication",type:"choice", opts:5, w:2},
  {id:18, cat:"Communication",type:"scale",          w:1},
  {id:19, cat:"Communication",type:"scale",          w:2},
  {id:20, cat:"Communication",type:"choice", opts:5, w:1},
  {id:21, cat:"Communication",type:"choice", opts:5, w:2},
  {id:22, cat:"Communication",type:"choice", opts:5, w:2},
  {id:23, cat:"Communication",type:"choice", opts:5, w:2},
  {id:24, cat:"Communication",type:"scale",          w:1},
  {id:25, cat:"Communication",type:"choice", opts:5, w:1},
  {id:26, cat:"Communication",type:"scale",          w:1},
  {id:27, cat:"Communication",type:"choice", opts:5, w:2},
  {id:28, cat:"Communication",type:"choice", opts:5, w:1},
  {id:29, cat:"Communication",type:"scale",          w:1},
  {id:30, cat:"Communication",type:"choice", opts:5, w:1},
  {id:31, cat:"Lifestyle",    type:"choice", opts:5, w:1},
  {id:32, cat:"Lifestyle",    type:"choice", opts:5, w:1},
  {id:33, cat:"Lifestyle",    type:"scale",          w:2},
  {id:34, cat:"Lifestyle",    type:"choice", opts:5, w:2},
  {id:35, cat:"Lifestyle",    type:"choice", opts:5, w:2},
  {id:36, cat:"Lifestyle",    type:"scale",          w:1},
  {id:37, cat:"Lifestyle",    type:"choice", opts:5, w:1},
  {id:38, cat:"Lifestyle",    type:"choice", opts:5, w:2},
  {id:39, cat:"Lifestyle",    type:"choice", opts:5, w:1},
  {id:40, cat:"Lifestyle",    type:"choice", opts:5, w:1},
  {id:41, cat:"Lifestyle",    type:"choice", opts:5, w:1},
  {id:42, cat:"Lifestyle",    type:"choice", opts:5, w:2},
  {id:43, cat:"Lifestyle",    type:"scale",          w:2},
  {id:44, cat:"Lifestyle",    type:"scale",          w:1},
  {id:45, cat:"Lifestyle",    type:"choice", opts:5, w:1},
  {id:46, cat:"Lifestyle",    type:"choice", opts:5, w:1},
  {id:47, cat:"Lifestyle",    type:"scale",          w:1},
  {id:48, cat:"Lifestyle",    type:"choice", opts:5, w:1},
  {id:49, cat:"Lifestyle",    type:"scale",          w:1},
  {id:50, cat:"Lifestyle",    type:"choice", opts:5, w:1},
  {id:51, cat:"Finances",     type:"scale",          w:2},
  {id:52, cat:"Finances",     type:"choice", opts:5, w:2},
  {id:53, cat:"Finances",     type:"choice", opts:5, w:1},
  {id:54, cat:"Finances",     type:"choice", opts:5, w:2},
  {id:55, cat:"Finances",     type:"scale",          w:1},
  {id:56, cat:"Finances",     type:"choice", opts:5, w:1},
  {id:57, cat:"Finances",     type:"scale",          w:2},
  {id:58, cat:"Finances",     type:"choice", opts:5, w:2},
  {id:59, cat:"Finances",     type:"choice", opts:5, w:1},
  {id:60, cat:"Finances",     type:"choice", opts:5, w:1},
  {id:61, cat:"Intimacy",     type:"scale",          w:2},
  {id:62, cat:"Intimacy",     type:"scale",          w:2},
  {id:63, cat:"Intimacy",     type:"choice", opts:5, w:1},
  {id:64, cat:"Intimacy",     type:"scale",          w:1},
  {id:65, cat:"Intimacy",     type:"choice", opts:5, w:2},
  {id:66, cat:"Intimacy",     type:"scale",          w:1},
  {id:67, cat:"Intimacy",     type:"scale",          w:2},
  {id:68, cat:"Intimacy",     type:"choice", opts:5, w:1},
  {id:69, cat:"Intimacy",     type:"choice", opts:5, w:1},
  {id:70, cat:"Intimacy",     type:"choice", opts:5, w:1},
  {id:71, cat:"Intimacy",     type:"scale",          w:1},
  {id:72, cat:"Intimacy",     type:"choice", opts:5, w:2},
  {id:73, cat:"Family",       type:"scale",          w:2},
  {id:74, cat:"Family",       type:"choice", opts:5, w:1},
  {id:75, cat:"Family",       type:"choice", opts:5, w:1},
  {id:76, cat:"Family",       type:"choice", opts:5, w:1},
  {id:77, cat:"Family",       type:"scale",          w:1},
  {id:78, cat:"Family",       type:"choice", opts:5, w:1},
  {id:79, cat:"Family",       type:"choice", opts:5, w:2},
  {id:80, cat:"Family",       type:"choice", opts:5, w:1},
  {id:81, cat:"Family",       type:"choice", opts:5, w:2},
  {id:82, cat:"Family",       type:"choice", opts:5, w:2},
  {id:83, cat:"Family",       type:"choice", opts:5, w:2},
  {id:84, cat:"Family",       type:"choice", opts:5, w:2},
  {id:85, cat:"Family",       type:"scale",          w:1},
  {id:86, cat:"Growth",       type:"choice", opts:5, w:2},
  {id:87, cat:"Growth",       type:"scale",          w:1},
  {id:88, cat:"Growth",       type:"choice", opts:5, w:1},
  {id:89, cat:"Growth",       type:"scale",          w:1},
  {id:90, cat:"Growth",       type:"choice", opts:5, w:2},
  {id:91, cat:"Growth",       type:"choice", opts:5, w:2},
  {id:92, cat:"Growth",       type:"choice", opts:5, w:2},
  {id:93, cat:"Growth",       type:"scale",          w:1},
  {id:94, cat:"Growth",       type:"scale",          w:1},
  {id:95, cat:"Growth",       type:"scale",          w:1},
  {id:96, cat:"Dealbreakers", type:"choice", opts:5, w:3},
  {id:97, cat:"Dealbreakers", type:"choice", opts:5, w:2},
  {id:98, cat:"Dealbreakers", type:"scale",          w:2},
  {id:99, cat:"Dealbreakers", type:"choice", opts:5, w:2},
  {id:100,cat:"Dealbreakers", type:"choice", opts:5, w:3},
] as const;

type QDef = typeof QS[number];

type AMap = Record<number, number>;

const CATS = ["Values","Communication","Lifestyle","Finances","Intimacy","Family","Growth","Dealbreakers"] as const;

function calcCompat(aAnswers: AMap, bAnswers: AMap) {
  let totalScore = 0;
  let totalWeight = 0;
  const catAcc: Record<string, { s: number; w: number }> = {};
  CATS.forEach(c => { catAcc[c] = { s: 0, w: 0 }; });

  for (const q of QS) {
    const ua = aAnswers[q.id];
    const ub = bAnswers[q.id];
    if (ua === undefined || ub === undefined) continue;

    let similarity: number;
    if (q.type === 'scale') {
      similarity = 1 - Math.abs(ua - ub) / 9;
    } else {
      similarity = 1 - Math.abs(ua - ub) / ((q as any).opts - 1);
    }

    const weighted = similarity * q.w;
    totalScore  += weighted;
    totalWeight += q.w;
    catAcc[q.cat].s += weighted;
    catAcc[q.cat].w += q.w;
  }

  const overall = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  const cats: Record<string, number> = {};
  for (const c of CATS) {
    cats[c] = catAcc[c].w > 0
      ? Math.round((catAcc[c].s / catAcc[c].w) * 100)
      : 0;
  }
  return { overall, cats };
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json() as { userId: string };
    if (!userId) throw new Error('userId is required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Load user A's answers
    const { data: aRows, error: aErr } = await supabase
      .from('question_answers')
      .select('question_id, answer')
      .eq('user_id', userId);
    if (aErr) throw aErr;

    const aAnswers: AMap = {};
    (aRows ?? []).forEach(r => { aAnswers[r.question_id] = r.answer; });

    if (Object.keys(aAnswers).length < 10) {
      return new Response(
        JSON.stringify({ message: 'Not enough answers to calculate compatibility.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    // 2. Find all other users who have ≥ 10 answers
    const { data: otherUsers, error: ouErr } = await supabase
      .from('question_answers')
      .select('user_id')
      .neq('user_id', userId);
    if (ouErr) throw ouErr;

    const otherIds = [...new Set((otherUsers ?? []).map(r => r.user_id))];

    if (otherIds.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No other users to compare against yet.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    // 3. Load all answers for the other users in one query
    const { data: bRows, error: bErr } = await supabase
      .from('question_answers')
      .select('user_id, question_id, answer')
      .in('user_id', otherIds);
    if (bErr) throw bErr;

    // Group by user
    const bAnswersByUser: Record<string, AMap> = {};
    for (const r of bRows ?? []) {
      if (!bAnswersByUser[r.user_id]) bAnswersByUser[r.user_id] = {};
      bAnswersByUser[r.user_id][r.question_id] = r.answer;
    }

    // 4. Compute + upsert scores
    const upsertRows = [];
    for (const bid of otherIds) {
      const bAnswers = bAnswersByUser[bid] ?? {};
      if (Object.keys(bAnswers).length < 10) continue;

      const { overall, cats } = calcCompat(aAnswers, bAnswers);

      // Upsert A→B
      upsertRows.push({
        user_a:            userId,
        user_b:            bid,
        overall,
        cat_values:        cats['Values']        ?? 0,
        cat_communication: cats['Communication'] ?? 0,
        cat_lifestyle:     cats['Lifestyle']     ?? 0,
        cat_finances:      cats['Finances']      ?? 0,
        cat_intimacy:      cats['Intimacy']      ?? 0,
        cat_family:        cats['Family']        ?? 0,
        cat_growth:        cats['Growth']        ?? 0,
        cat_dealbreakers:  cats['Dealbreakers']  ?? 0,
        calculated_at:     new Date().toISOString(),
      });

      // Also compute reverse B→A (same score, symmetric)
      upsertRows.push({
        user_a:            bid,
        user_b:            userId,
        overall,
        cat_values:        cats['Values']        ?? 0,
        cat_communication: cats['Communication'] ?? 0,
        cat_lifestyle:     cats['Lifestyle']     ?? 0,
        cat_finances:      cats['Finances']      ?? 0,
        cat_intimacy:      cats['Intimacy']      ?? 0,
        cat_family:        cats['Family']        ?? 0,
        cat_growth:        cats['Growth']        ?? 0,
        cat_dealbreakers:  cats['Dealbreakers']  ?? 0,
        calculated_at:     new Date().toISOString(),
      });
    }

    if (upsertRows.length > 0) {
      const { error: upsErr } = await supabase
        .from('compatibility_scores')
        .upsert(upsertRows, { onConflict: 'user_a,user_b' });
      if (upsErr) throw upsErr;
    }

    return new Response(
      JSON.stringify({ computed: upsertRows.length / 2 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
