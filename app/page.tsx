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

const lossRates = ["5%", "10%", "15%", "20%"] as const;

const tileManufacturers = ["기본", "동화", "윤현", "대보", "기타"] as const;

const constructionMethods = ["철거", "덧방"] as const;

const adhesiveRates = {
  dryFix: {
    name: "드라이픽스",
    demolitionRate: 0.75,
    overlayRate: 0.38,
    unit: "포",
  },
  epoxy: {
    name: "에폭시",
    demolitionRate: 0.27,
    overlayRate: 0.225,
    unit: "조",
    minimum: 0.3,
  },
} as const;

const commonAccessoryRates = [
  { name: "줄눈제", rate: 0.1, unit: "포" },
  { name: "실리콘", rate: 0.12, unit: "개", minimum: 0.2 },
] as const;

const cerafixRate = { rate: 0.225, unit: "통", minimum: 0.3 } as const;

type WorkArea = (typeof workAreas)[number];
type TileSize = (typeof wallTileSizes)[number];
type TileKind = "벽타일" | "바닥타일";
type InputMethod = "면적 입력" | "치수 입력" | "길이 입력";
type LossRate = (typeof lossRates)[number];
type TileManufacturer = (typeof tileManufacturers)[number];
type ConstructionMethod = (typeof constructionMethods)[number];
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
  orderBoxes: number;
};

type InputError =
  | "area"
  | "width"
  | "height"
  | "length"
  | "customTileWidth"
  | "customTileHeight"
  | "customBoxTiles";

