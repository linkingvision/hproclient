<template>
	<div class="grid_view" id="grid_view">

		<div class="grid_view_content" style="width:100%">

			<div class="content_left" :style="{ flex: isPutAway ? '0 0 280px' : '0 0 0%' }">

				<div class="left_top">
					<span></span>
					<span class="iconfont icon-liebiao" @click="toggleLeftPanel"></span>
				</div>

				<div class="left_content">
					<DeviceTree ref="deviceTreeRef" @drag-start="handleDeviceDragStart"></DeviceTree>
				</div>


				<!-- <div class="left_search">
          <el-input class="left_input" :placeholder="$t('Common.comm_filtration')" v-model="filterText" @input="filterNode">
            <template #suffix>
              <i class="iconfont icon-sousuo" style="cursor: pointer;" @click="handleIconClick"></i>
            </template>
</el-input>
</div>

<el-collapse v-model="activeNames" style="background: black;">
	<el-collapse-item name="devPartition" class="collapse_devPartition">
		<template #title>
              <div style="padding: 0 10px 0 20px;height: 40px;line-height: 40px;display: flex; justify-content: space-between;" class="liveplay_collapse_title">
                <span>Partition</span>
                <span class="iconfont icon-shuaxin" @click.stop="Refresh('device')"></span>
              </div>
            </template>
		<el-tree :data="dataSource" row-key="uuid" :props="defaultProps" empty-text="No available data"
			@node-expand="handleNodeExpand" @node-collapse="handleNodeCollapse" :prop="defaultProps"
			:default-expand-keys="defaultExpandIds">
			<template #default="{node,data}">
              <span @mouseenter="handleMouseEnter(data)" @mouseleave="handleMouseLeave()" style="width: 100%;">

								<div style="width: 100%;display: flex;justify-content: space-between;">
									<span class="size_color" draggable="true" @dragstart="dragStart($event,data.token,data.label,data.streamprofile,data.name,data.disabled_me,data)"
									style="display:flex;justify-content: flex-start;align-items: center;">

										<svg v-if="data.iconclass2" :class="data.dome == true ? 'CameraIcon DomeIcon' : 'CameraIcon'" aria-hidden="true" width="20" height="20">
											<use :xlink:href="data.iconclass2"></use>
										</svg>
										<span v-else-if="data.dome === true" style="font-size: 19px;transform: scale(1.0);"
										:class="data.iconclass + ' ' + data.iconclass1" :id="'icon' + data.token"></span>
										<span v-else :style="data.icontype == '' ? 'font-size: 19px' : 'font-size:16px'"
										:class="data.iconclass + ' ' + data.iconclass1" :id="'icon' + data.token"></span>

										<span v-if="data.alias" :class="data.iconclass4 + ' ' + data.iconclass1" style="padding-left: 4px;"
										:title="data.alias">{{ data.alias }}</span>
										<span v-else :class="data.iconclass4 + ' ' + data.iconclass1" style="padding-left: 4px;"
										:title="data.label">{{ data.label || data.name }}</span>

										<span v-if="typeof data.AllLength !== 'undefined'" style="padding-left: 4px;">
											{{ data.online }}/{{ data.AllLength }}
										</span>
									</span>

									<div style="display: flex;align-items: center;">
										<span v-if="data.DifferentType=='devChannel' || data.DifferentType == 'CasDevChannel'"
										:class="data.iconclass3" class="nowplay">
											<div style="display:flex;align-items: center;">
												<span class="dot">●</span>
												<span class="nowplayText">Playing</span>
											</div>
										</span>
										<span v-else :class="data.iconclass3" class="nowplay">
											<div style="display:flex;align-items: center;">
												<span class="dot">●</span>
												<span class="nowplayText">Playing</span>
											</div>
										</span>
									</div>

								</div>
							</span>
            </template>
		</el-tree>
	</el-collapse-item>
