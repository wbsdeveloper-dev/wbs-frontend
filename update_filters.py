import re

with open("app/dashboard/bbm/page.tsx", "r") as f:
    content = f.read()

# Lines 674-686
content = content.replace(
"""    const selectedUnitId = graphicUnit
      ? masterUnitData?.find((u) => u.name === graphicUnit)?.id
      : null;
    const selectedUpkId = graphicUpk
      ? masterUpkData?.find((u) => u.name === graphicUpk)?.id
      : null;
    const selectedKitId = graphicKit
      ? masterKitData?.find((k) => k.name === graphicKit)?.id
      : null;

    if (selectedUnitId) data = data.filter((p) => p.unit_id === selectedUnitId);
    if (selectedUpkId) data = data.filter((p) => p.upk_id === selectedUpkId);
    if (selectedKitId) data = data.filter((p) => p.kit_id === selectedKitId);""",
"""    const selectedUnitIds = graphicUnit.length > 0
      ? masterUnitData?.filter((u) => graphicUnit.includes(u.name)).map((u) => u.id) || []
      : [];
    const selectedUpkIds = graphicUpk.length > 0
      ? masterUpkData?.filter((u) => graphicUpk.includes(u.name)).map((u) => u.id) || []
      : [];
    const selectedKitId = graphicKit
      ? masterKitData?.find((k) => k.name === graphicKit)?.id
      : null;

    if (selectedUnitIds.length > 0) data = data.filter((p) => selectedUnitIds.includes(p.unit_id));
    if (selectedUpkIds.length > 0) data = data.filter((p) => selectedUpkIds.includes(p.upk_id));
    if (selectedKitId) data = data.filter((p) => p.kit_id === selectedKitId);"""
)

# Lines 735-743
content = content.replace(
"""    const selectedUnitId = graphicUnit
      ? masterUnitData?.find((u) => u.name === graphicUnit)?.id
      : null;
    const selectedUpkId = graphicUpk
      ? masterUpkData?.find((u) => u.name === graphicUpk)?.id
      : null;
    const selectedKitId = graphicKit
      ? masterKitData?.find((k) => k.name === graphicKit)?.id
      : null;""",
"""    const selectedUnitIds = graphicUnit.length > 0
      ? masterUnitData?.filter((u) => graphicUnit.includes(u.name)).map((u) => u.id) || []
      : [];
    const selectedUpkIds = graphicUpk.length > 0
      ? masterUpkData?.filter((u) => graphicUpk.includes(u.name)).map((u) => u.id) || []
      : [];
    const selectedKitId = graphicKit
      ? masterKitData?.find((k) => k.name === graphicKit)?.id
      : null;"""
)

# Lines 746-758 (the filter condition)
content = content.replace(
"""      if (graphicRegion) {
        const isSupplierInRegion = filterSupplierOptions.includes(record.tbbm);
        const isPlantInRegion = filterPlantOptions.includes(record.pembangkit);
        if (!isSupplierInRegion && !isPlantInRegion) return false;
      }
      if (selectedUnitId || selectedUpkId || selectedKitId) {
        const plantInfo = plantLookup.get(record.pembangkit);
        if (!plantInfo) return false;
        if (selectedUnitId && plantInfo.unit_id !== selectedUnitId)
          return false;
        if (selectedUpkId && plantInfo.upk_id !== selectedUpkId) return false;
        if (selectedKitId && plantInfo.kit_id !== selectedKitId) return false;
      }""",
"""      if (graphicRegion.length > 0) {
        const isSupplierInRegion = filterSupplierOptions.includes(record.tbbm);
        const isPlantInRegion = filterPlantOptions.includes(record.pembangkit);
        if (!isSupplierInRegion && !isPlantInRegion) return false;
      }
      if (selectedUnitIds.length > 0 || selectedUpkIds.length > 0 || selectedKitId) {
        const plantInfo = plantLookup.get(record.pembangkit);
        if (!plantInfo) return false;
        if (selectedUnitIds.length > 0 && !selectedUnitIds.includes(plantInfo.unit_id)) return false;
        if (selectedUpkIds.length > 0 && !selectedUpkIds.includes(plantInfo.upk_id)) return false;
        if (selectedKitId && plantInfo.kit_id !== selectedKitId) return false;
      }"""
)

# Line 762 -> graphicModa array
content = content.replace(
"""      if (graphicModa && record.moda !== graphicModa) return false;""",
"""      if (graphicModa.length > 0 && !graphicModa.includes(record.moda || "")) return false;"""
)

