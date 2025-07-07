
import React, { useState, useRef, useMemo } from 'react';
import Button from '../common/Button';
import { ICONS, MANDATORY_CARGAS_COLUMNS } from '../../constants';

interface ColumnConfigModalProps {
    allColumns: { key: string; header: string }[];
    visibleColumns: string[];
    defaultColumns: string[];
    onSave: (config: { columns: string[] }) => void;
    onCancel: () => void;
}

const ColumnConfigModal: React.FC<ColumnConfigModalProps> = ({ allColumns, visibleColumns, defaultColumns, onSave, onCancel }) => {
    const [currentVisible, setCurrentVisible] = useState(new Set(visibleColumns));
    const [orderedVisibleKeys, setOrderedVisibleKeys] = useState(() => allColumns.map(c => c.key).filter(key => visibleColumns.includes(key)));

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleVisibilityChange = (key: string) => {
        if (MANDATORY_CARGAS_COLUMNS.includes(key)) return; 
        
        const newVisible = new Set(currentVisible);
        let newOrderedKeys;

        if (newVisible.has(key)) {
            newVisible.delete(key);
            newOrderedKeys = orderedVisibleKeys.filter(k => k !== key);
        } else {
            newVisible.add(key);
            // Add the new key to the end of the ordered list
            newOrderedKeys = [...orderedVisibleKeys, key];
        }
        setCurrentVisible(newVisible);
        setOrderedVisibleKeys(newOrderedKeys);
    };

    const handleDragStart = (_: React.DragEvent<HTMLLIElement>, position: number) => {
        dragItem.current = position;
    };
    
    const handleDragEnter = (_: React.DragEvent<HTMLLIElement>, position: number) => {
        dragOverItem.current = position;
    };

    const handleDrop = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const newOrderedKeys = [...orderedVisibleKeys];
        const dragItemContent = newOrderedKeys[dragItem.current];
        newOrderedKeys.splice(dragItem.current, 1);
        newOrderedKeys.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setOrderedVisibleKeys(newOrderedKeys);
    };

    const handleSave = () => {
        onSave({ columns: orderedVisibleKeys });
    };

    const handleRestoreDefaults = () => {
        setCurrentVisible(new Set(defaultColumns));
        setOrderedVisibleKeys(allColumns.map(c => c.key).filter(key => defaultColumns.includes(key)));
    };

    const visibleOrderedColumns = useMemo(() => {
       return orderedVisibleKeys.map(key => allColumns.find(c => c.key === key)).filter(Boolean) as { key: string, header: string }[];
    }, [orderedVisibleKeys, allColumns]);
    
    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-lg font-semibold mb-2 text-text-primary">Columnas Visibles y Orden</h4>
                <p className="text-sm text-text-secondary mb-4">Arrastra y suelta para reordenar las columnas que se mostrarán en la tabla.</p>
                <ul className="space-y-2 border border-border-color rounded-md p-2 max-h-40 overflow-y-auto">
                    {visibleOrderedColumns.map((col, index) => (
                        <li
                            key={col!.key}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="flex items-center justify-between p-2 bg-primary rounded-md cursor-grab active:cursor-grabbing"
                        >
                            <span className="text-text-primary">{col!.header}</span>
                            <span className="text-text-secondary">{ICONS.grip}</span>
                        </li>
                    ))}
                    {visibleOrderedColumns.length === 0 && <li className="text-center text-text-secondary p-4">Ninguna columna visible.</li>}
                </ul>
            </div>
            <div>
                <h4 className="text-lg font-semibold mb-2 text-text-primary">Seleccionar Columnas</h4>
                <p className="text-sm text-text-secondary mb-4">Activa o desactiva las columnas que quieres incluir.</p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-border-color p-2 rounded-md">
                    {allColumns.map(col => {
                        const isMandatory = MANDATORY_CARGAS_COLUMNS.includes(col.key);
                        return (
                        <label key={col.key} className={`flex items-center space-x-2 p-1 rounded hover:bg-primary ${isMandatory ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            <input
                                type="checkbox"
                                checked={currentVisible.has(col.key)}
                                onChange={() => handleVisibilityChange(col.key)}
                                disabled={isMandatory}
                                className="form-checkbox h-4 w-4 text-accent bg-primary border-border-color rounded focus:ring-accent disabled:opacity-50"
                            />
                            <span className="text-sm text-text-primary">{col.header}</span>
                        </label>
                    )})}
                </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border-color mt-6">
                 <Button variant="ghost" onClick={handleRestoreDefaults}>
                    <div className="flex items-center gap-2">
                      {ICONS['refresh-cw']} Restaurar
                    </div>
                </Button>
                <div className="flex space-x-2">
                    <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar Cambios</Button>
                </div>
            </div>
        </div>
    );
};

export default ColumnConfigModal;
