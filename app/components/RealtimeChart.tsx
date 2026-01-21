"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { X } from "lucide-react";

import { ListFilter } from "lucide-react";
import FilterAutocomplete from "./FilterAutocomplete";

const filterTypeOptions = ["Pemasok", "Pembangkit"];
const pemasokOptions = ["Pemasok A", "Pemasok B"];
const pembangkitOptionsA = ["Pembangkit 1", "Pembangkit 2", "Pembangkir 3"];
const pembangkitOptionsB = ["Pembangkir 3", "Pembangkit 4"];

type ChartItem = {
  label: string;
  values: Record<string, number>;
};

interface TooltipPayload {
  name: string;
  value: number;
  color?: string;
  dataKey?: string;
}

type SelectedPoint = {
  label: string;
  series: string;
  value: number;
};

const COLORS: Record<string, string> = {
  "Pembangkit 1": "#f87171",
  "Pembangkit 2": "#fb923c",
  "Pembangkit 3": "#facc15",
  "Pembangkit 4": "#60a5fa",
  "Mean Pembangkit 1": "#f87171",
  "Mean Pembangkit 2": "#fb923c",
  "Mean Pembangkit 3": "#facc15",
  "Mean Pembangkit 4": "#60a5fa",
};

const dataJamA: ChartItem[] = [
  {
    label: "00.00",
    values: { "Pembangkit 1": 20, "Pembangkit 2": 35, "Pembangkit 3": 45 },
  },
  {
    label: "01.00",
    values: { "Pembangkit 1": 18, "Pembangkit 2": 30, "Pembangkit 3": 40 },
  },
  {
    label: "02.00",
    values: { "Pembangkit 1": 15, "Pembangkit 2": 28, "Pembangkit 3": 48 },
  },
  {
    label: "03.00",
    values: { "Pembangkit 1": 12, "Pembangkit 2": 25, "Pembangkit 3": 45 },
  },
  {
    label: "04.00",
    values: { "Pembangkit 1": 10, "Pembangkit 2": 22, "Pembangkit 3": 42 },
  },
  {
    label: "05.00",
    values: { "Pembangkit 1": 15, "Pembangkit 2": 30, "Pembangkit 3": 40 },
  },
  {
    label: "06.00",
    values: { "Pembangkit 1": 30, "Pembangkit 2": 45, "Pembangkit 3": 45 },
  },
  {
    label: "07.00",
    values: { "Pembangkit 1": 45, "Pembangkit 2": 60, "Pembangkit 3": 40 },
  },
  {
    label: "08.00",
    values: { "Pembangkit 1": 60, "Pembangkit 2": 70, "Pembangkit 3": 40 },
  },
  {
    label: "09.00",
    values: { "Pembangkit 1": 70, "Pembangkit 2": 80, "Pembangkit 3": 40 },
  },
  {
    label: "10.00",
    values: { "Pembangkit 1": 75, "Pembangkit 2": 85, "Pembangkit 3": 45 },
  },
  {
    label: "11.00",
    values: { "Pembangkit 1": 80, "Pembangkit 2": 90, "Pembangkit 3": 40 },
  },
  {
    label: "12.00",
    values: { "Pembangkit 1": 85, "Pembangkit 2": 95, "Pembangkit 3": 45 },
  },
  {
    label: "13.00",
    values: { "Pembangkit 1": 82, "Pembangkit 2": 92, "Pembangkit 3": 42 },
  },
  {
    label: "14.00",
    values: { "Pembangkit 1": 78, "Pembangkit 2": 88, "Pembangkit 3": 48 },
  },
  {
    label: "15.00",
    values: { "Pembangkit 1": 72, "Pembangkit 2": 82, "Pembangkit 3": 42 },
  },
  {
    label: "16.00",
    values: { "Pembangkit 1": 65, "Pembangkit 2": 75, "Pembangkit 3": 45 },
  },
  {
    label: "17.00",
    values: { "Pembangkit 1": 60, "Pembangkit 2": 70, "Pembangkit 3": 40 },
  },
  {
    label: "18.00",
    values: { "Pembangkit 1": 55, "Pembangkit 2": 65, "Pembangkit 3": 45 },
  },
  {
    label: "19.00",
    values: { "Pembangkit 1": 50, "Pembangkit 2": 60, "Pembangkit 3": 40 },
  },
  {
    label: "20.00",
    values: { "Pembangkit 1": 45, "Pembangkit 2": 55, "Pembangkit 3": 45 },
  },
  {
    label: "21.00",
    values: { "Pembangkit 1": 40, "Pembangkit 2": 50, "Pembangkit 3": 40 },
  },
  {
    label: "22.00",
    values: { "Pembangkit 1": 30, "Pembangkit 2": 45, "Pembangkit 3": 45 },
  },
  {
    label: "23.00",
    values: { "Pembangkit 1": 25, "Pembangkit 2": 40, "Pembangkit 3": 40 },
  },
];

