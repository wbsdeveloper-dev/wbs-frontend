# BBM Monitoring Table Documentation

## Overview
Added a comprehensive data table component for monitoring BBM (fuel) across various power plants with built-in filtering, sorting, and pagination capabilities.

## Implementation Details

### 1. **Package Installed**
- `@mui/x-data-grid` - Professional data grid component with advanced features

### 2. **Component Created**
**File**: `app/components/BBMMonitoringTable.tsx`

### 3. **Features**

#### Built-in Functionality:
- ✅ **Column Filtering** - Click column header menu to filter data
- ✅ **Column Sorting** - Click column headers to sort ascending/descending
- ✅ **Pagination** - Navigate through data with customizable page sizes (5, 10, 25, 50 rows)
- ✅ **Row Selection** - Checkbox selection for bulk operations
- ✅ **Responsive Design** - Horizontal scroll for many columns
- ✅ **Search/Filter** - Type in filter fields to search
- ✅ **Export Ready** - Can easily add CSV/Excel export functionality

#### Data Columns:
1. NO. - Row number
2. UNIT PELAKSANA - Execution unit name
3. JENIS KIT - Kit type (PLTD, PLTMG, etc.)
4. PEMBANGKIT - Power plant name
5. KAPASITAS kW - Capacity in kilowatts
6. JENIS BBM - Fuel type (B40, HSD, MFO)
7. MODA ANGKUTAN - Transportation mode
8. TBBM NAMA - TBBM name/location
9. KAP. (KL) - Tank capacity in kiloliters
10. PEMAKAIAN DATA2 BULAN-1 - Usage data from previous 2 months
11. HOP (Hari) - Days of operation
12. HOP MINIMUM - Minimum operation days
13. STOK OKT 2025 (KL) - Stock as of October 2025
14. KETERISIAN TANGKI (%) - Tank fill percentage
15. HOP 2 OKT 2025 (Hari) - Operation days as of Oct 2, 2025
16. KETERANGAN KONDISI HOP 5 HOP MIN - Status remarks

### 4. **Sample Data**
The component includes 4 sample rows representing data from UP3 Makassar Selatan for power plants:
- Barang Lompo
- Kodingareng
- Lae Lae
- Tana Keke

## Usage

### Basic Usage:
```tsx
import BBMMonitoringTable from './components/BBMMonitoringTable';

<BBMMonitoringTable />
```

### How to Use Features:

#### 1. **Filtering:**
- Click the three-dot menu icon in any column header
- Select "Filter"
- Enter filter criteria
- Multiple columns can be filtered simultaneously

#### 2. **Sorting:**
- Click any column header to sort ascending
- Click again to sort descending
- Click a third time to remove sorting

#### 3. **Pagination:**
- Use the bottom pagination controls to navigate pages
- Change "Rows per page" dropdown to adjust page size
- Shows "X-Y of Z" current page info

#### 4. **Row Selection:**
- Click checkboxes to select individual rows
- Click header checkbox to select all rows on current page
- Selected rows can be used for bulk operations (export, delete, etc.)

## Customization

### Adding More Data:
Edit the `rows` array in `BBMMonitoringTable.tsx`:

```typescript
const rows: BBMData[] = [
  {
    id: 5, // Must be unique
    no: 5,
    unitPelaksana: 'Your Unit',
    jenisKit: 'PLTD',
    // ... other fields
  },
  // Add more rows
];
```

### Modifying Columns:
Edit the `columns` array in `BBMMonitoringTable.tsx`:

```typescript
const columns: GridColDef[] = [
  {
    field: 'fieldName',
    headerName: 'Display Name',
    width: 150,
    type: 'number', // 'string', 'number', 'date', 'boolean'
    align: 'center',
    headerAlign: 'center',
  },
  // Add more columns
];
```

### Styling:
The table is styled to match the dashboard theme with:
- Gray borders (`#e5e7eb`)
- Light gray header background (`#f9fafb`)
- Hover effect on rows
- Responsive design with horizontal scroll

## Advanced Features (Easy to Add)

### 1. **Export to CSV/Excel:**
```bash
npm install @mui/x-data-grid-premium
```

### 2. **Server-Side Pagination:**
Connect to API endpoints for large datasets

### 3. **Custom Cell Renderers:**
Add icons, buttons, or custom formatting in cells

### 4. **Inline Editing:**
Enable cell editing with `editable: true` in column definition

### 5. **Toolbar with Search:**
Add global search and filter toolbar

## API Integration Example

```typescript
// Fetch data from API
const [rows, setRows] = useState<BBMData[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/bbm-monitoring')
    .then(res => res.json())
    .then(data => {
      setRows(data);
      setLoading(false);
    });
}, []);

// In DataGrid component:
<DataGrid
  rows={rows}
  loading={loading}
  // ... other props
/>
```

## Performance Notes

- The table is optimized for rendering large datasets
- Virtual scrolling ensures smooth performance with 1000+ rows
- Column resizing is automatic based on content
- Pagination reduces DOM elements for better performance

## Testing

All features have been tested:
- ✅ Lint check passed
- ✅ TypeScript compilation successful
- ✅ Production build successful
- ✅ Component renders correctly
- ✅ Filtering works as expected
- ✅ Sorting works as expected
- ✅ Pagination works as expected

## Position in Dashboard

The table is positioned at the bottom of the dashboard, after:
1. Filter dropdowns (Regional, Unit Induk, Unit Pelaksana, Period)
2. Stat cards (Total Stock, Consumption, Distribution)
3. Stock BBM bar chart and Fuel Type donut chart
4. Fuel Consumption chart and Power Plant HOP chart
5. **BBM Monitoring Table** ← NEW

## Future Enhancements

1. Connect to real API endpoints
2. Add export to Excel functionality
3. Add date range filtering
4. Add summary/aggregation row
5. Add drill-down capability (click row to see details)
6. Add color-coding for critical values
7. Add charts/sparklines in cells
8. Add bulk edit functionality
