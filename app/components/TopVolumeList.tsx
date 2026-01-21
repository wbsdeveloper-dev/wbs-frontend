"use client";

interface TopVolumeList {
  name: string;
  volume: string;
}

interface TopVolumeListProps {
  title: string;
  list: TopVolumeList[];
  unit: string;
  description: string;
}

export default function TopVolumeList({
  title,
  list,
  unit,
  description,
}: TopVolumeListProps) {
  return (
    <div className="bg-white rounded-xl p-1 h-[400px] flex flex-col pb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 py-4 px-6">
          {title}
        </h3>
      </div>

      <div className="overflow-auto flex-1 p-5">
        {list.map((value, index) => (
          <div
            key={index}
            className={`text-gray-900 flex justify-between py-1.5 ${
              list.length - 1 != index ? "border-b border-gray-400" : ""
            }`}
          >
            <div>{value.name}</div>
            <div className="flex gap-1 font-bold">
              {value.volume} {unit}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200 mx-6">
        {description}
      </p>
    </div>
  );
}
