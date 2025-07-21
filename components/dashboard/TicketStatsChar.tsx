import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
    LabelList,
} from 'recharts';
import { useMemo } from 'react';
import { Ticket } from '@/types';
import { buildTicketStatsChartData } from '@/lib/dashboard-utils';
import Card from '../common/Card';

interface Props {
    tickets: Ticket[];
}

export default function TicketStatsChart({ tickets }: Props) {
    const chartData = useMemo(() => buildTicketStatsChartData(tickets), [tickets]);

    return (
        <Card className="p-4">
            <h2 className="text-xl font-bold mb-4">Estadísticas Operativas de Tickets</h2>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                        formatter={(value: any, name: string) => [value, name]}
                        labelFormatter={(label: string) => `Últimas ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="created" fill="#4f46e5" name="Creados">
                        <LabelList dataKey="created" position="top" />
                    </Bar>
                    <Bar dataKey="closed" fill="#10b981" name="Cerrados">
                        <LabelList dataKey="closed" position="top" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {chartData.map(({ name, closeRate, closePerHour, overloaded }) => (
                    <div key={name} className="p-4 bg-primary border rounded shadow-sm">
                        <h3 className="text-sm font-semibold mb-2">Últimas {name}</h3>
                        <p className="text-sm">✔️ % de Cierre: <strong>{closeRate}%</strong></p>
                        <p className="text-sm">⏱️ Resolución/Hora: <strong>{closePerHour}</strong></p>
                        <p className={`text-sm ${overloaded ? 'text-red-600' : 'text-green-600'}`}>
                            {overloaded ? '⚠️ Sobrecarga operativa' : '✅ Cierre eficiente'}
                        </p>
                    </div>
                ))}
            </div>
        </Card>
    );
}
