"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Switch } from "@mui/material";
import Image from "next/image";

// Mock base64 QR code (valid sample QR code image)
const MOCK_QR_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

interface BotStatusProps {
  title: string;
  status: "online" | "connecting";
  lastUpdated: string;
  actionButton: {
    label: string;
    variant: "show" | "logout";
    onClick: () => void;
  };
}

const BotStatusCard: React.FC<BotStatusProps> = ({
  title,
  status,
  lastUpdated,
  actionButton,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>

      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-2 h-2 rounded-full ${status === "online" ? "bg-green-500" : "bg-yellow-400"}`}
        ></div>
        <span className="text-sm text-gray-600">
          {status === "online" ? "Online" : "Connecting..."}
        </span>
      </div>

      <div className="flex mb-4 justify-between items-center gap-8">
        <div className="w-full">
          <p className="text-xs text-gray-500">Last Updated: {lastUpdated}</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${status === "online" ? "bg-linear-to-r from-green-400 to-green-600" : "bg-linear-to-r from-yellow-400 to-yellow-600"}`}
              style={{ width: "75%" }}
            ></div>
          </div>
        </div>

        <button
          onClick={actionButton.onClick}
          className={`w-[150px] px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            actionButton.variant === "logout"
              ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {actionButton.label}
        </button>
      </div>
    </div>
  );
};

interface GroupItem {
  id: string;
  name: string;
  members: number;
  checked: boolean;
}

const ManajemenBot: React.FC = () => {
  const [showPrimaryQR, setShowPrimaryQR] = useState(false);
  const [showSecondaryQR, setShowSecondaryQR] = useState(false);
  const [qrCode] = useState(MOCK_QR_BASE64);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState([
    "keyword",
    "marmud",
    "taggersi",
    "monitoring",
  ]);
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState(true);

  const [groups, setGroups] = useState<GroupItem[]>([
    { id: "1", name: "GROUP PLN JAKARTA", members: 50, checked: true },
    { id: "2", name: "Group 1 PLN Gresik", members: 50, checked: true },
    { id: "3", name: "Monitoring Data Group 5", members: 50, checked: true },
    {
      id: "4",
      name: "Group Monitoring Data Indonesia Timur",
      members: 50,
      checked: false,
    },
    { id: "5", name: "GROUP PLN JATENG", members: 50, checked: false },
  ]);

  const handleGroupToggle = (id: string) => {
    setGroups(
      groups.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g)),
    );
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const activeGroups = groups.filter((g) => g.checked).length;
  const totalGroups = groups.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span>&gt;</span>
          <span className="text-gray-900">Manajemen Bot</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Bot</h1>
        <p className="text-sm text-gray-600 mt-1">
          Kelola bot & monitoring Whatsapp Bot PLN
        </p>
      </div>

      {/* Bot Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 ">
        <div>
          <BotStatusCard
            title="Primary Bot"
            status="online"
            lastUpdated="Today - 14:12"
            actionButton={{
              label: "Logout",
              variant: "logout",
              onClick: () => console.log("Logout primary"),
            }}
          />

          {/* Primary QR Expansion */}
          {showPrimaryQR && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Connect Whatsapp Bot
                </h3>
                <button
                  onClick={() => setShowPrimaryQR(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center py-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                  <Image
                    src={qrCode}
                    alt="WhatsApp QR Code"
                    width={192}
                    height={192}
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center mb-1">
                  Scan menggunakan WhatsApp &gt; Linked Devices
                </p>
                <p className="text-xs text-gray-500">Menunggu koneksi...</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <BotStatusCard
            title="Secondary Bot"
            status="connecting"
            lastUpdated="Today - 14:12"
            actionButton={{
              label: "Show QR",
              variant: "show",
              onClick: () => setShowSecondaryQR(!showSecondaryQR),
            }}
          />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          {/* Secondary QR Expansion */}
          {showSecondaryQR && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Connect Whatsapp Bot
                </h3>
                <button
                  onClick={() => setShowSecondaryQR(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center py-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                  <Image
                    src={qrCode}
                    alt="WhatsApp QR Code"
                    width={192}
                    height={192}
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center mb-1">
                  Scan menggunakan WhatsApp &gt; Linked Devices
                </p>
                <p className="text-xs text-gray-500">Menunggu koneksi...</p>
              </div>
            </div>
          )}
          {!showSecondaryQR && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Konfigurasi Group
              </h3>

              <div className="space-y-3 mb-4">
                {groups.map((group) => (
                  <label
                    key={group.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={group.checked}
                      onChange={() => handleGroupToggle(group.id)}
                      className="w-5 h-5 text-blue-500 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      {group.name}{" "}
                      <span className="text-gray-500">
                        ({group.members} anggota)
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="text-right text-sm text-gray-500 pt-3 border-t border-gray-200">
                {activeGroups} Aktif (dari {totalGroups})
              </div>
            </div>
          )}
          {/* Third Row */}
          <div className="grid grid-cols-1 gap-6 mt-4">
            {/* Bot Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 w-full">
              <div className="flex justify-between items-center mb-6 w-full">
                <h3 className="text-lg font-semibold text-gray-800">
                  Bot Activity
                </h3>
                <span className="text-xs text-gray-500">
                  No message sent yet
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-700">Outbox Queue</span>
                    <span className="text-sm font-semibold text-gray-900">
                      3
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-linear-to-r from-purple-400 to-purple-600 h-2 rounded-full"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-700">
                      Failed Deliveries
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      3
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-linear-to-r from-red-400 to-red-600 h-2 rounded-full"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Collection */}
          </div>
        </div>
        <div className={`grid ${showSecondaryQR ? "grid-cols-2" : ""} gap-6`}>
          {showSecondaryQR && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Konfigurasi Group
              </h3>

              <div className="space-y-3 mb-4">
                {groups.map((group) => (
                  <label
                    key={group.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={group.checked}
                      onChange={() => handleGroupToggle(group.id)}
                      className="w-5 h-5 text-blue-500 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      {group.name}{" "}
                      <span className="text-gray-500">
                        ({group.members} anggota)
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="text-right text-sm text-gray-500 pt-3 border-t border-gray-200">
                {activeGroups} Aktif (dari {totalGroups})
              </div>
            </div>
          )}

          {/* Keywords */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Keywords
              </h3>

              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
                    placeholder="Tambahkan keyword baru"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleAddKeyword}
                  className="px-6 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Tambahkan
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <button className="w-full px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Lihat Semua
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 grow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Data Collection
                </h3>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Enabled
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-900">
                    Enabled
                  </span>
                </div>
                <Switch
                  checked={dataCollectionEnabled}
                  onChange={(e) => setDataCollectionEnabled(e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#14a1bb",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#14a1bb",
                    },
                  }}
                />
              </div>

              <p className="text-sm text-gray-600">
                Mengumpulkan chat dan meta data untuk reporting
              </p>
            </div>
          </div>
        </div>
        {/* Konfigurasi Group */}
      </div>
    </div>
  );
};

export default ManajemenBot;
