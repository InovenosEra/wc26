import { useState, useEffect, useRef } from 'react';
import { Newspaper, ExternalLink, Clock, Filter, X, Search, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
}

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  imageUrl: string;
  url?: string;
  teams: string[];
}

export function NewsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTeams();
    fetchNews();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, code, flag_url')
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchNews = async (teamQuery?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { teamQuery },
      });

      if (error) throw error;
      setNews(data?.articles || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter teams based on search query
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNews = selectedTeam
    ? news.filter(article => 
        article.teams?.includes(selectedTeam) || (article.teams?.length === 0)
      )
    : news;

  const clearFilter = () => {
    setSelectedTeam(null);
    setSearchQuery('');
    fetchNews();
  };

  const selectTeam = (team: Team) => {
    setSelectedTeam(team.code);
    setSearchQuery(team.name);
    setShowSuggestions(false);
  };

  const handleRefresh = () => {
    fetchNews(selectedTeam || undefined);
  };

  const openArticle = (url?: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Latest News</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          {selectedTeam && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              className="h-7 px-2 text-xs gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Team Search with Autocomplete */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="w-3 h-3" />
          <span>Filter by team</span>
        </div>
        
        <div ref={searchRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search team name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                if (!e.target.value) {
                  setSelectedTeam(null);
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              className="pl-9 h-10 bg-card border-border"
              maxLength={50}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTeam(null);
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {/* Autocomplete Suggestions */}
          {showSuggestions && searchQuery && filteredTeams.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
              {filteredTeams.slice(0, 8).map((team) => (
                <button
                  key={team.id}
                  onClick={() => selectTeam(team)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left",
                    selectedTeam === team.code && "bg-primary/10"
                  )}
                >
                  {team.flag_url && (
                    <img 
                      src={team.flag_url} 
                      alt={team.name}
                      className="w-6 h-4 object-cover rounded-sm"
                    />
                  )}
                  <span className="text-sm">{team.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{team.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Team Filter */}
      <div className="space-y-2">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {teams.map((team) => (
              <Button
                key={team.id}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTeam(selectedTeam === team.code ? null : team.code)}
                className={cn(
                  "h-8 px-2 gap-1.5 shrink-0",
                  selectedTeam === team.code
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {team.flag_url && (
                  <img 
                    src={team.flag_url} 
                    alt={team.name}
                    className="w-5 h-3 object-cover rounded-sm"
                  />
                )}
                <span className="text-xs">{team.code}</span>
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* News List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading news...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">No news found for this team</p>
          </div>
        ) : (
          filteredNews.map((article) => (
            <Card 
              key={article.id} 
              onClick={() => openArticle(article.url)}
              className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex">
                <div className="w-24 h-24 flex-shrink-0">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=200&fit=crop';
                    }}
                  />
                </div>
                <CardContent className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold line-clamp-2 leading-tight mb-1">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {article.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {article.source}
                      </span>
                      {article.teams && article.teams.length > 0 && (
                        <div className="flex gap-1">
                          {article.teams.map(code => {
                            const team = teams.find(t => t.code === code);
                            return team?.flag_url ? (
                              <img 
                                key={code}
                                src={team.flag_url} 
                                alt={code}
                                className="w-4 h-3 object-cover rounded-sm"
                              />
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.date}
                    </span>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
