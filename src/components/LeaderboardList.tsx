import { Trophy, Medal, Award } from 'lucide-react';
import { LeaderboardEntry } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function LeaderboardList({ entries, currentUserId }: LeaderboardListProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-primary" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-primary/10 border-primary/30';
      case 2:
        return 'bg-gray-500/10 border-gray-500/30';
      case 3:
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return 'bg-card border-border';
    }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground text-sm">No rankings yet</p>
        <p className="text-muted-foreground text-xs mt-1">Make predictions to climb the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isCurrentUser = entry.profile.id === currentUserId;
        
        return (
          <div
            key={entry.profile.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all animate-slide-up",
              getRankStyle(entry.rank),
              isCurrentUser && "ring-1 ring-primary"
            )}
          >
            {/* Rank */}
            <div className="w-10 flex items-center justify-center">
              {getRankIcon(entry.rank) || (
                <span className="text-sm font-bold text-muted-foreground">
                  {entry.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            <Avatar className="w-10 h-10 border border-border">
              <AvatarFallback className="bg-secondary text-sm font-semibold">
                {entry.profile.username?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-semibold truncate",
                isCurrentUser && "text-primary"
              )}>
                {entry.profile.username || 'Anonymous'}
                {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
              </p>
            </div>

            {/* Points */}
            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                {entry.total_points}
              </p>
              <p className="text-[10px] text-muted-foreground">pts</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
