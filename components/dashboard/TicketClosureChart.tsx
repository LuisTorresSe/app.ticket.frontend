import React from 'react';
import { Ticket } from '@/types';
import { getTicketClosureStats } from '../../utils/ticketstat';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend
} from 'recharts';

interface Props {
    tickets: Ticket[];
}

const TicketClosureChart: React.FC<Props> = ({ tickets }) => {
    const stats = getTicketClosureStats(tickets);

    const chartData = [
        { range: '0–6h', value: stats['0-6'] },
        { range: '6–12h', value: stats['6-12'] },
        { range: '12–24h', value: stats['12-24'] },
        { range: '24–72h', value: stats['24-72'] },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-center mb-4 text-gray-700">
                Tiempo de Resolución de Tickets
            </h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Tickets Cerrados" fill="#3B82F6" radius={[10, 10, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TicketClosureChart;
