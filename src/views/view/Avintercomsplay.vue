<template>
    <div class="Avintercomsplay">
        <video class="video1" :id="videoid" autoplay webkit-playsinline playsinline></video>
        <div :id="MapId" class="map"></div>
        <canvas class="h5vcanvas" :id="canvas2id"></canvas>
        <canvas v-show="canvasdisplay" :id="canvas3id" style="position:absolute;bottom:0;right:0;z-index: 29;"></canvas>
        <canvas v-show="canvasdisplay" :id="canvasid" style="position:absolute;bottom:0;right:0;z-index: 30;"></canvas>

        <div class="h5controls" v-if="v1 && !hideControls">
            <div style="display: flex;justify-content: flex-end;width: 110px;">
                <button class="iconfont icon-zhuapai PlayMapHide" @click="DoSnapshotWeb"
                    style="cursor: pointer;"></button>
                <button class="iconfont PlayMapHide" :class="dzfa" @click="discanvas" style="cursor: pointer;"></button>
                <button type="button" class="iconfont" :class="fullscreenIcon" @click="emit('fullscreen')"
                    style="cursor: pointer;"></button>
                <button type="button" class="iconfont icon-guanbi" @click="CloseVideo()"
                    style="cursor: pointer;"></button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, } from 'vue';
import h5jssdk from '../../assets/js/h5jssdk.esm.js'
import eleZoomBg from '../../components/favicos/2000.png'
import { SearchCentralStorage, SearchDeviceStorage } from '../../api/player.js';
import { ElMessage } from 'element-plus';
import { usePlayStore } from '../../store/play.js';

// ===== props =====
const props = defineProps<{
    h5id: string;
    h5videoid: string;
    canvasid: string;
    time: Date;
    selectedId: string;
    grid: any[];
    replayData: any;
    root: string;
    session: string;
    access_token: string;
    MoveTo: boolean;
    MouseMoveFlag: boolean;
    zoomHourGrid: number;
    offReplayVideo: string;
    seekTime: number | null;
    playCommand: { cellId: string; cmd: string; ts: number } | null;
    speedCommand: { cellId: string; speed: string; ts: number } | null;
    volumeCommand: { cellId: string; volume: number; ts: number } | null;
    replayTrigger: { ts: number } | null;
    fullscreenIcon: string;
    hideControls?: boolean;
}>();

const emit = defineEmits<{
    (e: 'register-handler', h5id: string, handler: any): void;
    (e: 'update-grid-icon', cellId: string, icon: string): void;
    (e: 'update-grid-region', cellId: string, region: string): void;
    (e: 'close-token', token: string,cellId?:string): void;
    (e: 'pb-time', time: number, cellId: string): void;
    (e: 'record-list', timedata: any[]): void;
    (e: 'update-playing', cellId: string, v: boolean): void;
    (e: 'update-channel-token', cellId: string, token: string): void;
    (e: 'unregister-handler', h5id: string): void;
    (e: 'fullscreen'): void;
}>();

const { H5sPlayerWS2 } = h5jssdk;
const playStore = usePlayStore();
const videoid = computed(() => props.h5videoid);
const rtcid = computed(() => 'rtc' + props.h5videoid);
const canvasid = computed(() => props.canvasid);
const canvas2id = computed(() => 'canvas2' + props.h5id);
const canvas3id = computed(() => 'canvas3' + props.h5id);
const MapId = computed(() => 'map' + props.h5id);
const currentToken = ref<string>('');
const currentChannelName = ref<string>('');
const currentStreamprofile = ref<string>('main');

const dzfa = ref('icon-dianzifangda');
const canvasdisplay = ref(false);
let interval: number | null = null;
const eleZoomTimer = ref<number | null>(null);
const eleZoomState = ref<{
    x: number;
    y: number;
    disX: number;
    disY: number;
    disW: number;
    disH: number;
    width: number;
    height: number;
} | null>(null);
const eleZoomImg = ref<HTMLImageElement | null>(null);

const v1 = ref<any>(null);