const dataJamAMean: Record<string, number> = {
  "Pembangkit 1": 48.83,
  "Pembangkit 2": 63.63,
  "Pembangkit 3": 42.79,
};

const dataJamB: ChartItem[] = [
  { label: "00.00", values: { pembangkit: 20, pemasok: 35 } },
  { label: "01.00", values: { pembangkit: 18, pemasok: 30 } },
  { label: "02.00", values: { pembangkit: 15, pemasok: 28 } },
  { label: "03.00", values: { pembangkit: 12, pemasok: 25 } },
  { label: "04.00", values: { pembangkit: 10, pemasok: 22 } },
  { label: "05.00", values: { pembangkit: 15, pemasok: 30 } },
  { label: "06.00", values: { pembangkit: 30, pemasok: 45 } },
  { label: "07.00", values: { pembangkit: 45, pemasok: 60 } },
  { label: "08.00", values: { pembangkit: 60, pemasok: 70 } },
  { label: "09.00", values: { pembangkit: 70, pemasok: 80 } },
  { label: "10.00", values: { pembangkit: 75, pemasok: 85 } },
  { label: "11.00", values: { pembangkit: 80, pemasok: 90 } },
  { label: "12.00", values: { pembangkit: 85, pemasok: 95 } },
  { label: "13.00", values: { pembangkit: 82, pemasok: 92 } },
  { label: "14.00", values: { pembangkit: 78, pemasok: 88 } },
  { label: "15.00", values: { pembangkit: 72, pemasok: 82 } },
  { label: "16.00", values: { pembangkit: 65, pemasok: 75 } },
  { label: "17.00", values: { pembangkit: 60, pemasok: 70 } },
  { label: "18.00", values: { pembangkit: 55, pemasok: 65 } },
  { label: "19.00", values: { pembangkit: 50, pemasok: 60 } },
  { label: "20.00", values: { pembangkit: 45, pemasok: 55 } },
  { label: "21.00", values: { pembangkit: 40, pemasok: 50 } },
  { label: "22.00", values: { pembangkit: 30, pemasok: 45 } },
  { label: "23.00", values: { pembangkit: 25, pemasok: 40 } },
];

