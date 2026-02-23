import { CanopyLogo } from './shared/CanopyLogo';

interface LoadingScreenProps {
  statusText: string;
}

export function LoadingScreen({ statusText }: LoadingScreenProps) {
  return (
    <div className="h-screen w-screen bg-bg-app flex flex-col items-center justify-center gap-8">
      <CanopyLogo size="lg" />

      <div className="w-48">
        <div
          role="progressbar"
          className="h-[3px] bg-border-default rounded-full overflow-hidden"
        >
          <div className="h-full bg-accent rounded-full animate-progress" />
        </div>
      </div>

      <p className="text-xs text-text-tertiary">{statusText}</p>
    </div>
  );
}
