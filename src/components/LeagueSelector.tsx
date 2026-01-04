import { useState } from 'react';
import { Users, Plus, ChevronDown, Copy, Check, Loader2 } from 'lucide-react';
import { League } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface LeagueSelectorProps {
  leagues: League[];
  selectedLeague: League | null;
  onSelectLeague: (league: League) => void;
  onCreateLeague: (name: string) => Promise<League | null>;
  onJoinLeague: (code: string) => Promise<boolean>;
}

export function LeagueSelector({ 
  leagues, 
  selectedLeague, 
  onSelectLeague,
  onCreateLeague,
  onJoinLeague
}: LeagueSelectorProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateLeague = async () => {
    if (!newLeagueName.trim()) return;
    
    setIsLoading(true);
    try {
      const league = await onCreateLeague(newLeagueName.trim());
      
      if (league) {
        toast({
          title: 'League created!',
          description: `Share code: ${league.code}`,
        });
        setNewLeagueName('');
        setIsCreateOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create league. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error creating league:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create league. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinLeague = async () => {
    if (!joinCode.trim()) return;
    
    setIsLoading(true);
    try {
      const success = await onJoinLeague(joinCode.trim().toUpperCase());
      
      if (success) {
        toast({
          title: 'Joined league!',
        });
        setJoinCode('');
        setIsJoinOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid code',
          description: 'Please check the code and try again.',
        });
      }
    } catch (error) {
      console.error('Error joining league:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to join league. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    if (selectedLeague?.code) {
      navigator.clipboard.writeText(selectedLeague.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const openCreateDialog = () => {
    setIsCreateOpen(true);
  };

  const openJoinDialog = () => {
    setIsJoinOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex-1 justify-between gap-2 h-10">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium truncate">
                  {selectedLeague?.name || 'Select League'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-card border-border">
            {leagues.map((league) => (
              <DropdownMenuItem 
                key={league.id}
                onClick={() => onSelectLeague(league)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{league.name}</span>
                {league.is_global && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                    Global
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create League
            </DropdownMenuItem>

            <DropdownMenuItem onClick={openJoinDialog}>
              <Users className="w-4 h-4 mr-2" />
              Join League
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedLeague && !selectedLeague.is_global && selectedLeague.code && (
          <Button
            variant="outline"
            size="icon"
            onClick={copyCode}
            className="shrink-0"
          >
            {copiedCode ? (
              <Check className="w-4 h-4 text-accent" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Create League Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[90vw] max-w-[320px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create Private League</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="leagueName" className="text-xs">League Name</Label>
              <Input
                id="leagueName"
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                placeholder="My Awesome League"
                className="bg-background/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newLeagueName.trim() && !isLoading) {
                    handleCreateLeague();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleCreateLeague}
              className="w-full gradient-gold text-primary-foreground"
              disabled={isLoading || !newLeagueName.trim()}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Create League'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join League Dialog */}
      <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
        <DialogContent className="w-[90vw] max-w-[320px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Join Private League</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="joinCode" className="text-xs">League Code</Label>
              <Input
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                className="bg-background/50 uppercase"
                maxLength={12}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && joinCode.trim() && !isLoading) {
                    handleJoinLeague();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleJoinLeague}
              className="w-full gradient-gold text-primary-foreground"
              disabled={isLoading || !joinCode.trim()}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Join League'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
