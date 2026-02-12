"use client";

import { useState } from "react";
import { Box, Button, Tabs, Tab } from "@mui/material";
import { Plus } from "lucide-react";
import { DaftarSiteTable, RelasiOperasionalTable } from "../../components/SiteTable";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`site-tabpanel-${index}`}
            aria-labelledby={`site-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function SitePage() {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <main className="flex-1 overflow-auto">
                <div className="p-4 md:p-6 lg:p-8">
                    {/* Breadcrumb */}
                    <div className="text-sm text-gray-500 mb-2">
                        <span>Konfigurasi Sistem</span>
                        <span className="mx-2">&gt;</span>
                        <span className="text-gray-900">Manajemen Site</span>
                    </div>

                    {/* Header */}
                    <div className="mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            Manajemen Site
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm md:text-base">
                            Kelola lokasi operasional beserta keterhubungan pembangkit, pemasok, dan transportir
                        </p>
                    </div>

                    {/* Tabs and Button Container */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 3,
                            borderBottom: "1px solid #e5e7eb",
                        }}
                    >
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            sx={{
                                "& .MuiTabs-indicator": {
                                    backgroundColor: "#3b82f6",
                                    height: 3,
                                },
                                "& .MuiTab-root": {
                                    textTransform: "none",
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                    color: "#6b7280",
                                    minHeight: 48,
                                    px: 3,
                                    "&.Mui-selected": {
                                        color: "#3b82f6",
                                    },
                                },
                            }}
                        >
                            <Tab label="Daftar Site" />
                            <Tab label="Relasi Operasional" />
                            <Tab label="Peta Lokasi" />
                        </Tabs>

                        <Button
                            variant="contained"
                            startIcon={<Plus size={18} />}
                            sx={{
                                backgroundColor: "#0ea5e9",
                                textTransform: "none",
                                borderRadius: 2,
                                px: 3,
                                py: 1,
                                fontWeight: 500,
                                fontSize: "0.875rem",
                                boxShadow: "none",
                                "&:hover": {
                                    backgroundColor: "#0284c7",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                },
                            }}
                        >
                            {activeTab === 0 ? "Tambah Site" : activeTab === 1 ? "Tambah Relasi" : "Tambah Lokasi"}
                        </Button>
                    </Box>

                    {/* Tab Panels */}
                    <TabPanel value={activeTab} index={0}>
                        <DaftarSiteTable />
                    </TabPanel>

                    <TabPanel value={activeTab} index={1}>
                        <RelasiOperasionalTable />
                    </TabPanel>

                    <TabPanel value={activeTab} index={2}>
                        <Box
                            sx={{
                                height: 400,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "white",
                                borderRadius: 3,
                                border: "1px solid #e5e7eb",
                            }}
                        >
                            <p className="text-gray-500">Peta Lokasi akan ditampilkan di sini</p>
                        </Box>
                    </TabPanel>
                </div>
            </main>
        </div>
    );
}
