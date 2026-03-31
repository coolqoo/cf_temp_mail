import { useAppContext } from './store';
import './App.css';

// Components (We will create these soon)
import AuthGate from './components/AuthGate';
import InboxShell from './components/InboxShell';

function MainApp() {
  const { isAuthenticated } = useAppContext();
  
  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return <InboxShell />;
}

export default MainApp;