</el-collapse> -->

			</div>

			<div class="content_right" id="videoPanel" :style="{ width: isPutAway ? 'calc(100% - 280px)' : '100%' }">
				<div style="width: 100%;height: 100%; display: flex; flex-direction: column;">
					<div class="liveview_right_video_hed" id="video_hed" style="position: relative;" @drop="dropTarget($event)"
						@dragover.prevent="dragOver($event)">
						<div class="malv" :class="informationshow ? '' : 'malv-hide'" style="position:absolute;">
							<div class="malv-close" @click="closeInformation">×</div>
							<div class="malv-left">
								<div class="information_title">Video</div>
								<div class="information_content" v-for="(a, index) in informationVideo" :key="index">
									<div class="information_content_left">{{ a.name }}</div>
									<div class="information_content_right">{{ a.data }}</div>
								</div>
							</div>
							<div class="malv-right">
								<div class="information_title">Audio</div>
								<div class="information_content" v-for="(a, index) in informationAudio" :key="index">
									<div class="information_content_left">{{ a.name }}</div>
									<div class="information_content_right">{{ a.data }}</div>
								</div>
							</div>
						</div>
					</div>

					<div v-show="!isLive" class="control_area" style="width: 100%;">
						<div class="timeline-box" style="width: 100%;height:80px;padding: 0;box-sizing: border-box;border:none">
							<svg id="timeline"></svg>
						</div>
						<div class="control_btns">
							<div class="storage_box">
								<div class="storage_mode">
									<div class="CentralStorage" :class="{ active: playbackStorageMode === 'CentralStorage' }"
										@click="changeStorage('CentralStorage')">Central Storage</div>
									<div class="DeviceStorage" :class="{ active: playbackStorageMode === 'DeviceStorage' }"
										@click="changeStorage('DeviceStorage')">Device Storage</div>
								</div>
							</div>

							<div class="control-center">
								<el-date-picker style="width: 130px;" class="fixed_input" popper-class="date_popper" :teleported="false"
									v-model="xzvalue" size="small" @change="input_ch" @focus="isShow($event)" @blur="isClose" type="date"
									placeholder="Please select" :picker-options="pickerOptions"
									:default-time="new Date(2000, 1, 1, 0, 0, 0)" :append-to-body="false">
								</el-date-picker>

								<button class="resume-btn">
									<i class="iconfont" :class="isPlaying ? 'icon-zantingzhong' : 'icon-bofangzhong'" @click="resume"
										style="font-size: 32px;"></i>
								</button>

								<el-select v-model="region" size="small" class="ele" :popper-append-to-body="false" :teleported="false"
									popper-class="selectdrop" style="width: 45px;" @change="timeSpeed(region)" placeholder="Please select"
									@visible-change="timeInput">
									<el-option v-for="item in regiondata" :key="item.value" :label="item.label"
										:value="item.value"></el-option>
								</el-select>

								<div id="Audio_slider-bottom" class="Audio_slider-bottom">
									<div style="margin-right: 10px;">
										<i class="iconfont" :class="(Audioslider == 0) ? 'icon-jingyinguanbi' : 'icon-mn_shengyin_fill'"
											style="font-size: 22px;"></i>
									</div>
									<el-slider :step="0.1" :show-tooltip="false" :max="1" v-model="Audioslider"
										style="width: 60%;margin-right: 10px;"></el-slider>
								</div>
							</div>

							<div class="caveat_butt">
								<div class="showRecordType" @click="showRecordType = !showRecordType"
									style="width: 20px; height: 20px;">
									<i class="iconfont" :class="showRecordType ? 'icon-yincang' : 'icon-xianshi'"></i>
								</div>
								<div class="recodeType" v-if="showRecordType" style="padding: 0 10px;">
									<button class="mr-0" type="button"></button>Schedule Record
									<button class="mr-1" type="button"></button>Manual Record
									<button class="mr-2" type="button"></button>Alarm Record
								</div>
							</div>
						</div>

					</div>

				</div>
			</div>

			<div v-if="!isPutAway" class="TreeFold" @click="toggleLeftPanel">
				<i class="iconfont icon-liebiao"></i>
			</div>

			<div class="yuntai" :class="ptzShow ? '' : 'yuntai-hide'">

				<div class="header">
					<span>PTZ</span>
					<i class="iconfont icon-shouqi" @click="closePtz"></i>
				</div>

				<div class="controls">
					<div class="left">
						<i class="iconfont icon-jujiao2" @mousedown="PtzAction('focusin')" @mouseup="PtzAction('stop')"></i>
						<i class="iconfont icon-jujiao1" @mousedown="PtzAction('focusout')" @mouseup="PtzAction('stop')"></i>
						<i class="iconfont icon-guangquanjia" @mousedown="PtzAction('irisin')" @mouseup="PtzAction('stop')"></i>
						<i class="iconfont icon-guangquanjian" @mousedown="PtzAction('irisout')" @mouseup="PtzAction('stop')"></i>
						<i class="iconfont icon-light-open" @mousedown="PtzAction('lighton')" @mouseup="PtzAction('stop')"></i>
						<i class="iconfont icon-light-close" @mousedown="PtzAction('lightoff')" @mouseup="PtzAction('stop')"></i>
						<i class="iconfont icon-kaiyushua" @mousedown="PtzAction('wiperon')" @mouseup="PtzAction('stop')"></i>
						<i class="iconfont icon-guanyushua" @mousedown="PtzAction('wiperoff')" @mouseup="PtzAction('stop')"></i>
					</div>
					<div class="right">
						<div class="ptz-item corner">
							<div class="zs" @mousedown="PtzAction('upleft')" @mouseup="PtzAction('stop')">
								<i class="iconfont icon-zuoshang"></i>
							</div>
						</div>
						<div class="ptz-item shang" @mousedown="PtzAction('up')" @mouseup="PtzAction('stop')">
							<i class="iconfont icon-xiangshang"></i>
						</div>
						<div class="ptz-item corner">
							<div class="ys" @mousedown="PtzAction('upright')" @mouseup="PtzAction('stop')">
								<i class="iconfont icon-youshang"></i>
							</div>
						</div>
						<div class="ptz-item zuo" @mousedown="PtzAction('left')" @mouseup="PtzAction('stop')">
							<i class="iconfont icon-xiangzuo"></i>
						</div>
						<div class="ptz-item center"></div>
						<div class="ptz-item you" @mousedown="PtzAction('right')" @mouseup="PtzAction('stop')">
							<i class="iconfont icon-xiangyou"></i>
						</div>
						<div class="ptz-item corner">
							<div class="zx" @mousedown="PtzAction('downleft')" @mouseup="PtzAction('stop')">
								<i class="iconfont icon-zuoxia"></i>
							</div>
						</div>
						<div class="ptz-item xia" @mousedown="PtzAction('down')" @mouseup="PtzAction('stop')"><i
								class="iconfont icon-xiangxia"></i></div>
						<div class="ptz-item corner">
							<div class="yx" @mousedown="PtzAction('downright')" @mouseup="PtzAction('stop')">
								<i class="iconfont icon-youxia"></i>
							</div>
						</div>
					</div>
				</div>

				<div class="ptz-slider">
					<span>{{ ptzvalue }}</span>
					<el-slider v-model="ptzvalue" :show-tooltip="false" :max="1" :min="0.1" :step="0.1"></el-slider>
				</div>

				<el-timeline>
					<el-timeline-item placement="top" v-for="Pre in Presetdata" :key="Pre.strName">
						<el-card>
							<div class="preset_bgc">
								<input type="text" class="preset_input" :value="Pre.strName">
								<button type="button" class="iconfont icon-RectangleCopy1" @click="presetJump(Pre.strToken)"></button>
								<button type="button" class="iconfont icon-icon-test1"
									@click="presetSet(Pre.strToken, $event)"></button>
							</div>
						</el-card>
					</el-timeline-item>
				</el-timeline>

			</div>

		</div>

		<div class="grid_view_footer">
			<div class="blankPlaceHolder">
				<el-popover placement="top" width="260" trigger="click" popper-class="PatrolPopover" v-model="popoverVisible">
					<div class="PatrolContainer">
						<div class="PatrolTitle">
							<el-select v-model="regionchoice" size="small" placeholder="Please Select"
								no-data-text="No Avaliable Data">
								<el-option v-for="item in selectdata" :key="item.uuid" :label="item.patrolName"
									:value="item.elementView"></el-option>
							</el-select>
						</div>
						<div class="PatrolContent">
							<div class="PatrolContentElementView" v-for="(item, index) in regionchoice" :key="index"
								:style="{ background: currentIndex === index ? '#0399FE' : 'transparent' }">
								<div>
									<i class="iconfont icon-shitu2"></i>
									<span>{{ item.viewName }}</span>
								</div>
								<div>
									<span>{{ item.dwellTime }}s</span>
								</div>
							</div>
						</div>
						<div class="PatrolFooter">
							<i class="iconfont icon-xunhuan" :class="Repeating ? 'xunhuan' : ''" @click="Repeating = !Repeating"></i>
							<i class="iconfont icon-shangyi" @click="previous"></i>
							<i class="iconfont PatrolPlay" :class="PatrolPlay ? 'icon-zanting' : 'icon-bofang'"
								@click="Playview(regionchoice)"></i>
							<i class="iconfont icon-xiayi" @click="next"></i>
							<i class="iconfont icon-guanbi1 guanbiPatrol" @click="closePopover"></i>
						</div>
					</div>
					<template #reference>
						<div :class="['PatrolBtn', { 'active': popoverVisible }]">
							<i class="iconfont icon-shoudiantong"></i>
						</div>
					</template>

				</el-popover>
			</div>

			<div class="show-play-replay">
				<div class="changeLiveReplay" @click="ChangeActive(true)" :class="isLive ? 'live' : 'replay'">Live View</div>
				<div class="changeLiveReplay" @click="ChangeActive(false)" :class="!isLive ? 'live' : 'replay'">Playback</div>
			</div>

			<div style="padding-right:30px">
				<el-button class="iconfont icon-guanbigongge offAllVideo" @click="Alloffvideo"></el-button>
				<el-button class="iconfont icon-quanping" @click="panelFullScreen($event)"></el-button>
			</div>

		</div>

	</div>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import '../../assets/js/adapter.js'
import { H5sPlayerAudBack } from '../../assets/js/h5splayer.js'
import h5jssdk from '../../assets/js/h5jssdk.esm.js'
import { GridLayoutManager, Timeline } from '../../assets/js/uplayersdk.esm.js'
import uuid from "../../utils/uuid.js";
import { usePlayStore } from "../../store/play.js";
import { useSiteInfo } from "../../store/site-info.js";
import { useStore } from "../../store/index.js";
import { getDeviceInfo } from "../../utils/site.js";
import DeviceTree from "../../components/DeviceTree.vue";
import { GetStreamInfo, ManualRecEnable, ManualRecStart, PresetJump, PresetSet, Ptz, PtzControl, SearchCentralStorage, SearchRecordedCalendar, View } from "../../api/player.js";

interface PresetItem {
	strName: string,
	strToken: string,
};
interface PatrolOption {
	uuid: string,
	patrolName: string,
	elementView: any[],
};
interface PatrolViewItem {
	viewName: string,
	dwellTime: number,
	viewId?: string,
}

const mainStore = useStore();
const playStore = usePlayStore();
const siteStore = useSiteInfo();
const { H5sPlayerWS2 } = h5jssdk;

const isPutAway = ref(true);
const isDrag = ref(false);
const isLive = ref(true);
const informationshow = ref(false);
const isPlaying = ref(false);
const showRecordType = ref(false);
const ptzShow = ref(false);
const popoverVisible = ref(false);
const Repeating = ref(true);
const PatrolPlay = ref(false);
const stopTurePlay = ref(false);

const GridManager = ref<InstanceType<typeof GridLayoutManager> | null>(null);
const timeline = ref<InstanceType<typeof Timeline> | null>(null);
const deviceTreeRef = ref<InstanceType<typeof DeviceTree> | null>(null);
const audioback = ref<any>(null);
const timerRunInfo = ref<any>(null);
const monthChangeHandler = ref<((...args: any[]) => void) | null>(null);
const timelineChangeHandler = ref<((event: any) => void) | null>(null);
const timelineCurrentTimeHandler = ref<((event: any) => void) | null>(null);
const timelineUpdateEventBarHandler = ref<((event: any) => void) | null>(null);

const Audioslider = ref(0);
const ptzvalue = ref(0.5);
const currentIndex = ref(0);

