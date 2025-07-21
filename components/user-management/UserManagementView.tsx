
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { ICONS } from '../../constants';
import Modal from '../common/Modal';
import UserFormModal from './UserFormModal';
import { can } from '@/utils/permissions';

const UserManagementView: React.FC = () => {
    const { users, currentUser, deleteUser } = useAppContext();
    const [isModalOpen, setModalOpen] = useState(true);
    const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);
    const [filter, setFilter] = useState('');

    const canCreate = can("user.create") ?? false;
    const canEdit = can("user.edit") ?? false;
    const canDelete = can("user.delete") ?? false;

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(filter.toLowerCase()) ||
            user.role.toLowerCase().includes(filter.toLowerCase())
        );
    }, [users, filter]);

    const handleAddUser = () => {
        setUserToEdit(undefined);
        setModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setUserToEdit(user);
        setModalOpen(true);
    };

    const handleDeleteUser = (userId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar a este usuario? Esta acción no se puede deshacer.')) {
            deleteUser(userId);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-2xl font-bold">Gestión de Usuarios ({users.length})</h2>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <input
                            type="text"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder="Filtrar por nombre o rol..."
                            className="w-full md:w-64 bg-primary border border-border-color rounded-md px-3 py-2"
                        />
                        {canCreate && (
                            <Button onClick={handleAddUser} size="md">
                                <span className="mr-2">{ICONS.plus}</span>
                                Añadir Usuario
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 gamer:bg-red-950/80 gamer:text-red-300 adult:bg-black adult:text-amber-500">
                            <tr className="border-b border-border-color">
                                <th scope="col" className="p-3 font-semibold">Nombre</th>
                                <th scope="col" className="p-3 font-semibold">Rol</th>
                                <th scope="col" className="p-3 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-t border-border-color hover:bg-primary">
                                    <td className="p-3 font-semibold text-text-primary">{user.name}</td>
                                    <td className="p-3">{user.role}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {canEdit && (
                                                <Button size="sm" variant="secondary" onClick={() => handleEditUser(user)}>
                                                    {ICONS.edit} Editar
                                                </Button>
                                            )}
                                            {canDelete && currentUser.id !== user.id && (
                                                <Button size="sm" variant="danger" onClick={() => handleDeleteUser(user.id)}>
                                                    {ICONS.trash} Eliminar
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <p className="p-8 text-center text-text-secondary">No se encontraron usuarios.</p>
                    )}
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                title={userToEdit ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}
                size="xl"
            >
                <UserFormModal
                    userToEdit={userToEdit}
                    onFinished={() => setModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default UserManagementView;
