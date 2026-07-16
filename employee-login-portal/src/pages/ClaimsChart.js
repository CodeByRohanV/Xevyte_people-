
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// 1. Custom Hook to Detect Screen Width (for Responsiveness)
const useIsMobile = (maxWidth = 768) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= maxWidth);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= maxWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [maxWidth]);

    return isMobile;
};

const ClaimsChart = ({ approved, rejected, totalClaims, paidAmount }) => {
    const isMobile = useIsMobile(); // Check screen size

    // Define radii based on screen size
    const mobileInnerRadius = 60;
    const mobileOuterRadius = 70;
    const desktopInnerRadius = 100;
    const desktopOuterRadius = 130;

    const innerRadius = isMobile ? mobileInnerRadius : desktopInnerRadius;
    const outerRadius = isMobile ? mobileOuterRadius : desktopOuterRadius;

    // Define height based on screen size to prevent cutoffs
    const chartHeight = isMobile ? 300 : 450;

    // ⚠️ IMPORTANT: Adjust label position multiplier for smaller mobile size
    // Reduced from 1.4 (default/desktop) to 1.1 or 1.05 to prevent cutoff on mobile
    const labelMultiplier = isMobile ? 1.05 : 1.4;
    // Reduced horizontal offset for labels on mobile
    const labelOffset = isMobile ? 5 : 10;

    const total = approved + rejected;
    const data = [
        {
            name: 'Approved',
            value: approved,
            percentage: total > 0 ? (approved / total) * 100 : 0,
        },
        {
            name: 'Rejected',
            value: rejected,
            percentage: total > 0 ? (rejected / total) * 100 : 0,
        },
    ];

    const COLORS = ['#0B3D91', '#f87171']; // Dark blue for approved, Light red for rejected
    const TEXT_COLORS = ['#1F6FEB', '#f87171']; // Blue for approved label, Red for rejected label

    const renderCustomizedLabel = ({
        cx,
        cy,
        midAngle,
        index,
    }) => {
        // Use the conditional multiplier for responsiveness
        const radius = outerRadius + (outerRadius - innerRadius) * labelMultiplier;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
        const entry = data[index];
        const textAnchor = x > cx ? 'start' : 'end';
        const labelX = x + (x > cx ? labelOffset : -labelOffset); // Use conditional offset
        const labelY = y;
        const color = COLORS[index];

        return (
            <text
                x={labelX}
                y={labelY}
                fill={TEXT_COLORS[index]}
                textAnchor={textAnchor}
                dominantBaseline="central"
                style={{ fontSize: isMobile ? '12px' : '16px', fontWeight: '500' }} // Conditional font size
            >
                {`${entry.name}: ${entry.value}, ${entry.percentage.toFixed(0)}%`}
            </text>
        );
    };

    return (
        // Use conditional height
        <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
                {/* Chart Title */}
                <text
                    x="50%"
                    y="5%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: '600' }} // Conditional font size
                >
                    Total Claims Raised: {totalClaims}
                </text>

                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    // Use conditional radii
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    fill="#8884d8"
                    paddingAngle={4}
                    dataKey="value"
                    label={renderCustomizedLabel}
                    labelLine={false}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                </Pie>

                {/* Paid Amount Center Text */}
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fontSize: isMobile ? '14px' : '18px', fill: '#1F6FEB', fontWeight: '500' }} // Conditional font size
                >
                    Paid: ₹{Math.floor(paidAmount)}
                </text>

                <Tooltip />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default ClaimsChart;