const playbackStorageMode = ref('CentralStorage');
const selectCellId = ref("");
const playingViewId = ref("");
const region = ref("1.0");
const ptzToken = ref("");

const informationVideo = ref<any>([]);
const informationAudio = ref<any>([]);
const isPlayingArr = ref<any>([]);
const customDateArr = ref<any>([]);
const regiondata = ref<any>([
	{
		value: "16.0",
		label: "16x"
	},
	{
		value: "8.0",
		label: "8x"
	},
	{
		value: "4.0",
		label: "4x"
	},
	{
		value: "2.0",
		label: "2x"
	},
	{
		value: "1.0",
		label: "1x"
	},
	{
		value: "0.5",
		label: "1/2x"
	},
	{
		value: "0.25",
		label: "1/4x"
	},
]);
const Presetdata = ref<PresetItem[]>([]);
const regionchoice = ref<PatrolViewItem[]>([]);
const selectdata = ref<PatrolOption[]>([]);
const tureData = ref<PatrolViewItem[]>([]);
const patrolTimeouts = ref<any>([]);

const drag = ref<any>({});

const xzvalue = ref(new Date());

onMounted(async () => {
	initGridLayout();
})

onBeforeUnmount(() => {
	if (timeline.value) {
		timeline.value.removeEventListener('resume', timelineChangeHandler.value);
		timeline.value.removeEventListener('timelineCurrentTime', timelineCurrentTimeHandler.value);
		timeline.value.removeEventListener('updateEventBar', timelineUpdateEventBarHandler.value);
		timeline.value.clearMotionBar();
		timeline.value = null;
	}
})

watch(
	() => mainStore.darkMode,
	(newColor, oldColor) => {
		if (newColor && newColor !== oldColor) {
			switch (newColor) {
				case 'c-dark-theme':
					timeline.value.updateBackgroundColor('#343434');
					break;
				// case false:
				// 	timeline.value.updateBackgroundColor('#E4E4E4');
				// 	break;
				case 'darkblue':
					timeline.value.updateBackgroundColor('#1C2850');
					break;
				default:
					timeline.value.updateBackgroundColor('#343434');
			}
		}
	}
);

watch(
	isLive,
	(newData) => {
		if (!timeline.value) {
			nextTick(() => {
				initTimeline();
			})
		}
		resetPlay();
		if (newData) {
			GridManager.value.changePlayModeText('WS2');
		}
	}

)

const initTimeline = () => {
	let timelineBackgroundColor;
	switch (mainStore.darkMode) {
		case 'c-dark-theme':
			timelineBackgroundColor = '#343434';
			break;
		// case 'white':
		// 	timelineBackgroundColor = '#E4E4E4';
		// 	break;
		case 'darkblue':
			timelineBackgroundColor = '#1C2850';
			break;
		default:
			timelineBackgroundColor = '#343434';
	}
	timeline.value = new Timeline('#timeline', { timelineBackgroundColor, singleEvent: true });
	timeline.value.updateBackgroundColor(timelineBackgroundColor);
	timelineChangeHandler.value = (event: any) => {
		if (!isPlayingArr.value.length) return;
		const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid == selectCellId.value);
		if (currentSDK) {
			currentSDK.v1.moveto(formatToISO8(event.detail))
			getEventBar(currentSDK.conf.token, currentSDK.conf.name, xzvalue.value);
		}
	}
	timelineCurrentTimeHandler.value = (event: any) => {
		console.log('Timeline current time ：', event.detail);
	}
	timelineUpdateEventBarHandler.value = (event: any) => {
		console.log('Timeline Update Event Bar ：', event.detail);
	}

	timeline.value.addEventListener('resume', timelineChangeHandler.value);
	timeline.value.addEventListener('timelineCurrentTime', timelineCurrentTimeHandler.value);
	timeline.value.addEventListener('updateEventBar', timelineUpdateEventBarHandler.value);
}

const initGridLayout = () => {
	GridManager.value = new GridLayoutManager('#video_hed', {
		cacheKey: 'grid-view-layout',
		padding: 20,
		aspectRatio: [16, 9],
		animationDuration: 500,
		createIcons: {
			playModeIcon: true,
			playModeText: 'WS2',
			informationIcon: true,
			shouwhearIcon: true,
			snapshotIcon: true,
			recEnableIcon: true,
			ptzcontrolIcon: true
		}
	});
	GridManager.value.addEventListener('closeCell', (event: any) => {
		closePlayContainer(event.detail);
	})
	GridManager.value.addEventListener('cellClick', (event: any) => {
		selectSDK(event.detail);
	})
	GridManager.value.addEventListener('recEnableClick', (event: any) => {
		DoManualRecordStart(event.detail.id, event.detail.recEnable);
	})
	GridManager.value.addEventListener('Snapshot', (event: any) => {
		DoSnapshotWeb(event.detail.id);
	})
	GridManager.value.addEventListener('Information', (event: any) => {
		Information(event.detail.id);
	})
	GridManager.value.addEventListener('Shoutwheat', (event: any) => {
		Shoutwheat(event.detail.id, event.detail.audio);
	})
	GridManager.value.addEventListener('PtzControlShow', (event: any) => {
		PtzControlShow(event.detail.id);
	})
	GridManager.value.addEventListener('layoutLoadedFromCache', (event: any) => {
		LoadLayoutReady(event.detail);
	})

	GridManager.value.initialize()
}

const PlaybackCB = (event: any, userdata: any) => {
	if (selectCellId.value == userdata.videoid) {
		const strTime = JSON.parse(event).strTime;
		if (strTime !== "none") {
			timeline.value.setCurrentTime(strTime);
			xzvalue.value = new Date(strTime);
		}
	}
};

