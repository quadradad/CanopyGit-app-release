import { useState, useEffect } from 'react';
import { RepoProvider } from './contexts/RepoContext';
import { BranchProvider } from './contexts/BranchContext';
import { GitHubProvider } from './contexts/GitHubContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingScreen } from './components/LoadingScreen';
import { ToastContainer } from './components/shared/ToastContainer';

export default function App(): React.ReactElement {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Show loading screen for at least 1 second
    const timer = setTimeout(() => setIsReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <LoadingScreen statusText="Initializing..." />;
  }

  return (
    <ErrorProvider>
      <RepoProvider>
        <BranchProvider>
          <GitHubProvider>
            <RefreshProvider>
              <AppLayout />
              <ToastContainer />
            </RefreshProvider>
          </GitHubProvider>
        </BranchProvider>
      </RepoProvider>
    </ErrorProvider>
  );
}
