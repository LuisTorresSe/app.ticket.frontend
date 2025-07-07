
import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { Ticket, TicketStatus, TicketType } from '../../types';
import Card from '../common/Card';
import { NODE_OPTIONS } from '../../constants';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ReportsView: React.FC = () => {
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

    const ticketsByNodeData = useMemo(() => {
        const counts = tickets.reduce((acc, ticket) => {
            acc[ticket.node] = (acc[ticket.node] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [tickets]);

    const ticketsByMonthData = useMemo(() => {
        const countsByMonth: Record<string, Record<TicketType, number> & { name: string }> = {};

        tickets.forEach(ticket => {
            const month = new Date(ticket.creationDate).toISOString().slice(0, 7); // YYYY-MM
            if (!countsByMonth[month]) {
                countsByMonth[month] = { name: month, [TicketType.Proactive]: 0, [TicketType.Reactive]: 0, [TicketType.Maintenance]: 0 };
            }
            countsByMonth[month][ticket.type]++;
        });

        return Object.values(countsByMonth).sort((a,b) => a.name.localeCompare(b.name));
    }, [tickets]);

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
      
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Reportes y Analítica</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                    <h3 className="text-xl font-semibold mb-4">Tiempo Promedio de Solución por Avería</h3>
                    <div className="w-full h-80">
                        <ResponsiveContainer>
                            <BarChart data={avgSolutionTimeData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-color)" />
                                <XAxis type="number" stroke="var(--color-text-secondary)" />
                                <YAxis type="category" dataKey="name" stroke="var(--color-text-secondary)" width={150} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--color-border-color)'}}/>
                                <Legend wrapperStyle={{ color: 'var(--color-text-secondary)' }} />
                                <Bar dataKey="Tiempo Promedio (h)" fill="var(--color-accent)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card className="p-4">
                    <h3 className="text-xl font-semibold mb-4">Distribución de Tickets por Nodo</h3>
                    <div className="w-full h-80">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={ticketsByNodeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {ticketsByNodeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />}/>
                                <Legend wrapperStyle={{ color: 'var(--color-text-secondary)' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <Card className="p-4">
                <h3 className="text-xl font-semibold mb-4">Creación de Tickets por Mes</h3>
                <div className="w-full h-80">
                    <ResponsiveContainer>
                        <LineChart data={ticketsByMonthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-color)" />
                             <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
                             <YAxis stroke="var(--color-text-secondary)" />
                             <Tooltip content={<CustomTooltip />}/>
                             <Legend wrapperStyle={{ color: 'var(--color-text-secondary)' }}/>
                             <Line type="monotone" dataKey={TicketType.Proactive} stroke="#3182CE" />
                             <Line type="monotone" dataKey={TicketType.Reactive} stroke="#E53E3E" />
                             <Line type="monotone" dataKey={TicketType.Maintenance} stroke="#D69E2E" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

        </div>
    );
};

export default ReportsView;
