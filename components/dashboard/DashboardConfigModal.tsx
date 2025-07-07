import React, { useState, useMemo, useRef } from 'react';
import Button from '../common/Button';
import { ICONS } from '../../constants';

interface WidgetConfig {
    id: string;
    title: string;
}

interface LayoutItem extends WidgetConfig {
    visible: boolean;
}

interface DashboardConfigModalProps {
    allWidgets: WidgetConfig[];
    currentConfig: LayoutItem[];
    onSave: (newLayout: LayoutItem[]) => void;
    onCancel: () => void;
}

const DashboardConfigModal: React.FC<DashboardConfigModalProps> = ({ allWidgets, currentConfig, onSave, onCancel }) => {
    
    const [layoutConfig, setLayoutConfig] = useState<LayoutItem[]>(currentConfig);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleVisibilityChange = (widgetId: string) => {
        setLayoutConfig(prevConfig => {
            const newConfig = prevConfig.map(w => w.id === widgetId ? { ...w, visible: !w.visible } : w);
            const visible = newConfig.filter(w => w.visible);
            const hidden = newConfig.filter(w => !w.visible);
            return [...visible, ...hidden];
        });
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, position: number) => {
        dragItem.current = position;
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, position: number) => {
        dragOverItem.current = position;
    };

    const handleDrop = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        
        setLayoutConfig(prevConfig => {
            const visible = prevConfig.filter(i => i.visible);
            const hidden = prevConfig.filter(i => !i.visible);
            
            const draggedItem = visible.splice(dragItem.current!, 1)[0];
            visible.splice(dragOverItem.current!, 0, draggedItem);
            
            return [...visible, ...hidden];
        });

        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleSave = () => {
        onSave(layoutConfig);
    };

    const displayableOrderedWidgets = useMemo(() => {
        return layoutConfig.filter(w => w.visible);
    }, [layoutConfig]);

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-lg font-semibold mb-2 text-text-primary">Widgets Visibles</h4>
                <div className="grid grid-cols-2 gap-2 border border-border-color p-2 rounded-md">
                    {allWidgets.map(widget => (
                        <label key={widget.id} className="flex items-center space-x-2 p-1 rounded hover:bg-primary">
                            <input
                                type="checkbox"
                                checked={layoutConfig.find(l => l.id === widget.id)?.visible || false}
                                onChange={() => handleVisibilityChange(widget.id)}
                                className="form-checkbox h-4 w-4 text-accent bg-primary border-border-color rounded focus:ring-accent"
                            />
                            <span className="text-sm text-text-primary">{widget.title}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-lg font-semibold mb-2 text-text-primary">Orden de los Widgets</h4>
                <p className="text-sm text-text-secondary mb-4">Arrastra para reordenar los widgets visibles.</p>
                <ul className="space-y-2 border border-border-color rounded-md p-2 min-h-[100px]">
                    {displayableOrderedWidgets.map((widget, index) => (
                         <li
                            key={widget.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="flex items-center justify-between p-2 bg-primary rounded-md cursor-grab active:cursor-grabbing"
                        >
                            <span className="text-text-primary">{widget.title}</span>
                            <span className="text-text-secondary">{ICONS.grip}</span>
                        </li>
                    ))}
                    {displayableOrderedWidgets.length === 0 && (
                        <li className="text-center text-text-secondary p-4">Ningún widget visible.</li>
                    )}
                </ul>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t border-border-color">
                <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Cambios</Button>
            </div>
        </div>
    );
};

export default DashboardConfigModal;