const Play = async (data1: any) => {
    const token = data1.token;
    if (!token) return;

    if (v1.value) {
        try {
            v1.value.disconnect();
        } catch (e) {
            console.error(e);
        }
        v1.value = null;
    }

    const defaultStorage = localStorage.getItem('DefaultStorage') || 'CentralStorage';
    const Adswitch = defaultStorage === 'CentralStorage' ? 'true' : 'false';

    let begintime: string;
    let endtime: string;
    let movetotime: string;

    if (data1.begintime && data1.endtime) {
        begintime = new Date(data1.begintime).toISOString();
        endtime = new Date(data1.endtime).toISOString();
        movetotime = data1.movetotime ? new Date(data1.movetotime).toISOString() : begintime;
    } else {
        const timevalue = props.time || new Date();
        const year = timevalue.getFullYear();
        const month = timevalue.getMonth() + 1;
        const strDate = timevalue.getDate();
        const searchDate = timevalue.getDate() - 1;
        const localOffset = Math.abs(timevalue.getTimezoneOffset() / 60);
        begintime = year + '-' + month + '-' + searchDate + 'T00:00:00+0' + localOffset + ':00';
        endtime = year + '-' + month + '-' + strDate + 'T23:59:59+0' + localOffset + ':00';
        movetotime = year + '-' + month + '-' + strDate + 'T00:00:00+0' + localOffset + ':00';
    }
    let res: any;
    try {
        if (Adswitch === 'false') {
            res = await SearchDeviceStorage(props.root, props.access_token, token,encodeURIComponent(begintime), encodeURIComponent(endtime)
            );
        } else {
            res = await SearchCentralStorage(props.root, props.access_token, token,encodeURIComponent(begintime), encodeURIComponent(endtime)
            );
        }
    } catch (e) {
        console.error(e);
        return;
    }

    const recordList: any[] = res?.data?.record || [];
    const timedata = recordList.map((item: any) => {
        const type = item.type || item.nType || '';
        let color = '#31b1ff';
        if (type.includes('H5_STOR_REC_ALERT') || type.includes('H5_STOR_REC_A_MOTION') || type.includes('H5_STOR_REC_A_OBJECT')) {
            color = '#ee1011';
        } else if (type.includes('H5_STOR_REC_N_MANUAL')) {
            color = '#3cc43c';
        } else if (type.includes('H5_STOR_REC_N_SCHED')) {
            color = '#31b1ff';
        }
        return {
            beginTime: new Date(item.strStartTime).getTime(),
            endTime: new Date(item.strEndTime).getTime() + 1000,
            style: { background: color },
        };
    });
    emit('record-list', timedata);

    let realStart = movetotime;
    if (recordList.length > 0) {
        const timeinitial = new Date(movetotime).getTime();
        let matched = false;
        for (let i = 0; i < recordList.length; i++) {
            const item = recordList[i];
            const s = new Date(item.strStartTime).getTime();
            const e = new Date(item.strEndTime).getTime() + 1000;
            if (s < timeinitial && e > timeinitial) {
                realStart = movetotime;
                matched = true;
                break;
            }
            if (s >= timeinitial) {
                realStart = item.strStartTime;
                matched = true;
                break;
            }
        }
        if (!matched) realStart = movetotime;
    }

    const pbconf1 = {
        begintime: realStart,
        endtime: endtime,
        moveto: realStart,
        autoplay: 'true',
        showposter: 'false',
        callback: PlaybackCB,
        serverpb: Adswitch,
    };

    const baseURL = new URL(props.root);
    const conf = {
        videoid: videoid.value,
        protocol: baseURL.protocol,
        host: baseURL.host,
        rootpath: '/',
        token,
        pbconf: pbconf1,
        hlsver: 'v1',
        session: props.session,
        consolelog: 'true',
    };

    v1.value = new H5sPlayerWS2(conf);
    v1.value.connect();

    applyAspectRatio();

    emit('register-handler', props.h5id, v1.value);
    const cellId = props.h5id.replace('h', '');
    emit('update-grid-icon', cellId, 'iconfont icon-zanting');
    emit('update-playing', cellId, true);
    emit('update-channel-token', cellId, token);

    currentToken.value = token;
    currentChannelName.value = data1.channelName || data1.label || token;
    currentStreamprofile.value = data1.streamprofile || 'main';
};

