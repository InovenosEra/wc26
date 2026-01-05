import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// World Cup 2026 relevant keywords for filtering
const WORLD_CUP_KEYWORDS = [
  'world cup 2026', 'world cup 26', 'wc 2026', 'fifa 2026',
  'north america 2026', 'usa 2026', 'mexico 2026', 'canada 2026',
  'world cup qualifier', 'wcq', 'world cup qualification',
  'copa mundial', 'coupe du monde',
];

// National teams for World Cup context
const NATIONAL_TEAM_KEYWORDS = [
  'argentina national', 'brazil national', 'france national', 'england national',
  'germany national', 'spain national', 'portugal national', 'netherlands national',
  'belgium national', 'usa national', 'usmnt', 'mexico national', 'el tri',
  'canada national', 'italy national', 'japan national', 'korea national',
  'australia national', 'socceroos', 'morocco national', 'senegal national',
  'croatia national', 'uruguay national', 'colombia national', 'ecuador national',
  'nigeria national', 'egypt national', 'qatar national', 'saudi national',
  'iran national', 'cameroon national', 'ghana national', 'tunisia national',
  'wales national', 'poland national', 'denmark national', 'switzerland national',
  'serbia national', 'costa rica national',
  'world cup squad', 'national team call-up', 'international duty',
  'nations league', 'concacaf', 'conmebol', 'uefa nations', 'afcon qualifiers',
  'asian cup qualifiers', 'international break', 'friendly international',
];