# Line 968 -> API parameters
content = content.replace(
"""        moda: graphicModa || undefined,
        tbbm:
          graphicSupplier ||
          (graphicRegion ? filterSupplierOptions.join(",") : undefined),
        pembangkit:
          graphicPlant ||
          (graphicRegion || graphicUnit || graphicUpk || graphicKit
            ? filterPlantOptions.join(",")
            : undefined),""",
"""        moda: graphicModa.length > 0 ? graphicModa.join(",") : undefined,
        tbbm:
          graphicSupplier ||
          (graphicRegion.length > 0 ? filterSupplierOptions.join(",") : undefined),
        pembangkit:
          graphicPlant ||
          (graphicRegion.length > 0 || graphicUnit.length > 0 || graphicUpk.length > 0 || graphicKit
            ? filterPlantOptions.join(",")
            : undefined),"""
)

# UI Filter Pills section
content = content.replace(
"""                  className={`text-xs text-gray-500 ${graphicStart || graphicEnd || graphicRegion || graphicUnit || graphicUpk || graphicKit || graphicPlant || graphicSupplier || graphicProduct || graphicModa ? "mb-3" : "mb-6"}`}""",
"""                  className={`text-xs text-gray-500 ${graphicStart || graphicEnd || graphicRegion.length > 0 || graphicUnit.length > 0 || graphicUpk.length > 0 || graphicKit || graphicPlant || graphicSupplier || graphicProduct || graphicModa.length > 0 ? "mb-3" : "mb-6"}`}"""
)

content = content.replace(
"""                  graphicRegion ||
                  graphicUnit ||
                  graphicUpk ||
                  graphicKit ||
                  graphicPlant ||
                  graphicSupplier ||
                  graphicProduct ||
                  graphicModa) && (""",
"""                  graphicRegion.length > 0 ||
                  graphicUnit.length > 0 ||
                  graphicUpk.length > 0 ||
                  graphicKit ||
                  graphicPlant ||
                  graphicSupplier ||
                  graphicProduct ||
                  graphicModa.length > 0) && ("""
)

content = content.replace(
"""                    {graphicRegion && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Region: {graphicRegion}
                      </span>
                    )}""",
"""                    {graphicRegion.length > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Region: {graphicRegion.join(", ")}
                      </span>
                    )}"""
)

content = content.replace(
"""                    {graphicUnit && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Instansi/Unit: {graphicUnit}
                      </span>
                    )}""",
"""                    {graphicUnit.length > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Instansi/Unit: {graphicUnit.join(", ")}
                      </span>
                    )}"""
)

content = content.replace(
"""                    {graphicUpk && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Unit Pelaksana: {graphicUpk}
                      </span>
                    )}""",
"""                    {graphicUpk.length > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Unit Pelaksana: {graphicUpk.join(", ")}
                      </span>
                    )}"""
)

content = content.replace(
"""                    {graphicModa && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Moda: {graphicModa}
                      </span>
                    )}""",
"""                    {graphicModa.length > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Moda: {graphicModa.join(", ")}
                      </span>
                    )}"""
)

# Autocomplete Components
content = content.replace(
"""                    options={filterRegionOptions}
                    value={graphicRegion}
                    onChange={(val) => {
                      setGraphicRegion(val);""",
"""                    options={filterRegionOptions}
                    value={graphicRegion}
                    multiple={true}
                    onChange={(val) => {
                      setGraphicRegion(val || []);"""
)

content = content.replace(
"""                    options={filterUnitOptions}
                    value={graphicUnit}
                    onChange={(val) => {
                      setGraphicUnit(val);""",
"""                    options={filterUnitOptions}
                    value={graphicUnit}
                    multiple={true}
                    onChange={(val) => {
                      setGraphicUnit(val || []);"""
)

content = content.replace(
"""                    options={filterUpkOptions}
                    value={graphicUpk}
                    onChange={(val) => {
                      setGraphicUpk(val);""",
"""                    options={filterUpkOptions}
                    value={graphicUpk}
                    multiple={true}
                    onChange={(val) => {
                      setGraphicUpk(val || []);"""
)

content = content.replace(
"""                    options={masterModaData?.map((m) => m.name) || []}
                    value={graphicModa}
                    onChange={(val) => {
                      setGraphicModa(val);""",
"""                    options={masterModaData?.map((m) => m.name) || []}
                    value={graphicModa}
                    multiple={true}
                    onChange={(val) => {
                      setGraphicModa(val || []);"""
)

# National Mode Grafik reset
content = content.replace(
"""                      setGraphicRegion(null);
                      setGraphicUnit(null);
                      setGraphicUpk(null);
                      setGraphicModa(null);""",
"""                      setGraphicRegion([]);
                      setGraphicUnit([]);
                      setGraphicUpk([]);
                      setGraphicModa([]);"""
)


with open("app/dashboard/bbm/page.tsx", "w") as f:
    f.write(content)