const PlaybackCB = (event: string, data: any) => {
    const msgEvent = JSON.parse(event);
    if (msgEvent.type === 'H5S_EVENT_PB_TIME') {
        emit('pb-time', new Date(msgEvent.pbTime.strTime).getTime(), props.h5id);
    }
}

const DoSnapshotWeb = () => {
    const videoEl = document.getElementById(videoid.value) as HTMLVideoElement;
    if (!videoEl) return;
    const w = videoEl.videoWidth;
    const h = videoEl.videoHeight;
    if (!w || !h) {
        ElMessage.warning('No video frame');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(videoEl, 0, 0, w, h);

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const token = props.replayData?.token || 'snapshot';
    const fileName =
        token + '_'
        + now.getFullYear() + '-'
        + pad(now.getMonth() + 1) + '-'
        + pad(now.getDate()) + '-'
        + pad(now.getHours()) + '-'
        + pad(now.getMinutes()) + '-'
        + pad(now.getSeconds()) + '.png';

    const url = canvas.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.download = fileName;
    a.href = url;
    a.dataset.downloadurl = ['image/png', a.download, a.href].join(':');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const discanvas = () => {
    if (canvasdisplay.value) {
        stopEleZoom();
        return;
    }
    if (!v1.value) {
        return;
    }
    const video = document.getElementById(videoid.value) as HTMLVideoElement;
    const canvas = document.getElementById(canvas2id.value) as HTMLCanvasElement;
    const canvas2 = document.getElementById(canvasid.value) as HTMLCanvasElement;
    const canvas3 = document.getElementById(canvas3id.value) as HTMLCanvasElement;

    if (!video || !canvas || !canvas2 || !canvas3) return;
    if (!video.videoWidth || !video.videoHeight) {
        return;
    }

    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const thumbW = rect.width / 4;
    const thumbH = rect.height / 4;
    canvas2.width = thumbW;
    canvas2.height = thumbH;
    canvas2.style.width = thumbW + 'px';
    canvas2.style.height = thumbH + 'px';

    canvas3.width = thumbW;
    canvas3.height = thumbH;
    canvas3.style.width = thumbW + 'px';
    canvas3.style.height = thumbH + 'px';

    eleZoomState.value = {
        x: 0, y: 0,
        disX: 0, disY: 0,
        disW: thumbW, disH: thumbH,
        width: thumbW, height: thumbH,
    };

    const img = new Image();
    img.src = eleZoomBg;
    eleZoomImg.value = img;

    canvasdisplay.value = true;
    startEleZoomLoop();
};

const startEleZoomLoop = () => {
    if (eleZoomTimer.value) {
        clearInterval(eleZoomTimer.value);
        eleZoomTimer.value = null;
    }

    const video = document.getElementById(videoid.value) as HTMLVideoElement;
    const canvas = document.getElementById(canvas2id.value) as HTMLCanvasElement;
    const canvas2 = document.getElementById(canvasid.value) as HTMLCanvasElement;
    const canvas3 = document.getElementById(canvas3id.value) as HTMLCanvasElement;
    if (!video || !canvas || !canvas2 || !canvas3) return;

    const ctx = canvas.getContext('2d')!;
    const ctx3 = canvas3.getContext('2d')!;

    const loop = () => {
        if (!eleZoomState.value) return;
        const s = eleZoomState.value;
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
            video,
            (s.x / s.width) * vw,
            (s.y / s.height) * vh,
            (s.disW / s.width) * vw,
            (s.disH / s.height) * vh,
            0, 0,
            canvas.width, canvas.height
        );

        ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
        ctx3.drawImage(video, 0, 0, canvas3.width, canvas3.height);
    };

    loop();
    eleZoomTimer.value = window.setInterval(loop, 40);
    bindEleZoomEvents(canvas, canvas2);
};

const bindEleZoomEvents = (canvas: HTMLCanvasElement, canvas2: HTMLCanvasElement) => {
    if (!eleZoomState.value) return;
    const s = eleZoomState.value;
    const ctx2 = canvas2.getContext('2d')!;

    const renderThumb = () => {
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        if (eleZoomImg.value) {
            ctx2.drawImage(eleZoomImg.value, s.x, s.y, s.disW, s.disH);
        }
    };
    renderThumb();

    canvas2.onmousedown = (e: MouseEvent) => {
        const rect = canvas2.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - s.x;
        const offsetY = e.clientY - rect.top - s.y;

        canvas2.onmousemove = (ev: MouseEvent) => {
            s.x = ev.clientX - rect.left - offsetX;
            s.y = ev.clientY - rect.top - offsetY;
            clamp(s);
            renderThumb();
        };
        canvas2.onmouseup = () => {
            canvas2.onmousemove = null;
            canvas2.onmouseup = null;
        };
    };

    canvas2.onwheel = (e: WheelEvent) => {
        e.preventDefault();
        const scale = e.deltaY < 0 ? 1.1 : 0.9;
        let newW = s.disW * scale;
        let newH = s.disH * scale;
        if (newW < 20 || newH < 20) return;
        if (newW > s.width) newW = s.width;
        if (newH > s.height) newH = s.height;
        const cx = s.x + s.disW / 2;
        const cy = s.y + s.disH / 2;
        s.disW = newW;
        s.disH = newH;
        s.x = cx - newW / 2;
        s.y = cy - newH / 2;
        clamp(s);
        renderThumb();
    };
};

const clamp = (s: any) => {
    if (s.x < 0) s.x = 0;
    if (s.y < 0) s.y = 0;
    if (s.x + s.disW > s.width) s.x = s.width - s.disW;
    if (s.y + s.disH > s.height) s.y = s.height - s.disH;
};

const stopEleZoom = () => {
    if (eleZoomTimer.value) {
        clearInterval(eleZoomTimer.value);
        eleZoomTimer.value = null;
    }

    const canvas = document.getElementById(canvas2id.value) as HTMLCanvasElement;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    const canvas2 = document.getElementById(canvasid.value) as HTMLCanvasElement;
    if (canvas2) {
        const ctx2 = canvas2.getContext('2d');
        ctx2?.clearRect(0, 0, canvas2.width, canvas2.height);
        canvas2.style.width = '';
        canvas2.style.height = '';
        canvas2.onmousedown = null;
        canvas2.onmousemove = null;
        canvas2.onmouseup = null;
        canvas2.onwheel = null;
    }

    const canvas3 = document.getElementById(canvas3id.value) as HTMLCanvasElement;
    if (canvas3) {
        const ctx3 = canvas3.getContext('2d');
        ctx3?.clearRect(0, 0, canvas3.width, canvas3.height);
        canvas3.style.width = '';
        canvas3.style.height = '';
    }

    canvasdisplay.value = false;
    eleZoomState.value = null;
    eleZoomImg.value = null;
};

const CloseVideo = (_beforeDestroy?: string) => {
    if (canvasdisplay.value) stopEleZoom();
    const token = v1.value?.config?.token || props.replayData?.token || '';
    if (v1.value) {
        try {
            v1.value.disconnect();
        } catch (e) {
            console.error(e);
        }
        v1.value = null;
    }

    const videoEl = document.getElementById(videoid.value) as HTMLVideoElement;
    if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.srcObject = null;
        videoEl.load();
        videoEl.poster = '';
    }

    const cellId = props.h5id.replace('h', '');
    emit('update-grid-icon', cellId, 'iconfont icon-bofang');
    emit('record-list', []);
    emit('unregister-handler', props.h5id);
    emit('update-channel-token', cellId, '');
    if (token) emit('close-token', token,cellId);

    currentToken.value = '';
    currentChannelName.value = '';
    currentStreamprofile.value = 'main';
};

