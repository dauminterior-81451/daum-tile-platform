"use client";

import { useState } from "react";

const workAreas = ["욕실", "주방벽", "베란다", "걸레받이", "기타"] as const;

const wallTileSizes = [
  "300×300",
  "300×600",
  "600×600",
  "600×1200",
  "800×800",
  "900×900",
  "직접입력",
] as const;

const floorTileSizes = [
  "300×300",
  "300×600",
  "600×600",
  "600×1200",
  "800×800",
  "900×900",
  "직접입력",
] as const;

const lossRates = ["5%", "10%", "15%", "20%"] as const;

const accessoryRates = [
  { name: "드라이픽스", rate: 0.7286, unit: "포" },
  { name: "에폭시", rate: 0.2619, unit: "조" },
  { name: "줄눈제", rate: 0.0857, unit: "포" },
  { name: "실리콘", rate: 0.1048, unit: "개" },
] as const;

type WorkArea = (typeof workAreas)[number];
type TileSize = (typeof wallTileSizes)[number];
type TileKind = "벽타일" | "바닥타일";
type InputMethod = "면적 입력" | "치수 입력" | "길이 입력";
type LossRate = (typeof lossRates)[number];
type RegisteredTileSize = Exclude<TileSize, "직접입력">;

type TileSpec = {
  width: number;
  height: number;
  tileArea: number;
  boxTiles: number;
  boxArea: number;
};

type CalculationResult = {
  constructionArea: number;
  lossAppliedArea: number;
  requiredTiles: number;
  requiredBoxes: number;
};

type InputError = "area" | "width" | "height" | "length";

type SavedCalculation = {
  id: number;
  workArea: WorkArea;
  tileKind: TileKind;
  tileSize: TileSize;
  inputMethod: InputMethod;
  areaSquareMeter: string;
  widthMillimeter: string;
  heightMillimeter: string;
  lengthMillimeter: string;
  lossRate: LossRate;
  constructionArea: number;
  lossAppliedArea: number;
  requiredBoxes: number;
  totalOrderQuantity: number;
};

const tileSpecs: Record<RegisteredTileSize, TileSpec> = {
  "300×300": {
    width: 300,
    height: 300,
    tileArea: 0.09,
    boxTiles: 16,
    boxArea: 1.44,
  },
  "300×600": {
    width: 300,
    height: 600,
    tileArea: 0.18,
    boxTiles: 8,
    boxArea: 1.44,
  },
  "600×600": {
    width: 600,
    height: 600,
    tileArea: 0.36,
    boxTiles: 4,
    boxArea: 1.44,
  },
  "600×1200": {
    width: 600,
    height: 1200,
    tileArea: 0.72,
    boxTiles: 2,
    boxArea: 1.44,
  },
  "800×800": {
    width: 800,
    height: 800,
    tileArea: 0.64,
    boxTiles: 3,
    boxArea: 1.92,
  },
  "900×900": {
    width: 900,
    height: 900,
    tileArea: 0.81,
    boxTiles: 2,
    boxArea: 1.62,
  },
};

function getButtonClass(isActive: boolean) {
  return [
    "min-h-12 rounded-md border px-4 py-3 text-sm font-semibold transition-colors sm:text-base",
    isActive
      ? "border-sky-600 bg-sky-600 text-white shadow-sm"
      : "border-zinc-200 bg-white text-zinc-700 hover:border-sky-300 hover:bg-sky-50",
  ].join(" ");
}

function getDefaultInputMethod(area: WorkArea): InputMethod {
  if (area === "주방벽") {
    return "치수 입력";
  }

  if (area === "걸레받이") {
    return "길이 입력";
  }

  return "면적 입력";
}

function parseInputValue(value: string) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

function isValidPositiveInput(value: string) {
  return value.trim() !== "" && parseInputValue(value) > 0;
}

function formatSquareMeter(value: number) {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2).replace(/\.?0+$/, "");
}

