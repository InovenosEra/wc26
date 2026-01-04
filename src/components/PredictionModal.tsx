import { useState } from 'react';
import { Match } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Minus, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PredictionModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (homeScore: number, awayScore: number) => Promise<void>;
  initialHomeScore?: number;
  initialAwayScore?: number;
}

export function PredictionModal({ 
  match, 
  isOpen, 
  onClose, 
  onSubmit,
  initialHomeScore = 0,
  initialAwayScore = 0
}: PredictionModalProps) {
  const [homeScore, setHomeScore] = useState(initialHomeScore);
  const [awayScore, setAwayScore] = useState(initialAwayScore);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(homeScore, awayScore);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const ScoreInput = ({ 
    value, 
    onChange, 
    team 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    team: { name: string; flag_url: string | null };
  }) => (
    <div className="flex flex-col items-center gap-3">
      <img 
        src={team.flag_url || ''} 
        alt={team.name}
        className="w-16 h-10 object-cover rounded shadow-md"
      />
      <span className="text-sm font-semibold">{team.name}</span>
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
            "bg-secondary hover:bg-secondary/80 disabled:opacity-30"
          )}
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <div className="w-16 h-16 rounded-xl bg-card border-2 border-primary/50 flex items-center justify-center">
          <span className="text-3xl font-bold text-primary">{value}</span>
        </div>
        
        <button
          onClick={() => onChange(Math.min(15, value + 1))}
          disabled={value === 15}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
            "bg-secondary hover:bg-secondary/80 disabled:opacity-30"
          )}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (!match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] mx-auto bg-card border-border left-1/2 -translate-x-1/2">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            Make Your Prediction
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="flex items-start justify-between gap-4">
            <ScoreInput 
              value={homeScore} 
              onChange={setHomeScore} 
              team={match.home_team}
            />
            
            <div className="pt-16 text-muted-foreground font-semibold">
              VS
            </div>
            
            <ScoreInput 
              value={awayScore} 
              onChange={setAwayScore} 
              team={match.away_team}
            />
          </div>

          <div className="mt-6 p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">5 pts</span> for exact score • 
              <span className="font-semibold text-accent ml-1">2 pts</span> for correct result
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="flex-1 gradient-gold text-primary-foreground shadow-gold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Confirm'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
