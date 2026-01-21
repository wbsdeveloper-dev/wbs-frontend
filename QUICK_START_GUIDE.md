# Quick Start Guide - PLN Dashboard

## Running the Dashboard

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Visit **http://localhost:3000** to view the dashboard.

## Dashboard Structure

### Page Layout (Top to Bottom):

1. **Sidebar** (Left)
   - PLN Logo
   - Dashboard (active)
   - Entry Data
   - Database
   - Settings
   - Logout

2. **Header**
   - Title: "Dashboard"
   - Tagline: "Plan, prioritize, and accomplish your tasks with ease."

3. **Monitoring Section**
   - Title: "Monitoring BBM PLN"
   
4. **Filter Controls** (MUI Autocomplete)
   - Regional dropdown with search
   - Unit Induk dropdown with search
   - Unit Pelaksana dropdown with search
   - Period dropdown with search

5. **Stat Cards** (3 columns)
   - Total Stock (blue, with progress bar)
   - Total Consumption (white)
   - Total Distribution (white)

6. **Charts Row 1** (2 columns)
   - Stock BBM in Pembangkit (bar chart)
   - Stock By Fuel Type (donut chart)

7. **Charts Row 2** (2 columns)
   - Fuel Consumption (donut chart)
   - Power Plant HOP (horizontal bar chart)

8. **Data Table** (Full width) ← **NEW!**
   - BBM Monitoring Table
   - 16 columns with all monitoring data
   - Built-in filtering per column
   - Built-in sorting
   - Pagination (5, 10, 25, 50 rows per page)
   - Row selection checkboxes
   - Horizontal scroll for many columns

## Key Features

### MUI Autocomplete Filters
- Type to search options
- Clear button to reset
- Dropdown arrow for full list
- Smooth animations

### BBM Monitoring Table
- **Filter**: Click column header menu → Filter
- **Sort**: Click column header (once=ascending, twice=descending)
- **Paginate**: Use bottom controls to navigate
- **Select**: Check boxes for row selection
- **Responsive**: Horizontal scroll for wide tables

## Technologies Used

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Charts and graphs
- **MUI (Material-UI)** - Autocomplete & DataGrid
- **Lucide React** - Icons

## Project Files

```
app/
├── components/
│   ├── BBMMonitoringTable.tsx      ← NEW: Data table with filtering
│   ├── FilterAutocomplete.tsx      ← NEW: MUI autocomplete wrapper
│   ├── FuelConsumptionChart.tsx
│   ├── FuelTypeDonutChart.tsx
│   ├── PowerPlantHOPChart.tsx
│   ├── Sidebar.tsx
│   ├── StatCard.tsx
│   └── StockBarChart.tsx
├── layout.tsx
├── page.tsx                         ← Updated: Added table
└── globals.css
```

## Common Tasks

### Adding Data to Table
Edit `app/components/BBMMonitoringTable.tsx`:
```typescript
const rows: BBMData[] = [
  // Add your data here
  {
    id: 1,
    no: 1,
    unitPelaksana: 'Your Unit',
    jenisKit: 'PLTD',
    pembangkit: 'Plant Name',
    // ... other fields
  },
];
```

### Connecting to API
In `app/components/BBMMonitoringTable.tsx`:
```typescript
const [rows, setRows] = useState<BBMData[]>([]);

useEffect(() => {
  fetch('/api/bbm-data')
    .then(res => res.json())
    .then(data => setRows(data));
}, []);
```

### Customizing Filter Options
In `app/page.tsx`:
```typescript
const regionalOptions = ['Your', 'Custom', 'Options'];
```

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Check for errors
npm run lint
```

## Documentation Files

- `README.md` - Main project documentation
- `DASHBOARD_README.md` - Original dashboard features
- `MUI_AUTOCOMPLETE_UPDATE.md` - Autocomplete implementation
- `BBM_TABLE_DOCUMENTATION.md` - Table component details
- `QUICK_START_GUIDE.md` - This file

## Support

For MUI DataGrid documentation: https://mui.com/x/react-data-grid/
For Recharts documentation: https://recharts.org/

## Summary of Recent Updates

### ✅ Completed:
1. Installed MUI packages (@mui/material, @emotion/react, @emotion/styled)
2. Installed MUI DataGrid (@mui/x-data-grid)
3. Created FilterAutocomplete component
4. Replaced all select dropdowns with MUI Autocomplete
5. Created BBMMonitoringTable component with 16 columns
6. Added table to dashboard below all charts
7. Implemented filtering, sorting, and pagination
8. All builds and tests passing

### 🎉 Ready to Use!
The dashboard is now fully functional with:
- Interactive filter dropdowns
- Comprehensive data table
- All charts and visualizations
- Responsive design
