# PLN Dashboard - Monitoring BBM

A comprehensive dashboard for monitoring PLN fuel (BBM) stock, consumption, and distribution across power plants.

## Features

### 1. **Sidebar Navigation**
- PLN branding with logo
- Dashboard, Entry Data, and Database menu items
- Settings and Logout options

### 2. **Monitoring Filters**
- Regional selection
- Unit Induk selection
- Unit Pelaksana selection
- Period selection

### 3. **Key Metrics Cards**
- **Total Stock**: Displays current fuel stock with filling level progress bar
- **Total Consumption**: Shows fuel consumption with percentage change
- **Total Distribution**: Shows distribution metrics with percentage change

### 4. **Data Visualizations**
- **Stock BBM in Pembangkit**: Bar chart showing fuel stock across all power plants
- **Stock By Fuel Type**: Donut chart displaying stock distribution by fuel type (B40, MFO, HSD)
- **Fuel Consumption**: Donut chart showing consumption by power plants
- **Power Plant HOP**: Horizontal bar chart with color-coded status (Normal, Alert, Critical)

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Getting Started

### Install dependencies:
```bash
npm install
```

### Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Build for production:
```bash
npm run build
npm start
```

## Project Structure

```
app/
├── components/
│   ├── Sidebar.tsx                 # Navigation sidebar
│   ├── StatCard.tsx                # Metric card component
│   ├── StockBarChart.tsx           # Stock bar chart
│   ├── FuelTypeDonutChart.tsx      # Fuel type donut chart
│   ├── FuelConsumptionChart.tsx    # Consumption donut chart
│   └── PowerPlantHOPChart.tsx      # HOP horizontal bar chart
├── layout.tsx                      # Root layout
└── page.tsx                        # Dashboard page
```

## Customization

### Update Data
The charts currently use mock data. To integrate real data:

1. Create API endpoints or data services
2. Update the `data` arrays in each chart component
3. Add state management (e.g., React Context, Zustand, or Redux)
4. Connect dropdown filters to data fetching

### Styling
- Colors and styles are configured using Tailwind CSS
- Chart colors can be modified in the `COLORS` arrays in each chart component
- Adjust the color scheme to match your brand guidelines

## Notes

- The dashboard is fully responsive
- All components are client-side rendered (`'use client'`)
- Charts use Recharts library for interactive visualizations
- Icons are from Lucide React library
