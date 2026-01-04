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

    const prompt = `Generate one short, interesting football/soccer fact about either ${homeTeam} or ${awayTeam} that would be relevant for a FIFA World Cup 2026 match between them at ${stadium || 'the stadium'} in ${city || 'the host city'}. 

The fact should be:
- About World Cup history, head-to-head records, notable players, or interesting trivia
- Maximum 2 sentences
- Engaging and informative
- Factually accurate based on real football history

Stage: ${stage || 'Group Stage'}

Just provide the fact directly, no introduction or quotation marks.`;

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
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
            content: 'You are a knowledgeable football historian who provides interesting and accurate facts about World Cup matches and teams.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', errorText);
      throw new Error(`Lovable AI API error: ${response.status}`);
    }

    const data = await response.json();
    const fact = data.choices?.[0]?.message?.content || 'An exciting World Cup match awaits!';

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
      status: 200, // Return 200 with fallback fact
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
