
import React from 'react';
import Card from '../common/Card';

interface KpiCardProps {
    title: string;
    value: number | string;
    description?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, description }) => {
    return (
        <Card className="p-5">
            <h4 className="text-sm font-medium text-text-secondary uppercase tracking-wider">{title}</h4>
            <p className="text-4xl font-bold text-text-primary mt-2">{value}</p>
            {description && <p className="text-xs text-text-secondary mt-1">{description}</p>}
        </Card>
    );
};

export default KpiCard;
