
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { TicketType, TicketStatus, EmailStatus, UserRole, Ticket, Subticket } from '../../types';

import EvolutionChart from './EvolutionChart';
import Card from '../common/Card';
import Button from '../common/Button';
import { ICONS } from '../../constants';
import Modal from '../common/Modal';
import DashboardConfigModal from './DashboardConfigModal';
import { useAuthStore } from '@/store/authStore';
import { can } from '@/utils/permissions';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-secondary p-2 border border-border-color rounded shadow-lg text-sm">
                <p className="label font-bold text-text-primary">{label}</p>
                {payload.map((pld: any) => (
                    <p key={pld.dataKey} style={{ color: pld.color }}>
                        {`${pld.name}: ${pld.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const TicketStatusWidget = () => {
    const { tickets } = useAppContext();

    const ticketsByStatus = useMemo(() => tickets.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
    }, {} as Record<TicketStatus, number>), [tickets]);

    const statusConfig: Record<TicketStatus, { color: string }> = {
        [TicketStatus.Pending]: { color: 'bg-green-500' },
        [TicketStatus.InProgress]: { color: 'bg-blue-500' },
        [TicketStatus.OnHold]: { color: 'bg-yellow-400' },
        [TicketStatus.Solved]: { color: 'bg-gray-500' },
    };

    return (
        <Card className="p-6 flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Estado General de Tickets</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 flex-grow content-around">
                {Object.values(TicketStatus).map(status => (
                    <div key={status} className="flex items-center">
                        <span className={`w-2.5 h-2.5 rounded-full mr-3 ${statusConfig[status].color}`}></span>
                        <div>
                            <div className="text-sm text-text-secondary">{status}</div>
                            <div className="text-2xl font-bold text-text-primary">{ticketsByStatus[status] || 0}</div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const TicketTypeWidget = () => {
    const { tickets } = useAppContext();

    const ticketsByType = useMemo(() => tickets.reduce((acc, ticket) => {
        acc[ticket.type] = (acc[ticket.type] || 0) + 1;
        return acc;
    }, {} as Record<TicketType, number>), [tickets]);

    const typeColors: Record<TicketType, string> = {
        [TicketType.Proactive]: 'bg-sky-500',
        [TicketType.Reactive]: 'bg-rose-500',
        [TicketType.Maintenance]: 'bg-amber-500'
    };

    return (
        <Card className="p-6 flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Distribución por Tipo</h3>
            <div className="space-y-4 flex flex-col justify-center flex-grow">
                {Object.values(TicketType).map(type => (
                    <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className={`w-2.5 h-2.5 rounded-full mr-3 ${typeColors[type]}`}></span>
                            <span className="text-sm text-text-primary">{type}</span>
                        </div>
                        <div className="text-xl font-bold text-text-primary">{ticketsByType[type] || 0}</div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const EvolutionWidget = () => {
    const { tickets } = useAppContext();
    return (
        <Card className="p-4 h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-4">Evolución de Tickets (Diario)</h3>
            <div className="flex-grow h-96">
                <EvolutionChart tickets={tickets} />
            </div>
        </Card>
    );
}

const AdvisorWidget = () => {
    const { tickets } = useAppContext();
    const ticketsByAdvisor = useMemo(() => tickets.reduce((acc, ticket) => {
        acc[ticket.advisor] = (acc[ticket.advisor] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), [tickets]);

    const sortedAdvisors = useMemo(() => Object.entries(ticketsByAdvisor).sort(([, a], [, b]) => b - a), [ticketsByAdvisor]);
    const maxTickets = useMemo(() => (sortedAdvisors.length > 0 ? sortedAdvisors[0][1] : 0), [sortedAdvisors]);

    return (
        <Card className="p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Tickets por Asesor</h3>
            <div className="space-y-3 text-sm flex-grow overflow-y-auto pr-2">
                {sortedAdvisors.map(([advisor, count]) => {
                    const percentage = maxTickets > 0 ? (count / maxTickets) * 100 : 0;
                    return (
                        <div key={advisor}>
                            <div className="flex justify-between items-center mb-1 text-text-primary">
                                <span>{advisor}</span>
                                <strong className="font-semibold">{count}</strong>
                            </div>
                            <div className="w-full bg-border-color rounded-full h-1.5">
                                <div className="bg-accent h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    );
}


const CityWidget = () => {
    const { subtickets } = useAppContext();
    const subticketsByCity = useMemo(() => subtickets.reduce((acc, subticket) => {
        acc[subticket.city] = (acc[subticket.city] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), [subtickets]);

    const sortedCities = useMemo(() => Object.entries(subticketsByCity).sort(([, a], [, b]) => b - a), [subticketsByCity]);
    const maxSubtickets = useMemo(() => (sortedCities.length > 0 ? sortedCities[0][1] : 0), [sortedCities]);

    return (
        <Card className="p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Subtickets por Ciudad</h3>
            <div className="space-y-3 text-sm flex-grow overflow-y-auto pr-2">
                {sortedCities.map(([city, count]) => {
                    const percentage = maxSubtickets > 0 ? (count / maxSubtickets) * 100 : 0;
                    return (
                        <div key={city}>
                            <div className="flex justify-between items-center mb-1 text-text-primary">
                                <span>{city}</span>
                                <strong className="font-semibold">{count}</strong>
                            </div>
                            <div className="w-full bg-border-color rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    );
}

const EmailStatusWidget = () => {
    const { tickets } = useAppContext();
    const ticketsByEmailStatus = tickets.reduce((acc, ticket) => {
        acc[ticket.emailStatus] = (acc[ticket.emailStatus] || 0) + 1;
        return acc;
    }, {} as Record<EmailStatus, number>);
    return (
        <Card className="p-4 h-full">
            <h3 className="text-lg font-semibold mb-2">Estado del Correo</h3>
            <ul className="space-y-2 text-sm mt-4">
                <li className="flex justify-between p-1 items-center">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span>Declarado</span>
                    <strong className="text-lg font-bold">{ticketsByEmailStatus.Declarado || 0}</strong>
                </li>
                <li className="flex justify-between p-1 items-center">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span>No Declarado</span>
                    <strong className="text-lg font-bold">{ticketsByEmailStatus['No Declarado'] || 0}</strong>
                </li>
            </ul>
        </Card>
    );
}

const AvgSolutionTimeWidget = () => {
    const { tickets, subtickets } = useAppContext();
    const avgSolutionTimeData = useMemo(() => {
        const solutionTimesByDiagnosis: Record<string, { totalHours: number, count: number }> = {};

        const solvedTickets = tickets.filter(t => t.status === TicketStatus.Solved);
        solvedTickets.forEach(ticket => {
            const ticketSubtickets = subtickets.filter(st => st.ticketId === ticket.id && st.eventStartDate && st.eventEndDate);
            if (ticketSubtickets.length > 0) {
                ticketSubtickets.forEach(st => {
                    const durationMs = new Date(st.eventEndDate!).getTime() - new Date(st.eventStartDate).getTime();
                    const durationHours = durationMs / (1000 * 60 * 60);

                    if (!solutionTimesByDiagnosis[ticket.initialDiagnosis]) {
                        solutionTimesByDiagnosis[ticket.initialDiagnosis] = { totalHours: 0, count: 0 };
                    }
                    solutionTimesByDiagnosis[ticket.initialDiagnosis].totalHours += durationHours;
                    solutionTimesByDiagnosis[ticket.initialDiagnosis].count += 1;
                });
            }
        });

        return Object.entries(solutionTimesByDiagnosis).map(([diagnosis, data]) => ({
            name: diagnosis,
            'Tiempo Promedio (h)': parseFloat((data.totalHours / data.count).toFixed(2)),
        }));
    }, [tickets, subtickets]);

    return (
        <Card className="p-4 h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-4">Tiempo Promedio de Solución por Avería</h3>
            <div className="w-full flex-grow h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={avgSolutionTimeData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-color)" />
                        <XAxis type="number" stroke="var(--color-text-secondary)" />
                        <YAxis type="category" dataKey="name" stroke="var(--color-text-secondary)" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-border-color)' }} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-secondary)' }} />
                        <Bar dataKey="Tiempo Promedio (h)" fill="var(--color-accent)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

const TicketsByNodePieWidget = () => {
    const { tickets } = useAppContext();
    const ticketsByNodeData = useMemo(() => {
        const counts = tickets.reduce((acc, ticket) => {
            acc[ticket.node] = (acc[ticket.node] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [tickets]);

    return (
        <Card className="p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Distribución de Tickets por Nodo</h3>
            <div className="w-full flex-grow h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={ticketsByNodeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} label>
                            {ticketsByNodeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-secondary)' }} iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

// const TicketsByMonthWidget = () => {
//     const { tickets } = useAppContext();
//     const ticketsByMonthData = useMemo(() => {
//         const countsByMonth: Record<string, Record<TicketType, number> & { name: string }> = {};

//         tickets.forEach(ticket => {
//             const month = new Date(ticket.creationDate).toISOString().slice(0, 7); // YYYY-MM
//             if (!countsByMonth[month]) {
//                 countsByMonth[month] = { name: month, [TicketType.Proactive]: 0, [TicketType.Reactive]: 0, [TicketType.Maintenance]: 0 };
//             }
//             countsByMonth[month][ticket.type]++;
//         });

//         return Object.values(countsByMonth).sort((a,b) => a.name.localeCompare(b.name));
//     }, [tickets]);

//     return (
//         <Card className="p-4 h-full flex flex-col">
//             <h3 className="text-xl font-semibold mb-4">Creación de Tickets por Mes</h3>
//             <div className="w-full flex-grow h-96">
//                 <ResponsiveContainer width="100%" height="100%">
//                     <LineChart data={ticketsByMonthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
//                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-color)" />
//                          <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
//                          <YAxis stroke="var(--color-text-secondary)" />
//                          <Tooltip content={<CustomTooltip />}/>
//                          <Legend wrapperStyle={{ color: 'var(--color-text-secondary)' }}/>
//                          <Line type="monotone" dataKey={TicketType.Proactive} stroke="#3182CE" strokeWidth={2} />
//                          <Line type="monotone" dataKey={TicketType.Reactive} stroke="#E53E3E" strokeWidth={2} />
//                          <Line type="monotone" dataKey={TicketType.Maintenance} stroke="#D69E2E" strokeWidth={2} />
//                     </LineChart>
//                 </ResponsiveContainer>
//             </div>
//         </Card>
//     );
// };


const WIDGET_COMPONENTS: Record<string, React.FC> = {
    ticketStatus: TicketStatusWidget,
    ticketType: TicketTypeWidget,
    evolution: EvolutionWidget,
    byAdvisor: AdvisorWidget,
    byCity: CityWidget,
    byEmail: EmailStatusWidget,
    avgSolutionTime: AvgSolutionTimeWidget,
    ticketsByNodePie: TicketsByNodePieWidget
    // ticketsByMonth: TicketsByMonthWidget,
};

interface WidgetConfig {
    id: string;
    title: string;
    colSpanClass: string;
}

interface LayoutItem extends WidgetConfig {
    visible: boolean;
}

const ALL_WIDGETS: WidgetConfig[] = [
    { id: 'ticketStatus', title: 'KPI: Estado de Tickets', colSpanClass: 'col-span-12 md:col-span-6' },
    { id: 'ticketType', title: 'KPI: Tipo de Tickets', colSpanClass: 'col-span-12 md:col-span-6' },
    { id: 'evolution', title: 'Evolución de Tickets (Diario)', colSpanClass: 'col-span-12 lg:col-span-8' },
    { id: 'byAdvisor', title: 'Tickets por Asesor', colSpanClass: 'col-span-12 md:col-span-6 lg:col-span-4' },
    { id: 'ticketsByMonth', title: 'Creación de Tickets por Mes', colSpanClass: 'col-span-12' },
    { id: 'avgSolutionTime', title: 'Tiempo Promedio de Solución', colSpanClass: 'col-span-12 lg:col-span-7' },
    { id: 'ticketsByNodePie', title: 'Distribución por Nodo', colSpanClass: 'col-span-12 md:col-span-6 lg:col-span-5' },
    { id: 'byCity', title: 'Subtickets por Ciudad', colSpanClass: 'col-span-12 md:col-span-6' },
    { id: 'byEmail', title: 'Estado del Correo', colSpanClass: 'col-span-12 md:col-span-6' },
];


const LOCAL_STORAGE_KEY = 'dashboardLayout_v4';

const Dashboard: React.FC = () => {
    const { currentUser } = useAppContext();

    const { user } = useAuthStore()

    const [isConfigModalOpen, setConfigModalOpen] = useState(false);
    const [dashboardConfig, setDashboardConfig] = useState<LayoutItem[]>([]);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const canConfigure = can("dashboard.configure") ?? false;

    useEffect(() => {
        const savedLayout = localStorage.getItem(LOCAL_STORAGE_KEY);
        let finalConfig: LayoutItem[];

        if (savedLayout) {
            try {
                const parsedLayout = JSON.parse(savedLayout) as LayoutItem[];
                const allWidgetIds = new Set(ALL_WIDGETS.map(w => w.id));
                const validLayoutItems = parsedLayout.filter(item => allWidgetIds.has(item.id));
                const configuredIds = new Set(validLayoutItems.map(item => item.id));

                const missingWidgets = ALL_WIDGETS
                    .filter(w => !configuredIds.has(w.id))
                    .map(w => ({ ...w, visible: true }));

                finalConfig = [...validLayoutItems, ...missingWidgets];
                // Ensure colSpanClass is up to date from ALL_WIDGETS
                finalConfig = finalConfig.map(item => {
                    const masterWidget = ALL_WIDGETS.find(w => w.id === item.id);
                    return { ...item, colSpanClass: masterWidget?.colSpanClass || '' };
                });
            } catch (e) {
                console.error("Failed to parse dashboard layout from localStorage", e);
                finalConfig = ALL_WIDGETS.map(w => ({ ...w, visible: true }));
            }
        } else {
            finalConfig = ALL_WIDGETS.map(w => ({ ...w, visible: true }));
        }
        setDashboardConfig(finalConfig);
    }, []);

    const visibleWidgets = useMemo(() => dashboardConfig.filter(w => w.visible), [dashboardConfig]);

    const handleSaveLayout = (newLayout: LayoutItem[]) => {
        setDashboardConfig(newLayout);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newLayout));
        setConfigModalOpen(false);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
    };

    const handleDrop = () => {
        if (!canConfigure || dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            return;
        }

        const newVisibleWidgets = [...visibleWidgets];
        const draggedItemContent = newVisibleWidgets.splice(dragItem.current, 1)[0];
        newVisibleWidgets.splice(dragOverItem.current, 0, draggedItemContent);

        dragItem.current = null;
        dragOverItem.current = null;

        const hiddenWidgets = dashboardConfig.filter(w => !w.visible);
        const newDashboardConfig = [...newVisibleWidgets, ...hiddenWidgets];

        setDashboardConfig(newDashboardConfig);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newDashboardConfig));
    };

    const renderWidgets = () => {
        return (
            <div className="grid grid-cols-12 gap-6">
                {visibleWidgets.map((widget, index) => {
                    const WidgetComponent = WIDGET_COMPONENTS[widget.id];
                    if (!WidgetComponent) return null;

                    return (
                        <div
                            key={widget.id}
                            className={widget.colSpanClass}
                            draggable={canConfigure}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <div className={`h-full ${canConfigure ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                                <WidgetComponent />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                <h2 className="text-3xl font-bold">¡Bienvenido de nuevo, {user?.fullName}!</h2>
                {canConfigure && (
                    <Button onClick={() => setConfigModalOpen(true)} size="sm" variant="secondary">
                        <div className="flex items-center gap-2">{ICONS.settings} Configurar Panel</div>
                    </Button>
                )}
            </div>

            {renderWidgets()}

            <Modal isOpen={isConfigModalOpen} onClose={() => setConfigModalOpen(false)} title="Configurar Panel de Control">
                <DashboardConfigModal
                    allWidgets={ALL_WIDGETS}
                    currentConfig={dashboardConfig}
                    onSave={handleSaveLayout}
                    onCancel={() => setConfigModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default Dashboard;
