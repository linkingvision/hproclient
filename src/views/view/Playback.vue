<template>
    <div class="playback" ref="rootRef">
        <div id="Fullscreen">
            <div class="playback_video_hed" id="video_hed">
                <div v-for="cell in grid" :key="cell.id" class="palace videoColor" :style="computeCellStyle(cell)"
                    @click="cellClicked(cell.id)">
                    <Avintercomsplay ref="cellRefs" :h5id="'h' + cell.id" :h5videoid="'hvideo' + cell.id"
                        :canvasid="'canvas' + cell.id" :access_token="accessToken" :time="xzvalue"
                        :selectedId="selectedCellId" :grid="grid" :replayData="replayData" :root="root"
                        :session="session" :MoveTo="false" :MouseMoveFlag="false" :zoomHourGrid="12"
                        :offReplayVideo="''" :seekTime="seekTime" :play-command="playCommand"
                        :replay-trigger="replayTrigger" :speed-command="speedCommand" :volume-command="volumeCommand"
                        :fullscreen-icon="fullscreenIcon" @pb-time="onPbTime" @record-list="onRecordList"
                        @update-grid-icon="onUpdateGridIcon" @close-token='onCloseToken' @fullscreen="panelFullScreen"
                        @update-playing="onUpdatePlaying" @register-handler="onRegisterHandler"
                        @unregister-handler="onUnregisterHandler" @update-channel-token="onUpdateChannelToken">
                    </Avintercomsplay>
                </div>
            </div>
            <div class="func_area">
                <div class="timeline" style="height: 55px;width: 100%;display: block;">
                    <canvas id="timelineCanvas" ref="timelineRef"></canvas>
                </div>
                <div class="func">
                    <div class="left">
                        <span :class="{ choice: storage === 'CentralStorage' }"
                            style="cursor: pointer;margin-right: 5px; padding-inline: 5px;"
                            @click="changeStorage('CentralStorage')">Central Storage</span>
                        <span :class="{ choice: storage === 'DeviceStorage' }"
                            style="cursor: pointer;padding-inline: 5px;" @click="changeStorage('DeviceStorage')">Device
                            Storage</span>
                    </div>
                    <div class="center">
                        <el-date-picker v-model="xzvalue" type="date" placeholder="Please Select Date"
                            @focus="onDatePickerFocus" :teleported="false" class="date_picker"
                            :cell-class-name="dateCellClassName" popper-class="playback-date-popper"></el-date-picker>
                        <el-select class="speedSelect" :model-value="getRegion(selectedCellId)" @change="changeSpeed"
                            style="background-color: #2c7bf4;width: 55px;color: #FFFFFF;border-radius: 14px;">
                            <el-option value="0.25">1/4x</el-option>
                            <el-option value="0.5">1/2x</el-option>
                            <el-option value="1">1x</el-option>
                            <el-option value="2">2x</el-option>
                            <el-option value="4">4x</el-option>
                            <el-option value="8">8x</el-option>
                            <el-option value="16">16x</el-option>
                        </el-select>
                        <el-button class="iconfont" :class="getPlaying(selectedCellId) ? 'icon-zanting' : 'icon-bofang'"
                            @click="togglePlay"
                            style="background-color: transparent;padding: 5px;border: none;font-size: 16px;color:rgba(255, 255, 255, 0.5)"></el-button>
                        <span style="display: flex;align-items: center;width: 15%;gap: 10px;" class="audio_slider">
                            <span class="iconfont " style="font-size: 18px;color: #FFFFFF;"
                                :class="getVolume(selectedCellId) > 0 ? 'icon-shengyinkai' : 'icon-shengyinguan'"></span>

                            <el-slider style="width:80%;margin-left: 5px;" :show-tooltip="false"
                                :model-value="getVolume(selectedCellId)" @input="(v: number) => changeVolume(v)"
                                :min="0" :max="1" :step="0.1"></el-slider>
                        </span>
                    </div>
                    <div class="right">
                        <span class="iconfont" :class="expendIcon" @click="showRecordType = !showRecordType"></span>
                        <span v-if="showRecordType">
                            <button class="mr-0" type="button"></button>Schedule Record
                            <button class="mr-1" type="button"></button>Manual Record
                            <button class="mr-2" type="button"></button>Alarm Record
                        </span>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onBeforeUnmount } from 'vue';