const softCloseForLayout = () => {
    if (canvasdisplay.value) stopEleZoom();
    if (v1.value) {
        try { v1.value.disconnect(); } catch (e) { console.error(e); }
        v1.value = null;
    }
    const videoEl = document.getElementById(videoid.value) as HTMLVideoElement;
    if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.srcObject = null;
        videoEl.load();
        videoEl.poster = '';
    }
    emit('unregister-handler', props.h5id);
};

const onAspectRatio = () => {
	document.querySelectorAll('.palace video').forEach((el) => {
		el.classList.remove('video1');
		el.classList.add('keepAspectRatio');
	});
}

const offAspectRatio = () => {
	document.querySelectorAll('.palace video').forEach((el) => {
		el.classList.remove('keepAspectRatio');
		el.classList.add('video1');
	})
}

const applyAspectRatio = () => {
	if(playStore.aspectRatio){
		onAspectRatio()
	}else{
		offAspectRatio()
	}
}

const pause = () => {
    v1.value?.pause();
}

const resume = () => {
    v1.value?.resume();
}

const moveto = (t:Date | string | number) => {
    v1.value?.moveto(new Date(t));
};

defineExpose({
    currentToken,
    currentChannelName,
    currentStreamprofile,
    softCloseForLayout,
    pause,
    resume,
    moveto,
});

