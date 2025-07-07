import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Ticket, TicketType } from '../../types';

interface EvolutionChartProps {
    tickets: Ticket[];
}

const EvolutionChart: React.FC<EvolutionChartProps> = ({ tickets }) => {
    const data = tickets.reduce((acc, ticket) => {
        const date = new Date(ticket.creationDate).toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const existing = acc.find(item => item.date === date);
        if (existing) {
            existing[ticket.type] = (existing[ticket.type] || 0) + 1;
        } else {
            acc.push({
                date,
                [ticket.type]: 1,
            });
        }
        return acc;
    }, [] as any[]).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="w-full h-full">
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-color)" />
                    <XAxis dataKey="date" stroke="var(--color-text-secondary)" />
                    <YAxis stroke="var(--color-text-secondary)" allowDecimals={false}/>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}
                        labelStyle={{ color: '#C9D1D9' }}
                    />
                    <Legend wrapperStyle={{color: 'var(--color-text-secondary)'}} />
                    <Bar dataKey={TicketType.Proactive} stackId="a" fill="#3182CE" />
                    <Bar dataKey={TicketType.Reactive} stackId="a" fill="#E53E3E" />
                    <Bar dataKey={TicketType.Maintenance} stackId="a" fill="#D69E2E" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default EvolutionChart;