export default function Home() {
  const [selectedArea, setSelectedArea] = useState<WorkArea>("욕실");
  const [selectedTileKind, setSelectedTileKind] = useState<TileKind>("벽타일");
  const [selectedWallTile, setSelectedWallTile] = useState<TileSize>("300×600");
  const [selectedFloorTile, setSelectedFloorTile] = useState<TileSize>("300×300");
  const [inputMethod, setInputMethod] = useState<InputMethod>("면적 입력");
  const [areaSquareMeter, setAreaSquareMeter] = useState("");
  const [widthMillimeter, setWidthMillimeter] = useState("");
  const [heightMillimeter, setHeightMillimeter] = useState("");
  const [lengthMillimeter, setLengthMillimeter] = useState("");
  const [selectedLossRate, setSelectedLossRate] = useState<LossRate>("10%");
  const [calculationResult, setCalculationResult] =
    useState<CalculationResult | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [isCopyComplete, setIsCopyComplete] = useState(false);
  const [inputErrors, setInputErrors] = useState<InputError[]>([]);
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>(
    [],
  );

  const selectedTileSize =
    selectedTileKind === "벽타일" ? selectedWallTile : selectedFloorTile;
  const selectedTileSpec =
    selectedTileSize === "직접입력" ? null : tileSpecs[selectedTileSize];
  const canSelectInputMethod =
    selectedArea === "욕실" || selectedArea === "베란다" || selectedArea === "기타";
  const heightLabel = selectedArea === "주방벽" ? "높이(mm)" : "세로(mm)";
  const savedTotalBoxes = savedCalculations.reduce(
    (total, calculation) => total + calculation.requiredBoxes,
    0,
  );
  const savedTotalOrderQuantity = savedCalculations.reduce(
    (total, calculation) => total + calculation.totalOrderQuantity,
    0,
  );
  const savedTotalConstructionArea = savedCalculations.reduce(
    (total, calculation) => total + calculation.constructionArea,
    0,
  );

  function resetCalculationResult() {
    setCalculationResult(null);
    setIsResultStale(true);
    setInputErrors([]);
  }

  function clearInputError(error: InputError) {
    setInputErrors((currentErrors) =>
      currentErrors.filter((currentError) => currentError !== error),
    );
  }

  function handleAreaSelect(area: WorkArea) {
    resetCalculationResult();
    setSelectedArea(area);
    setInputMethod(getDefaultInputMethod(area));
  }

  function handleCalculate() {
    if (!selectedTileSpec) {
      setCalculationResult(null);
      setIsResultStale(false);
      return;
    }

    const nextInputErrors: InputError[] =
      inputMethod === "면적 입력"
        ? isValidPositiveInput(areaSquareMeter)
          ? []
          : ["area"]
        : inputMethod === "치수 입력"
          ? [
              ...(isValidPositiveInput(widthMillimeter) ? [] : ["width" as const]),
              ...(isValidPositiveInput(heightMillimeter)
                ? []
                : ["height" as const]),
            ]
          : isValidPositiveInput(lengthMillimeter)
            ? []
            : ["length"];

    if (nextInputErrors.length > 0) {
      setInputErrors(nextInputErrors);
      setCalculationResult(null);
      setIsResultStale(false);
      return;
    }

    setInputErrors([]);

    const width = parseInputValue(widthMillimeter);
    const height = parseInputValue(heightMillimeter);
    const area = parseInputValue(areaSquareMeter);
    const length = parseInputValue(lengthMillimeter);
    const constructionArea =
      inputMethod === "면적 입력"
        ? area
        : inputMethod === "치수 입력"
          ? (width * height) / 1_000_000
          : (length * selectedTileSpec.height) / 1_000_000;
    const lossRate = parseInputValue(selectedLossRate.replace("%", "")) / 100;
    const lossAppliedArea = constructionArea * (1 + lossRate);

    setCalculationResult({
      constructionArea,
      lossAppliedArea,
      requiredTiles: Math.ceil(lossAppliedArea / selectedTileSpec.tileArea),
      requiredBoxes: Math.ceil(lossAppliedArea / selectedTileSpec.boxArea),
    });
    setIsResultStale(false);
  }

  async function handleCopyOrderSummary() {
    if (!calculationResult || !selectedTileSpec) {
      return;
    }

    try {
      const orderSummary = [
        `시공부위: ${selectedArea}`,
        `타일규격: ${selectedTileSize}`,
        "",
        `시공면적: ${calculationResult.constructionArea.toFixed(2)}㎡`,
        `로스적용면적: ${calculationResult.lossAppliedArea.toFixed(2)}㎡`,
        `발주박스: ${calculationResult.requiredBoxes}박스`,
        `총발주수량: ${
          calculationResult.requiredBoxes * selectedTileSpec.boxTiles
        }장`,
        "",
        "부자재 참고 계산",
        ...accessoryRates.map(
          (accessory) =>
            `${accessory.name}: ${(
              calculationResult.constructionArea * accessory.rate
            ).toFixed(1)}${accessory.unit}`,
        ),
        "",
        "※ 부자재 수량은 참고용입니다.",
      ].join("\n");

      await navigator.clipboard.writeText(orderSummary);
      setIsCopyComplete(true);
      window.setTimeout(() => setIsCopyComplete(false), 1500);
    } catch {
      setIsCopyComplete(false);
    }
  }

  async function handleCopySavedOrderSummary() {
    if (savedCalculations.length === 0) {
      return;
    }

    try {
      const savedOrderItems = savedCalculations.map(
        (calculation, index) =>
          [
            `${index + 1}. ${calculation.workArea}`,
            `   타일규격: ${calculation.tileSize}`,
            `   시공면적: ${formatSquareMeter(calculation.constructionArea)}㎡`,
            `   발주박스: ${calculation.requiredBoxes}박스`,
            `   총발주수량: ${calculation.totalOrderQuantity}장`,
          ].join("\n"),
      );
      const accessorySummary = accessoryRates.map(
        (accessory) =>
          `${accessory.name}: ${(savedTotalConstructionArea * accessory.rate).toFixed(1)}${accessory.unit}`,
      );
      const savedOrderSummary = [
        "[다움 타일 발주]",
        "",
        savedOrderItems.join("\n\n"),
        "",
        "---",
        "",
        `총 박스 수량: ${savedTotalBoxes}박스`,
        `총 발주 수량: ${savedTotalOrderQuantity}장`,
        "",
        "전체 부자재 요약",
        "",
        accessorySummary.join("\n"),
        "",
        "※ 저장된 계산 목록 전체 기준",
      ].join("\n");

      await navigator.clipboard.writeText(savedOrderSummary);
      setIsCopyComplete(true);
      window.setTimeout(() => setIsCopyComplete(false), 1500);
    } catch {
      setIsCopyComplete(false);
    }
  }

  function handleSaveCalculation() {
    if (!calculationResult || !selectedTileSpec) {
      return;
    }

    setSavedCalculations((currentCalculations) => {
      const nextId =
        currentCalculations.length > 0
          ? Math.max(
              ...currentCalculations.map((calculation) => calculation.id),
            ) + 1
          : 1;

      return [
        ...currentCalculations,
        {
          id: nextId,
          workArea: selectedArea,
          tileKind: selectedTileKind,
          tileSize: selectedTileSize,
          inputMethod,
          areaSquareMeter,
          widthMillimeter,
          heightMillimeter,
          lengthMillimeter,
          lossRate: selectedLossRate,
          constructionArea: calculationResult.constructionArea,
          lossAppliedArea: calculationResult.lossAppliedArea,
          requiredBoxes: calculationResult.requiredBoxes,
          totalOrderQuantity:
            calculationResult.requiredBoxes * selectedTileSpec.boxTiles,
        },
      ];
    });
  }

  function handleEditSavedCalculation(calculation: SavedCalculation) {
    setSelectedArea(calculation.workArea);
    setSelectedTileKind(calculation.tileKind);

    if (calculation.tileKind === "벽타일") {
      setSelectedWallTile(calculation.tileSize);
    } else {
      setSelectedFloorTile(calculation.tileSize);
    }

    setInputMethod(calculation.inputMethod);
    setAreaSquareMeter(calculation.areaSquareMeter);
    setWidthMillimeter(calculation.widthMillimeter);
    setHeightMillimeter(calculation.heightMillimeter);
    setLengthMillimeter(calculation.lengthMillimeter);
    setSelectedLossRate(calculation.lossRate);
    setCalculationResult(null);
    setIsResultStale(true);
    setInputErrors([]);
  }

  function handleDeleteSavedCalculation(id: number) {
    setSavedCalculations((currentCalculations) =>
      currentCalculations.filter((calculation) => calculation.id !== id),
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 sm:px-6 sm:py-10 lg:px-8">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-sm font-semibold text-sky-700">TILE CALCULATOR</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-zinc-950 sm:text-4xl">
            타일 계산기
          </h1>
          <p className="mt-3 text-base leading-7 text-zinc-600">
            시공 부위와 타일 규격을 선택해 현장 산출 기준을 준비합니다.
          </p>
        </header>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
              1
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-500">STEP 1</p>
              <h2 className="text-xl font-bold tracking-normal text-zinc-950">
                시공 부위
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {workAreas.map((area) => (
              <button
                key={area}
                type="button"
                className={getButtonClass(selectedArea === area)}
                onClick={() => handleAreaSelect(area)}
                aria-pressed={selectedArea === area}
              >
                {area}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
              2
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-500">STEP 2</p>
              <h2 className="text-xl font-bold tracking-normal text-zinc-950">
                타일 규격
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-zinc-100 p-1.5 sm:w-80">
            {(["벽타일", "바닥타일"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                className={[
                  "rounded-md px-4 py-3 text-sm font-bold transition-colors",
                  selectedTileKind === kind
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800",
                ].join(" ")}
                onClick={() => {
                  resetCalculationResult();
                  setSelectedTileKind(kind);
                }}
                aria-pressed={selectedTileKind === kind}
              >
                {kind}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-base font-bold text-zinc-900">{selectedTileKind}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {(selectedTileKind === "벽타일" ? wallTileSizes : floorTileSizes).map(
                (size) => (
                  <button
                    key={size}
                    type="button"
                    className={getButtonClass(selectedTileSize === size)}
                    onClick={() => {
                      resetCalculationResult();

                      if (selectedTileKind === "벽타일") {
                        setSelectedWallTile(size);
                        return;
                      }

                      setSelectedFloorTile(size);
                    }}
                    aria-pressed={selectedTileSize === size}
                  >
                    {size}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            {selectedTileSpec ? (
              <dl className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    타일 1매 면적
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {selectedTileSpec.tileArea}㎡
                  </dd>
                </div>
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    박스당 수량
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {selectedTileSpec.boxTiles}매
                  </dd>
                </div>
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    박스당 면적
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {selectedTileSpec.boxArea}㎡
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm leading-6 text-zinc-600">
                직접입력 선택 시 규격 데이터를 별도로 입력합니다.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
              3
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-500">STEP 3</p>
              <h2 className="text-xl font-bold tracking-normal text-zinc-950">
                입력 방식
              </h2>
            </div>
          </div>

          {canSelectInputMethod ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(["면적 입력", "치수 입력"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  className={[
                    "flex min-h-12 items-center gap-3 rounded-md border px-4 py-3 text-left text-sm font-semibold transition-colors sm:text-base",
                    inputMethod === method
                      ? "border-sky-600 bg-sky-50 text-sky-800"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-sky-300 hover:bg-sky-50",
                  ].join(" ")}
                  onClick={() => {
                    resetCalculationResult();
                    setInputMethod(method);
                  }}
                  aria-pressed={inputMethod === method}
                >
                  <span
                    className={[
                      "flex h-5 w-5 items-center justify-center rounded-full border",
                      inputMethod === method
                        ? "border-sky-600 bg-sky-600"
                        : "border-zinc-300 bg-white",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {inputMethod === method ? (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    ) : null}
                  </span>
                  {method}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-sky-600 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 sm:text-base">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-sky-600 bg-sky-600"
                  aria-hidden="true"
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
                {inputMethod}
              </div>
            </div>
          )}

          {inputMethod === "면적 입력" ? (
            <div className="mt-6">
              <label
                htmlFor="area-square-meter"
                className="text-sm font-bold text-zinc-800"
              >
                시공 면적(㎡)
              </label>
              <input
                id="area-square-meter"
                type="number"
                inputMode="decimal"
                min="0"
                value={areaSquareMeter}
                onChange={(event) => {
                  resetCalculationResult();
                  clearInputError("area");
                  setAreaSquareMeter(event.target.value);
                }}
                placeholder="예: 12.5"
                className="mt-2 h-12 w-full rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
              {inputErrors.includes("area") ? (
                <p className="mt-2 text-sm font-semibold text-red-600">
                  올바른 값을 입력해주세요
                </p>
              ) : null}
            </div>
          ) : inputMethod === "치수 입력" ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="width-millimeter"
                  className="text-sm font-bold text-zinc-800"
                >
                  가로(mm)
                </label>
                <input
                  id="width-millimeter"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={widthMillimeter}
                  onChange={(event) => {
                    resetCalculationResult();
                    clearInputError("width");
                    setWidthMillimeter(event.target.value);
                  }}
                  placeholder="예: 3000"
                  className="mt-2 h-12 w-full rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
                {inputErrors.includes("width") ? (
                  <p className="mt-2 text-sm font-semibold text-red-600">
                    올바른 값을 입력해주세요
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="height-millimeter"
                  className="text-sm font-bold text-zinc-800"
                >
                  {heightLabel}
                </label>
                <input
                  id="height-millimeter"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={heightMillimeter}
                  onChange={(event) => {
                    resetCalculationResult();
                    clearInputError("height");
                    setHeightMillimeter(event.target.value);
                  }}
                  placeholder="예: 2400"
                  className="mt-2 h-12 w-full rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
                {inputErrors.includes("height") ? (
                  <p className="mt-2 text-sm font-semibold text-red-600">
                    올바른 값을 입력해주세요
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <label
                htmlFor="length-millimeter"
                className="text-sm font-bold text-zinc-800"
              >
                길이(mm)
              </label>
              <input
                id="length-millimeter"
                type="number"
                inputMode="numeric"
                min="0"
                value={lengthMillimeter}
                onChange={(event) => {
                  resetCalculationResult();
                  clearInputError("length");
                  setLengthMillimeter(event.target.value);
                }}
                placeholder="예: 3000"
                className="mt-2 h-12 w-full rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
              {inputErrors.includes("length") ? (
                <p className="mt-2 text-sm font-semibold text-red-600">
                  올바른 값을 입력해주세요
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
              4
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-500">STEP 4</p>
              <h2 className="text-xl font-bold tracking-normal text-zinc-950">
                로스율
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {lossRates.map((rate) => (
              <button
                key={rate}
                type="button"
                className={getButtonClass(selectedLossRate === rate)}
                onClick={() => {
                  resetCalculationResult();
                  setSelectedLossRate(rate);
                }}
                aria-pressed={selectedLossRate === rate}
              >
                {rate}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
              5
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-500">STEP 5</p>
              <h2 className="text-xl font-bold tracking-normal text-zinc-950">
                계산 결과
              </h2>
            </div>
          </div>

          <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            {calculationResult ? (
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    시공 면적
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {calculationResult.constructionArea.toFixed(2)}㎡
                  </dd>
                </div>
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    로스 적용 면적
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {calculationResult.lossAppliedArea.toFixed(2)}㎡
                  </dd>
                </div>
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    필요 타일 수량(장)
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {calculationResult.requiredTiles}장
                  </dd>
                </div>
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    발주 박스 수량(박스)
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {calculationResult.requiredBoxes}박스
                  </dd>
                </div>
                {selectedTileSpec ? (
                  <>
                    <div className="rounded-md bg-white p-4">
                      <dt className="text-xs font-semibold text-zinc-500">
                        박스당 수량(장)
                      </dt>
                      <dd className="mt-2 text-lg font-bold text-zinc-950">
                        {selectedTileSpec.boxTiles}장
                      </dd>
                    </div>
                    <div className="rounded-md bg-white p-4">
                      <dt className="text-xs font-semibold text-zinc-500">
                        총 발주 수량(장)
                      </dt>
                      <dd className="mt-2 text-lg font-bold text-zinc-950">
                        {calculationResult.requiredBoxes *
                          selectedTileSpec.boxTiles}
                        장
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>
            ) : isResultStale ? (
              <p className="text-sm leading-6 text-zinc-600">
                입력값이 변경되었습니다.
                <br />
                다시 계산하기를 눌러주세요.
              </p>
            ) : !selectedTileSpec ? (
              <p className="text-sm font-semibold leading-6 text-zinc-700">
                직접입력 규격은 준비중입니다
              </p>
            ) : (
              <p className="text-sm leading-6 text-zinc-600">
                계산하기 버튼을 누르면 결과가 표시됩니다.
              </p>
            )}
          </div>

          {calculationResult ? (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-base font-bold text-zinc-950">
                부자재 참고 계산
              </h3>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {accessoryRates.map((accessory) => (
                  <div
                    key={accessory.name}
                    className="rounded-md bg-white px-4 py-3"
                  >
                    <dt className="text-sm font-semibold text-zinc-500">
                      {accessory.name}
                    </dt>
                    <dd className="mt-2 text-lg font-bold text-zinc-950">
                      {(
                        calculationResult.constructionArea * accessory.rate
                      ).toFixed(1)}
                      {accessory.unit}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm leading-6 text-zinc-600">
                부자재 수량은 참고용입니다. 실제 사용량은 현장 상태, 타일
                규격, 바탕면, 줄눈 폭, 작업 방식에 따라 달라질 수 있습니다.
              </p>
            </div>
          ) : null}

          {calculationResult && selectedTileSpec ? (
            <div className="mt-5 rounded-md border border-sky-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-950">
                    발주 요약
                  </h3>
                  {isCopyComplete ? (
                    <p className="mt-1 text-sm font-semibold text-sky-700">
                      복사 완료
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={handleCopyOrderSummary}
                  className="h-10 rounded-md border border-zinc-200 bg-zinc-50 px-4 text-sm font-bold text-zinc-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                >
                  복사
                </button>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex justify-between gap-4 rounded-md bg-zinc-50 px-4 py-3">
                  <dt className="text-sm font-semibold text-zinc-500">
                    시공부위
                  </dt>
                  <dd className="text-sm font-bold text-zinc-950">
                    {selectedArea}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 rounded-md bg-zinc-50 px-4 py-3">
                  <dt className="text-sm font-semibold text-zinc-500">
                    타일규격
                  </dt>
                  <dd className="text-sm font-bold text-zinc-950">
                    {selectedTileSize}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 rounded-md bg-zinc-50 px-4 py-3">
                  <dt className="text-sm font-semibold text-zinc-500">
                    시공면적
                  </dt>
                  <dd className="text-sm font-bold text-zinc-950">
                    {calculationResult.constructionArea.toFixed(2)}㎡
                  </dd>
                </div>
                <div className="flex justify-between gap-4 rounded-md bg-zinc-50 px-4 py-3">
                  <dt className="text-sm font-semibold text-zinc-500">
                    로스적용면적
                  </dt>
                  <dd className="text-sm font-bold text-zinc-950">
                    {calculationResult.lossAppliedArea.toFixed(2)}㎡
                  </dd>
                </div>
                <div className="flex justify-between gap-4 rounded-md bg-zinc-50 px-4 py-3">
                  <dt className="text-sm font-semibold text-zinc-500">
                    발주박스
                  </dt>
                  <dd className="text-sm font-bold text-zinc-950">
                    {calculationResult.requiredBoxes}박스
                  </dd>
                </div>
                <div className="flex justify-between gap-4 rounded-md bg-zinc-50 px-4 py-3">
                  <dt className="text-sm font-semibold text-zinc-500">
                    총발주수량
                  </dt>
                  <dd className="text-sm font-bold text-zinc-950">
                    {calculationResult.requiredBoxes *
                      selectedTileSpec.boxTiles}
                    장
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          {calculationResult && selectedTileSpec ? (
            <button
              type="button"
              onClick={handleSaveCalculation}
              className="mt-5 h-12 w-full rounded-md border border-sky-600 bg-white px-5 text-base font-bold text-sky-700 transition-colors hover:bg-sky-50 sm:w-auto"
            >
              결과 저장
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleCalculate}
            className="mt-5 h-12 w-full rounded-md bg-sky-600 px-5 text-base font-bold text-white shadow-sm transition-colors hover:bg-sky-700 sm:w-auto"
          >
            계산하기
          </button>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
              6
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-500">STEP 6</p>
              <h2 className="text-xl font-bold tracking-normal text-zinc-950">
                계산 목록
              </h2>
            </div>
          </div>

          {savedCalculations.length > 0 ? (
            <>
              <div className="mt-5 grid gap-3">
                {savedCalculations.map((calculation) => (
                  <article
                    key={calculation.id}
                    className="rounded-md border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base font-bold text-zinc-950">
                          {calculation.workArea} / {calculation.tileSize}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          발주박스 {calculation.requiredBoxes}박스 · 총발주수량{" "}
                          {calculation.totalOrderQuantity}장
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditSavedCalculation(calculation)}
                          className="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteSavedCalculation(calculation.id)
                          }
                          className="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex justify-between gap-4 rounded-md bg-white px-4 py-3">
                        <dt className="text-sm font-semibold text-zinc-500">
                          시공부위
                        </dt>
                        <dd className="text-sm font-bold text-zinc-950">
                          {calculation.workArea}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 rounded-md bg-white px-4 py-3">
                        <dt className="text-sm font-semibold text-zinc-500">
                          타일규격
                        </dt>
                        <dd className="text-sm font-bold text-zinc-950">
                          {calculation.tileSize}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 rounded-md bg-white px-4 py-3">
                        <dt className="text-sm font-semibold text-zinc-500">
                          시공면적
                        </dt>
                        <dd className="text-sm font-bold text-zinc-950">
                          {calculation.constructionArea.toFixed(2)}㎡
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 rounded-md bg-white px-4 py-3">
                        <dt className="text-sm font-semibold text-zinc-500">
                          로스적용면적
                        </dt>
                        <dd className="text-sm font-bold text-zinc-950">
                          {calculation.lossAppliedArea.toFixed(2)}㎡
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 rounded-md bg-white px-4 py-3">
                        <dt className="text-sm font-semibold text-zinc-500">
                          발주박스
                        </dt>
                        <dd className="text-sm font-bold text-zinc-950">
                          {calculation.requiredBoxes}박스
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 rounded-md bg-white px-4 py-3">
                        <dt className="text-sm font-semibold text-zinc-500">
                          총발주수량
                        </dt>
                        <dd className="text-sm font-bold text-zinc-950">
                          {calculation.totalOrderQuantity}장
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>

              <div className="mt-5 grid gap-3 rounded-md border border-sky-200 bg-sky-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-sky-700">
                    총 박스 수량
                  </p>
                  <p className="mt-2 text-2xl font-bold text-zinc-950">
                    {savedTotalBoxes}박스
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-sky-700">
                    총 발주 수량
                  </p>
                  <p className="mt-2 text-2xl font-bold text-zinc-950">
                    {savedTotalOrderQuantity}장
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-base font-bold text-zinc-950">
                  전체 부자재 요약
                </h3>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {accessoryRates.map((accessory) => (
                    <div
                      key={accessory.name}
                      className="rounded-md bg-white px-4 py-3"
                    >
                      <dt className="text-sm font-semibold text-zinc-500">
                        {accessory.name}
                      </dt>
                      <dd className="mt-2 text-lg font-bold text-zinc-950">
                        {(savedTotalConstructionArea * accessory.rate).toFixed(1)}
                        {accessory.unit}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-sm font-semibold text-amber-800">
                  ※ 저장된 계산 목록 전체 기준
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleCopySavedOrderSummary}
                  className="h-12 w-full rounded-md bg-zinc-900 px-5 text-base font-bold text-white shadow-sm transition-colors hover:bg-zinc-800 sm:w-auto"
                >
                  전체 발주내역 복사
                </button>
                {isCopyComplete ? (
                  <p className="text-sm font-semibold text-sky-700">
                    복사 완료
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
              저장된 계산 결과가 없습니다.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