import Avintercomsplay from './Avintercomsplay.vue';
import { TimeSlider } from '../../assets/js/timeline-canvas.js'
const props = defineProps<{
    replayData: any;
    selectedId: string;
    root: string;
    session: string;
    accessToken: string;
}>();

const emit = defineEmits<{
    (e: 'update:selectedId', id: string): void;
    (e: 'update-channel-token', windowIndex: number, token: string): void;
    (e: 'close-token', token: string, cellId?: string): void;
}>();

const layouts: Record<string | number, { cells: any[]; layout: string }> = {
    1: {
        cells: [{ id: '1-1', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, merged: true }],
        layout: '1|1',
    },
    3: {
        cells: [
            { id: "1-1", rowStart: 1, rowEnd: 4, colStart: 1, colEnd: 2, merged: true },
            { id: "1-2", rowStart: 1, rowEnd: 4, colStart: 2, colEnd: 3, merged: true },
            { id: "1-3", rowStart: 1, rowEnd: 4, colStart: 3, colEnd: 4, merged: true },
        ],
        layout: "3|3",
    },
    4: {
        cells: [
            { id: '1-1', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, merged: false },
            { id: '1-2', rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3, merged: false },
            { id: '2-1', rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2, merged: false },
            { id: '2-2', rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3, merged: false },
        ],
        layout: '2|2',
    },
    6: {
        cells: [
            { id: '1-1', rowStart: 1, rowEnd: 3, colStart: 1, colEnd: 3, merged: true },
            { id: '1-3', rowStart: 1, rowEnd: 2, colStart: 3, colEnd: 4, merged: false },
            { id: '2-3', rowStart: 2, rowEnd: 3, colStart: 3, colEnd: 4, merged: false },
            { id: '3-1', rowStart: 3, rowEnd: 4, colStart: 1, colEnd: 2, merged: false },
            { id: '3-2', rowStart: 3, rowEnd: 4, colStart: 2, colEnd: 3, merged: false },
            { id: '3-3', rowStart: 3, rowEnd: 4, colStart: 3, colEnd: 4, merged: false },
        ],
        layout: '3|3',
    },
    7: {
        cells: [
            { id: '1-1', rowStart: 1, rowEnd: 4, colStart: 1, colEnd: 2, merged: true },
            { id: '1-2', rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3, merged: false },
            { id: '1-3', rowStart: 1, rowEnd: 2, colStart: 3, colEnd: 4, merged: false },
            { id: '2-2', rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3, merged: false },
            { id: '2-3', rowStart: 2, rowEnd: 3, colStart: 3, colEnd: 4, merged: false },
            { id: '3-2', rowStart: 3, rowEnd: 4, colStart: 2, colEnd: 3, merged: false },
            { id: '3-3', rowStart: 3, rowEnd: 4, colStart: 3, colEnd: 4, merged: false },
        ],
        layout: '3|3',
    },
    9: {
        cells: [
            ...Array.from({ length: 9 }, (_, index) => {
                const row = Math.floor(index / 3) + 1;
                const col = (index % 3) + 1;
                return { id: `${row}-${col}`, rowStart: row, rowEnd: row + 1, colStart: col, colEnd: col + 1, merged: false };
            }),
        ],
        layout: '3|3',
    },
    13: {
        cells: [
            { id: '1-1', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, merged: false },
            { id: '1-2', rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3, merged: false },
            { id: '1-3', rowStart: 1, rowEnd: 2, colStart: 3, colEnd: 4, merged: false },
            { id: '1-4', rowStart: 1, rowEnd: 2, colStart: 4, colEnd: 5, merged: false },
            { id: '2-1', rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2, merged: false },
            { id: '2-2', rowStart: 2, rowEnd: 4, colStart: 2, colEnd: 4, merged: true },
            { id: '2-4', rowStart: 2, rowEnd: 3, colStart: 4, colEnd: 5, merged: false },
            { id: '3-1', rowStart: 3, rowEnd: 4, colStart: 1, colEnd: 2, merged: false },
            { id: '3-4', rowStart: 3, rowEnd: 4, colStart: 4, colEnd: 5, merged: false },
            { id: '4-1', rowStart: 4, rowEnd: 5, colStart: 1, colEnd: 2, merged: false },
            { id: '4-2', rowStart: 4, rowEnd: 5, colStart: 2, colEnd: 3, merged: false },
            { id: '4-3', rowStart: 4, rowEnd: 5, colStart: 3, colEnd: 4, merged: false },
            { id: '4-4', rowStart: 4, rowEnd: 5, colStart: 4, colEnd: 5, merged: false },
        ],
        layout: '4|4',
    },
    16: {
        cells: [
            ...Array.from({ length: 16 }, (_, index) => {
                const row = Math.floor(index / 4) + 1;
                const col = (index % 4) + 1;
                return { id: `${row}-${col}`, rowStart: row, rowEnd: row + 1, colStart: col, colEnd: col + 1, merged: false };
            }),
        ],
        layout: '4|4',
    },
    25: {
        cells: [
            ...Array.from({ length: 25 }, (_, index) => {
                const row = Math.floor(index / 5) + 1;
                const col = (index % 5) + 1;
                return { id: `${row}-${col}`, rowStart: row, rowEnd: row + 1, colStart: col, colEnd: col + 1, merged: false };
            }),
        ],
        layout: '5|5',
    },
    '4Alt': {
        cells: [
            { id: '1-1', rowStart: 1, rowEnd: 3, colStart: 1, colEnd: 4, merged: true },
            { id: '3-1', rowStart: 3, rowEnd: 4, colStart: 1, colEnd: 2, merged: false },
            { id: '3-2', rowStart: 3, rowEnd: 4, colStart: 2, colEnd: 3, merged: false },
            { id: '3-3', rowStart: 3, rowEnd: 4, colStart: 3, colEnd: 4, merged: false },
        ],
        layout: '3|3',
    },
};
const cellRefs = ref<any[]>([]);
const layoutType = ref('2|2');
const grid = ref<any[]>([...layouts[4].cells]);
const selectedCellId = ref(props.selectedId || '1-1');
const pannelFullScreen = () => {
    const el = document.getElementById('Fullscreen');
    if (!el) return;
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        el.requestFullscreen();
    }
}
const rootRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
let resizeTimer: number | null = null;
const xzvalue = ref(new Date());
const recordDaysMap = ref<Record<string, number[]>>({});
const playing = ref<Record<string, boolean>>({});
const getPlaying = (cellId: string) => playing.value[cellId] ?? false;
const setPlaying = (cellId: string, v: boolean) => playing.value = { ...playing.value, [cellId]: v };
const playIcon = ref('icon-bofang');
const playCommand = ref<{ cellId: string; cmd: string; ts: number } | null>(null);
const regions = ref<Record<string, string>>({});
const getRegion = (cellId: string) => regions.value[cellId] ?? '1x';
const setRegion = (cellId: string, v: string) => regions.value = { ...regions.value, [cellId]: v };

