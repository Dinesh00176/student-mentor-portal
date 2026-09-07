import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </AuthProvider>
  );
}
