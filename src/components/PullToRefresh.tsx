import { ReactNode, forwardRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export const PullToRefresh = forwardRef<HTMLDivElement, PullToRefreshProps>(
  ({ onRefresh, children, className }, _ref) => {
    const {
      containerRef,
      pullDistance,
      isRefreshing,
      progress,
      shouldTrigger,
    } = usePullToRefresh({ onRefresh });

    return (
      <div
        ref={containerRef}
        className={cn("relative overflow-auto", className)}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Pull indicator */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-200"
          style={{
            top: 0,
            height: pullDistance,
            opacity: progress,
          }}
        >
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm transition-all duration-200",
              shouldTrigger && "bg-primary/20 border-primary/50",
              isRefreshing && "bg-primary/20"
            )}
          >
            <RefreshCw
              className={cn(
                "w-5 h-5 text-primary transition-transform duration-200",
                isRefreshing && "animate-spin"
              )}
              style={{
                transform: isRefreshing 
                  ? undefined 
                  : `rotate(${progress * 360}deg)`,
              }}
            />
          </div>
        </div>

        {/* Content with pull offset */}
        <div
          className="transition-transform duration-200 ease-out"
          style={{
            transform: `translateY(${pullDistance}px)`,
            transitionDuration: pullDistance === 0 ? '200ms' : '0ms',
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

PullToRefresh.displayName = 'PullToRefresh';
