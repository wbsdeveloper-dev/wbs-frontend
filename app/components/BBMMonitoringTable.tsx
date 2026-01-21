'use client';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';

interface BBMData {
  id: number;
  no: number;
  unitPelaksana: string;
  jenisKit: string;
  pembangkit: string;
  kapasitasKw: number;
  jenisBbm: string;
  modaAngkutan: string;
  tbbmNama: string;
  tbbmKapKl: number;
  tanggalTimbunPemakaianData2Bulan1: number;
  tanggalTimbunHopHari: number;
  tanggalTimbunHopMinimum: number;
  stokOkt2025Kl: number;
  keterisianTangkiKl: number;
  hop2Okt2025Hari: number;
  keteranganKondisiHop5HopMin: string;
}

const columns: GridColDef[] = [
  { 
    field: 'no', 
    headerName: 'NO.', 
    width: 60,
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'unitPelaksana',
    headerName: 'UNIT PELAKSANA',
    width: 150,
  },
  {
    field: 'jenisKit',
    headerName: 'JENIS KIT',
    width: 100,
  },
  {
    field: 'pembangkit',
    headerName: 'PEMBANGKIT',
    width: 130,
  },
  {
    field: 'kapasitasKw',
    headerName: 'KAPASITAS kW',
    width: 120,
    type: 'number',
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'jenisBbm',
    headerName: 'JENIS BBM',
    width: 100,
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'modaAngkutan',
    headerName: 'MODA ANGKUTAN',
    width: 120,
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'tbbmNama',
    headerName: 'TBBM NAMA',
    width: 120,
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'tbbmKapKl',
    headerName: 'KAP. (KL)',
    width: 90,
    type: 'number',
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'tanggalTimbunPemakaianData2Bulan1',
    headerName: 'PEMAKAIAN DATA2 BULAN-1',
    width: 130,
    type: 'number',
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'tanggalTimbunHopHari',
    headerName: 'HOP (Hari)',
    width: 100,
    type: 'number',
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'tanggalTimbunHopMinimum',
    headerName: 'HOP MINIMUM',
    width: 120,
    type: 'number',
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'stokOkt2025Kl',
    headerName: 'STOK OKT 2025 (KL)',
    width: 130,
    type: 'number',
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'keterisianTangkiKl',
    headerName: 'KETERISIAN TANGKI (%)',
    width: 150,
    type: 'number',
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'hop2Okt2025Hari',
    headerName: 'HOP 2 OKT 2025 (Hari)',
    width: 150,
    type: 'number',
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'keteranganKondisiHop5HopMin',
    headerName: 'KETERANGAN KONDISI HOP 5 HOP MIN',
    width: 250,
    align: 'center',
    headerAlign: 'center',
  },
];

const rows: BBMData[] = [
  {
    id: 1,
    no: 1,
    unitPelaksana: 'UP3 Makassar Selatan',
    jenisKit: 'PLTD',
    pembangkit: 'Barang Lompo',
    kapasitasKw: 828,
    jenisBbm: 'B40',
    modaAngkutan: 'Shipping',
    tbbmNama: 'Makassar',
    tbbmKapKl: 24,
    tanggalTimbunPemakaianData2Bulan1: 1.2,
    tanggalTimbunHopHari: 20,
    tanggalTimbunHopMinimum: 10,
    stokOkt2025Kl: 18,
    keterisianTangkiKl: 75,
    hop2Okt2025Hari: 15,
    keteranganKondisiHop5HopMin: '',
  },
  {
    id: 2,
    no: 2,
    unitPelaksana: 'UP3 Makassar Selatan',
    jenisKit: 'PLTD',
    pembangkit: 'Kodingareng',
    kapasitasKw: 1304,
    jenisBbm: 'B40',
    modaAngkutan: 'Shipping',
    tbbmNama: 'Makassar',
    tbbmKapKl: 20,
    tanggalTimbunPemakaianData2Bulan1: 1.00,
    tanggalTimbunHopHari: 20,
    tanggalTimbunHopMinimum: 10,
    stokOkt2025Kl: 8,
    keterisianTangkiKl: 40,
    hop2Okt2025Hari: 8,
    keteranganKondisiHop5HopMin: 'RENCANA KIRIM 10 KL',
  },
  {
    id: 3,
    no: 3,
    unitPelaksana: 'UP3 Makassar Selatan',
    jenisKit: 'PLTD',
    pembangkit: 'Lae Lae',
    kapasitasKw: 702,
    jenisBbm: 'B40',
    modaAngkutan: 'Shipping',
    tbbmNama: 'Makassar',
    tbbmKapKl: 20,
    tanggalTimbunPemakaianData2Bulan1: 0.75,
    tanggalTimbunHopHari: 27,
    tanggalTimbunHopMinimum: 9,
    stokOkt2025Kl: 15,
    keterisianTangkiKl: 75,
    hop2Okt2025Hari: 20,
    keteranganKondisiHop5HopMin: '',
  },
  {
    id: 4,
    no: 4,
    unitPelaksana: 'UP3 Makassar Selatan',
    jenisKit: 'PLTD',
    pembangkit: 'Tana Keke',
    kapasitasKw: 340,
    jenisBbm: 'B40',
    modaAngkutan: 'Shipping',
    tbbmNama: 'Makassar',
    tbbmKapKl: 12,
    tanggalTimbunPemakaianData2Bulan1: 0.28,
    tanggalTimbunHopHari: 39,
    tanggalTimbunHopMinimum: 10,
    stokOkt2025Kl: 7,
    keterisianTangkiKl: 58,
    hop2Okt2025Hari: 24,
    keteranganKondisiHop5HopMin: '',
  },
];

export default function BBMMonitoringTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">BBM Monitoring Table</h3>
        <p className="text-sm text-gray-600 mb-4">
          MONITORING BBM UNIT INDUK DISTRIBUSI SULAWESI SELATAN, TENGGARA & BARAT
        </p>
        <p className="text-sm text-gray-500">November 2025</p>
      </div>
      
      <Box sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderColor: '#e5e7eb',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f9fafb',
              borderColor: '#e5e7eb',
              fontSize: '0.75rem',
              fontWeight: 600,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f3f4f6',
            },
          }}
        />
      </Box>
    </div>
  );
}
