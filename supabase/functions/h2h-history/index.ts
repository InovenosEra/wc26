import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { homeTeam, awayTeam } = await req.json();

    if (!homeTeam || !awayTeam) {
      throw new Error('Both teams are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Fetching H2H history for: ${homeTeam} vs ${awayTeam}`);

    const prompt = `Provide historical FIFA World Cup match data between ${homeTeam} and ${awayTeam}.

Return a JSON object with this EXACT structure (no markdown, just raw JSON):
{
  "totalMatches": <number of World Cup matches between these teams>,
  "team1Wins": <number of wins for ${homeTeam}>,
  "team2Wins": <number of wins for ${awayTeam}>,
  "draws": <number of draws>,
  "matches": [
    {
      "year": <year as number>,
      "tournament": "<e.g., 'World Cup 1998', 'World Cup 2014'>",
      "stage": "<e.g., 'Group Stage', 'Final', 'Quarter-final'>",
      "team1Score": <score for ${homeTeam}>,
      "team2Score": <score for ${awayTeam}>,
      "venue": "<city and country>",
      "winner": "<team name or 'Draw'>"
    }
  ],
  "notableStats": "<One sentence about a notable stat or record between these teams in World Cups>"
}

IMPORTANT:
- Only include ACTUAL FIFA World Cup matches (not qualifiers, friendlies, or other tournaments)
- If these teams have never met in a World Cup, return totalMatches: 0 with an empty matches array
- Order matches from most recent to oldest
- Be factually accurate - only include matches that actually happened
- Return ONLY the JSON object, no explanation or markdown`;

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
            content: 'You are a football statistics expert with accurate knowledge of all FIFA World Cup matches. You provide data in valid JSON format only. Never include markdown formatting or code blocks.' 
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
          history: null
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(JSON.stringify({ 
          error: 'Payment required',
          history: null
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
    let content = data.choices?.[0]?.message?.content || '';
    
    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Raw AI response:', content);

    try {
      const history = JSON.parse(content);
      console.log('Parsed history:', history);
      
      return new Response(JSON.stringify({ history }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse response',
        history: null
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in h2h-history function:', errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      history: null
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
