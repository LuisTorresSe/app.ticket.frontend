import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';

const LoginPage: React.FC = () => {
    const { login, loading } = useAppContext();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('Usuario y contraseña son requeridos.');
            return;
        }

        const success = await login(username.trim(), password.trim());
        if (!success) {
            setError('Credenciales incorrectas. Inténtalo de nuevo.');
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-primary p-4">
            <Card className="w-full max-w-sm p-8 animate-fade-in">
                <div className="text-center mb-8">
                    <span className="text-5xl font-bold text-accent">Win</span>
                    <p className="text-text-secondary mt-2">Sistema de Gestión de Tickets</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                        id="username"
                        label="Nombre de Usuario"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="ej., Diego"
                        autoComplete="username"
                    />
                    <Input
                        id="password"
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                    />

                    {error && <p className="text-sm text-danger text-center">{error}</p>}

                    <Button
                        type="submit"
                        className="w-full mt-6"
                        size="lg"
                        isLoading={loading.login}
                        disabled={!username || !password}
                    >
                        Ingresar
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default LoginPage;
