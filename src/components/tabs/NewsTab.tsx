import { Newspaper, ExternalLink, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const mockNews = [
  {
    id: 1,
    title: "FIFA Announces Final World Cup 2026 Venues",
    summary: "The 16 host cities across USA, Canada, and Mexico have been confirmed for the expanded 48-team tournament.",
    source: "FIFA.com",
    date: "2 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=200&fit=crop",
  },
  {
    id: 2,
    title: "Argentina Prepares to Defend World Cup Title",
    summary: "Lionel Messi and the defending champions begin their preparation for the tournament with a training camp.",
    source: "ESPN",
    date: "5 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=200&fit=crop",
  },
  {
    id: 3,
    title: "New Format Explained: 48 Teams, 104 Matches",
    summary: "Everything you need to know about the expanded World Cup format with 12 groups of 4 teams each.",
    source: "BBC Sport",
    date: "1 day ago",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=200&fit=crop",
  },
  {
    id: 4,
    title: "Rising Stars to Watch at World Cup 2026",
    summary: "From Bellingham to Yamal, the young talents expected to shine on the world stage.",
    source: "Sky Sports",
    date: "2 days ago",
    imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=200&fit=crop",
  },
];

export function NewsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Latest News</h2>
      </div>

      <div className="space-y-3">
        {mockNews.map((article) => (
          <Card 
            key={article.id} 
            className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex">
              <div className="w-24 h-24 flex-shrink-0">
                <img 
                  src={article.imageUrl} 
                  alt={article.title}
                  className="w-full h-full object-cover"
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
                  <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {article.source}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.date}
                  </span>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground pt-4">
        News updates coming soon with live API integration
      </p>
    </div>
  );
}
