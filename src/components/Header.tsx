import { User, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import wc2026Logo from '@/assets/wc2026-logo.png';

interface HeaderProps {
  onAuthClick: () => void;
}

export function Header({ onAuthClick }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <img 
            src={wc2026Logo} 
            alt="FIFA World Cup 2026" 
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-sm font-bold text-foreground leading-none">
              Predictions
            </h1>
          </div>
        </div>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarFallback className="bg-secondary text-xs font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-xs text-muted-foreground">
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAuthClick}
            className="text-xs gap-1.5 border-primary/30 hover:border-primary hover:bg-primary/10"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
