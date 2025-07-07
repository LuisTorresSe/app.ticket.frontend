import React from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import MainContent from '../layout/MainContent';
import Toast from './Toast';
import { useAppContext } from '../../context/AppContext';

const MainLayout: React.FC = () => {
    const { toast } = useAppContext();
    return (
        <div className="flex h-screen bg-primary font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-primary p-4 md:p-6 lg:p-8">
                    <MainContent />
                </main>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
};

export default MainLayout; 