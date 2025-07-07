
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, UserRole, Permissions } from '../../types';
import { SUPERUSER_PERMISSIONS, USER_PERMISSIONS } from '../../constants';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Card from '../common/Card';

interface UserFormModalProps {
    userToEdit?: User;
    onFinished: () => void;
}

const getPermissionsForRole = (role: UserRole): Permissions => {
    return role === UserRole.Superuser ? SUPERUSER_PERMISSIONS : USER_PERMISSIONS;
};

const UserFormModal: React.FC<UserFormModalProps> = ({ userToEdit, onFinished }) => {
    const { addUser, updateUser } = useAppContext();
    const isEditMode = !!userToEdit;

    const [formData, setFormData] = useState({
        name: userToEdit?.name || '',
        password: '',
        role: userToEdit?.role || UserRole.User,
        permissions: userToEdit?.permissions || getPermissionsForRole(UserRole.User),
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            permissions: getPermissionsForRole(formData.role)
        }));
    }, [formData.role]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido.';
        if (!isEditMode && !formData.password) newErrors.password = 'La contraseña es requerida para nuevos usuarios.';
        if (formData.password && formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const userData = {
                name: formData.name,
                role: formData.role,
                permissions: formData.permissions,
                ...(formData.password && { password: formData.password })
            };

            if (isEditMode && userToEdit) {
                await updateUser(userToEdit.id, userData);
            } else {
                await addUser(userData);
            }
            onFinished();
        }
    };
    
    const handlePermissionChange = (module: keyof Permissions, permission: string, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [module]: {
                    ...(prev.permissions[module] as any),
                    [permission]: value
                }
            }
        }));
    };

    const PermissionCheckbox: React.FC<{ module: keyof Permissions; permKey: string; label: string }> = ({ module, permKey, label }) => (
        <label className="flex items-center space-x-2">
            <input
                type="checkbox"
                checked={(formData.permissions[module] as any)[permKey]}
                onChange={(e) => handlePermissionChange(module, permKey, e.target.checked)}
                className="form-checkbox h-4 w-4 text-accent bg-primary border-border-color rounded focus:ring-accent"
            />
            <span>{label}</span>
        </label>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Nombre de Usuario"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={errors.name}
                />
                <Input
                    label={isEditMode ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={errors.password}
                />
                 <Select
                    label="Rol"
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                    {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </Select>
            </div>
            
            <div>
                 <h4 className="text-lg font-semibold mb-2 text-text-primary">Permisos Detallados</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border border-border-color rounded-lg">
                    <Card className="p-3">
                        <h5 className="font-bold mb-2">Tickets</h5>
                        <PermissionCheckbox module="tickets" permKey="view" label="Ver" />
                        <PermissionCheckbox module="tickets" permKey="create" label="Crear" />
                        <PermissionCheckbox module="tickets" permKey="edit" label="Editar/Cerrar" />
                        <PermissionCheckbox module="tickets" permKey="delete" label="Archivar" />
                    </Card>
                    <Card className="p-3">
                        <h5 className="font-bold mb-2">Dashboard</h5>
                        <PermissionCheckbox module="dashboard" permKey="view" label="Ver" />
                        <PermissionCheckbox module="dashboard" permKey="configure" label="Configurar" />
                    </Card>
                    <Card className="p-3">
                        <h5 className="font-bold mb-2">Gestión Usuarios</h5>
                        <PermissionCheckbox module="userManagement" permKey="view" label="Ver" />
                        <PermissionCheckbox module="userManagement" permKey="create" label="Crear" />
                        <PermissionCheckbox module="userManagement" permKey="edit" label="Editar" />
                        <PermissionCheckbox module="userManagement" permKey="delete" label="Eliminar" />
                    </Card>
                     <Card className="p-3">
                        <h5 className="font-bold mb-2">Servs Down</h5>
                        <PermissionCheckbox module="cargas" permKey="view" label="Ver" />
                        <PermissionCheckbox module="cargas" permKey="configure" label="Configurar Columnas" />
                    </Card>
                    <Card className="p-3">
                        <h5 className="font-bold mb-2">Archivados</h5>
                        <PermissionCheckbox module="archived" permKey="view" label="Ver" />
                        <PermissionCheckbox module="archived" permKey="edit" label="Restaurar" />
                    </Card>
                    <Card className="p-3">
                        <h5 className="font-bold mb-2">Otras Vistas</h5>
                        <PermissionCheckbox module="mail" permKey="view" label="Ver Correo" />
                        <PermissionCheckbox module="sql" permKey="view" label="Ver Consola SQL" />
                    </Card>
                 </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-border-color">
                <Button type="button" variant="secondary" onClick={onFinished}>Cancelar</Button>
                <Button type="submit">{isEditMode ? 'Actualizar Usuario' : 'Crear Usuario'}</Button>
            </div>
        </form>
    );
};

export default UserFormModal;
