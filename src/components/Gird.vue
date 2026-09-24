<template>
  <div>
    <div class="grid-preview" :style="gridPreviewStyle">
      <div
        v-for="cell in previewGrid"
        :key="cell.id"
        class="grid-cell"
        :style="computeCellStyle(cell)"
      >
        <div class="cell-edge top-edge" @click="selectEdgeForMerge(cell, 'top')"></div>
        <div class="cell-edge right-edge" @click="selectEdgeForMerge(cell, 'right')"></div>
        <div class="cell-edge bottom-edge" @click="selectEdgeForMerge(cell, 'bottom')"></div>
        <div class="cell-edge left-edge" @click="selectEdgeForMerge(cell, 'left')"></div>
      </div>
    </div>

    <div class="control-panel">
      <div class="control-group">
        <span class="label">row:</span>
        <el-input-number
          class="inputnumber"
          size="small"
          v-model="rows"
          controls-position="right"
          :min="1"
          :max="8"
        />
      </div>
      <div class="control-group">
        <span class="label">column:</span>
        <el-input-number
          class="inputnumber"
          size="small"
          v-model="cols"
          controls-position="right"
          :min="1"
          :max="8"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

interface GridCell {
  id: string;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
  merged: boolean;
  mergeGroup?: string[];
}

type EdgeDirection = 'top' | 'right' | 'bottom' | 'left';

interface MergeSelection {
  cell: GridCell;
  edge: EdgeDirection;
}

export interface LayoutData {
  layoutType: string;
  rows: number;
  cols: number;
  grid: Array<Omit<GridCell, 'mergeGroup'>>;
}

const emit = defineEmits<{
  (e: 'get-layout-data', layoutData: LayoutData): void;
  (e: 'update-grid', grid: GridCell[], layoutType: string): void;
}>();

const rows = ref<number>(2);
const cols = ref<number>(2);
const previewGrid = ref<GridCell[]>([]);
const mergeSelections = ref<MergeSelection[]>([]);

const gridPreviewStyle = computed(() => ({
  display: 'grid',
  gridTemplateRows: `repeat(${rows.value}, 1fr)`,
  gridTemplateColumns: `repeat(${cols.value}, 1fr)`,
}));

watch([rows, cols], () => {
  generateGrid();
});

const generateGrid = (): void => {
  const newGrid: GridCell[] = [];
  for (let row = 1; row <= rows.value; row++) {
    for (let col = 1; col <= cols.value; col++) {
      newGrid.push({
        id: `${row}-${col}`,
        rowStart: row,
        rowEnd: row + 1,
        colStart: col,
        colEnd: col + 1,
        merged: false,
      });
    }
  }
  previewGrid.value = newGrid;
};

const resetToDefault = (): void => {
  rows.value = 2;
  cols.value = 2;
  mergeSelections.value = [];
  generateGrid();
};

const getLayoutData = (): void => {
  const cleanedGrid = previewGrid.value.map((cell) => ({
    id: cell.id,
    rowStart: cell.rowStart,
    rowEnd: cell.rowEnd,
    colStart: cell.colStart,
    colEnd: cell.colEnd,
    merged: cell.merged,
  }));

  const layoutData: LayoutData = {
    layoutType: `${rows.value}|${cols.value}`,
    rows: rows.value,
    cols: cols.value,
    grid: cleanedGrid,
  };

  emit('get-layout-data', layoutData);
};

const confirmLayout = (): void => {
  const layoutType = `${rows.value}|${cols.value}`;
  emit('update-grid', previewGrid.value, layoutType);
};

const increaseRows = (): void => {
  if (rows.value < 8) rows.value += 1;
};
const decreaseRows = (): void => {
  if (rows.value > 1) rows.value -= 1;
};
const increaseCols = (): void => {
  if (cols.value < 8) cols.value += 1;
};
const decreaseCols = (): void => {
  if (cols.value > 1) cols.value -= 1;
};

const selectEdgeForMerge = (selectedCell: GridCell, selectedEdge: EdgeDirection): void => {
  if (mergeSelections.value.length === 0) {
    mergeSelections.value.push({ cell: selectedCell, edge: selectedEdge });
    return;
  }

  const previousSelection = mergeSelections.value[0];
  const currentSelection: MergeSelection = { cell: selectedCell, edge: selectedEdge };

  if (isAdjacentAndValid(previousSelection, currentSelection)) {
    performMerge(previousSelection, currentSelection);
    mergeSelections.value = [];
  } else {
    mergeSelections.value = [{ cell: selectedCell, edge: selectedEdge }];
  }
};