const speed = ref('1.0');
const speedCommand = ref<{ cellId: string; speed: string; ts: number } | null>(null);
const volumes = ref<Record<string, number>>({});
const getVolume = (cellId: string) => volumes.value[cellId] ?? 0;
const setVolume = (cellId: string, v: number) => volumes.value = { ...volumes.value, [cellId]: v };
const volumeCommand = ref<{ cellId: string; volume: number; ts: number } | null>(null);
const expendIcon = computed(() => {
    if (!showRecordType.value) {
        return 'icon-zuojiantou';
    } else {
        return 'icon-youjiantou';
    }
});
const showRecordType = ref(false);
const isFullscreen = ref(false);
const fullscreenIcon = computed(() => isFullscreen.value ? 'icon-suoxiao' : 'icon-fangda')
const handlers = ref<Record<string, any>>({});
const onPbTime = (time: number, h5id: string) => {
    if (h5id !== 'h' + selectedCellId.value) return;
    slider?.set_time_to_middle(time);
}
const onRecordList = (timedata: any[]) => {
    if (!slider) return;
    if (timedata.length === 0) {
        slider.clearLine();
        return;
    }
    slider?.set_cells(timedata);
    const first = timedata[0];
    const mid = (first.beginTime + first.endTime) / 2;
    slider.set_time_to_middle(mid);
};
const storage = ref<'CentralStorage' | 'DeviceStorage'>((localStorage.getItem('DefaultStorage') as any) || 'CentralStorage');
const replayTrigger = ref<{ ts: number } | null>(null);
let slider: TimeSlider | null = null;
const seekTime = ref<number | null>(null);