type SavedCalculation = {
  id: number;
  workArea: WorkArea;
  tileKind: TileKind;
  tileManufacturer: TileManufacturer;
  tileSize: TileSize;
  tileDisplayName: string;
  constructionMethod: ConstructionMethod;
  inputMethod: InputMethod;
  areaSquareMeter: string;
  widthMillimeter: string;
  heightMillimeter: string;
  lengthMillimeter: string;
  customTileWidthMillimeter: string;
  customTileHeightMillimeter: string;
  customBoxTiles: string;
  lossRate: LossRate;
  constructionArea: number;
  lossAppliedArea: number;
  requiredTiles: number;
  recommendedBoxes: number;
  requiredBoxes: number;
  actualOrderArea: number;
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

const manufacturerTileSizes: Record<TileManufacturer, readonly TileSize[]> = {
  기본: wallTileSizes,
  동화: ["300×300", "300×600", "600×600", "600×1200", "800×800"],
  윤현: ["600×600", "600×1200", "800×800"],
  대보: ["300×300", "300×600", "600×600", "600×1200", "900×900"],
  기타: wallTileSizes,
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

function formatTileDimension(value: number) {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2).replace(/\.?0+$/, "");
}

export default function Home() {
  const [selectedArea, setSelectedArea] = useState<WorkArea>("욕실");
  const [selectedTileKind, setSelectedTileKind] = useState<TileKind>("벽타일");
  const [selectedTileManufacturer, setSelectedTileManufacturer] =
    useState<TileManufacturer>("기본");
  const [selectedWallTile, setSelectedWallTile] = useState<TileSize>("300×600");
  const [selectedFloorTile, setSelectedFloorTile] = useState<TileSize>("300×300");
  const [inputMethod, setInputMethod] = useState<InputMethod>("면적 입력");
  const [areaSquareMeter, setAreaSquareMeter] = useState("");
  const [widthMillimeter, setWidthMillimeter] = useState("");
  const [heightMillimeter, setHeightMillimeter] = useState("");
  const [lengthMillimeter, setLengthMillimeter] = useState("");
  const [customTileWidthMillimeter, setCustomTileWidthMillimeter] = useState("");
  const [customTileHeightMillimeter, setCustomTileHeightMillimeter] = useState("");
  const [customBoxTiles, setCustomBoxTiles] = useState("");
  const [selectedLossRate, setSelectedLossRate] = useState<LossRate>("10%");
  const [selectedConstructionMethod, setSelectedConstructionMethod] =
    useState<ConstructionMethod>("철거");
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
  const availableTileSizes = manufacturerTileSizes[selectedTileManufacturer];
  const selectedTileSpec =
    selectedTileSize === "직접입력" ? null : tileSpecs[selectedTileSize];
  const customTileWidth = parseInputValue(customTileWidthMillimeter);
  const customTileHeight = parseInputValue(customTileHeightMillimeter);
  const customBoxTileCount = parseInputValue(customBoxTiles);
  const customTileDisplayName =
    selectedTileSize === "직접입력" &&
    isValidPositiveInput(customTileWidthMillimeter) &&
    isValidPositiveInput(customTileHeightMillimeter)
      ? `${formatTileDimension(customTileWidth)}×${formatTileDimension(
          customTileHeight,
        )}`
      : "직접입력";
  const customTileSpec =
    selectedTileSize === "직접입력" &&
    isValidPositiveInput(customTileWidthMillimeter) &&
    isValidPositiveInput(customTileHeightMillimeter) &&
    isValidPositiveInput(customBoxTiles)
      ? {
          width: customTileWidth,
          height: customTileHeight,
          tileArea: (customTileWidth * customTileHeight) / 1_000_000,
          boxTiles: customBoxTileCount,
          boxArea:
            ((customTileWidth * customTileHeight) / 1_000_000) *
            customBoxTileCount,
        }
      : null;
  const calculationTileSpec = selectedTileSpec ?? customTileSpec;
  const selectedTileDisplayName =
    selectedTileSize === "직접입력" ? customTileDisplayName : selectedTileSize;
  const orderBoxes = calculationResult?.orderBoxes ?? 0;
  const orderBoxDifference = calculationResult
    ? orderBoxes - calculationResult.requiredBoxes
    : 0;
  const orderBoxDifferenceText =
    orderBoxDifference === 0
      ? "추천과 동일"
      : orderBoxDifference > 0
        ? `추천보다 ${orderBoxDifference}박스 많음`
        : `추천보다 ${Math.abs(orderBoxDifference)}박스 적음`;
  const totalOrderQuantity = calculationTileSpec
    ? orderBoxes * calculationTileSpec.boxTiles
    : 0;
  const actualOrderArea = calculationTileSpec
    ? orderBoxes * calculationTileSpec.boxArea
    : 0;
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
  const savedOverlayConstructionArea = savedCalculations.reduce(
    (total, calculation) =>
      total + (calculation.constructionMethod === "덧방"
        ? calculation.constructionArea
        : 0),
    0,
  );
  const savedDemolitionConstructionArea =
    savedTotalConstructionArea - savedOverlayConstructionArea;

  function getAccessoryQuantity(
    constructionArea: number,
    accessory: { rate: number; unit: string; minimum?: number },
  ) {
    const quantity = constructionArea * accessory.rate;
    const displayQuantity =
      accessory.minimum && quantity > 0
        ? Math.max(quantity, accessory.minimum)
        : quantity;

    return `${displayQuantity.toFixed(1)}${accessory.unit}`;
  }

  function getMethodAccessoryQuantity(
    constructionMethod: ConstructionMethod,
    constructionArea: number,
    accessory: {
      demolitionRate: number;
      overlayRate: number;
      unit: string;
      minimum?: number;
    },
  ) {
    return getAccessoryQuantity(constructionArea, {
      rate:
        constructionMethod === "덧방"
          ? accessory.overlayRate
          : accessory.demolitionRate,
      unit: accessory.unit,
      minimum: accessory.minimum,
    });
  }

  function getCombinedMethodAccessoryQuantity(
    demolitionArea: number,
    overlayArea: number,
    accessory: {
      demolitionRate: number;
      overlayRate: number;
      unit: string;
      minimum?: number;
    },
  ) {
    const demolitionQuantity = demolitionArea * accessory.demolitionRate;
    const overlayQuantity = overlayArea * accessory.overlayRate;
    const displayQuantity =
      (accessory.minimum && demolitionQuantity > 0
        ? Math.max(demolitionQuantity, accessory.minimum)
        : demolitionQuantity) +
      (accessory.minimum && overlayQuantity > 0
        ? Math.max(overlayQuantity, accessory.minimum)
        : overlayQuantity);

    return `${displayQuantity.toFixed(1)}${accessory.unit}`;
  }

  function getCerafixStatus(constructionMethod: ConstructionMethod) {
    return constructionMethod === "덧방" ? "덧방·선택" : "철거 시 불가";
  }

  function getCerafixDisplay(constructionMethod: ConstructionMethod, area: number) {
    return constructionMethod === "덧방"
      ? `${getCerafixStatus(constructionMethod)} (${getAccessoryQuantity(
          area,
          cerafixRate,
        )})`
      : getCerafixStatus(constructionMethod);
  }

  function getConstructionMethodGuide() {
    return "벽 접착제는 드라이픽스 또는 에폭시 중 택일하여 사용합니다.";
  }

  function getAccessorySummaryLines(
    constructionMethod: ConstructionMethod,
    constructionArea: number,
  ) {
    return [
      `${constructionMethod} 벽 접착제`,
      `${adhesiveRates.dryFix.name}: ${getMethodAccessoryQuantity(
        constructionMethod,
        constructionArea,
        adhesiveRates.dryFix,
      )}`,
      `또는 ${adhesiveRates.epoxy.name}: ${getMethodAccessoryQuantity(
        constructionMethod,
        constructionArea,
        adhesiveRates.epoxy,
      )}`,
      "",
      "공통 부자재",
      ...commonAccessoryRates.map(
        (accessory) =>
          `${accessory.name}: ${getAccessoryQuantity(constructionArea, accessory)}`,
      ),
      `세라픽스: ${getCerafixDisplay(constructionMethod, constructionArea)}`,
    ];
  }

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

  function setSelectedTileSize(size: TileSize) {
    if (selectedTileKind === "벽타일") {
      setSelectedWallTile(size);
      return;
    }

    setSelectedFloorTile(size);
  }

  function getSavedTileDisplayName(calculation: SavedCalculation) {
    if (calculation.tileDisplayName) {
      return calculation.tileDisplayName;
    }

    if (
      calculation.tileSize === "직접입력" &&
      isValidPositiveInput(calculation.customTileWidthMillimeter) &&
      isValidPositiveInput(calculation.customTileHeightMillimeter)
    ) {
      return `${formatTileDimension(
        parseInputValue(calculation.customTileWidthMillimeter),
      )}×${formatTileDimension(
        parseInputValue(calculation.customTileHeightMillimeter),
      )}`;
    }

    return calculation.tileSize;
  }

  function getSavedTileSpec(calculation: SavedCalculation) {
    if (calculation.tileSize !== "직접입력") {
      return tileSpecs[calculation.tileSize];
    }

    if (
      isValidPositiveInput(calculation.customTileWidthMillimeter) &&
      isValidPositiveInput(calculation.customTileHeightMillimeter) &&
      isValidPositiveInput(calculation.customBoxTiles)
    ) {
      const width = parseInputValue(calculation.customTileWidthMillimeter);
      const height = parseInputValue(calculation.customTileHeightMillimeter);
      const boxTiles = parseInputValue(calculation.customBoxTiles);
      const tileArea = (width * height) / 1_000_000;

      return {
        width,
        height,
        tileArea,
        boxTiles,
        boxArea: tileArea * boxTiles,
      };
    }

    return null;
  }

  function getSavedActualOrderArea(calculation: SavedCalculation) {
    if (calculation.actualOrderArea) {
      return calculation.actualOrderArea;
    }

    const savedTileSpec = getSavedTileSpec(calculation);

    return savedTileSpec ? calculation.requiredBoxes * savedTileSpec.boxArea : 0;
  }

  function handleOrderBoxesChange(value: string) {
    if (!calculationResult) {
      return;
    }

    const nextOrderBoxes = Math.max(1, Math.floor(parseInputValue(value)));

    setCalculationResult({
      ...calculationResult,
      orderBoxes: nextOrderBoxes,
    });
  }

  function handleAreaSelect(area: WorkArea) {
    resetCalculationResult();
    setSelectedArea(area);
    setInputMethod(getDefaultInputMethod(area));
  }

  function handleManufacturerSelect(manufacturer: TileManufacturer) {
    resetCalculationResult();
    setSelectedTileManufacturer(manufacturer);

    const nextTileSizes = manufacturerTileSizes[manufacturer];

    if (!nextTileSizes.includes(selectedTileSize)) {
      setSelectedTileSize(nextTileSizes[0]);
    }
  }

  function handleCalculate() {
    const tileSpecErrors: InputError[] =
      selectedTileSize === "직접입력"
        ? [
            ...(isValidPositiveInput(customTileWidthMillimeter)
              ? []
              : ["customTileWidth" as const]),
            ...(isValidPositiveInput(customTileHeightMillimeter)
              ? []
              : ["customTileHeight" as const]),
            ...(isValidPositiveInput(customBoxTiles)
              ? []
              : ["customBoxTiles" as const]),
          ]
        : [];
    const areaInputErrors: InputError[] =
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
    const nextInputErrors: InputError[] = [
      ...tileSpecErrors,
      ...areaInputErrors,
    ];

    if (nextInputErrors.length > 0) {
      setInputErrors(nextInputErrors);
      setCalculationResult(null);
      setIsResultStale(false);
      return;
    }

    if (!calculationTileSpec) {
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
          : (length * calculationTileSpec.height) / 1_000_000;
    const lossRate = parseInputValue(selectedLossRate.replace("%", "")) / 100;
    const lossAppliedArea = constructionArea * (1 + lossRate);
    const requiredBoxes = Math.ceil(lossAppliedArea / calculationTileSpec.boxArea);

    setCalculationResult({
      constructionArea,
      lossAppliedArea,
      requiredTiles: Math.ceil(lossAppliedArea / calculationTileSpec.tileArea),
      requiredBoxes,
      orderBoxes: requiredBoxes,
    });
    setIsResultStale(false);
  }

  async function handleCopyOrderSummary() {
    if (!calculationResult || !calculationTileSpec) {
      return;
    }

    try {
      const orderSummary = [
        `시공부위: ${selectedArea}`,
        `타일규격: ${selectedTileDisplayName}`,
        `시공기준: ${selectedConstructionMethod}`,
        "",
        `시공면적: ${calculationResult.constructionArea.toFixed(2)}㎡`,
        `로스적용면적: ${calculationResult.lossAppliedArea.toFixed(2)}㎡`,
        `발주박스: ${orderBoxes}박스`,
        `총발주수량: ${totalOrderQuantity}장`,
        `실제발주면적: ${actualOrderArea.toFixed(2)}㎡`,
        "",
        "부자재 참고 계산",
        ...getAccessorySummaryLines(
          selectedConstructionMethod,
          calculationResult.constructionArea,
        ),
        "",
        `※ ${getConstructionMethodGuide()}`,
        "※ 부자재 수량은 시공면적 기준 참고용입니다.",
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
            `   타일규격: ${getSavedTileDisplayName(calculation)}`,
            `   시공기준: ${calculation.constructionMethod}`,
            `   시공면적: ${formatSquareMeter(calculation.constructionArea)}㎡`,
            `   발주박스: ${calculation.requiredBoxes}박스`,
            `   총발주수량: ${calculation.totalOrderQuantity}장`,
            `   실제발주면적: ${formatSquareMeter(
              getSavedActualOrderArea(calculation),
            )}㎡`,
            `   세라픽스: ${getCerafixDisplay(
              calculation.constructionMethod,
              calculation.constructionArea,
            )}`,
          ].join("\n"),
      );
      const accessorySummary = [
        `${adhesiveRates.dryFix.name}: ${getCombinedMethodAccessoryQuantity(
          savedDemolitionConstructionArea,
          savedOverlayConstructionArea,
          adhesiveRates.dryFix,
        )}`,
        `또는 ${adhesiveRates.epoxy.name}: ${getCombinedMethodAccessoryQuantity(
          savedDemolitionConstructionArea,
          savedOverlayConstructionArea,
          adhesiveRates.epoxy,
        )}`,
        ...commonAccessoryRates.map(
          (accessory) =>
            `${accessory.name}: ${getAccessoryQuantity(
              savedTotalConstructionArea,
              accessory,
            )}`,
        ),
        `세라픽스: ${
          savedOverlayConstructionArea > 0
            ? `${getCerafixStatus("덧방")} (${getAccessoryQuantity(
                savedOverlayConstructionArea,
                cerafixRate,
              )})`
            : "철거 시 불가"
        }`,
      ];
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
        "※ 저장된 계산 목록 전체 시공면적 기준",
      ].join("\n");

      await navigator.clipboard.writeText(savedOrderSummary);
      setIsCopyComplete(true);
      window.setTimeout(() => setIsCopyComplete(false), 1500);
    } catch {
      setIsCopyComplete(false);
    }
  }

  function handleSaveCalculation() {
    if (!calculationResult || !calculationTileSpec) {
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
          tileManufacturer: selectedTileManufacturer,
          tileSize: selectedTileSize,
          tileDisplayName: selectedTileDisplayName,
          constructionMethod: selectedConstructionMethod,
          inputMethod,
          areaSquareMeter,
          widthMillimeter,
          heightMillimeter,
          lengthMillimeter,
          customTileWidthMillimeter,
          customTileHeightMillimeter,
          customBoxTiles,
          lossRate: selectedLossRate,
          constructionArea: calculationResult.constructionArea,
          lossAppliedArea: calculationResult.lossAppliedArea,
          requiredTiles: calculationResult.requiredTiles,
          recommendedBoxes: calculationResult.requiredBoxes,
          requiredBoxes: orderBoxes,
          actualOrderArea,
          totalOrderQuantity,
        },
      ];
    });
  }

  function handleEditSavedCalculation(calculation: SavedCalculation) {
    const savedTileSpec = getSavedTileSpec(calculation);

    setSelectedArea(calculation.workArea);
    setSelectedTileKind(calculation.tileKind);
    setSelectedTileManufacturer(calculation.tileManufacturer ?? "기본");

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
    setCustomTileWidthMillimeter(calculation.customTileWidthMillimeter);
    setCustomTileHeightMillimeter(calculation.customTileHeightMillimeter);
    setCustomBoxTiles(calculation.customBoxTiles);
    setSelectedLossRate(calculation.lossRate);
    setSelectedConstructionMethod(calculation.constructionMethod ?? "철거");
    setCalculationResult(
      savedTileSpec
        ? {
            constructionArea: calculation.constructionArea,
            lossAppliedArea: calculation.lossAppliedArea,
            requiredTiles:
              calculation.requiredTiles ??
              Math.ceil(calculation.lossAppliedArea / savedTileSpec.tileArea),
            requiredBoxes:
              calculation.recommendedBoxes ??
              Math.ceil(calculation.lossAppliedArea / savedTileSpec.boxArea),
            orderBoxes: calculation.requiredBoxes,
          }
        : null,
    );
    setIsResultStale(!savedTileSpec);
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

                  const nextSelectedTile =
                    kind === "벽타일" ? selectedWallTile : selectedFloorTile;

                  if (!availableTileSizes.includes(nextSelectedTile)) {
                    if (kind === "벽타일") {
                      setSelectedWallTile(availableTileSizes[0]);
                    } else {
                      setSelectedFloorTile(availableTileSizes[0]);
                    }
                  }
                }}
                aria-pressed={selectedTileKind === kind}
              >
                {kind}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-base font-bold text-zinc-900">제조사</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {tileManufacturers.map((manufacturer) => (
                <button
                  key={manufacturer}
                  type="button"
                  className={getButtonClass(
                    selectedTileManufacturer === manufacturer,
                  )}
                  onClick={() => handleManufacturerSelect(manufacturer)}
                  aria-pressed={selectedTileManufacturer === manufacturer}
                >
                  {manufacturer}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-base font-bold text-zinc-900">{selectedTileKind}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {availableTileSizes.map(
                (size) => (
                  <button
                    key={size}
                    type="button"
                    className={getButtonClass(selectedTileSize === size)}
                    onClick={() => {
                      resetCalculationResult();
                      setSelectedTileSize(size);
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
              <div className="grid gap-4">
                <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3">
                  <p className="text-sm font-bold text-sky-800">
                    현장 타일 규격과 1박스 안에 들어있는 장수를 입력하세요.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    입력한 값으로 타일 1매 면적과 박스당 면적을 바로 확인합니다.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="custom-tile-width"
                      className="text-sm font-bold text-zinc-800"
                    >
                      타일 가로(mm)
                    </label>
                    <input
                      id="custom-tile-width"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={customTileWidthMillimeter}
                      onChange={(event) => {
                        resetCalculationResult();
                        clearInputError("customTileWidth");
                        setCustomTileWidthMillimeter(event.target.value);
                      }}
                      placeholder="예: 400"
                      className="mt-2 h-12 w-full rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    />
                    {inputErrors.includes("customTileWidth") ? (
                      <p className="mt-2 text-sm font-semibold text-red-600">
                        올바른 값을 입력해주세요
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="custom-tile-height"
                      className="text-sm font-bold text-zinc-800"
                    >
                      타일 세로(mm)
                    </label>
                    <input
                      id="custom-tile-height"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={customTileHeightMillimeter}
                      onChange={(event) => {
                        resetCalculationResult();
                        clearInputError("customTileHeight");
                        setCustomTileHeightMillimeter(event.target.value);
                      }}
                      placeholder="예: 800"
                      className="mt-2 h-12 w-full rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    />
                    {inputErrors.includes("customTileHeight") ? (
                      <p className="mt-2 text-sm font-semibold text-red-600">
                        올바른 값을 입력해주세요
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="custom-box-tiles"
                      className="text-sm font-bold text-zinc-800"
                    >
                      박스당 수량(장)
                    </label>
                    <input
                      id="custom-box-tiles"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={customBoxTiles}
                      onChange={(event) => {
                        resetCalculationResult();
                        clearInputError("customBoxTiles");
                        setCustomBoxTiles(event.target.value);
                      }}
                      placeholder="예: 4"
                      className="mt-2 h-12 w-full rounded-md border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    />
                    {inputErrors.includes("customBoxTiles") ? (
                      <p className="mt-2 text-sm font-semibold text-red-600">
                        올바른 값을 입력해주세요
                      </p>
                    ) : null}
                  </div>
                </div>

                <dl className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md bg-white p-4">
                    <dt className="text-xs font-semibold text-zinc-500">
                      타일 1매 면적
                    </dt>
                    <dd className="mt-2 text-lg font-bold text-zinc-950">
                      {customTileSpec
                        ? `${formatSquareMeter(customTileSpec.tileArea)}㎡`
                        : "-"}
                    </dd>
                  </div>
                  <div className="rounded-md bg-white p-4">
                    <dt className="text-xs font-semibold text-zinc-500">
                      박스당 수량
                    </dt>
                    <dd className="mt-2 text-lg font-bold text-zinc-950">
                      {customTileSpec
                        ? `${formatSquareMeter(customTileSpec.boxTiles)}매`
                        : "-"}
                    </dd>
                  </div>
                  <div className="rounded-md bg-white p-4">
                    <dt className="text-xs font-semibold text-zinc-500">
                      박스당 면적
                    </dt>
                    <dd className="mt-2 text-lg font-bold text-zinc-950">
                      {customTileSpec
                        ? `${formatSquareMeter(customTileSpec.boxArea)}㎡`
                        : "-"}
                    </dd>
                  </div>
                </dl>
              </div>
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
                    실제 발주 박스
                  </dt>
                  <dd className="mt-2">
                    <input
                      id="order-boxes"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={orderBoxes}
                      onChange={(event) =>
                        handleOrderBoxesChange(event.target.value)
                      }
                      className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-lg font-bold text-zinc-950 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    />
                  </dd>
                  <p className="mt-2 text-xs font-semibold text-zinc-500">
                    현장에서 최종 발주할 박스 수입니다.
                  </p>
                </div>
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    추천 박스
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {calculationResult.requiredBoxes}박스
                  </dd>
                  <p className="mt-2 text-xs font-semibold text-zinc-500">
                    로스 적용 면적 기준 자동 계산값입니다.
                  </p>
                </div>
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    추천 대비 조정
                  </dt>
                  <dd
                    className={[
                      "mt-2 text-lg font-bold",
                      orderBoxDifference === 0
                        ? "text-zinc-950"
                        : "text-sky-700",
                    ].join(" ")}
                  >
                    {orderBoxDifferenceText}
                  </dd>
                  <p className="mt-2 text-xs font-semibold text-zinc-500">
                    실제 발주 박스를 바꾸면 자동 반영됩니다.
                  </p>
                </div>
                {calculationTileSpec ? (
                  <>
                    <div className="rounded-md bg-white p-4">
                      <dt className="text-xs font-semibold text-zinc-500">
                        총 발주 수량
                      </dt>
                      <dd className="mt-2 text-lg font-bold text-zinc-950">
                        {totalOrderQuantity}장
                      </dd>
                    </div>
                    <div className="rounded-md bg-white p-4">
                      <dt className="text-xs font-semibold text-zinc-500">
                        실제 발주면적
                      </dt>
                      <dd className="mt-2 text-lg font-bold text-zinc-950">
                        {actualOrderArea.toFixed(2)}㎡
                      </dd>
                      <p className="mt-2 text-xs font-semibold text-zinc-500">
                        실제 발주 박스 × 박스당 면적입니다.
                      </p>
                    </div>
                    <div className="rounded-md bg-white p-4">
                      <dt className="text-xs font-semibold text-zinc-500">
                        박스당 수량
                      </dt>
                      <dd className="mt-2 text-lg font-bold text-zinc-950">
                        {calculationTileSpec.boxTiles}장
                      </dd>
                    </div>
                  </>
                ) : null}
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    타일규격
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {selectedTileDisplayName}
                  </dd>
                </div>
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    시공면적
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {calculationResult.constructionArea.toFixed(2)}㎡
                  </dd>
                  <p className="mt-2 text-xs font-semibold text-zinc-500">
                    현장 실제 시공 면적이며 부자재 계산 기준입니다.
                  </p>
                </div>
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    로스적용면적
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {calculationResult.lossAppliedArea.toFixed(2)}㎡
                  </dd>
                  <p className="mt-2 text-xs font-semibold text-zinc-500">
                    시공면적에 선택한 로스율을 더한 값입니다.
                  </p>
                </div>
                <div className="rounded-md bg-white p-4">
                  <dt className="text-xs font-semibold text-zinc-500">
                    필요 타일 수량(장)
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {calculationResult.requiredTiles}장
                  </dd>
                </div>
              </dl>
            ) : isResultStale ? (
              <p className="text-sm leading-6 text-zinc-600">
                입력값이 변경되었습니다.
                <br />
                다시 계산하기를 눌러주세요.
              </p>
            ) : selectedTileSize === "직접입력" && !calculationTileSpec ? (
              <p className="text-sm font-semibold leading-6 text-zinc-700">
                직접입력 규격을 입력한 뒤 계산하기를 눌러주세요.
              </p>
            ) : (
              <p className="text-sm leading-6 text-zinc-600">
                계산하기 버튼을 누르면 결과가 표시됩니다.
              </p>
            )}
          </div>

          {calculationResult ? (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-950">
                    부자재 참고 계산 - {selectedConstructionMethod}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {getConstructionMethodGuide()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-md bg-white p-1.5 sm:w-48">
                  {constructionMethods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      className={[
                        "rounded-md px-3 py-2 text-sm font-bold transition-colors",
                        selectedConstructionMethod === method
                          ? "bg-amber-500 text-white shadow-sm"
                          : "text-zinc-600 hover:bg-amber-50 hover:text-zinc-900",
                      ].join(" ")}
                      onClick={() => setSelectedConstructionMethod(method)}
                      aria-pressed={selectedConstructionMethod === method}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md bg-white px-4 py-3">
                  <dt className="text-sm font-semibold text-zinc-500">
                    드라이픽스
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {getMethodAccessoryQuantity(
                      selectedConstructionMethod,
                      calculationResult.constructionArea,
                      adhesiveRates.dryFix,
                    )}
                  </dd>
                </div>
                <div className="rounded-md bg-white px-4 py-3">
                  <dt className="text-sm font-semibold text-zinc-500">
                    또는 에폭시
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {getMethodAccessoryQuantity(
                      selectedConstructionMethod,
                      calculationResult.constructionArea,
                      adhesiveRates.epoxy,
                    )}
                  </dd>
                </div>
                {commonAccessoryRates.map((accessory) => (
                  <div
                    key={accessory.name}
                    className="rounded-md bg-white px-4 py-3"
                  >
                    <dt className="text-sm font-semibold text-zinc-500">
                      {accessory.name}
                    </dt>
                    <dd className="mt-2 text-lg font-bold text-zinc-950">
                      {getAccessoryQuantity(
                        calculationResult.constructionArea,
                        accessory,
                      )}
                    </dd>
                  </div>
                ))}
                <div className="rounded-md bg-white px-4 py-3">
                  <dt className="text-sm font-semibold text-zinc-500">
                    세라픽스
                  </dt>
                  <dd className="mt-2 text-lg font-bold text-zinc-950">
                    {getCerafixDisplay(
                      selectedConstructionMethod,
                      calculationResult.constructionArea,
                    )}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-6 text-zinc-600">
                부자재 수량은 실제 발주면적이 아닌 시공면적 기준 참고값입니다.
                실제 사용량은 현장 상태, 타일 규격, 바탕면, 줄눈 폭, 작업
                방식에 따라 달라질 수 있습니다.
              </p>
            </div>
          ) : null}

          {calculationResult && calculationTileSpec ? (
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
                    {selectedTileDisplayName}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 rounded-md bg-zinc-50 px-4 py-3">
                  <dt className="text-sm font-semibold text-zinc-500">
                    시공기준
                  </dt>
                  <dd className="text-sm font-bold text-zinc-950">
                    {selectedConstructionMethod}
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
                    {orderBoxes}박스
                  </dd>
                </div>
                <div className="flex justify-between gap-4 rounded-md bg-zinc-50 px-4 py-3">
                  <dt className="text-sm font-semibold text-zinc-500">
                    총발주수량
                  </dt>
                  <dd className="text-sm font-bold text-zinc-950">
                    {totalOrderQuantity}장
                  </dd>
                </div>
                <div className="flex justify-between gap-4 rounded-md bg-zinc-50 px-4 py-3">
                  <dt className="text-sm font-semibold text-zinc-500">
                    실제발주면적
                  </dt>
                  <dd className="text-sm font-bold text-zinc-950">
                    {actualOrderArea.toFixed(2)}㎡
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          {calculationResult && calculationTileSpec ? (
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
                          {calculation.workArea} /{" "}
                          {getSavedTileDisplayName(calculation)}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          {calculation.constructionMethod} ·{" "}
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
                          {getSavedTileDisplayName(calculation)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 rounded-md bg-white px-4 py-3">
                        <dt className="text-sm font-semibold text-zinc-500">
                          시공기준
                        </dt>
                        <dd className="text-sm font-bold text-zinc-950">
                          {calculation.constructionMethod}
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
                      <div className="flex justify-between gap-4 rounded-md bg-white px-4 py-3">
                        <dt className="text-sm font-semibold text-zinc-500">
                          실제발주면적
                        </dt>
                        <dd className="text-sm font-bold text-zinc-950">
                          {getSavedActualOrderArea(calculation).toFixed(2)}㎡
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 rounded-md bg-white px-4 py-3">
                        <dt className="text-sm font-semibold text-zinc-500">
                          세라픽스
                        </dt>
                        <dd className="text-sm font-bold text-zinc-950">
                          {getCerafixDisplay(
                            calculation.constructionMethod,
                            calculation.constructionArea,
                          )}
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
                  <div className="rounded-md bg-white px-4 py-3">
                    <dt className="text-sm font-semibold text-zinc-500">
                      드라이픽스
                    </dt>
                    <dd className="mt-2 text-lg font-bold text-zinc-950">
                      {getCombinedMethodAccessoryQuantity(
                        savedDemolitionConstructionArea,
                        savedOverlayConstructionArea,
                        adhesiveRates.dryFix,
                      )}
                    </dd>
                  </div>
                  <div className="rounded-md bg-white px-4 py-3">
                    <dt className="text-sm font-semibold text-zinc-500">
                      또는 에폭시
                    </dt>
                    <dd className="mt-2 text-lg font-bold text-zinc-950">
                      {getCombinedMethodAccessoryQuantity(
                        savedDemolitionConstructionArea,
                        savedOverlayConstructionArea,
                        adhesiveRates.epoxy,
                      )}
                    </dd>
                  </div>
                  {commonAccessoryRates.map((accessory) => (
                    <div
                      key={accessory.name}
                      className="rounded-md bg-white px-4 py-3"
                    >
                      <dt className="text-sm font-semibold text-zinc-500">
                        {accessory.name}
                      </dt>
                      <dd className="mt-2 text-lg font-bold text-zinc-950">
                        {getAccessoryQuantity(
                          savedTotalConstructionArea,
                          accessory,
                        )}
                      </dd>
                    </div>
                  ))}
                  <div className="rounded-md bg-white px-4 py-3">
                    <dt className="text-sm font-semibold text-zinc-500">
                      세라픽스
                    </dt>
                    <dd className="mt-2 text-lg font-bold text-zinc-950">
                      {savedOverlayConstructionArea > 0
                        ? `${getCerafixStatus("덧방")} (${getAccessoryQuantity(
                            savedOverlayConstructionArea,
                            cerafixRate,
                          )})`
                        : "철거 시 불가"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm font-semibold text-amber-800">
                  ※ 저장된 계산 목록 전체 시공면적 기준
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