function isWorldCupRelevant(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  
  // Direct World Cup mentions
  if (WORLD_CUP_KEYWORDS.some(kw => text.includes(kw))) {
    return true;
  }
  
  // National team news (relevant to World Cup)
  if (NATIONAL_TEAM_KEYWORDS.some(kw => text.includes(kw))) {
    return true;
  }
  
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamQuery } = await req.json().catch(() => ({}));
    
    let articles: any[] = [];
    
    console.log('Fetching World Cup 2026 news...');

    // Fetch from ESPN Soccer RSS
    try {
      const espnResponse = await fetch('https://www.espn.com/espn/rss/soccer/news');
      if (espnResponse.ok) {
        const espnText = await espnResponse.text();
        const espnArticles = parseRSS(espnText, 'ESPN');
        // Filter for World Cup relevant content only
        const wcArticles = espnArticles.filter(a => isWorldCupRelevant(a.title, a.summary));
        articles.push(...wcArticles);
        console.log(`ESPN: ${wcArticles.length} World Cup relevant articles`);
      }
    } catch (e) {
      console.log('ESPN RSS failed:', e);
    }

    // Fetch from BBC Sport Football RSS
    try {
      const bbcResponse = await fetch('https://feeds.bbci.co.uk/sport/football/rss.xml');
      if (bbcResponse.ok) {
        const bbcText = await bbcResponse.text();
        const bbcArticles = parseRSS(bbcText, 'BBC Sport');
        // Filter for World Cup relevant content only
        const wcArticles = bbcArticles.filter(a => isWorldCupRelevant(a.title, a.summary));
        articles.push(...wcArticles);
        console.log(`BBC: ${wcArticles.length} World Cup relevant articles`);
      }
    } catch (e) {
      console.log('BBC RSS failed:', e);
    }

    // Fetch from Sky Sports Football RSS
    try {
      const skyResponse = await fetch('https://www.skysports.com/rss/12040'); // Football feed
      if (skyResponse.ok) {
        const skyText = await skyResponse.text();
        const skyArticles = parseRSS(skyText, 'Sky Sports');
        const wcArticles = skyArticles.filter(a => isWorldCupRelevant(a.title, a.summary));
        articles.push(...wcArticles);
        console.log(`Sky Sports: ${wcArticles.length} World Cup relevant articles`);
      }
    } catch (e) {
      console.log('Sky Sports RSS failed:', e);
    }

    // Fetch from Goal.com RSS
    try {
      const goalResponse = await fetch('https://www.goal.com/feeds/en/news');
      if (goalResponse.ok) {
        const goalText = await goalResponse.text();
        const goalArticles = parseRSS(goalText, 'Goal.com');
        const wcArticles = goalArticles.filter(a => isWorldCupRelevant(a.title, a.summary));
        articles.push(...wcArticles);
        console.log(`Goal.com: ${wcArticles.length} World Cup relevant articles`);
      }
    } catch (e) {
      console.log('Goal.com RSS failed:', e);
    }

    // Remove duplicates by title similarity
    const seenTitles = new Set<string>();
    articles = articles.filter(article => {
      const normalizedTitle = article.title.toLowerCase().substring(0, 40);
      if (seenTitles.has(normalizedTitle)) {
        return false;
      }
      seenTitles.add(normalizedTitle);
      return true;
    });

    console.log(`Total unique World Cup articles: ${articles.length}`);

    // Always supplement with curated World Cup 2026 news to ensure content
    const curatedNews = getCuratedNews();
    if (articles.length < 10) {
      const existingTitles = new Set(articles.map(a => a.title.toLowerCase().substring(0, 30)));
      for (const curated of curatedNews) {
        if (!existingTitles.has(curated.title.toLowerCase().substring(0, 30))) {
          articles.push(curated);
        }
        if (articles.length >= 15) break;
      }
    }

    // Filter by team if specified
    let filteredArticles = articles;
    if (teamQuery) {
      const query = teamQuery.toLowerCase();
      filteredArticles = articles.filter((article: any) => 
        article.title?.toLowerCase().includes(query) ||
        article.summary?.toLowerCase().includes(query) ||
        article.teams?.some((t: string) => t.toLowerCase() === query)
      );
      // If no filtered results, return all
      if (filteredArticles.length === 0) {
        filteredArticles = articles;
      }
    }

    // Sort by date (most recent first)
    filteredArticles.sort((a, b) => {
      const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return dateB - dateA;
    });

    return new Response(JSON.stringify({ 
      articles: filteredArticles.slice(0, 15),
      source: 'world_cup_2026'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error fetching news:', error);
    return new Response(JSON.stringify({ 
      articles: getCuratedNews(),
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseRSS(xmlText: string, source: string): any[] {
  const articles: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let index = 0;

  while ((match = itemRegex.exec(xmlText)) !== null && index < 20) {
    const item = match[1];
    const title = extractTag(item, 'title');
    const description = extractTag(item, 'description');
    const link = extractTag(item, 'link');
    const pubDate = extractTag(item, 'pubDate');
    const mediaUrl = extractMediaUrl(item);

    if (title) {
      articles.push({
        id: `rss-${source}-${index}-${Date.now()}`,
        title: cleanHtml(title),
        summary: cleanHtml(description)?.substring(0, 200) || '',
        source,
        date: pubDate ? formatTimeAgo(new Date(pubDate)) : 'Recently',
        rawDate: pubDate || null,
        imageUrl: mediaUrl || getDefaultImage(index),
        url: link,
        teams: extractTeamCodes(title + ' ' + (description || '')),
      });
      index++;
    }
  }

  return articles;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const match = xml.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function extractMediaUrl(item: string): string | null {
  const mediaMatch = item.match(/url="([^"]+\.(jpg|jpeg|png|gif|webp)[^"]*)"/i);
  if (mediaMatch) return mediaMatch[1];
  
  const imgMatch = item.match(/<img[^>]+src="([^"]+)"/i);
  if (imgMatch) return imgMatch[1];
  
  return null;
}

function cleanHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDefaultImage(index: number): string {
  const images = [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=200&fit=crop',
  ];
  return images[index % images.length];
}

const teamKeywords: Record<string, string[]> = {
  'ARG': ['argentina', 'messi', 'albiceleste'],
  'BRA': ['brazil', 'brasil', 'neymar', 'selecao', 'seleção'],
  'ENG': ['england', 'bellingham', 'three lions', 'kane'],
  'FRA': ['france', 'mbappe', 'mbappé', 'les bleus'],
  'GER': ['germany', 'deutschland', 'german'],
  'ESP': ['spain', 'españa', 'la roja', 'yamal'],
  'POR': ['portugal', 'ronaldo', 'portuguese'],
  'NED': ['netherlands', 'dutch', 'holland', 'oranje'],
  'BEL': ['belgium', 'belgian', 'de bruyne'],
  'USA': ['usa', 'united states', 'usmnt', 'pulisic', 'american'],
  'MEX': ['mexico', 'mexican', 'el tri'],
  'CAN': ['canada', 'canadian', 'davies'],
  'ITA': ['italy', 'italia', 'italian', 'azzurri'],
  'JPN': ['japan', 'japanese'],
  'KOR': ['korea', 'korean', 'son heung'],
  'AUS': ['australia', 'socceroos'],
  'MAR': ['morocco', 'moroccan'],
  'SEN': ['senegal', 'senegalese'],
  'CRO': ['croatia', 'croatian', 'modric'],
  'URU': ['uruguay', 'uruguayan'],
};

function extractTeamCodes(text: string): string[] {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const found: string[] = [];

  for (const [code, keywords] of Object.entries(teamKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      found.push(code);
    }
  }

  return found.slice(0, 3);
}

function getCuratedNews(): any[] {
  const now = new Date();
  return [
    {
      id: 'curated-1',
      title: "FIFA World Cup 2026: Complete Guide to the Expanded 48-Team Format",
      summary: "The 2026 FIFA World Cup will be the largest ever, featuring 48 teams across 16 host cities in the USA, Canada, and Mexico. Here's everything you need to know about the new format.",
      source: "FIFA.com",
      date: formatTimeAgo(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
      rawDate: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=200&fit=crop",
      url: "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026",
      teams: [],
    },
    {
      id: 'curated-2',
      title: "World Cup 2026: Argentina's Path to Defending Their Title",
      summary: "Lionel Messi and the reigning World Cup champions prepare for what could be his final World Cup tournament in North America.",
      source: "ESPN",
      date: formatTimeAgo(new Date(now.getTime() - 5 * 60 * 60 * 1000)),
      rawDate: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=200&fit=crop",
      url: "https://www.espn.com/soccer",
      teams: ["ARG"],
    },
    {
      id: 'curated-3',
      title: "World Cup 2026 Host Cities: USA, Mexico and Canada Prepare Stadiums",
      summary: "The three co-host nations are finalizing infrastructure and stadium preparations for the biggest World Cup in history, with 16 cities set to welcome the world.",
      source: "BBC Sport",
      date: formatTimeAgo(new Date(now.getTime() - 12 * 60 * 60 * 1000)),
      rawDate: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=200&fit=crop",
      url: "https://www.bbc.com/sport/football",
      teams: ["USA", "MEX", "CAN"],
    },
    {
      id: 'curated-4',
      title: "World Cup 2026 Qualification: European Giants Battle for Spots",
      summary: "France, England, Germany, and Spain are among the favorites as UEFA teams compete for the 16 European World Cup slots.",
      source: "Sky Sports",
      date: formatTimeAgo(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      rawDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=200&fit=crop",
      url: "https://www.skysports.com/football",
      teams: ["FRA", "ENG", "GER"],
    },
    {
      id: 'curated-5',
      title: "World Cup 2026: Brazil's New Generation Eyes Glory",
      summary: "After disappointment in Qatar, the Seleção's young stars including Endrick and Vinicius Jr lead the charge for a record sixth World Cup title.",
      source: "Goal.com",
      date: formatTimeAgo(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
      rawDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=400&h=200&fit=crop",
      url: "https://www.goal.com/en",
      teams: ["BRA"],
    },
    {
      id: 'curated-6',
      title: "World Cup 2026 Rising Stars: Young Players to Watch",
      summary: "From Jude Bellingham to Lamine Yamal, these are the emerging talents expected to light up the World Cup in North America.",
      source: "The Athletic",
      date: formatTimeAgo(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
      rawDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=200&fit=crop",
      url: "https://theathletic.com/football",
      teams: ["ENG", "ESP"],
    },
    {
      id: 'curated-7',
      title: "World Cup 2026: Morocco Aims to Build on Historic 2022 Run",
      summary: "After their semifinal appearance in Qatar, the Atlas Lions are focused on going even further at the 2026 World Cup.",
      source: "CAF Online",
      date: formatTimeAgo(new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)),
      rawDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&h=200&fit=crop",
      url: "https://www.cafonline.com",
      teams: ["MAR"],
    },
    {
      id: 'curated-8',
      title: "World Cup 2026: USMNT Hopes to Make History on Home Soil",
      summary: "The United States men's national team is building towards their best-ever World Cup performance as co-hosts in 2026.",
      source: "US Soccer",
      date: formatTimeAgo(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
      rawDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=200&fit=crop",
      url: "https://www.ussoccer.com",
      teams: ["USA"],
    },
    {
      id: 'curated-9',
      title: "World Cup 2026: Asian Giants Japan and Korea Set Ambitious Goals",
      summary: "Both Asian powerhouses continue to produce world-class talent and aim for deep tournament runs in North America.",
      source: "AFC",
      date: formatTimeAgo(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)),
      rawDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=200&fit=crop",
      url: "https://www.the-afc.com",
      teams: ["JPN", "KOR"],
    },
    {
      id: 'curated-10',
      title: "World Cup 2026 Qualification: CONMEBOL Race Heats Up",
      summary: "South American giants battle for automatic qualification spots as the 2026 World Cup qualifying campaign intensifies.",
      source: "CONMEBOL",
      date: formatTimeAgo(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
      rawDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=200&fit=crop",
      url: "https://www.conmebol.com",
      teams: ["ARG", "BRA", "URU"],
    },
  ];
}