const computeCellStyle = (cell: any): any => {
    const borderWidth = '1px';
    const selectedBorderWidth = '2px';
    const [totalRows, totalCols] = layoutType.value.split('|').map(Number);
    const cellWidth = 100 / totalCols;
    const cellHeight = 100 / totalRows;
    const isSelected = selectedCellId.value === cell.id;
    const style: any = {
        position: 'absolute',
        top: `${(cell.rowStart - 1) * cellHeight}%`,
        left: `${(cell.colStart - 1) * cellWidth}%`,
        width: `calc(${cellWidth * (cell.colEnd - cell.colStart)}% - ${borderWidth})`,
        height: `calc(${cellHeight * (cell.rowEnd - cell.rowStart)}% - ${borderWidth})`,
        boxSizing: 'border-box',
        border: `${borderWidth} solid transparent`,
        zIndex: 1,
    };

    if (isSelected) {
        style.border = `${selectedBorderWidth} solid #F44336`;
        style.top = `calc(${style.top})`,
            style.left = `calc(${style.left})`,
            style.width = `calc(${style.width} + 1 * ${borderWidth})`
        style.height = `calc(${style.height} + 1 * ${borderWidth})`
    }
    return style;
}

const changeLayout = (key: string | number) => {
    const layout = layouts[key];
    if (!layout) return;

    const playingInfo: Record<number, { token: string; channelName: string; streamprofile: string }> = {};
    grid.value.forEach((cell, index) => {
        const child = cellRefs.value[index];
        if (child?.currentToken) {
            playingInfo[index] = {
                token: child.currentToken,
                channelName: child.currentChannelName,
                streamprofile: child.currentStreamprofile,
            };
        }
    });

    cellRefs.value.forEach((child: any) => {
        try { child?.softCloseForLayout?.(); } catch (e) { console.error(e); }
    });
    handlers.value = {};
    playing.value = {};

    layoutType.value = layout.layout;
    grid.value = [...layout.cells];

    nextTick(() => {
        setTimeout(() => {
            Object.keys(playingInfo).forEach((k) => {
                const windowIndex = Number(k);
                const info = playingInfo[windowIndex];
                if (!info) return;
                if (!grid.value[windowIndex]) return;
                const cell = grid.value[windowIndex];
                playTokenInCell(cell.id, info);
            });
        }, 100);
    });

    if (!grid.value.find(c => c.id === selectedCellId.value)) {
        selectedCellId.value = grid.value[0]?.id || '1-1';
        emit('update:selectedId', selectedCellId.value);
    }

    nextTick(() => {
        slider = null;
        initTimeline();
    });
};

const changeCustomizedPanel = (item: any) => {
    const playingInfo: Record<number, { token: string; channelName: string; streamprofile: string }> = {};
    grid.value.forEach((cell, index) => {
        const child = cellRefs.value[index];
        if (child?.currentToken) {
            playingInfo[index] = {
                token: child.currentToken.value,
                channelName: child.currentChannelName.value,
                streamprofile: child.currentStreamprofile.value,
            };
        }
    });

    cellRefs.value.forEach((child: any) => {
        try { child?.softCloseForLayout?.(); } catch (e) { console.error(e); }
    });
    handlers.value = {};
    playing.value = {};

    layoutType.value = `${item.layoutData.rows}|${item.layoutData.cols}`;
    grid.value = [...item.layoutData.grid];

    nextTick(() => {
        setTimeout(() => {
            Object.keys(playingInfo).forEach((k) => {
                const windowIndex = Number(k);
                const info = playingInfo[windowIndex];
                if (!info) return;
                if (!grid.value[windowIndex]) return;
                const cell = grid.value[windowIndex];
                playTokenInCell(cell.id, info);
            });
        }, 100);
    });

    if (!grid.value.find(c => c.id === selectedCellId.value)) {
        selectedCellId.value = grid.value[0]?.id || '1-1';
        emit('update:selectedId', selectedCellId.value);
    }

    nextTick(() => {
        slider = null;
        initTimeline();
    });
};

const playTokenInCell = (cellId: string, info: { token: string; channelName: string; streamprofile: string }) => {
    props.replayData.value = {
        token: info.token,
        vid: 'h' + cellId,
        channelName: info.channelName,
        streamprofile: info.streamprofile,
    };
};

defineExpose({ changeLayout, changeCustomizedPanel });

const cellClicked = (cellId: string) => {
    selectedCellId.value = cellId;
    emit('update:selectedId', cellId);
}