const formatToISO8 = (dateInput: any) => {
	let dateObj = new Date(dateInput);
	const year = dateObj.getFullYear();
	const month = String(dateObj.getMonth() + 1).padStart(2, '0');
	const day = String(dateObj.getDate()).padStart(2, '0');
	const hour = String(dateObj.getHours()).padStart(2, '0');
	const minute = String(dateObj.getMinutes()).padStart(2, '0');
	const second = String(dateObj.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`;
};

const Alloffvideo = () => {
	if (playingViewId.value) {
		deviceTreeRef.value?.updatePlayingStatus('del', `view_${playingViewId.value}`);
		isPlayingArr.value.forEach((item: any) => {
			deviceTreeRef.value?.updatePlayingStatus('del', item.conf.token);
		})
		playingViewId.value = '';
	}
	if (isPlayingArr.value.length === 0) return;
	isPlayingArr.value.forEach((item: any) => {
		item.v1?.disconnect();
		delete item.v1;
	})
	if (audioback.value) {
		audioback.value.disconnect();
		delete audioback.value;
		audioback.value = null
	}
	isPlayingArr.value = [];
	selectCellId.value = '';
	if (!isLive.value) {
		timeline.value.options.name = '';
		timeline.value?._initEventBarName();
		timeline.value?.updateMotionEvents([], null);
	}

	deviceTreeRef.value?.updatePlayingStatus('clear', '');

	GridManager.value?.reloadStageConfiguration(async (cell: any) => { });
};

const srcView = (viewid: any) => {
	const { access_token, root } = getDeviceInfo()
	Alloffvideo();
	View(root, access_token, viewid).then(async (result: any) => {
		if (result.data.code === 0) {
			const res = result.data.result;
			const layoutData = transformViewToGrid(res.layout, res.viewEntity);
			localStorage.setItem('grid-view-layout', JSON.stringify(layoutData));
			GridManager.value.initialize();
			await nextTick();
			deviceTreeRef.value?.updatePlayingStatus('add', `view_${viewid}`);
		}
	})
}

const transformViewToGrid = (layoutData: any, viewEntities: any) => {
	const { session } = getDeviceInfo()
	const layout = layoutData.setting.layoutView;

	const positionMap: any = {};
	viewEntities.forEach((entity: any) => {
		const pos = entity.layoutPosition;
		if (pos) {
			positionMap[pos] = {
				token: entity.Channel.token,
				name: entity.Channel.name,
				resourceUUID: entity.resourceUUID,
				recording: entity.Channel.recording,
			}
		}
	});

	const maxRow = Math.max(...layout.map((cell: any) => cell.rowEnd)) - 1;
	const maxCol = Math.max(...layout.map((cell: any) => cell.colEnd)) - 1;
	const result = Array.from({ length: maxRow }, () =>
		Array.from({ length: maxCol }, () => ({}))
	)

	const processedCells = new Set();
	const sortedLayout = [...layout].sort((a, b) => {
		if (a.merged && !b.merged) return -1;
		if (!a.merged && b.merged) return 1;
		return 0;
	});

	sortedLayout.forEach((cell: any) => {
		const row = cell.rowStart - 1;
		const col = cell.colStart - 1;
		const cellKey = `${row}-${col}`;

		if (processedCells.has(cellKey)) return;

		const posKey = `h${cell.rowStart}-${cell.colStart}`;

		const hasCamera = positionMap[posKey];

		if (cell.merged) {
			const rowSpan = cell.rowEnd - cell.rowStart;
			const colSpan = cell.colEnd - cell.colStart;

			if (hasCamera) {
				const videoId = uuid(8);
				result[row][col] = {
					row: row,
					column: col,
					rowSpan: rowSpan,
					forceLbm: false,
					claimed: true,
					spannedUpoon: false,
					camera: {
						videoid: videoId,
						token: hasCamera.token,
						session: session,
						name: hasCamera.name,
						label: hasCamera.name,
						resourceUUID: hasCamera.resourceUUID,
						recording: hasCamera.recording,
					},
					id: `G${videoId}`
				};

				processedCells.add(cellKey);

				for (let r = row; r < row + rowSpan; r++) {
					for (let c = col; c < col + colSpan; c++) {
						const subCellKey = `${r}-${c}`;
						if (r === row && c === col) continue;
						if (r < maxRow && c < maxCol) {
							result[r][c] = {
								row: r,
								column: c,
								rowSpan: 1,
								columnSpan: 1,
								forceLbm: false,
								claimed: false,
								spannedUpon: true,
								camera: null,
								id: null
							};
							processedCells.add(subCellKey);
						}
					}
				}
			}
			else {
				result[row][col] = {};
				processedCells.add(cellKey);

				for (let r = row; r < row + rowSpan; r++) {
					for (let c = col; c < col + colSpan; c++) {
						const subCellKey = `${r}-${c}`;
						if (r !== row || c !== col) {
							processedCells.add(subCellKey);
						}
					}
				}
			}
		}
		else {
			if (!processedCells.has(cellKey)) {
				if (hasCamera) {
					const videoId = uuid(8);
					result[row][col] = {
						row: row,
						column: col,
						rowSpan: 1,
						columnSpan: 1,
						forceLbm: false,
						claimed: true,
						spannedUpon: false,
						camera: {
							videoid: videoId,
							token: hasCamera.token,
							session: session,
							name: hasCamera.name,
							label: hasCamera.name,
							resourceUUID: hasCamera.resourceUUID,
							recording: hasCamera.recording
						},
						id: `G${videoId}`
					};
				} else {
					result[row][col] = {};
				}
				processedCells.add(cellKey);
			}
		}
	})
	return result;
}

const handleDeviceDragStart = (ev: DragEvent, dragData: any) => {
	isDrag.value = true;
	drag.value = dragData;
	GridManager.value?.showLines();
	GridManager.value?.highlightCells([]);
};

const dragStart = (ev: any, token: string, label: string, streamprofile: string, name: string, disabled_me: boolean, data: any) => {
	const { access_token, root, session } = getDeviceInfo()
	isDrag.value = true;
	const baseUrl = new URL(root);
	const AccessToken = sessionStorage.getItem("Access_token") ? sessionStorage.getItem("Access_token") : "";
	drag.value = {};
	if (data.disabled_me == false) {
		if (data.DifferentType == 'map') return;
		else if (data.DifferentType == 'view') {
			drag.value = {
				viewid: data.token,
				token: data.token
			}
		} else {
			let Adswitch = ''
			if (playbackStorageMode.value == 'CentralStorage') {
				Adswitch = 'true';
			} else if (playbackStorageMode.value == 'DeviceStorage') {
				Adswitch = 'false';
			}
			if (isLive.value) {
				drag.value = {
					videoid: uuid(8),
					name: label,
					protocol: baseUrl.protocol,
					host: baseUrl.host,
					token: token,
					rootpath: '/',
					session: session,
					streamprofile: streamprofile,
					hlsver: 'v1',
					consolelog: 'true',
					resourceUUID: data.uuid
				}
			} else {
				let uuid1 = uuid(8);
				const date = xzvalue.value ? new Date(xzvalue.value) : new Date();
				date.setHours(0, 0, 0, 0);
				const startTimestamp = date.getTime();
				date.setHours(23, 59, 59, 999);
				const endTimestamp = date.getTime();
				const pbconf = {
					begintime: formatToISO8(startTimestamp),
					endtime: formatToISO8(endTimestamp),
					autoplay: 'true',
					showposter: 'false',
					callback: PlaybackCB,
					serverpb: Adswitch,
					userdata: {
						videoid: uuid1,
					}
				}
				drag.value = {
					videoid: uuid1,
					name: label,
					protocol: baseUrl.protocol,
					host: baseUrl.host,
					rootpath: '/',
					token: token,
					serverpb: Adswitch,
					pbconf,
					hlsver: 'v1',
					consolelog: 'false',
					session: session,
					resourceUUID: data.uuid,
				}
			}
		}
	}
	GridManager.value.showLines();
	GridManager.value.highlightCells([]);
}

const dropTarget = async (ev: any) => {
	const { access_token, root } = getDeviceInfo()
	if (!isDrag.value && !drag.value.videoid || !isDrag.value && !drag.value.viewid) {
		GridManager.value?.hideLines();
		GridManager.value?.highlightCells([]);
		return
	}
	if (drag.value.videoid) {
		let recEnable;
		try {
			const result = await ManualRecEnable(root, access_token, drag.value.token);
			if (result.data.code === 0) {
				recEnable = result.data.result.manualRecEnable;
			}
		} catch (error) {
			recEnable = false;
		}

		let eventX = ev.pageX;
		let eventY = ev.pageY;

		let conf = {
			pageX: eventX,
			pageY: eventY,
			id: 'G' + drag.value.videoid,
			recording: drag.value.recording,
			recEnable,
			audio: false,
			camera: {
				videoid: drag.value.videoid,
				token: drag.value.token,
				session: drag.value.session,
				name: drag.value.name,
				streamprofile: drag.value.streamprofile,
				resourceUUID: drag.value.resourceUUID,
			}
		}
		GridManager.value?.claimCellByCoordinates(conf);

		const videoContainer = document.getElementById(conf.id);
		const video = document.createElement('video');
		video.style.position = 'absolute';
		video.style.width = '100%';
		video.style.height = '100%';
		video.style.top = '0';
		video.style.left = '0';
		video.style.display = 'block';
		video.id = drag.value.videoid;
		video.controls = false;
		video.muted = true;
		video.autoplay = true;
		videoContainer?.appendChild(video);

		const obj: any = {
			v1: null,
			conf: {
				...drag.value,
			},
			data: {
				isPlaying: true,
				region: '1.0'
			}
		}
		obj.v1 = new H5sPlayerWS2(drag.value);
		obj.v1?.connect();
		isPlayingArr.value.push(obj);
		changeMainSDKHandler({ detail: conf.id })

		deviceTreeRef.value?.updatePlayingStatus('add', drag.value.token);

	} else if (drag.value.viewid) {
		srcView(drag.value.viewid);
		playingViewId.value = drag.value.viewid;
	}

	isDrag.value = false;
	GridManager.value?.hideLines();
	GridManager.value?.highlightCells([]);
};

const changeMainSDKHandler = (event: any) => {
	const id = event.detail;
	const vid = id.slice(1);
	selectCellId.value = vid;

	document.querySelectorAll('.grid_cell.red_border')
		.forEach(el => el.classList.remove('red_border'));

	const target = document.getElementById(id);
	if (target) target.classList.add('red_border');

	if (!isLive.value) {
		const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid === vid);
		if (currentSDK) {
			isPlaying.value = currentSDK.data.isPlaying;
			region.value = currentSDK.data.region;
			getEventBar(currentSDK.conf.token, currentSDK.conf.name, currentSDK.conf.pbconf?.begintime);
		}
	}
}

const dragOver = (ev: any) => {
	if (!isDrag.value && !drag.value.videoid || !isDrag.value && !drag.value.viewid) return;
	let eventX = ev.pageX;
	let eventY = ev.pageY;
	let cellsToHighlight = [];
	GridManager.value.showLines();
	let gridPostition = GridManager.value.findGridPositionByCoordinates(eventX, eventY);
	if (gridPostition !== false) {
		let gridDimensions = GridManager.value.getDimensionsForGridPosition(gridPostition[0], gridPostition[1]);
		cellsToHighlight.push(gridDimensions);
	}
	GridManager.value.highlightCells(cellsToHighlight, "rgba(141,189,255,0.3)");
};

const closeInformation = (id: any) => {
	informationshow.value = false;
	if (timerRunInfo.value) {
		clearInterval(timerRunInfo.value);
		timerRunInfo.value = null;
	}
};

const changeStorage = (mode: string) => {
	if (mode === playbackStorageMode.value) return;
	playbackStorageMode.value = mode;
	resetPlay();
};

const resetPlay = () => {
	let Adswitch = '';
	if (playbackStorageMode.value === 'CentralStorage') {
		Adswitch = 'true';
	} else if (playbackStorageMode.value === 'DeviceStorage') {
		Adswitch = 'false';
	}
	const date = new Date();
	date.setHours(0, 0, 0, 0);
	const startTimestamp = date.getTime();
	date.setHours(23, 59, 59, 999);
	const endTimestamp = date.getTime();
	isPlayingArr.value.forEach((item: any) => {
		item.v1.disconnect();
		delete item.v1;
		item.v1 = null;
		const conf = item.conf;
		if (isLive.value) {
			item.conf = {
				videoid: conf.videoid,
				name: conf.name,
				protocol: conf.protocol,
				host: conf.host,
				rootpath: '/',
				token: conf.token,
				streamprofile: conf.streamprofile,
				hlsver: 'v1',
				consolelog: 'false',
				session: conf.session,
				resourceUUID: conf.resourceUUID
			}
		} else {
			item.conf = {
				videoid: conf.videoid,
				name: conf.name,
				protocol: conf.protocol,
				host: conf.host,
				rootpath: '/',
				token: conf.token,
				serverpb: Adswitch,
				streamprofile: conf.streamprofile,
				pbconf: {
					begintime: formatToISO8(startTimestamp),
					endtime: formatToISO8(endTimestamp),
					autoplay: 'true',
					showposter: 'false',
					callback: PlaybackCB,
					serverpb: Adswitch,
					userdata: {
						videoid: conf.videoid,
					}
				},
				hlsver: 'v1',
				consolelog: 'false',
				session: conf.session,
				resourceUUID: conf.resourceUUID
			}
			item.data = {
				isPlaying: true,
				region: '1.0'
			}
		}
		item.v1 = new H5sPlayerWS2(item.conf);
		item.v1.connect();
	})
	if (selectCellId.value) {
		const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid == selectCellId.value);
		if (currentSDK) {
			getEventBar(currentSDK.conf.token, currentSDK.conf.name);
		}
	}
};

const getEventBar = (token: string, name: string, strTime?: any) => {
	const { access_token, root } = getDeviceInfo()
	const date = strTime ? new Date(strTime) : new Date();
	date.setHours(23, 59, 59, 0);
	const endTime = date.getTime();
	date.setHours(0, 0, 0, 0);
	date.setDate(date.getDate() - 1);
	const startTime = date.getTime();
	const end = encodeURIComponent(formatToISO8(endTime));
	const start = encodeURIComponent(formatToISO8(startTime));
	if (playbackStorageMode.value === 'CentralStorage') {
		SearchCentralStorage(root, access_token, token, start, end)
	} else {

	}

};

const input_ch = () => {
	if (!isPlayingArr.value.length) return;
	const currentSDK = isPlayingArr.value.find((item: any) => item.config.videoid === selectCellId.value);
	if (currentSDK) {
		currentSDK.v1.moveto(formatToISO8(xzvalue.value));
		currentSDK.conf.pbconf.begintime = formatToISO8(xzvalue.value);
		getEventBar(currentSDK.conf.token, currentSDK.conf.name, xzvalue.value)
	}
};

const isShow = async (e: any) => {
	await nextTick();
	monthChangeHandler.value = () => {
		monthChange();
	}
	document.querySelector('.el-month-table')?.addEventListener('click', monthChangeHandler.value)
	document.querySelectorAll("[aria-label='下个月'],[aria-label='上个月'],[aria-label='后一年'],[aria-label='前一年']")
		.forEach((item: any) => item.addEventListener('click', monthChangeHandler.value))
	customDateArr.value = [];
	const year = xzvalue.value.getFullYear();
	const month = xzvalue.value.getMonth() + 1;
	if (!selectCellId.value) return;
	const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid === selectCellId.value);
	if (currentSDK && currentSDK.conf.token) {
		SearchRecordCalendar(currentSDK.conf.token, year, month);
	}
};

const monthChange = () => {
	let year;
	let month;
	year = document.querySelectorAll('.el-date-picker__header-label')[0].innerHTML.slice(0, 4);
	year = Number(year);
	month = document.querySelectorAll('.el-date-picker__header-label')[1].innerHTML.slice(0, -1);
	month = Number(month);
	xzvalue.value = new Date(xzvalue.value);
	xzvalue.value.setFullYear(year);
	xzvalue.value.setMonth(month - 1);
	const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid === selectCellId.value);
	if (currentSDK && currentSDK.conf.token) {
		SearchRecordCalendar(currentSDK.conf.token, year, month);
	}
};

const SearchRecordCalendar = (token: string, year: any, month: any) => {
	const { access_token, root } = getDeviceInfo()
	customDateArr.value = [];
	document.querySelectorAll('.available').forEach(el => {
		el.classList.remove('custom_date_class');
	});
	SearchRecordedCalendar(root, access_token, token, year, month).then((res: any) => {
		if (res.data.record) {
			res.data.record.forEach((key: any) => {
				if (key.bHasRec || key.bHasAlarmRec) {
					let months = month < 10 ? '0' + month : month;
					let day = key.nDay < 10 ? '0' + key.nDay : key.nDay;
					let data = year + '-' + months + '-' + day + "T00:00:00+08:00";
					customDateArr.value.push(new Date(data).getTime());
				}
			});
		}
	})
};

const isClose = () => {
	if (!monthChangeHandler.value) return;
	document.querySelector('.el-month-table')?.removeEventListener('click', monthChangeHandler.value)
	document.querySelectorAll("[aria-label='下个月'],[aria-label='上个月'],[aria-label='后一年'],[aria-label='前一年']")
		.forEach((item: any) => item.removeEventListener('click', monthChangeHandler.value))
};

const pickerOptions = () => {
	return {
		cellClassName(Date: any) {
			if (customDateArr.value.indexOf(Date.getTime()) != -1) {
				return "custom_date_class";
			}
		}
	}
};

const resume = () => {
	if (!isPlayingArr.value.length) return;
	const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid === selectCellId.value);
	if (isPlaying.value) {
		currentSDK.v1.pause();
		currentSDK.data.isPlaying = false;
		isPlaying.value = false;
	} else {
		currentSDK.v1.resume();
		currentSDK.data.isPlaying = true;
		isPlaying.value = true;
	}
};

const timeInput = (e: any) => {
	if (e) {
		const isFullscreen = !!(
			document.fullscreenElement ||
			(document as any).webkitFullscreenElement ||
			(document as any).mozFullScreenElement ||
			(document as any).msFullscreenElement
		);

		const dropdown = document.querySelector('.ele .selectdrop') as HTMLElement;
		if (!dropdown) return;

		if (!isFullscreen) {
			dropdown.style.left = '-19px';
		} else {
			dropdown.style.left = '0px !important';
		}
	}
};

const timeSpeed = (speed: any) => {
	if (!isPlayingArr.value.length) {
		region.value = '1.0';
		return;
	}
	const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid === selectCellId.value);
	if (currentSDK) {
		currentSDK.v1.speed(speed);
		currentSDK.data.region = speed;
	}
};

const toggleLeftPanel = () => {
	isPutAway.value = !isPutAway.value;
};

const closePtz = () => {
	ptzShow.value = false;
	ptzToken.value = '';
};

const PtzAction = (action: string, speed?: number) => {
	const { access_token, root } = getDeviceInfo()
	let speedValue = speed || ptzvalue;
	if (!ptzToken.value) return;
	Ptz(root, access_token, ptzToken.value, action, speedValue).then((res: any) => { });
};

const presetJump = (token: string) => {
	const { access_token, root } = getDeviceInfo()
	PresetJump(root, access_token, ptzToken.value, token, ptzvalue.value).then((res: any) => { });
};

const presetSet = (token: string, event: any) => {
	const { access_token, root } = getDeviceInfo()
	var val = event.currentTarget.previousElementSibling.previousElementSibling.value;
	PresetSet(root, access_token, ptzToken.value, val, token).then((res: any) => { });
};

const previous = () => {
	if (currentIndex.value > 0) {
		currentIndex.value--;
	} else {
		currentIndex.value = tureData.value.length - 1;
	}
};

const next = () => {
	if (currentIndex.value < tureData.value.length - 1) {
		currentIndex.value++;
	} else {
		currentIndex.value = 0;
	}
};

const Playview = (data: any) => {
	if (!data || !playStore.isLive) return;
	tureData.value = data;
	if (PatrolPlay.value) {
		stopPatrol('pause');
	} else {
		stopTurePlay.value = true;
		PatrolPlay.value = true;
		if (currentIndex.value >= tureData.value.length) {
			currentIndex.value = 0;
		}
		executePatrol();
	}
};

const executePatrol = () => {
	playStore.WaitPatrolClose = true;
	if (playStore.WaitPatrolClose) return;
	if (currentIndex.value < tureData.value.length) {
		const item = tureData.value[currentIndex.value];
		srcView(item.viewId);
		const patrolKey = Date.now();
		const patrolTimeout = setTimeout(() => {
			currentIndex.value++;
			executePatrol();
		}, item.dwellTime * 1000);
		patrolTimeouts.value.push({ key: patrolKey, timer: patrolTimeout });
	} else {
		if (Repeating.value) {
			currentIndex.value = 0;
			executePatrol();
		} else {
			PatrolPlay.value = false;
		}
	}
};

const stopPatrol = (pause?: any) => {
	if (!pause) {
		playStore.offVideo = "close" + uuid();
	}
	patrolTimeouts.value.forEach((timeout: any) => {
		clearTimeout(timeout.timer);
	})
	patrolTimeouts.value = [];;
	PatrolPlay.value = false;
	stopTurePlay.value = false;
};

const closePopover = () => {
	popoverVisible.value = false;
	stopPatrol();
};

const ChangeActive = (flag: boolean) => {
	isLive.value = flag;
}

const panelFullScreen = (event: any) => {
	var elem = document.getElementById("video_hed");
	if (!elem) return;

	const isFullscreen = !!document.fullscreenElement;

	if (isFullscreen) {
		if (document.exitFullscreen) {
			document.exitFullscreen().catch((err) => { console.error(err); });
		}
	} else {
		if (elem.requestFullscreen) {
			elem.requestFullscreen().catch((err) => { console.error(err); });
		} else {
			return;
		}
	}
};

const closePlayContainer = (id: any) => {
	if (!isPlayingArr.value) return;
	const vid = id.slice(1);
	const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid == vid);
	if (currentSDK && currentSDK.v1 && currentSDK.conf) {
		currentSDK.v1.disconnect();
		delete currentSDK.v1;

		deviceTreeRef.value?.updatePlayingStatus('del', currentSDK.conf.token);

		isPlayingArr.value = isPlayingArr.value.filter((item: any) => item.conf.videoid != vid);
		if (playingViewId.value && isPlayingArr.value.length === 0) {
			deviceTreeRef.value?.updatePlayingStatus('del', `view_${playingViewId.value}`);
			playingViewId.value = '';
		}
		if (currentSDK.conf.videoid === selectCellId.value) {
			timeline.value.options.name = '';
			timeline.value?._initEventBarName();
			timeline.value?.updateMotionEvents([], null)
			if (audioback.value) {
				audioback.value.disconnect();
				delete audioback.value;
				audioback.value = null;
			}
		}
	}
};

const selectSDK = (id: any) => {
	const vid = id.slice(1);
	selectCellId.value = vid;
	if (isLive.value) {
		document.querySelectorAll('.grid_cell.red_border').forEach(el => el.classList.remove('re_border'));
		const target = document.getElementById(id);
		if (target) target.classList.add('red_border');
	} else {
		document.querySelectorAll('.grid_cell.red_border').forEach(el => el.classList.remove('red_border'));
		const target = document.getElementById(id);
		if (target) target.classList.add('red_border');
		const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid === vid);
		if (currentSDK) {
			isPlaying.value = currentSDK.data.isPlaying;
			region.value = currentSDK.data.region;
			getEventBar(currentSDK.conf.token, currentSDK.conf.name, currentSDK.conf.pbconf.begintime);
		}
	}
};

const Information = (id: any) => {
	const vid = id.slice(1);
	const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid === vid);
	if (informationshow.value) {
		informationshow.value = false;
		clearInterval(timerRunInfo.value);
		timerRunInfo.value = null;
	} else {
		informationshow.value = true;
		Informationdate(vid, currentSDK.conf.token);
		timerRunInfo.value = setInterval(() => {
			Informationdate(vid, currentSDK.conf.token);
		}, 8000);
	}
};

const Informationdate = (id: any, token: string) => {
	const { access_token, root } = getDeviceInfo()
	GetStreamInfo(root, access_token, token).then((res: any) => {
		if (res) {
			informationAudio.value = [
				{
					name: 'Codec',
					data: res.data.strAudioType
				},
				{
					name: 'Sample Rate',
					data: res.data.nAudioSampleRate
				},
				{
					name: 'Sample Bit',
					data: res.data.nAudioSampleBit
				},
				{
					name: 'Channel',
					data: res.data.nAudioChannels
				},
				{
					name: 'Bitrate',
					data: (res.data.nAudioBitrate / 1024).toFixed(1) + 'kbps'
				},
			];
			informationVideo.value = [
				{
					name: 'Codec',
					data: res.data.strVideoType
				},
				{
					name: 'Width',
					data: res.data.nVideoWidth
				},
				{
					name: 'Height',
					data: res.data.nVideoHeight
				},
				{
					name: 'FPS',
					data: res.data.nVideoFPS
				},
				{
					name: 'Bitrate',
					data: (res.data.nVideoBitrate / 1024).toFixed(1) + 'kbps'
				},
			]
		}
	})
}

const Shoutwheat = (id: any, audio: any) => {
	const { root, session } = getDeviceInfo()
	const vid = id.slice(1);
	const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid === vid);
	if (!currentSDK) return;
	const url = new URL(root);
	const host = url.host;
	const protocol = url.protocol;
	const conf = {
		protocol: protocol,
		host: host,
		rootpath: '/',
		token: currentSDK.conf.token,
		session: session,
	}
	if (audio) {
		audioback.value.disconnect();
		audioback.value = null;
	} else {
		if (audioback.value) {
			audioback.value.disconnect();
			audioback.value = null;
		}
		audioback.value = new H5sPlayerAudBack(conf);
		audioback.value.connect();
	}
	GridManager.value.changeAudio(id, !audio);
}

const DoSnapshotWeb = (id: any) => {
	const vid = id.slice(1);
	const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid === vid);
	if (!currentSDK) return;

	const date = new Date();
	const fileName = `${currentSDK.conf.token}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes}-${date.getSeconds()}`;
	const video = document.getElementById(vid) as HTMLVideoElement;
	if (video) video.crossOrigin = 'anonymous';

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;
	ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
	var imgURL = canvas.toDataURL("image/png");
	var dlLink = document.createElement('a');

	dlLink.download = fileName;
	dlLink.href = imgURL;
	document.body.appendChild(dlLink);
	dlLink.click();
	document.body.removeChild(dlLink);
};

const DoManualRecordStart = (id: any, recEnable: any) => {
	const { access_token, root } = getDeviceInfo()
	const vid = id.slice(1);
	let manualRecEnable;
	if (recEnable) {
		manualRecEnable = false;
	} else {
		manualRecEnable = true;
	}
	const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid === vid);
	if (!currentSDK) return;
	const data = {
		devUUID: currentSDK.conf.resourceUUID,
		setting: { manualRecEnable }
	}
	ManualRecStart(root, access_token).then((res: any) => {
		if (res && res.data.msg === 'Success') {
			if (manualRecEnable) {
				ElMessage({
					message: 'Start recording',
					type: 'success',
					duration: 500,
					customClass: "success-message",
				});
			} else {
				ElMessage({
					message: 'Stop recording',
					type: 'success',
					duration: 5000,
					customClass: "success-message",
				})
			}
			GridManager.value.changeRecEnable(id, manualRecEnable);
		}
	})
};

const PtzControlShow = (id: any) => {
	const { access_token, root, session } = getDeviceInfo()
	const vid = id.slice(1);
	const currentSDK = isPlayingArr.value.find((item: any) => item.conf.videoid === vid);
	if (!currentSDK) return;
	ptzShow.value = true;
	ptzToken.value = currentSDK.conf.token;
	Presetdata.value = [];
	PtzControl(root, access_token, ptzToken.value).then((res: any) => {
		if (res) {
			for (let i = 0; i < res.data.preset.length; i++) {
				const newItem = {
					strName: res.data.preset[i].strName,
					strToken: res.data.preset[i].strToken,
				}
				if (i >= 8) {
					break;
				}
				Presetdata.value.push(newItem);
			}
		}
	})
};

const LoadLayoutReady = async (detail: any) => {
	const { root, session } = getDeviceInfo()
	isLive.value = true;
	const baseUrl = new URL(root);
	await nextTick();
	detail.forEach((item: any) => {
		item.forEach((row: any) => {
			if (row && row.camera) {
				const protocol = baseUrl.protocol;
				const host = baseUrl.host;
				const obj: any = {
					conf: {
						videoid: row.camera.videoid,
						name: row.camera.name,
						protocol: protocol,
						host: host,
						token: row.camera.token,
						rootpath: '/',
						session: session,
						streamprofile: row.camera.streamprofile,
						hlsver: 'v1',
						consolelog: 'true',
						resourceUUID: row.camera.resourceUUID
					},
					v1: null,
					data: {
						isPlaying: true,
						region: '1.0'
					}
				}
				const videoContainer = document.getElementById('G' + obj.conf.videoid);
				const video = document.createElement('video');
				video.style.position = 'absolute';
				video.style.width = '100%';
				video.style.height = '100%';
				video.style.top = '0';
				video.style.left = '0';
				video.style.display = 'block';
				video.id = obj.conf.videoid;
				video.controls = false;
				video.muted = true;
				video.autoplay = true;
				videoContainer?.appendChild(video);
				obj.v1 = new H5sPlayerWS2(obj.conf);
				if (obj.v1) {
					obj.v1.connect();
				}
				isPlayingArr.value.push(obj);
				changeMainSDKHandler({ detail: 'G' + obj.conf.videoid });
				deviceTreeRef.value?.updatePlayingStatus('add', row.camera.token);
			}
		})
	})
};

</script>

<style lang="scss" scoped>
.grid_view {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;

	.grid_view_content {
		display: flex;
		flex: 1;
		height: calc(100vh - 60px);
		justify-content: space-between;
		position: relative;
		overflow: hidden;

		.content_left {
			flex: 0 0 280px;
			height: 100%;
			overflow: auto;

			.left_top {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 0 17px;
				height: 40px;
				line-height: 40px;

				.icon-liebiao {
					cursor: pointer;
					font-size: 18px;
				}
			}

			.left_search {
				padding: 14px;

				.left_input {
					width: 100%;
				}
			}

			:deep(.el-collapse) {
				.el-collapse-item {
					.el-collapse-item__wrap {
						.el-collapse-item__content {
							overflow: auto;
						}
					}
				}
			}
		}

		.content_right {
			width: calc(100% - 280px);
			height: 100%;
			margin-right: 2px;
			position: relative;
			display: flex;
			flex-direction: column;

			.liveview_right_video_hed {
				position: relative;
				width: 100%;
				flex: 1;
				overflow: hidden;
				background-image: url('./img/GridLogo_white.png');
				background-size: 380px 350px;
				background-repeat: no-repeat;
				background-position: center center;

				.malv {
					position: absolute;
					top: 20px;
					right: 16px;
					z-index: 100;
					width: 336px;
					height: 150px;
					display: flex;
					transition: 0.2s;
					font-size: 14px;

					.malv-close {
						position: absolute;
						top: 3px;
						right: 8px;
						font-size: 16px;
						cursor: pointer;
					}

					.malv-left,
					.malv-right {
						width: 100%;
						height: 100%;
						background-color: rgba(51, 51, 51, 0.5);

						.information_title {
							width: 100%;
							height: 30px;
							line-height: 30px;
							background-color: rgba(0, 0, 0, 0.7);
							padding: 0 10px;
						}

						.information_content {
							width: 100%;
							display: flex;
							justify-content: space-between;
							// padding: 0 2px;

							.information_content_left {
								width: 50%;
								color: #3ABBFE;
								text-align: left;
							}

							.information_content_right {
								width: 50%;
								color: #3ABBFE;
								text-align: left;
							}
						}
					}
				}

				.malv-hide {
					right: -336px;
				}

				:deep(.line-matrix) {
					position: absolute;
					z-index: 40;
					top: 0;
					left: 0;

					line {
						shape-rendering: crispEdges;
						stroke: #585858;
					}
				}

				:deep(.cell-matrix) {
					z-index: 42;
					position: absolute;
					top: 0;
					left: 0;

					.red_border {
						border: #f44336 2px solid;
					}

					.blue_dashed {
						border: #0399FE 2px dashed;
					}

					.playback_check_border {
						border: #CDFF00 2px solid;
					}

					div {
						overflow: hidden;
						position: absolute;
					}

					.grid_cell:hover {
						.cell-i {
							bottom: 3px;
						}

						.float-layer {
							top: 0;
						}
					}

					.active {
						transform: scale(1.2);
						z-index: 100;
					}

					.float-layer {
						position: absolute;
						right: 0;
						top: -30px;
						z-index: 10;
						height: 30px;
						line-height: 30px;
						background: url('./img/liveview_buttback.png') no-repeat;
						background-size: 290px 30px;
						text-align: right;
						padding: 0 10px;
						transition: 0.2s;

						i,
						span {
							margin-left: 10px;
							cursor: pointer;
							color: #fff;
						}
					}

					.cell-i {
						font-style: normal;
						position: absolute;
						bottom: -30px;
						right: 5px;
						color: aliceblue;
						font-size: 20px;
						z-index: 10;
						cursor: nwse-resize;
						transition: 0.2s;
					}

					.cell-close {
						font-style: normal;
						position: absolute;
						top: 3px;
						right: 5px;
						color: aliceblue;
						font-size: 20px;
						z-index: 10;
						cursor: pointer;
						display: none;
					}
				}

				:deep(.cell-highlighter) {
					z-index: 44;
					position: absolute;
					top: 0;
					left: 0;
					display: none;
				}
			}

			:deep(.control_area) {
				width: 100%;
				height: 120px;
				display: flex;
				flex-direction: column;

				.timeline-box {
					width: 100%;
					height: 80px;
					padding: 0;
					box-sizing: border-box;
					border: none;
				}

				.control_btns {
					width: 100%;
					flex: 1;
					display: flex;
					justify-content: space-between;
					align-items: center;

					.storage_box {
						width: 17%;
					}

					.storage_mode {
						width: 190px;
						display: flex;
						height: 24px;
						margin-left: 10px;
						border-radius: 12px;

						.CentralStorage,
						.DeviceStorage {
							flex: 1;
							height: 100%;
							line-height: 24px;
							text-align: center;
							border-radius: 12px;
							font-size: 12px;
							cursor: pointer;
						}

						.active {
							background-color: #0399FE;
						}
					}

					.control-center {
						display: flex;
						align-items: center;
						justify-content: center;
						gap: 5px;

						.fixed_input {
							.el-input__wrapper {
								background: transparent;
							}

							.el-input__suffix {
								display: none;
							}
						}

						.resume-btn {
							background: transparent;
							border: none;

							i {
								font-size: 22px;
							}
						}

						.ele {
							margin-right: 5px;

							.el-select__placeholder {
								text-align: center;
								color: #ffffff;
							}

							.el-select__suffix {
								display: none;
							}

							.el-input__inner {
								border-radius: 2px;
							}

							.el-popper__arrow {
								display: none;
							}
						}

						.Audio_slider-bottom {
							display: flex;
							flex-direction: row;
							justify-content: flex-start;
							align-items: center;
							width: 210px;

							i {
								font-size: 20px;
							}

							.el-slider__runway {
								height: 3px;
								background-color: rgba(73, 74, 76, 0.5) !important;

								.el-slider__bar {
									height: 3px;
								}

								.el-slider__button-wrapper {
									height: 34px;
									width: 36px;

									.el-slider__button {
										width: 4px;
										border: 1px solid #409EFF;
										height: 12px;
										background-color: #409eff;
										border-radius: 0px;
									}
								}
							}
						}
					}


					.caveat_butt {
						display: flex;
						align-items: center;
						justify-content: flex-end;
						width: 17%;

						.showRecordType {
							width: 24px;
							height: 30px;
							text-align: center;
							line-height: 30px;
							border-radius: 4px;
							cursor: pointer;
						}

						.mr-0 {
							width: 15px;
							height: 15px;
							border-radius: 50px;
							border: 0;
							margin-right: 5px !important;
							vertical-align: middle;
							background-color: #31b1ff;
						}

						.mr-1 {
							width: 15px;
							height: 15px;
							border-radius: 50px;
							border: 0;
							margin: 0 5px;
							vertical-align: middle;
							background-color: rgb(60, 196, 60);
						}

						.mr-2 {
							width: 15px;
							height: 15px;
							border-radius: 50px;
							border: 0;
							margin: 0 5px;
							vertical-align: middle;
							background-color: #ee1011;
						}
					}
				}

				#timeline {
					.center-pointer line {
						stroke: #FEEF03;
						stroke-width: 2;
					}

					.label text {
						font-size: 14px;
						color: #ffffff;
					}

					.label rect {
						fill: #0399FE
					}

					.bar-name text {
						font-size: 10px;
					}

					.domain {
						display: none;
						visibility: hidden;
					}
				}
			}
		}

		.yuntai {
			position: absolute;
			left: 5px;
			bottom: 0;
			width: 270px;
			height: 550px;
			transition: 0.3s;

			.header {
				width: 100%;
				height: 32px;
				display: flex;
				justify-content: space-between;
				align-items: center;

				i {
					display: block;
					width: 20px;
					height: 20px;
					line-height: 20px;
					text-align: center;
					border-radius: 50%;
					cursor: pointer;
					font-size: 10px;
				}
			}

			:deep(.el-timeline) {
				padding: 10px 5px;

				.el-card {
					background: transparent;
					border: none;
				}

				.el-card__body {
					padding: 0;
				}

				.el-timeline-item {
					padding-bottom: 0;
				}

				.el-timeline-item__wrapper {
					top: -15px;

					.preset_bgc {
						width: 100%;
						display: flex;
						justify-content: space-between;
						align-items: center;
						background-color: transparent;

						.preset_input {
							width: 150px;
							background-color: transparent;
							border: none;
							box-shadow: none;
							padding-left: 10px;
						}

						button {
							background-color: transparent;
							border: none;
						}
					}
				}
			}

			.ptz-slider {
				width: 100%;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;

				.el-slider {
					width: 90%;
					padding: 0 10px;
				}
			}

			.controls {
				width: 100%;
				height: 144px;
				display: flex;
				padding-inline: 10px;
				justify-content: space-between;
				margin: 20px 0;

				.left {
					width: 70px;
					height: 100%;
					display: grid;
					grid-template-columns: repeat(2, 32px);
					grid-template-rows: repeat(4, 32px);
					grid-column-gap: 5px;
					grid-row-gap: 5px;

					i {
						display: flex;
						align-items: center;
						justify-content: center;
						border-radius: 4px;
						width: 32px;
						height: 32px;
						font-size: 20px;
						cursor: pointer;
					}

					i:active {
						color: #0399FE;
					}
				}

				.right {
					width: 144px;
					height: 100%;
					display: grid;
					grid-template-columns: repeat(3, 1fr);
					grid-template-rows: repeat(3, 1fr);
					grid-column-gap: 0px;
					grid-row-gap: 0px;

					.ptz-item {
						display: flex;
						justify-content: center;
						align-items: center;
						position: relative;

						i {
							font-size: 22px;
						}
					}

					.shang {
						border-radius: 4px 4px 0 0;
						cursor: pointer;
					}

					.zuo {
						border-radius: 4px 0 0 4px;
						cursor: pointer;
					}

					.you {
						border-radius: 0 4px 4px 0;
						cursor: pointer;
					}

					.xia {
						border-radius: 0 0 4px 4px;
						cursor: pointer;
					}

					.corner {
						background-color: transparent !important;

						.zs,
						.ys,
						.zx,
						.yx {
							position: absolute;
							width: 32px;
							height: 32px;
							border-radius: 4px;
							display: flex;
							align-items: center;
							justify-content: center;
							cursor: pointer;

							i {
								font-size: 20px;
							}
						}

						.zs {
							top: 0;
							left: 0;
						}

						.ys {
							top: 0;
							right: 0;
						}

						.zx {
							left: 0;
							bottom: 0;
						}

						.yx {
							right: 0;
							bottom: 0;
						}
					}

					.ptz-item:active {
						i {
							color: #0399FE;
						}
					}
				}
			}
		}

		.yuntai-hide {
			bottom: -550px;
		}

		.TreeFold {
			position: absolute;
			top: 0;
			left: 0;
			width: 40px;
			height: 40px;
			background: rgba(124, 124, 124, 0.5);
			border-radius: 0px 2px 2px 0px;
			z-index: 1031;
			text-align: center;
			line-height: 40px;
			cursor: pointer;

			i {
				font-size: 18px;
			}
		}
	}

	.grid_view_footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 30px;
		flex-shrink: 0;
		padding: 0 10px;

		.blankPlaceHolder {
			width: 20%;
			display: flex;

			.PatrolBtn {
				width: 100px;
				height: 20px;
				border-radius: 4px;
				line-height: 20px;
				text-align: center;
				cursor: pointer;

				.active {
					background-color: #0399FE;
					color: #ffffff;
				}
			}

			.PatrolBtn:not(.active) {
				color: #0399FE;
			}
		}

		.show-play-replay {
			display: flex;
			align-items: center;

			.changeLiveReplay {
				width: 100px;
				height: 20px;
				border-radius: 4px;
				font-size: 12px;
				text-align: center;
				line-height: 20px;
				cursor: pointer;
			}
		}
	}

	.PatrolPopover {
		padding: 0px;

		.PatrolContainer {
			height: 400px;
			display: flex;
			flex-direction: column;
			justify-content: space-between;

			.PatrolTitle {
				height: 60px;
				padding: 15px;

				.el-select {
					width: 100%;

					.el-input__inner {
						background: transparent;
					}
				}
			}

			.PatrolContent {
				height: 100%;
				padding: 15px;
				overflow: auto;

				&::-webkit-scrollbar {
					width: 8px;
					height: 8px;
				}

				&::-webkit-scrollbar-thumb {
					border-radius: 5px;
					background: rgba(218, 218, 218, 0.2);
				}

				&::-webkit-scrollbar-track {
					border-radius: 0;
					background: rgba(218, 218, 218, 0.1);
				}

				.PatrolContentElementView {
					display: flex;
					justify-content: space-between;
					align-items: center;
					height: 32px;
					border-radius: 2px;
					padding: 0px 10px;

					i {
						margin-right: 5px;
					}
				}
			}

			.PatrolFooter {
				height: 32px;
				padding: 0 10px;
				display: flex;
				justify-content: space-between;
				align-items: center;

				i {
					cursor: pointer;
				}

				.xunhuan {
					color: #67C23A;
				}

				.PatrolPlay {
					color: #0399FE;
				}

				.guanbiPatrol {
					color: #FE5003;
				}
			}
		}
	}
}
</style>