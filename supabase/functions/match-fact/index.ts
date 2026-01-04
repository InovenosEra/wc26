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

    const prompt = `Generate ONE fascinating, specific football fact about the matchup between ${homeTeam} and ${awayTeam}.

Choose ONE of these categories and make it SPECIFIC to these two teams:
1. Head-to-head World Cup history (if they've met before in a World Cup)
2. A notable player from either team and their World Cup achievements
3. An interesting statistic comparing these two national teams
4. Historical context about either team's World Cup journey
5. A record held by either team in World Cup competitions

Requirements:
- The fact MUST be specifically about ${homeTeam} or ${awayTeam} - not generic football facts
- Maximum 2 sentences
- Be factually accurate based on real football/World Cup history
- Make it engaging and something fans would find interesting
- Do NOT use generic phrases like "this will be an exciting match"

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