const initTimeline = () => {
    const canvasEl = document.getElementById('timelineCanvas') as HTMLCanvasElement;
    if (!canvasEl) return;
    slider = new TimeSlider({
        canvasid: 'timelineCanvas',
        videoid: 'hvideo' + selectedCellId.value,
        zoom: 24,
        init_cells: [],
        mousedown: () => { },
        mouseup: (time: number) => {
            seekTime.value = time;
            const h5id = 'h' + selectedCellId.value;
        },
        mousemove: () => { },
        thumbing_cb: (zoom: number) => { },
        croppingCallback: () => { },
    } as any);

    nextTick(() => {
        resizeTimeline();
        // const parent = canvasEl.parentElement;
        // if (parent) {
        //     const w = parent.offsetWidth;
        //     canvasEl.width = w;
        //     (slider as any).canvansW = w;
        //     (slider as any).init(true);
        // }
    })
};

const resizeTimeline = () => {
    if (resizeTimer) cancelAnimationFrame(resizeTimer);
    resizeTimer = requestAnimationFrame(() => {
        const canvasEl = document.getElementById('timelineCanvas') as HTMLCanvasElement;
        if (!canvasEl || !slider) return;
        const parent = canvasEl.parentElement;
        if (!parent) return;
        const w = parent.clientWidth;
        canvasEl.width = w;
        (slider as any).canvansW = w;
        (slider as any).init(true);
    })
}

const onUpdateGridIcon = (cellId: string, icon: string) => {
    const cell = grid.value.find(c => c.id === cellId);
    if (cell) cell.icon = icon;
}

const onUpdatePlaying = (cellId: string, v: boolean) => {
    setPlaying(cellId, v);
}

const onRegisterHandler = (h5id: string, handler: any) => {
    handlers.value = { ...handlers.value, [h5id]: handler };
}

const onUnregisterHandler = (h5id: string) => {
    const next = { ...handlers.value };
    delete next[h5id];
    handlers.value = next;
}

const fetchRecordCalendar = async (token: string, year: number, month: number) => {
    if (!token) return;
    const url = `${props.root}/api/v1/SearchStorRecordCalendar?token=${token}&year=${year}&month=${month}&session=${props.session}`;
    try {
        const res = await fetch(url);
        const result = await res.json();
        const records = result.data?.record || result.record || [];
        const days = records
            .filter((r: any) => r.bHasRec || r.bHasAnalyticsRec)
            .map((r: any) => r.nDay);
        recordDaysMap.value = {
            ...recordDaysMap.value,
            [token]: days,
        };
    } catch (e) {
        console.error(e);
    }
};

const dateCellClassName = (date: Date) => {
    const token = props.replayData?.token || '';
    if (!token) return '';
    const today = xzvalue.value || new Date();
    if (date.getFullYear() !== today.getFullYear()) return '';
    if (date.getMonth() !== today.getMonth()) return '';
    if (recordDaysMap.value[token]?.includes(date.getDate())) {
        return 'has-record';
    }
    return '';
}

const onDatePickerFocus = () => {
    const token = props.replayData?.token || '';
    if (!token) return;
    const d = xzvalue.value || new Date();
    fetchRecordCalendar(token, d.getFullYear(), d.getMonth() + 1);
};

const isCellPlaying = (cellId: string) => !!handlers.value['h' + cellId];

const togglePlay = () => {
    const cellId = selectedCellId.value;
    if (!isCellPlaying(cellId)) return;
    const isPlaying = getPlaying(cellId);
    setPlaying(cellId, !isPlaying);
    playCommand.value = { cellId, cmd: !isPlaying ? 'resume' : 'pause', ts: Date.now() };
}

const changeSpeed = (speed: string) => {
    const cellId = selectedCellId.value;

    setRegion(cellId, speed);
    speedCommand.value = { cellId, speed, ts: Date.now() };
}

const changeVolume = (v: number) => {
    const cellId = selectedCellId.value;
    setVolume(cellId, v);
    volumeCommand.value = { cellId, volume: v, ts: Date.now() };
}

const changeStorage = (type: 'CentralStorage' | 'DeviceStorage') => {
    if (storage.value === type) return;
    storage.value = type;
    localStorage.setItem('DefaultStorage', type);
    if (props.replayData) {
        replayTrigger.value = { ts: Date.now() };
    }
}

const onUpdateChannelToken = (cellId: string, token: string) => {
    const windowIndex = grid.value.findIndex(c => c.id === cellId);
    if (windowIndex < 0) return;
    emit('update-channel-token', windowIndex, token);
}

const onCloseToken = (token: string, cellId?: string) => {
    emit('close-token', token, cellId);
}

const panelFullScreen = () => {
    const el = document.getElementById('Fullscreen');
    if (!el) return;
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        el.requestFullscreen();
    }
}

