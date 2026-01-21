'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'PLTMG SUMBAWA', value: 45 },
  { name: 'PLTMG BIMA', value: 25 },
  { name: 'PLTD BIMA', value: 30 },
];

const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe'];

export default function FuelConsumptionChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuel Consumption</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={0}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
        Visualization of Fuel Stock by Fuel Type from UPK Tambora as of September 28, 2025
      </p>
    </div>
  );
}