watch(
    () => props.replayData,
    (token) => {
        if (!token) return;
        if (props.h5id !== token.vid) return;
        Play(token);
    }
);

watch(
    () => props.offReplayVideo,
    (val) => {
        if (!val) return;
        // AllCloseVideo()
    }
);

watch(
    () => props.seekTime, (time) => {
        if (!time || !v1.value) return;
        if (props.h5id !== 'h' + props.selectedId) return;
        v1.value.moveto(new Date(time));
    }
)

watch(() => props.playCommand, (val) => {
    if (!val || !v1.value) return;
    if (props.h5id !== 'h' + val.cellId) return;
    if (val.cmd === 'pause') {
        v1.value.pause()
    } else if (val.cmd === 'resume') {
        v1.value.resume()
    }
});

watch(() => props.speedCommand, (val) => {
    if (!val || !v1.value) return;
    if (props.h5id !== 'h' + val.cellId) return;
    v1.value.speed(val.speed);
})

watch(() => props.volumeCommand, (val) => {
    if (!val || !v1.value) return;
    if (props.h5id !== 'h' + val.cellId) return;
    const videoEl = document.getElementById(videoid.value) as HTMLVideoElement;
    if (videoEl) videoEl.volume = val.volume;
})

watch(() => props.time, () => {
    if (props.h5id !== 'h' + props.selectedId) return;
    if (!props.replayData) return;
    Play(props.replayData);
})

watch(() => props.replayTrigger, () => {
    if (!props.replayData) return;
    if (props.h5id !== props.replayData.vid) return;
    Play(props.replayData);
})

watch(() => playStore.aspectRatio,()=>{
    applyAspectRatio();
})

onMounted(() => {
    // 初始化 canvas 尺寸
});

onBeforeUnmount(() => {
    if (canvasdisplay.value) stopEleZoom();
});
</script>

<style lang="scss" scoped>
.Avintercomsplay {
    width: 100%;
    height: 100%;
    position: relative;

    .video1 {
        width: 100%;
        height: 100%;
        object-fit: fill;
        display: block;
    }

    .h5vcanvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .PlayFailurePrompted {
        display: none;
        width: 182px;
        height: 22px;
        position: absolute;
        top: 59%;
        left: 52%;
        transform: translate(-52%, -59%);
        color: #CCCCCC;
    }

    .h5controls {
        position: absolute;
        top: 0;
        right: 0;
        padding: 0;
        z-index: 10000;
        height: 30px;
        display: none;
        text-align: right;
        line-height: 30px;
        background-image: url('../../assets/image/funcBlack.png');
        background-size: 110px 30px;
        background-position: center;

        button {
            border: none;
            background: none;
            color: #FFFFFF;
            margin-right: 10px;

        }

        .rotate {
            transform: rotateY(180deg);
        }
    }

    &:hover .h5controls {
        display: flex;
    }

    .timeline {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 55px;
        z-index: 5;
    }
}
</style>