const onFullscreen = () => {
    isFullscreen.value = !!document.fullscreenElement;
}

onMounted(() => {
    document.addEventListener('fullscreenchange', onFullscreen);
    nextTick(() => initTimeline());
    if (!props.selectedId) {
        emit('update:selectedId', grid.value[0]?.id || '1-1');
    }
    if (rootRef.value) {
        resizeObserver = new ResizeObserver(() => {
            resizeTimeline();
        })
        resizeObserver.observe(rootRef.value);
    }
})

onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', onFullscreen);
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
})

watch(
    selectedCellId,
    () => {
        slider = null;
        nextTick(() => initTimeline())
    }
)

watch(xzvalue, (newVal, oldVal) => {
    if (!newVal) return;
    if (oldVal && newVal.getTime() === oldVal.getTime()) return;
    const token = props.replayData?.token || '';
    if (token) {
        fetchRecordCalendar(token, newVal.getFullYear(), newVal.getMonth() + 1);
    }
});

watch(() => props.replayData, (newVal) => {
    if (!newVal?.token) return;
    const d = xzvalue.value || new Date();
    fetchRecordCalendar(newVal.token, d.getFullYear(), d.getMonth() + 1);
});
</script>

<style lang="scss" scoped>
.playback {
    width: 100%;
    height: 100%;

    #Fullscreen {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .playback_video_hed {
        position: relative;
        width: 100%;
        height: 90%;
        overflow: hidden;

        .palace {
            position: absolute;
            overflow: hidden;
            background: #000;
        }
    }

    .func_area {
        width: 100%;
        height: 10%;

        .func {
            height: 35%;
            width: 100%;
            display: flex;
            justify-content: space-between;

            .left {
                background-color: #333333;
                border-radius: 12px;
                height: 25px;
                line-height: 25px;

                .choice {
                    background-color: #0399FE;
                    border-radius: 12px;
                }
            }

            .center {
                width: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;

                :deep(.speedSelect) {
                    padding-left: 8px;
                    height: 20px;

                    .el-select__wrapper {
                        border: none;
                        height: 20px;
                        line-height: 20px;
                        min-height: 0;
                    }

                    .el-select__suffix {
                        display: none;
                    }

                    span {
                        font-size: 12px;
                    }
                }

                :deep(.audio_slider) {
                    .el-slider__button {
                        width: 4px;
                        border: 1px solid #409EFF;
                        height: 12px;
                        background-color: #409EFF;
                        border-radius: 0px;
                    }

                    .el-slider__bar {
                        height: 3px;
                    }

                    .el-slider__runway {
                        height: 3px;
                    }

                    .el-slider__button-wrapper {
                        height: 33px;
                    }
                }

                :deep(.date_picker) {
                    width: 130px;

                    .el-input__wrapper {
                        width: 130px;
                        background-color: transparent;
                    }

                    .el-input__inner {
                        color: #3ABBFE;
                    }

                    .el-input__suffix-inner {
                        display: none;
                    }
                }
            }

            .right {
                width: 25%;
                display: flex;
                justify-content: flex-end;

                .mr-0 {
                    background-color: #31B1FE;
                    width: 15px;
                    height: 15px;
                    padding: 1px 6px;
                    margin: 0 5px 0 5px !important;
                    border: none;
                    border-radius: 16px;
                }

                .mr-1 {
                    background-color: #3CC43C;
                    width: 15px;
                    height: 15px;
                    padding: 1px 6px;
                    margin: 0 4px 0 5px;
                    border: none;
                    border-radius: 16px;
                }

                .mr-2 {
                    background-color: #EE1011;
                    width: 15px;
                    height: 15px;
                    padding: 1px 6px;
                    margin: 0 8px 0 5px;
                    border: none;
                    border-radius: 16px;
                }
            }
        }
    }

    :global(.playback-date-popper .el-date-table td.current:not(.disabled) .el-date-table-cell__text) {
        background-color: #0399FE !important;
        color: #FFFFFF !important;
        border-radius: 0;
    }

    :global(.playback-date-popper .el-date-table td.has-record .el-date-table-cell__text::after) {
        content: '';
        position: absolute;
        top: 1px;
        left: 1px;
        width: 0;
        height: 0;
        border-right: 8px solid transparent;
        border-top: 8px solid #FFFFFF;
        pointer-events: none;
        z-index: 2;
    }

}
</style>