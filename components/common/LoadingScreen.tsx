import React from 'react';
import Spinner from './Spinner';

const LoadingScreen: React.FC = () => (
    <div className="flex h-screen w-full items-center justify-center bg-primary text-text-primary">
        <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-lg text-text-secondary">Cargando datos...</p>
        </div>
    </div>
);

export default LoadingScreen; 