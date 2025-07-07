import React from 'react';
import { AppProvider } from './context/AppContext';
import AuthGate from './components/common/AuthGate';
// Comentado porque el módulo no se encuentra o no existe
// import AuthGate from './components/common/AuthGate';

const App: React.FC = () => {
    return (
        <AppProvider>
            <AuthGate />
        </AppProvider>
    );
};

export default App;
