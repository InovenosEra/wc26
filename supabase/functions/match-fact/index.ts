import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { homeTeam, awayTeam, stadium, city, stage } = await req.json();

    if (!homeTeam || !awayTeam) {
      throw new Error('Home team and away team are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating fact for: ${homeTeam} vs ${awayTeam} at ${stadium}, ${city}`);

    // Use a random seed to ensure variety
    const randomSeed = Math.floor(Math.random() * 100);
    
    const prompt = `Generate ONE fascinating, specific football fact. Random seed: ${randomSeed}.

RANDOMLY select ONE category from this list (use the random seed to vary your choice):
1. HEAD-TO-HEAD HISTORY: A memorable past encounter between ${homeTeam} and ${awayTeam} in any competition
2. TEAM LEGEND: A legendary player from ${homeTeam} or ${awayTeam} and their iconic moment
3. WORLD CUP GLORY: ${homeTeam}'s or ${awayTeam}'s greatest World Cup achievement or heartbreak
4. TACTICAL IDENTITY: The distinctive playing style or formation ${homeTeam} or ${awayTeam} is known for
5. MANAGER STORY: An interesting fact about either team's current or legendary manager
6. STADIUM/VENUE: ${stadium ? `An interesting fact about ${stadium} in ${city}` : 'A memorable World Cup venue moment involving either team'}
7. NATIONAL PRIDE: A cultural or historical connection between football and ${homeTeam} or ${awayTeam}
8. RECORD BREAKER: A unique record held by ${homeTeam}, ${awayTeam}, or one of their players
9. UNDERDOG STORY: A surprising upset or underdog victory involving either team
10. RIVALRY: Any notable rivalry or intense match involving ${homeTeam} or ${awayTeam}
11. YOUNG TALENT: An emerging star or promising young player from either squad
12. GOALSCORING: A memorable goal or top scorer fact from either national team
13. DEFENSIVE PROWESS: A clean sheet record or legendary defender from either team
14. WORLD CUP DEBUT: When ${homeTeam} or ${awayTeam} first appeared in a World Cup
15. QUALIFICATION: An interesting story from either team's World Cup qualification journey

Requirements:
- Pick a DIFFERENT category each time - be unpredictable!
- The fact MUST be specifically about ${homeTeam} or ${awayTeam}
- Maximum 2 sentences, make it punchy and memorable
- Be factually accurate based on real football history
- Make it engaging - surprise the reader with something they might not know
- Do NOT use generic phrases like "this will be an exciting match"
- Focus on ONE specific detail, not broad summaries

${stadium ? `Venue: ${stadium}, ${city}` : ''}
${stage ? `Tournament stage: ${stage}` : ''}

Provide ONLY the fact, no introduction or quotation marks.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a knowledgeable football historian specializing in FIFA World Cup history. You provide accurate, specific, and interesting facts about national teams and their World Cup performances. Never make up statistics - only share real, verifiable information.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          fact: `${homeTeam} and ${awayTeam} face off in what promises to be a thrilling World Cup encounter.`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(JSON.stringify({ 
          error: 'Payment required',
          fact: `${homeTeam} takes on ${awayTeam} in this World Cup 2026 clash.`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      throw new Error(`Lovable AI API error: ${response.status}`);
    }

    const data = await response.json();
    const fact = data.choices?.[0]?.message?.content || `${homeTeam} and ${awayTeam} meet in an exciting World Cup encounter.`;

    console.log('Generated fact:', fact);

    return new Response(JSON.stringify({ fact }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in match-fact function:', errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      fact: 'Get ready for an exciting World Cup match between these two nations!'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