const data1MingguA: ChartItem[] = [
  { label: "Senin", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Selasa", values: { pembangkit: 70, pemasok: 82 } },
  { label: "Rabu", values: { pembangkit: 72, pemasok: 85 } },
  { label: "Kamis", values: { pembangkit: 75, pemasok: 88 } },
  { label: "Jumat", values: { pembangkit: 78, pemasok: 90 } },
  { label: "Sabtu", values: { pembangkit: 74, pemasok: 86 } },
  { label: "Minggu", values: { pembangkit: 70, pemasok: 83 } },
];
const data1MingguB: ChartItem[] = [
  { label: "Senin", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Selasa", values: { pembangkit: 70, pemasok: 82 } },
  { label: "Rabu", values: { pembangkit: 72, pemasok: 85 } },
  { label: "Kamis", values: { pembangkit: 75, pemasok: 88 } },
  { label: "Jumat", values: { pembangkit: 78, pemasok: 90 } },
  { label: "Sabtu", values: { pembangkit: 74, pemasok: 86 } },
  { label: "Minggu", values: { pembangkit: 70, pemasok: 83 } },
];

const data3BulanA: ChartItem[] = [
  { label: "Juli", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Agustus", values: { pembangkit: 72, pemasok: 85 } },
  { label: "September", values: { pembangkit: 78, pemasok: 90 } },
];
const data3BulanB: ChartItem[] = [
  { label: "Juli", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Agustus", values: { pembangkit: 72, pemasok: 85 } },
  { label: "September", values: { pembangkit: 78, pemasok: 90 } },
];

const data6BulanA: ChartItem[] = [
  { label: "April", values: { pembangkit: 60, pemasok: 72 } },
  { label: "Mei", values: { pembangkit: 65, pemasok: 76 } },
  { label: "Juni", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Juli", values: { pembangkit: 70, pemasok: 83 } },
  { label: "Agustus", values: { pembangkit: 74, pemasok: 87 } },
  { label: "September", values: { pembangkit: 78, pemasok: 90 } },
];
const data6BulanB: ChartItem[] = [
  { label: "April", values: { pembangkit: 60, pemasok: 72 } },
  { label: "Mei", values: { pembangkit: 65, pemasok: 76 } },
  { label: "Juni", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Juli", values: { pembangkit: 70, pemasok: 83 } },
  { label: "Agustus", values: { pembangkit: 74, pemasok: 87 } },
  { label: "September", values: { pembangkit: 78, pemasok: 90 } },
];

const data1TahunA: ChartItem[] = [
  { label: "Jan", values: { pembangkit: 50, pemasok: 65 } },
  { label: "Feb", values: { pembangkit: 52, pemasok: 67 } },
  { label: "Mar", values: { pembangkit: 55, pemasok: 70 } },
  { label: "Apr", values: { pembangkit: 58, pemasok: 72 } },
  { label: "Mei", values: { pembangkit: 62, pemasok: 75 } },
  { label: "Jun", values: { pembangkit: 65, pemasok: 78 } },
  { label: "Jul", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Agu", values: { pembangkit: 72, pemasok: 85 } },
  { label: "Sep", values: { pembangkit: 75, pemasok: 88 } },
  { label: "Okt", values: { pembangkit: 78, pemasok: 90 } },
  { label: "Nov", values: { pembangkit: 80, pemasok: 92 } },
  { label: "Des", values: { pembangkit: 82, pemasok: 95 } },
];
const data1TahunB: ChartItem[] = [
  { label: "Jan", values: { pembangkit: 50, pemasok: 65 } },
  { label: "Feb", values: { pembangkit: 52, pemasok: 67 } },
  { label: "Mar", values: { pembangkit: 55, pemasok: 70 } },
  { label: "Apr", values: { pembangkit: 58, pemasok: 72 } },
  { label: "Mei", values: { pembangkit: 62, pemasok: 75 } },
  { label: "Jun", values: { pembangkit: 65, pemasok: 78 } },
  { label: "Jul", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Agu", values: { pembangkit: 72, pemasok: 85 } },
  { label: "Sep", values: { pembangkit: 75, pemasok: 88 } },
  { label: "Okt", values: { pembangkit: 78, pemasok: 90 } },
  { label: "Nov", values: { pembangkit: 80, pemasok: 92 } },
  { label: "Des", values: { pembangkit: 82, pemasok: 95 } },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm text-gray-900 w-[300px] z-100">
      <p className="font-semibold mb-2">{label}</p>

      <ul className="space-y-1">
        {payload.map((item, index) => (
          <li key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}</span>
            </span>

            <span className="font-medium">{item.value} MMBTU</span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between mt-2">
        <p>JPH</p>
        <p>100</p>
      </div>
      <div className="flex justify-between">
        <p>TOP</p>
        <p>200</p>
      </div>
      <div className="flex justify-between">
        <p>JPMH</p>
        <p>170</p>
      </div>
      <div className="flex justify-between">
        <p>Harga PJBG</p>
        <p>Rp.2,000,000,000</p>
      </div>
      <div className="flex justify-between mt-2">
        <p>Realisasi</p>
        <p>98</p>
      </div>
      <div className="flex justify-between ">
        <p>Flowrate</p>
        <p>80</p>
      </div>
    </div>
  );
};

export default function RealtimeChart() {
  const [period, setPeriod] = useState("1D");
  const [filterType, setFilterType] = useState<string | null>("Pemasok");
  const [pemasok, setPemasok] = useState<string | null>("Pemasok A");
  const [pembangkit, setPembangkit] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [chartData, setChartData] = useState<ChartItem[]>(dataJamA);
  const [openModal, setOpenModal] = useState(false);
  const [note, setNote] = useState("");
  const [chartDataMean, setChartDataMean] =
    useState<Record<string, number>>(dataJamAMean);

  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(
    null
  );

  const today = new Date();

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(today);

  const pembangkitOptions = useMemo(() => {
    if (pemasok === "Pemasok A") return pembangkitOptionsA;
    if (pemasok === "Pemasok B") return pembangkitOptionsB;
    return [];
  }, [pemasok]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Grafik Penyaluran Gas - {pemasok}{" "}
          {filterType == "Pemasok" ? (pembangkit ? " Ke " : "") : " Dari "}{" "}
          {pembangkit ?? pembangkit}
        </h3>
        <div>
          <p className="text-gray-700 font-bold">{formattedDate}</p>
        </div>
        <div className="flex gap-10">
          <div className="flex gap-6">
            <button
              className={`text-[#115d72] ${
                period == "1D" ? "bg-[#14a2bb92] w-[45px] rounded-md" : ""
              } cursor-pointer`}
              onClick={() => {
                setPeriod("1D");
                if (pemasok == "Pemasok A") setChartData(dataJamA);
                if (pemasok == "Pemasok B") setChartData(dataJamB);
              }}
            >
              1D
            </button>
            <button
              className={`text-[#115d72] ${
                period == "1W" ? "bg-[#14a2bb92] w-[45px] rounded-md" : ""
              } cursor-pointer`}
              onClick={() => {
                setPeriod("1W");
                if (pemasok == "Pemasok A") setChartData(data1MingguA);
                if (pemasok == "Pemasok B") setChartData(data1MingguB);
              }}
            >
              1W
            </button>
            <button
              className={`text-[#115d72] ${
                period == "3M" ? "bg-[#14a2bb92] w-[45px] rounded-md" : ""
              } cursor-pointer`}
              onClick={() => {
                setPeriod("3M");
                if (pemasok == "Pemasok A") setChartData(data3BulanA);
                if (pemasok == "Pemasok B") setChartData(data3BulanB);
              }}
            >
              3M
            </button>
            <button
              className={`text-[#115d72] ${
                period == "6M" ? "bg-[#14a2bb92] w-[45px] rounded-md" : ""
              } cursor-pointer`}
              onClick={() => {
                setPeriod("6M");
                if (pemasok == "Pemasok A") setChartData(data6BulanA);
                if (pemasok == "Pemasok B") setChartData(data6BulanB);
              }}
            >
              6M
            </button>
            <button
              className={`text-[#115d72] ${
                period == "1Y" ? "bg-[#14a2bb92] w-[45px] rounded-md" : ""
              } cursor-pointer`}
              onClick={() => {
                setPeriod("1Y");
                if (pemasok == "Pemasok A") setChartData(data1TahunA);
                if (pemasok == "Pemasok B") setChartData(data1TahunB);
              }}
            >
              1Y
            </button>
          </div>
          <div className="relative">
            <button
              className={`cursor-pointer`}
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <ListFilter
                className={`w-5 ${
                  filterOpen ? "text-[#14a2bb92]" : "text-gray-500"
                }`}
              />
            </button>
            {filterOpen && (
              <div className="absolute z-20 bg-white text-gray-500 right-0 w-3xs shadow-lg p-6 rounded-xl flex flex-col gap-3">
                <FilterAutocomplete
                  label="Filter Berdasar"
                  options={filterTypeOptions}
                  value={filterType}
                  onChange={setFilterType}
                  placeholder="Pilih Filter"
                />
                {(filterType == "Pemasok" || pembangkit) && (
                  <FilterAutocomplete
                    label="Pemasok"
                    options={pemasokOptions}
                    value={pemasok}
                    onChange={setPemasok}
                    placeholder="Pilih Pemasok"
                  />
                )}
                {(filterType == "Pembangkit" || pemasok) && (
                  <FilterAutocomplete
                    label="Pembangkit"
                    options={pembangkitOptions}
                    value={pembangkit}
                    onChange={setPembangkit}
                    placeholder="Pilih Pembangkit"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <XAxis dataKey="label" />
          <YAxis domain={[0, 100]} />
          <Legend className="z-0" />
          <Tooltip content={<CustomTooltip />} />
          {Object.keys(chartData[0].values)
            .filter((key) => {
              if (!pembangkit) return true;

              return key.toLowerCase().includes(pembangkit.toLowerCase());
            })
            .map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={`values.${key}`}
                name={key.toUpperCase()}
                stroke={COLORS[key]}
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload, value } = props;

                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={20}
                      fill="transparent"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedPoint({
                          label: payload.label,
                          series: key,
                          value,
                        });

                        setOpenModal(true);
                      }}
                    />
                  );
                }}
              />
            ))}

          {Object.keys(dataJamAMean)
            .filter((key) => {
              if (!pembangkit) return true;

              return key.toLowerCase().includes(pembangkit.toLowerCase());
            })
            .map((key) => (
              <ReferenceLine
                key={`mean-${key}`}
                y={dataJamAMean[key]}
                stroke={COLORS[`Mean ${key}`]}
                strokeDasharray="6 6"
                label={`Mean ${key}`}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
        Visualisasi data realtime perbandingan pemasok dan pembangkit harian 24
        jam
      </p>
      {openModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenModal(false)}
          />
          <div className="relative bg-white w-full max-w-5xl rounded-xl shadow-lg p-6 z-10">
            <div className="text-right text-gray-900">
              <button
                onClick={() => setOpenModal(false)}
                className="cursor-pointer"
              >
                <X />
              </button>
            </div>
            <div>
              <div className="grid grid-cols-2 text-gray-900 gap-8">
                <div>
                  <div className="flex justify-between">
                    <h3 className="font-bold mb-2">
                      Catatan {selectedPoint?.series}
                    </h3>
                    <p className="font-bold mb-2">
                      {selectedPoint?.label}, {formattedDate}
                    </p>
                  </div>
                  <div className="border border-gray-200 p-3 rounded-lg">
                    <div className="mt-1">
                      <p>
                        Lorem ipsum dolor, sit amet consectetur adipisicing
                        elit. Animi consectetur laborum odio sapiente
                        exercitationem maiores inventore. Eligendi saepe dolorem
                        enim perferendis dolorum sint! Facilis officia, ea dolor
                        architecto enim, inventore, quae dolores earum
                        perspiciatis at ipsa repudiandae! Neque quibusdam
                        laboriosam fugit distinctio blanditiis? Vitae et
                        quisquam commodi sed nobis. Quaerat repellendus ducimus
                        quae perspiciatis veritatis eos mollitia aut alias
                        dignissimos dicta, fuga, minima maxime doloremque porro
                        temporibus qui blanditiis eum itaque sequi facilis, esse
                        eligendi neque. Minus debitis officia, ut laboriosam
                        fuga animi quaerat placeat error? Facere error similique
                        odit, in beatae temporibus qui quasi alias esse officia
                        officiis rerum?
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Tambah Catatan Baru</h3>
                  <div>
                    <textarea
                      id="message"
                      rows={4}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Tulis catatan di sini..."
                      className="
                        w-full rounded-lg border border-gray-200
                        px-4 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        focus:border-blue-500
                        resize-none
                      "
                    />
                    <button className="w-[100] bg-[#14a1bb] hover:bg-[#115d72] text-white font-medium py-2 rounded-lg transition-colors cursor-pointer">
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