const isAdjacentAndValid = (first: MergeSelection, second: MergeSelection): boolean => {
  const { cell: firstCell, edge: firstEdge } = first;
  const { cell: secondCell, edge: secondEdge } = second;

  if (firstCell.id === secondCell.id) return false;

  if (
    (firstEdge === 'right' && secondEdge === 'left') ||
    (firstEdge === 'left' && secondEdge === 'right')
  ) {
    if (
      firstCell.colEnd === secondCell.colStart ||
      firstCell.colStart === secondCell.colEnd
    ) {
      return checkHorizontalMerge(firstCell, secondCell);
    }
  }

  if (
    (firstEdge === 'bottom' && secondEdge === 'top') ||
    (firstEdge === 'top' && secondEdge === 'bottom')
  ) {
    if (
      firstCell.rowEnd === secondCell.rowStart ||
      firstCell.rowStart === secondCell.rowEnd
    ) {
      return checkVerticalMerge(firstCell, secondCell);
    }
  }

  return false;
};

const checkHorizontalMerge = (firstCell: GridCell, secondCell: GridCell): boolean => {
  return (
    firstCell.rowStart === secondCell.rowStart &&
    firstCell.rowEnd === secondCell.rowEnd
  );
};

const checkVerticalMerge = (firstCell: GridCell, secondCell: GridCell): boolean => {
  return (
    firstCell.colStart === secondCell.colStart &&
    firstCell.colEnd === secondCell.colEnd
  );
};

const performMerge = (first: MergeSelection, second: MergeSelection): void => {
  if (!isAdjacentAndValid(first, second)) return;

  const { cell: firstCell } = first;
  const { cell: secondCell } = second;

  const mergedRowStart = Math.min(firstCell.rowStart, secondCell.rowStart);
  const mergedRowEnd = Math.max(firstCell.rowEnd, secondCell.rowEnd);
  const mergedColStart = Math.min(firstCell.colStart, secondCell.colStart);
  const mergedColEnd = Math.max(firstCell.colEnd, secondCell.colEnd);

  updateMergedCells(firstCell, mergedRowStart, mergedRowEnd, mergedColStart, mergedColEnd);
  updateMergedCells(secondCell, mergedRowStart, mergedRowEnd, mergedColStart, mergedColEnd);

  firstCell.merged = true;
  secondCell.merged = true;
};

const updateMergedCells = (
  cell: GridCell,
  rowStart: number,
  rowEnd: number,
  colStart: number,
  colEnd: number
): void => {
  cell.rowStart = rowStart;
  cell.rowEnd = rowEnd;
  cell.colStart = colStart;
  cell.colEnd = colEnd;

  const mergedGroup = new Set<string>([...(cell.mergeGroup || []), cell.id]);
  cell.mergeGroup = Array.from(mergedGroup);

  previewGrid.value.forEach((gridCell) => {
    if (mergedGroup.has(gridCell.id)) {
      gridCell.mergeGroup = Array.from(mergedGroup);
    }
  });
};

const computeCellStyle = (cell: GridCell): Record<string, string | number> => {
  return {
    'grid-row-start': cell.rowStart,
    'grid-row-end': cell.rowEnd,
    'grid-column-start': cell.colStart,
    'grid-column-end': cell.colEnd,
    backgroundColor: cell.merged ? 'lightgray' : 'white',
  };
};

defineExpose({
  resetToDefault,
  getLayoutData,
  confirmLayout,
  increaseRows,
  decreaseRows,
  increaseCols,
  decreaseCols,
  generateGrid,
});

onMounted(() => {
  generateGrid();
});
</script>

<style>
.label {
  font-size: 12px;
  margin-right: 10px;
  white-space: nowrap;
}

.grid-preview {
  border: 1px solid #232323;
  margin-top: 10px;
  width: 100%;
  height: 300px;
  display: grid;
  gap: 5px;
}

.control-panel {
  display: flex;
  padding: 10px;
  justify-content: space-between;
}

.control-group {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.inputnumber .el-input-number__input {
  border-radius: 15px;
  border: none;
  background-color: #000;
  color: #fff;
}

.el-input-number__increase {
  background: none !important;
}
.el-input-number__decrease {
  background: none !important;
}

.inputnumber .el-input-number__input:focus {
  outline: none;
  box-shadow: none;
}

.grid-cell {
  border: 1px solid #232323;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #676767 !important;
}

.cell-edge {
  position: absolute;
  background-color: #232323;
  cursor: pointer;
}

.cell-edge:hover {
  background-color: #fedb03;
}

.top-edge {
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.right-edge {
  right: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.bottom-edge {
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.left-edge {
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}
</style>