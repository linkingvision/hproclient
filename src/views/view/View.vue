<template>
	<div id="liveplay">
		<div class="liveplay_top">
			<div class="liveplay_left" v-show="isPutAway">
				<div class="liveplay_left_top">
					<span></span>
					<span class="iconfont icon-liebiao" @click="putAway" v-show="isPutAway"></span>
				</div>
				<div class="liveplay_left_search">
					<el-input class="liveview_left_input" :placeholder="$t('Common.comm_filtration')" v-model="filterText">
						<template #suffix>
							<i class="iconfont icon-sousuo" style="cursor: pointer;" @click="handleIconClick"></i>
						</template>
					</el-input>
				</div>
				<el-collapse v-model="activeNames">
					<el-collapse-item name="devPartition">
						<template #title>
							<div
								style="display: flex; justify-content: space-between; width: 90%; align-items: center; padding-left: 10px;">
								<div class="title-text" style="white-space: nowrap;">Partition</div>
								<div class="liveview-colltitle" style="align-items: center;">
									<div @click.stop="loadDeviceTree"><i class="iconfont icon-shuaxin"></i></div>
								</div>
							</div>
						</template>
						<el-tree-v2 ref="treeRef" style="max-width: 100%;" :data="channelData" :props="treeProps"
							:default-expanded-keys="expandedKeys" node-key="id" :height="890" @node-click="handleNodeClick"
							@node-contextmenu="onRightClick">
							<template #default="{ node, data }">
								<div style="width: 100%; display: flex; align-items: center; position: relative;"
									:class="getNodeClass(data)"  @click="selectColor(data,$event)"  :style="siteStyle(data)">
									<el-tooltip :content="getMsg(data)" placement="top-start" :offset="-8" :disabled="data.type !== 'site'">
										<span style="width: 100%; display: flex; align-items: center;">
											<svg v-if="data.data && data.data.recording" class="icon" aria-hidden="true"
												:style="{ marginRight: '0' }" style="width: 19px;height: 17px;margin-right: 10px;">
												<use :href="getRecordingIcon(data)"></use>
											</svg>
											<i v-else :class="`iconfont ${getNodeIcon(data)}`" :style="{
												opacity: getNodeColor(data),
												marginRight: '8px',
												fontSize: data.type === 'device' && data.isLeaf ? '22px' : '20px',
												color: isChannelPlaying(data) ? '#00ff00' : 'inherit'
											}"></i>
											<span :style="{
												opacity: getNodeColor(data),
												color: isChannelPlaying(data) ? '#00ff00' : 'inherit',
												fontSize: '14px',
											}">{{ node.label }}</span>
										</span>
									</el-tooltip>
									<span v-if="isChannelPlaying(data)"
										style="color: #00ff00; font-size: 12px; position: absolute; right: 10px; display: flex; gap: 8px;align-items: center;white-space: nowrap;flex-shrink: 0;">
										<div style="width: 10px;height: 10px; border-radius: 50%; background:#00ff00;"></div>
										Playing...
									</span>
								</div>
							</template>
						</el-tree-v2>
					</el-collapse-item>
				</el-collapse>

				<div v-show="showCalendar" class="calendar-wrapper">
					<div style="width: auto;">
						<el-button-group style="display: flex;width: 100%;justify-content: space-between;" class="date_button">
							<el-button @click="preYearWPL" class="iconfont icon-xiangzuotiao"></el-button>
							<el-button @click="preMonthWPL" class="iconfont icon-shangyibu"></el-button>
							<el-button class="el-calendar-title" @click="today">
								{{ dateValue ? dateValue.getFullYear() : '' }}-{{ dateValue ? dateValue.getMonth() + 1 : '' }}
							</el-button>
							<el-button @click="nextMonthWPL" class="iconfont icon-xiayibu"></el-button>
							<el-button @click="nextYearWPL" class="iconfont icon-xiangyoutiao"></el-button>
						</el-button-group>
						<div class="custom-week-header">
							<span class="week-item">Su</span>
							<span class="week-item">Mo</span>
							<span class="week-item">Tu</span>
							<span class="week-item">We</span>
							<span class="week-item">Th</span>
							<span class="week-item">Fr</span>
							<span class="week-item">Sa</span>
						</div>
						<el-calendar ref="calendar" v-model="dateValue" :key="calendarKey"></el-calendar>
						<!-- :cell-class-name="wplCalendarCellClass" -->
					</div>
				</div>

			</div>
			<div class="liveplay_right">
				<div class="liveplay_right_top">
					<!-- v-if="isDataReady" -->
					<WPLplayer ref="wplPlayerRef" container-id="wplPlayer" :visible="true" :layout-type="currentWPLLayoutType"
						:enable-playback="!isLive" @ready="onWPLReady" @window-click="onWPLWindowClick"
						@fullscreen-exit="onWPLFullscreenExit" @info="onWPLInfo" @ptz="onWPLPtz" @play-ended="onWPLPlayEnded"
						@local-snapshot="onWPLLocalSnapshot" @serve-snapshot="onWPLServeSnapshot" @local-record="onWPLLocalRecord"
						@serve-record="onWPLServeRecord"></WPLplayer>
					<div class="analytics" v-show="analyticsEvent">
						<AnalyticsEvent ref="analyticsPanelRef" :auto-load="true"></AnalyticsEvent>
					</div>
				</div>
				<div class="liveplay_right_bottom" v-show="!isFullScreen">
					<div class="liveplay_bottom_gongge">
						<div v-show="!isPutAway" @click="putAway" style="cursor: pointer; margin: 5px 10px 0 0;">
							<i class="iconfont icon-liebiao"></i>
						</div>
						<el-popover placement="bottom-start" :width="400" trigger="click" popper-class="grid_set_popover"
							:popper-style="{ position: 'fixed', bottom: '20px', left: '10px', width: '230px' }">
							<template #reference>
								<span :class="'iconfont icon-' + actionLayoutClass" class="switGrid"
									style="font-size: 22px;cursor: pointer;"></span>
							</template>
							<div class="layout-selector-content">
								<div class="title" v-for="(layouts, key) in LayoutName" :key="key">
									<div style="padding-bottom: 2px;">{{ layoutNameMap[key] }}</div>
									<div class="layout-buttons">
										<span style="padding-right: 8px; font-size: 28px;cursor:pointer;" v-for="value in layouts"
											:key="value" @click="switGrid(value)"
											:class="['item iconfont icon-' + value, { active: actionLayoutClass === value }]"></span>
									</div>
								</div>
							</div>
						</el-popover>
					</div>
					<div class="liveplay_bottom_left">
						<div class="changeLiveReplay" @click="ChangeActive('LivePlay')" :class="isLive ? 'live' : 'replay'">
							<!-- <span class="iconfont icon-shishi"></span> -->
							<span>Liveview</span>
						</div>
						<div class="changeLiveReplay" @click="ChangeActive('Replay')" :class="!isLive ? 'live' : 'replay'">
							<!-- <span class="iconfont icon-huifang"></span> -->
							<span>Playback</span>
						</div>
					</div>
					<div class="liveplay_bottom_guanbi">
						<span class="iconfont icon-quanping" @click="wplPlayerRef?.fullScreen()"
							style="font-size: 22px;cursor: pointer;"></span>
						<span class="iconfont icon-guanbigongge" @click="StopPlay('all')"
							style="font-size: 22px;cursor: pointer;"></span>
						<span class="iconfont" :class="analyticsEvent ? 'icon-xiayibu' : 'icon-shangyibu'"
							@click="analyticsEvent = !analyticsEvent" style="font-size: 22px;cursor: pointer;"></span>
					</div>
				</div>
			</div>
		</div>

		<!-- <el-popover :popper-class="themeClass" v-model:visible="popoverVisible2" trigger="manual"
			placement="right-start"
			:popper-style="{ left: `${menuPosition2.x}px`, top: `${menuPosition2.y}px`, position: 'absolute' }">
			<template #reference>
				<span class="el-dropdown-link"></span>
			</template>
			<div class="liveplay_popover_title">
				<div class="title">{{ $t('View.view_send') }}</div>
				<div class="displays" v-for="item in  allDisplays " :key="item" :command="item"
					@click="handleCommand(item)">
					<span class="iconfont icon icon-fasongdaochuangkou" v-if="item == 'window'"> </span>
					<span class="iconfont icon icon-xianshiping" v-if="item !== 'window'"> </span>
					<span v-if="item == 'window'"> {{ $t('View.view_window') }}</span>
					<span v-if="item == 'main display'"> {{ $t('View.view_main_monitor') }}</span>
					<span v-if="item !== 'main display' && item !== 'window'"> {{ item }}</span>
				</div>
			</div>
		</el-popover> -->

		<!-- <el-dialog style="width: 400px" class="push_dialog" v-model="visible" :show-close="false">
			<div style="height:  250px;">
				<div class="liveplay_right_grid liveplay_right_grid_dialog" :class="visibleData.layoutName">
					<div class="liveplay_right_item" v-for=" item  in  LayoutData[visibleData.layoutName] " :key="item"
						:class="visibleData.layoutPosition == item ? 'liveplay_right_item_dialog_active liveplay_right_item' + item : 'liveplay_right_item' + item"
						:token="item" @click="visibleData.layoutPosition = item">
						{{ item }}
					</div>
				</div>
			</div>
			<template #footer>
				<span class="dialog-footer">
					<el-button class="cancel_btn" @click="visible = false">Cancel</el-button>
					<el-button class="confirm_btn" type="primary" @click="sendVideoWallChannelPlay">
						{{ $t("Common.comm_send") }}
					</el-button>
				</span>
			</template>
		</el-dialog> -->

		<div class="wpl-information-panel" v-if="wplInformationShow">
			<div class="info-header">
				<span>Bitstream Information</span>
				<i class="iconfont icon-shouqi" @click="closeWplInformation"></i>
			</div>
			<div class="information_con">
				<div class="information1">
					<div class="information_title">Video</div>
					<div class="information_content" v-for="(item, index) in wplInformationData.video" :key="index">
						<span class="information_content_left">{{ item.name }}</span>
						<span class="information_content_right">{{ item.data }}</span>
					</div>
				</div>
				<div class="information1">
					<div class="information_title">Audio</div>
					<div class="information_content" v-for="(item, index) in wplInformationData.audio" :key="index">
						<span class="information_content_left">{{ item.name }}</span>
						<span class="information_content_right">{{ item.data }}</span>
					</div>
				</div>
			</div>
		</div>

		<div class="yuntai wpl-ptz-panel" :class="wplPtzShow ? '' : 'yuntai-hide'">
			<div class="header">
				<span>PTZ</span>
				<i class="iconfont icon-shouqi" @click="closeWplPtz"></i>
			</div>
			<div class="controls">
				<div class="left">
					<i class="iconfont icon-jujiao2" @mousedown="wplPtzAction('focusin')" @mouseup="wplPtzAction('stop')"></i>
					<i class="iconfont icon-jujiao1" @mousedown="wplPtzAction('focusout')" @mouseup="wplPtzAction('stop')"></i>
					<i class="iconfont icon-guangquanjia" @mousedown="wplPtzAction('irisin')" @mouseup="wplPtzAction('stop')"></i>
					<i class="iconfont icon-guangquanjian" @mousedown="wplPtzAction('irisout')" @mouseup="wplPtzAction('stop')"></i>
					<i class="iconfont icon-light-open" @mousedown="wplPtzAction('lighton')" @mouseup="wplPtzAction('stop')"></i>
					<i class="iconfont icon-light-close" @mousedown="wplPtzAction('lightoff')" @mouseup="wplPtzAction('stop')"></i>
					<i class="iconfont icon-kaiyushua" @mousedown="wplPtzAction('wiperon')" @mouseup="wplPtzAction('stop')"></i>
					<i class="iconfont icon-guanyushua" @mousedown="wplPtzAction('wiperoff')" @mouseup="wplPtzAction('stop')"></i>
				</div>
				<div class="right">
					<div class="ptz-item corner">
						<div class="zs" @mousedown="wplPtzAction('upleft')" @mouseup="wplPtzAction('stop')">
							<i class="iconfont icon-zuoshang"></i>
						</div>
					</div>
					<div class="ptz-item shang" @mousedown="wplPtzAction('up')" @mouseup="wplPtzAction('stop')">
						<i class="iconfont icon-xiangshang"></i>
					</div>
					<div class="ptz-item corner">
						<div class="ys" @mousedown="wplPtzAction('upright')" @mouseup="wplPtzAction('stop')">
							<i class="iconfont icon-youshang"></i>
						</div>
					</div>
					<div class="ptz-item zuo" @mousedown="wplPtzAction('left')" @mouseup="wplPtzAction('stop')">
						<i class="iconfont icon-xiangzuo"></i>
					</div>
					<div class="ptz-item center"></div>
					<div class="ptz-item you" @mousedown="wplPtzAction('right')" @mouseup="wplPtzAction('stop')">
						<i class="iconfont icon-xiangyou"></i>
					</div>
					<div class="ptz-item corner">
						<div class="zx" @mousedown="wplPtzAction('downleft')" @mouseup="wplPtzAction('stop')">
							<i class="iconfont icon-zuoxia"></i>
						</div>
					</div>
					<div class="ptz-item xia" @mousedown="wplPtzAction('down')" @mouseup="wplPtzAction('stop')">
						<i class="iconfont icon-xiangxia"></i>
					</div>
					<div class="ptz-item corner">
						<div class="yx" @mousedown="wplPtzAction('downright')" @mouseup="wplPtzAction('stop')">
							<i class="iconfont icon-youxia"></i>
						</div>
					</div>
				</div>
			</div>
			<div class="ptz-slider">
				<span>{{ wplPtzSpeed }}</span>
				<el-slider v-model="wplPtzSpeed" :show-tooltip="false" :max="1" :min="0.1" :step="0.1"></el-slider>
			</div>
			<el-timeline>
				<el-timeline-item placement="top" v-for="preset in wplPresetData" :key="preset.strToken">
					<el-card>
						<div class="preset_bgc">
							<input type="text" class="preset_input" v-model="preset.strName" />
							<button type="button" class="iconfont icon-RectangleCopy1"
								@click="gotoWplPreset(preset.strToken)"></button>
							<button type="button" class="iconfont icon-icon-test1" @click="deleteWplPreset(preset.strToken)"></button>
						</div>
					</el-card>
				</el-timeline-item>
			</el-timeline>
		</div>
		<div v-if="menuVisible" class="context-menu" :style="{ left: x + 'px', top: y + 'px' }">
			<div class="menu-item" @click="goSetup">Set Up</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted, onErrorCaptured, ref, reactive, computed, watch, nextTick } from "vue";
import { useRouter } from 'vue-router';
import { XboxGamepad } from "../../utils/gamepad.js";
import { ElMessageBox, ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import WPLplayer from "../../components/WPLplayer.vue";
import AnalyticsEvent from "../../components/AnalyticsEvent.vue";
import { getDeviceInfo } from "../../utils/site.js";
import { useSiteInfo } from "../../store/site-info";
import { useStore } from "../../store/index.js";
import { GetPartitionApi, GetDeviceChannelsApi } from "../../api/channel";
import { DiscoveredDevice } from "../../types/site-info.js";
import { LayoutData, LayoutName } from "../../utils/layout.js";
import { PtzApi } from "../../api/channel";
import { initWPLPlayer } from "../../utils/initWPL.js";
import uuid from "../../utils/uuid.js";

interface PlayerState {
	layoutType: string;
	windows: {
		[windowIndex: number]: {
			token: string;
			streamprofile: string;
			channelName: string;
			isPlayback: boolean;
			playbackBeginTime?: string | Date;
			playbackEndTime?: string | Date;
			currentTime?: string | Date;
		};
	}
}

interface TreeNode {
	id: string;
	label: string;
	type: 'site' | 'partition' | 'device' | 'map' | 'view';
	children?: TreeNode[];
	online?: boolean;
	data: any;
	isLeaf?: boolean;
	loaded?: boolean;
	isDeviceChannel?: boolean;
}

const { t } = useI18n();
const siteStore = useSiteInfo();
const store = useStore();
let deviceCache = new Map();

const liveplayState = ref<PlayerState>({
	layoutType: 'WPL_LAYOUT_MODE_3X3',
	windows: {}
});
const replayState = ref<PlayerState>({
	layoutType: 'WPL_LAYOUT_MODE_3X3',
	windows: {}
});
const ipcRenderer = window.ipcRenderer;
const themeClass = computed(() => localStorage.getItem('themeStore.darkMode') === 'white' ? 'liveplay_popover' : 'liveplay_popover_dark');
let gamepad: XboxGamepad;
const connected = ref(false);
const router = useRouter();
const activeNames = ref(['devPartition'])
let left = ref(0)
let top = ref(0)
let width = ref(0)
let height = ref(0)
let titleBarHeight = ref(0)
let standaloneWindow = ref(false);
let isFullScreen = ref(false)
const filterText = ref<string>("");
const isPutAway = ref(true);
const gamepadContent = ref("");
const wplPlayerRef = ref<InstanceType<typeof WPLplayer> | null>(null);
const isDataReady = ref(false);
const isLive = ref(localStorage.getItem('isLive') === 'true' ? true : false);
const windowDeviceIpMap = ref<Map<number, string>>(new Map());
//stream
const wplInformationShow = ref(false);
const wplCurrentInfoToken = ref("");
//ptz
const wplPtzShow = ref(false);
const wplPtzToken = ref("");
const wplPtzSpeed = ref(0.5);
const wplPresetData = ref<Array<{ strToken: string, strName: string }>>([]);

const dateValue = ref(new Date());
const enablePlayback = computed(() => !isLive.value);
const calendarKey = ref(0);
const wplCustomDateArr = ref<number[]>([]);
const clickedWindowIndex = ref<number | null>(null);
const wplToken = ref<Record<number, string>>({})
const isSettingDateValue = ref(false);
const hasRestored = ref(false);

//analytics event
const analyticsEvent = ref(false);
const analyticsPanelRef = ref();

const layoutNameMap = {
	basic: 'Basic',
	vertical: 'Vertical',
	other: 'Other'
}

const isSelected = ref(false);
const selectedNode = ref<any>(null);

const actionLayoutClass = ref("layout2-2-1");
const visible = ref(false);
const channelData = ref<any[]>([]);
const expandedKeys = ref<any[]>([]);
const treeRef = ref<any>(null)
const treeProps = {
	value: 'id',
	label: 'label',
	children: 'children'
}
const isLoading = ref(false)
const radio = ref('Real time')
const menuPosition2 = ref({ x: 0, y: 0 });
const channelTokens = ref<Record<number, string>>({});
const channelStream = ref<Record<number, string>>({});
window.ipcRenderer.on('window-closing', () => {
});
window.ipcRenderer.on('standalone-window', () => {
	standaloneWindow.value = true;

});

onMounted(async () => {
	if (localStorage.getItem('isLive') === null) {
		isLive.value = true;
		localStorage.setItem('isLive', JSON.stringify(true));
	}

	try {
		await loadDeviceTree();
		gamepad = new XboxGamepad({
			onButtonPress,
			onButtonRelease,
			onAxisChange,
			onConnected,
			deadZone: 0.15
		});
		gamepad.startListening();
		connected.value = gamepad.connected;
	} catch (error) {
		console.error(error);
	};

	await restorePlayingState();

	const savedState = liveplayState.value;
	if (savedState?.layoutType && wplPlayerRef.value) {
		setTimeout(() => {
			if (wplPlayerRef.value) {
				wplPlayerRef.value.switchLayout(savedState.layoutType);
				const wplLayoutMap: Record<string, string> = {
					'WPL_LAYOUT_MODE_1X1': 'layout1-1-1',
					'WPL_LAYOUT_MODE_2X2': 'layout2-2-1',
					'WPL_LAYOUT_MODE_3X3': 'layout3-3-1',
					'WPL_LAYOUT_MODE_4X4': 'layout4-4-1',
					'WPL_LAYOUT_MODE_5X5': 'layout5-5-1',
					'WPL_LAYOUT_MODE_6X6': 'layout6-6-1',
					'WPL_LAYOUT_MODE_8X8': 'layout8-8-1',
					'WPL_LAYOUT_MODE_6': 'layout1-6-1',
					'WPL_LAYOUT_MODE_1p1': 'layout1-2-1',
					'WPL_LAYOUT_MODE_1p2': 'layout1-3-1',
					'WPL_LAYOUT_MODE_1p3': 'layout1-4-1',
					'WPL_LAYOUT_MODE_8': 'layout1-4-2',
				};
				const layoutKey = Object.keys(wplLayoutMap).find(key => key === savedState.layoutType);
				if (layoutKey) {
					actionLayoutClass.value = wplLayoutMap[layoutKey];
				}
			}
		}, 500);
	}

	window.addEventListener('storage', handleStorageChange);

	window.ipcRenderer.on('wpl-hide', () => {
		if (wplPlayerRef.value && (wplPlayerRef.value as any).hide) {
			(wplPlayerRef.value as any).hide();
		}
	});

	window.ipcRenderer.on('wpl-show', () => {
		if (wplPlayerRef.value && (wplPlayerRef.value as any).show) {
			(wplPlayerRef.value as any).show();
		}
	});
})

const ChangeActive = async (type: string) => {
	saveCurrentPlayState();

	if (wplPlayerRef.value) {
		wplPlayerRef.value.stopAll();
		clearAllPlayingState();
	}

	playingNodeRefs.value.forEach((nodeData, token) => {
		nodeData.isPlaying = false;
		const iconConfig = getDeviceIconConfig(nodeData, false);
		nodeData.iconfont = iconConfig.iconfont;
		nodeData.iconSvg = iconConfig.iconSvg;
		nodeData.iconclass1 = iconConfig.iconclass1;
		nodeData.iconclass2 = iconConfig.iconclass2;
		nodeData.iconclass3 = iconConfig.iconclass3;
	});
	playingIdArr.value = [];
	if (type === 'LivePlay') {
		isLive.value = true;
		localStorage.setItem('isLive', JSON.stringify(true));
	} else {
		isLive.value = false;
		localStorage.setItem('isLive', JSON.stringify(false));
	}

	await nextTick();
	await new Promise(resolve => setTimeout(resolve, 100));
	const stateToRestore = isLive.value ? liveplayState.value : replayState.value;
	if (stateToRestore && Object.keys(stateToRestore.windows || {}).length > 0) {
		const device = getDeviceInfo().target;
		if (device) {
			const session = device.session || '';
			const ip = device.ipv4Address || '';
			const port = device.enableHttps ? Number(device.httpsPort) : Number(device.httpPort);
			const protocol = device.enableHttps ? 'https:' : 'http:';
			await restorePlayState(stateToRestore, session, ip, port, protocol);
		} else {
			await restorePlayState(stateToRestore);
		}
	} else if (stateToRestore?.layoutType) {
		if (wplPlayerRef.value) {
			wplPlayerRef.value.switchLayout(stateToRestore.layoutType);
			const wplLayoutMap: Record<string, string> = {
				'WPL_LAYOUT_MODE_1X1': 'layout1-1-1',
				'WPL_LAYOUT_MODE_2X2': 'layout2-2-1',
				'WPL_LAYOUT_MODE_3X3': 'layout3-3-1',
				'WPL_LAYOUT_MODE_4X4': 'layout4-4-1',
				'WPL_LAYOUT_MODE_5X5': 'layout5-5-1',
				'WPL_LAYOUT_MODE_6X6': 'layout6-6-1',
				'WPL_LAYOUT_MODE_8X8': 'layout8-8-1',
				'WPL_LAYOUT_MODE_6': 'layout1-6-1',
				'WPL_LAYOUT_MODE_1p1': 'layout1-2-1',
				'WPL_LAYOUT_MODE_1p2': 'layout1-3-1',
				'WPL_LAYOUT_MODE_1p3': 'layout1-4-1',
				'WPL_LAYOUT_MODE_8': 'layout1-4-2',
			};
			const layoutKey = Object.keys(wplLayoutMap).find(key => key === stateToRestore.layoutType);
			if (layoutKey) {
				actionLayoutClass.value = wplLayoutMap[layoutKey];
			}
		}
	}
};

const saveCurrentPlayState = () => {
	const count = Number(localStorage.getItem('hproViewCount') || '0');
	if (count !== 1) return;
	const state = buildPlayState();
	if (!state) return;

	if (isLive.value) {
		liveplayState.value = state;
	} else {
		replayState.value = state;
	}

	if (!isLive.value) return;

	const windows = state.windows || {};
	const windowKeys = Object.keys(windows);

	const cacheData = {
		layoutType: state.layoutType,
		windows: state.windows,
		isLive: isLive.value,
	}

	if (windowKeys.length > 0) {
		const firstWindowIndex = parseInt(windowKeys[0]) - 1;
		const deviceIp = windowDeviceIpMap.value.get(firstWindowIndex);
		if (deviceIp) {
			localStorage.setItem(`hpro_view_${deviceIp}`, JSON.stringify(cacheData));
		}
	} else {
		const allKeys = Object.keys(localStorage);
		const viewKeys = allKeys.filter(key => key.startsWith('hpro_view_'));
		for (const key of viewKeys) {
			try {
				const cached = localStorage.getItem(key);
				if (cached) {
					const data = JSON.parse(cached);
					data.windows = {};
					localStorage.setItem(key, JSON.stringify(data));
				}
			} catch (error) {
				console.error('failed to clear:', error);
			}
		}
	}
}

const restorePlayState = async (state: PlayerState, session?: string, ip?: string, port?: number, protocol?: string) => {
	if (!wplPlayerRef.value) return;

	const player = wplPlayerRef.value as any;
	const windows = state.windows || {};

	if (Object.keys(windows).length === 0) {
		if (state.layoutType) {
			player.switchLayout(state.layoutType);
			const wplLayoutMap: Record<string, string> = {
				'WPL_LAYOUT_MODE_1X1': 'layout1-1-1',
				'WPL_LAYOUT_MODE_2X2': 'layout2-2-1',
				'WPL_LAYOUT_MODE_3X3': 'layout3-3-1',
				'WPL_LAYOUT_MODE_4X4': 'layout4-4-1',
				'WPL_LAYOUT_MODE_5X5': 'layout5-5-1',
				'WPL_LAYOUT_MODE_6X6': 'layout6-6-1',
				'WPL_LAYOUT_MODE_8X8': 'layout8-8-1',
				'WPL_LAYOUT_MODE_6': 'layout1-6-1',
				'WPL_LAYOUT_MODE_1p1': 'layout1-2-1',
				'WPL_LAYOUT_MODE_1p2': 'layout1-3-1',
				'WPL_LAYOUT_MODE_1p3': 'layout1-4-1',
				'WPL_LAYOUT_MODE_8': 'layout1-4-2',
			};
			const layoutKey = Object.keys(wplLayoutMap).find(key => key === state.layoutType);
			if (layoutKey) {
				actionLayoutClass.value = wplLayoutMap[layoutKey];
			}
		}
		return;
	}
	if (state.layoutType) {
		await nextTick();
		player.switchLayout(state.layoutType);
		const wplLayoutMap: Record<string, string> = {
			'WPL_LAYOUT_MODE_1X1': 'layout1-1-1',
			'WPL_LAYOUT_MODE_2X2': 'layout2-2-1',
			'WPL_LAYOUT_MODE_3X3': 'layout3-3-1',
			'WPL_LAYOUT_MODE_4X4': 'layout4-4-1',
			'WPL_LAYOUT_MODE_5X5': 'layout5-5-1',
			'WPL_LAYOUT_MODE_6X6': 'layout6-6-1',
			'WPL_LAYOUT_MODE_8X8': 'layout8-8-1',
			'WPL_LAYOUT_MODE_6': 'layout1-6-1',
			'WPL_LAYOUT_MODE_1p1': 'layout1-2-1',
			'WPL_LAYOUT_MODE_1p2': 'layout1-3-1',
			'WPL_LAYOUT_MODE_1p3': 'layout1-4-1',
			'WPL_LAYOUT_MODE_8': 'layout1-4-2',
		};
		const layoutKey = Object.keys(wplLayoutMap).find(key => key === state.layoutType);
		if (layoutKey) {
			actionLayoutClass.value = wplLayoutMap[layoutKey];
		}
		await new Promise(resolve => setTimeout(resolve, 300));
	}
	for (const [windowIndexStr, info] of Object.entries(windows)) {
		const windowIndex = parseInt(windowIndexStr) - 1;
		if (ip) {
			windowDeviceIpMap.value.set(windowIndex, ip)
		}
		if (player.stopWindow) {
			player.stopWindow(windowIndex);
		}
		try {
			if (isLive.value) {
				await player.play({
					windowIndex: windowIndex,
					token: info.token,
					streamprofile: info.streamprofile || 'main',
					session: session,
					channelName: info.channelName || info.token,
					host: ip,
					port: port,
					protocol: protocol,
				});
			} else if (info.isPlayback && info.playbackBeginTime && info.playbackEndTime) {
				let startTime = info.playbackBeginTime;
				if (info.currentTime) {
					startTime = info.currentTime;
				}
				if (startTime instanceof Date) {
					startTime = startTime.toISOString();
				}
				let endTime = info.playbackEndTime;
				if (endTime instanceof Date) {
					endTime = endTime.toISOString();
				}
				await player.playback({
					windowIndex: windowIndex,
					token: info.token,
					startTime: startTime,
					endTime: endTime,
					streamprofile: info.streamprofile || 'main',
					session: session,
					channelName: info.channelName || info.token,
					port: port,
					protocol: protocol
				});
			}
			channelTokens.value[parseInt(windowIndexStr)] = info.token;
			channelStream.value[parseInt(windowIndexStr)] = info.streamprofile || 'main';

			wplToken.value[windowIndex] = info.token;
			if (clickedWindowIndex.value === null || clickedWindowIndex.value === undefined) {
				clickedWindowIndex.value = windowIndex;
			}

			if (info.token) {
				playingChannels.value.set(info.token, windowIndex);
			}
		} catch (error) {
			console.error(`restore window ${windowIndexStr} failed`, error);
		}
	}

	if (!isLive.value && clickedWindowIndex.value !== null && clickedWindowIndex.value !== undefined) {
		const token = wplToken.value[clickedWindowIndex.value];
		if (token) {
			setTimeout(() => {
				refreshWPLRecordCalendar(token);
			}, 500);
		}
	}

	for (const [token] of playingChannels.value) {
		const nodeData = playingNodeRefs.value.get(token);
		if (nodeData) {
			nodeData.isPlaying = true;
			const iconConfig = getDeviceIconConfig(nodeData, true);
			nodeData.iconSvg = iconConfig.iconSvg;
			nodeData.iconfont = iconConfig.iconfont;
			nodeData.iconclass1 = iconConfig.iconclass1;
			nodeData.iconclass2 = iconConfig.iconclass2;
			nodeData.iconclass3 = iconConfig.iconclass3;
		}
	}
};

const isGamepad = ref(true);
const onButtonPress = (data: any, name: string) => {
	const { root, access_token } = getDeviceInfo();
	let url: string = root;
	let newData: any;
	let speed: number;
	switch (data.index) {
		case 0:
		case 1:
			if (!isGamepad.value) {
				return;
			}
			if (data.index == 0) {
				selectedItem.value++
				if (selectedItem.value > LayoutData[actionLayoutClass.value]) {
					selectedItem.value = 1
				}
			} else {
				selectedItem.value--
				if (selectedItem.value < 1) {
					selectedItem.value = LayoutData[actionLayoutClass.value]
				}
			}

			break;
		case 2:
			wplPlayerRef.value?.fullScreen();
			break;
		case 3:
			if (!isGamepad.value) {
				return;
			}
			if (!channelTokens.value[selectedItem.value]) return;
			newData = {
				token: channelTokens.value[selectedItem.value],
				action: "preset",
				preset: "preset1",
				speed: 0.5
			}
			PtzApi(url, access_token, newData).then((response: any) => {
			})

			break;
		case 4:
			if (!isGamepad.value) {
				return;
			}
			if (!channelTokens.value[selectedItem.value]) return;
			newData = {
				token: channelTokens.value[selectedItem.value],
				action: "preset",
				preset: "preset1",
				speed: 0.5
			}
			PtzApi(url, access_token, newData).then((response: any) => {
			})
			break;
		case 5:
			if (!isGamepad.value) {
				return;
			}
			if (!channelTokens.value[selectedItem.value]) return;
			newData = {
				token: channelTokens.value[selectedItem.value],
				action: "preset",
				preset: "preset1",
				speed: 0.5
			}
			PtzApi(url, access_token, data).then((response: any) => {
			})
			break;
		case 6:
			isGamepad.value = false;
			speed = Number(localStorage.getItem('sensitivityZ')) || 0.5;
			newData = {
				token: channelTokens.value[selectedItem.value],
				action: "zoomin",
				speed: speed
			}
			PtzApi(url, access_token, newData).then((response: any) => {
				if (response.bStatus) {
					const elements = document.getElementsByClassName('gamepadCtx' + selectedItem.value);
					if (elements.length > 0) {
						const element = elements[0] as HTMLElement;
						gamepadContent.value = "zoom out"
						element.style.display = 'flex';
					}
				}
			})
			break;
		case 7:
			isGamepad.value = false;
			speed = Number(localStorage.getItem('sensitivityZ')) || 0.5;
			newData = {
				token: channelTokens.value[selectedItem.value],
				action: "zoomout",
				speed: speed
			}
			PtzApi(url, access_token, newData).then((response: any) => {
				if (response.bStatus) {
					const elements = document.getElementsByClassName('gamepadCtx' + selectedItem.value);
					if (elements.length > 0) {
						const element = elements[0] as HTMLElement;
						gamepadContent.value = "zoom in"
						element.style.display = 'flex';
					}
				}
			})
			break;
		default:
			break;
	}
};

const onButtonRelease = (data: any, name: string) => {
	const { root, access_token } = getDeviceInfo();
	if (data.index == 6 || data.index == 7) {
		let item = selectedItem.value
		isGamepad.value = true;
		if (!channelTokens.value[item]) return;
		let url: string = root;
		let newData = {
			token: channelTokens.value[item],
			action: "stop",
			speed: 0.5
		}
		PtzApi(url, access_token, newData).then((response: any) => {
			if (response.bStatus) {
				const elements = document.getElementsByClassName('gamepadCtx' + item);
				if (elements.length > 0) {
					const element = elements[0] as HTMLElement;
					element.style.display = 'none';
				}
			}
		})
	} else {
	}
};

const onAxisChange = (axis: any) => {
	//exit if no video is playing in current grid cell
	const { access_token, root } = getDeviceInfo();
	if (!channelTokens.value[selectedItem.value]) return;
	let newData: any;
	let url: string = root;
	if (Math.abs(axis.LeftStickX.value) == 0 && Math.abs(axis.LeftStickY.value) == 0) {
		isGamepad.value = true;
		newData = {
			token: channelTokens.value[selectedItem.value],
			action: "stop",
			speed: 0.5
		}
		const elements = document.getElementsByClassName('gamepadCtx' + selectedItem.value);
		if (elements.length > 0) {
			const element = elements[0] as HTMLElement;
			gamepadContent.value = ""
			element.style.display = 'none';
		}
	} else {
		let ptzAction = "";
		//get configured sensitivity, use default value 0.5 if unavailable
		let speed = Number(localStorage.getItem('sensitivityPT')) || 0.5;
		//calculate final sensitivity by multiplication
		speed = Math.ceil(Math.max(Math.abs(axis.LeftStickX.value), Math.abs(axis.LeftStickY.value)) * speed * 10) / 10;
		if (Math.abs(axis.LeftStickX.value) >= Math.abs(axis.LeftStickY.value)) {
			if (axis.LeftStickX.value < 0) {
				ptzAction = "left";
			} else {
				ptzAction = "right";
			}
		} else {
			if (axis.LeftStickY.value < 0) {
				ptzAction = "up";
			} else if (axis.LeftStickY.value > 0) {
				ptzAction = "down";
			}
		}
		isGamepad.value = false;
		newData = {
			token: channelTokens.value[selectedItem.value],
			action: ptzAction,
			speed: speed
		}
		const elements = document.getElementsByClassName('gamepadCtx' + selectedItem.value);
		if (elements.length > 0) {
			const element = elements[0] as HTMLElement;
			gamepadContent.value = "move"
			element.style.display = 'flex';
		}

	}
	PtzApi(url, access_token, newData).then((response: any) => {
	})
};

const onConnected = (data: boolean) => {
	connected.value = data;
};

const putAway = () => {
	isPutAway.value = !isPutAway.value
};
const handleIconClick = () => {
	if (filterText.value == "") {
		return;
	}
};

const loadDeviceTree = async () => {
	if (isLoading.value) return;
	isLoading.value = true;

	try {
		channelData.value = [];
		const channelArr = [];

		for (const site of siteStore.siteDevices) {
			if (site.login) {
				const siteData: any = {
					id: `site_${site.ipv4Address}`,
					isLeaf: false,
					label: site.deviceName || site.ipv4Address,
					loaded: true,
					online: site.login,
					type: 'site',
					data: site,
					children: []
				}

				const protocol = site.enableHttps ? 'https:' : 'http:';
				const port = site.enableHttps ? site.httpsPort : site.httpPort;
				const root = `${protocol}//${site.ipv4Address}:${port}`;

				const partitionParams = {
					root,
					access_token: site.access_token ?? ''
				};

				const res = await GetPartitionApi(partitionParams);

				if (res.status == 200 && res.data.code == 0) {
					const result = res.data.result;
					const list = flattenRootNodes(result);

					const deviceItems: any[] = [];
					const collectDevices = (nodes: any[]) => {
						for (const node of nodes) {
							if (node.type === 'device' && node.data && node.data.token) {
								deviceItems.push(node);
							}
							if (node.children && node.children.length > 0) {
								collectDevices(node.children);
							}
						}
					};
					collectDevices(list);
					const batchSize = 3;
					for (let i = 0; i < deviceItems.length; i += batchSize) {
						const batch = deviceItems.slice(i, i + batchSize);
						await Promise.allSettled(
							batch.map(async (item) => {
								try {
									const cacheKey = item.data.token;
									if (deviceCache.has(cacheKey)) {
										const cachedData = deviceCache.get(cacheKey);
										if (cachedData.length > 0) {
											item.children = cachedData;
											item.loaded = true;
											item.isLeaf = false;
										} else {
											delete item.children;
											item.loaded = true;
											item.isLeaf = true;
										}
										return;
									}

									const ress = await GetDeviceChannelsApi({
										root,
										access_token: site.access_token ?? '',
										token: item.data.token
									});

									if (ress.status == 200 && ress.data.code == 0 && ress.data.result.length > 0) {
										const channels = ress.data.result.map((channel: any, index: number) => ({
											id: `channel_${item.data.devId}_${index}`,
											label: channel.name || `channel ${index + 1}`,
											name: channel.name || `channel ${index + 1}`,
											token: channel.token,
											online: channel.online,
											type: 'device',
											data: channel,
											isLeaf: true,
											isDeviceChannel: true,
											ipv4Address: site.ipv4Address,
											protocol: site.enableHttps ? 'https:' : 'http:',
											host: site.enableHttps ? site.httpsPort : site.httpPort,
											session: site.session,
											access_token: site.access_token
										}));

										deviceCache.set(cacheKey, channels);
										item.children = channels;
										item.loaded = true;
										item.isLeaf = false;
									} else {
										deviceCache.set(cacheKey, []);
										delete item.children;
										item.loaded = true;
										item.isLeaf = false;
									}
								} catch (error) {
									console.error(`failed to load device ${item.data.devId} channels:`, error);
									delete item.children;
									item.loaded = true;
									item.isLeaf = false;
								}
							})
						);
						if (i + batchSize < deviceItems.length) {
							await new Promise(resolve => setTimeout(resolve, 100));
						}
					}

					siteData.children = list;
				}
				channelArr.push(siteData);
			}
		}
		channelData.value = channelArr;
		// expandedKeys.value = getAllKeys(channelArr);
	} finally {
		isLoading.value = false;
	}
}

const flattenRootNodes = (partitions: any[]): TreeNode[] => {
	const result: TreeNode[] = [];
	partitions.forEach(partition => {
		// 1. 优先显示子分区
		if (partition.children && partition.children.length > 0) {
			const childrenNodes = transformToTreeData(partition.children);
			result.push(...childrenNodes);
		}

		// 2. 显示 dev 设备
		if (partition.dev && partition.dev.length > 0) {
			partition.dev.forEach((device: any) => {
				result.push({
					id: `dev_${device.devId}`,
					label: device.name,
					type: 'device',
					online: device.online,
					data: device,
					children: [{ id: 'placeholder', label: '', type: 'device', data: null }],
					isLeaf: false,
					loaded: false
				});
			});
		}

		// 3. 显示 map
		if (partition.map && partition.map.length > 0) {
			partition.map.forEach((map: any) => {
				result.push({
					id: `map_${map.mapId}`,
					label: map.mapName,
					type: 'map',
					data: map,
					isLeaf: true,
					loaded: true
				});
			});
		}

		// 4. 显示 view
		if (partition.view && partition.view.length > 0) {
			partition.view.forEach((view: any) => {
				result.push({
					id: `view_${view.viewId}`,
					label: view.viewName,
					type: 'view',
					data: view,
					isLeaf: true,
					loaded: true
				});
			});
		}
	});
	return result;
}

const transformToTreeData = (partitions: any[]): TreeNode[] => {
	const result: TreeNode[] = [];

	partitions.forEach(partition => {
		const hasChildren = (partition.children && partition.children.length > 0) ||
			(partition.dev && partition.dev.length > 0) ||
			(partition.map && partition.map.length > 0) ||
			(partition.view && partition.view.length > 0);

		const partitionNode: TreeNode = {
			id: `partition_${partition.devPartitionId}`,
			label: partition.devPartitionName,
			type: 'partition',
			data: partition,
			isLeaf: !hasChildren,
			loaded: false
		};

		if (hasChildren) {
			partitionNode.children = [];

			if (partition.children && partition.children.length > 0) {
				const childrenNodes = transformToTreeData(partition.children);
				partitionNode.children.push(...childrenNodes);
			}

			if (partition.dev && partition.dev.length > 0) {
				partition.dev.forEach((device: any) => {
					partitionNode.children!.push({
						id: `dev_${device.devId}`,
						label: device.name,
						type: 'device',
						online: device.online,
						data: device,
						children: [{ id: 'placeholder', label: '', type: 'device', data: null }],
						isLeaf: false,
						loaded: false
					});
				});
			}

			if (partition.map && partition.map.length > 0) {
				partition.map.forEach((map: any) => {
					partitionNode.children!.push({
						id: `map_${map.mapId}`,
						label: map.mapName,
						type: 'map',
						data: map,
						isLeaf: true,
						loaded: true
					});
				});
			}

			if (partition.view && partition.view.length > 0) {
				partition.view.forEach((view: any) => {
					partitionNode.children!.push({
						id: `view_${view.viewId}`,
						label: view.viewName,
						type: 'view',
						data: view,
						isLeaf: true,
						loaded: true
					});
				});
			}

			partitionNode.loaded = true;
		}

		result.push(partitionNode);
	});

	return result;
}

const getAllKeys = (data: any) => {
	const keys: any[] = [];
	const stack = [...data];

	while (stack.length > 0) {
		const item = stack.pop();
		if (item && item.id !== 'placeholder') {
			keys.push(item.id);
			if (item.children && item.children.length > 0) {
				if (!item.isLeaf) {
					stack.push(...item.children);
				}
			}
		}
	}
	return keys;
}

const playingIdArr = ref<string[]>([]);
const playingChannels = ref<Map<string, number>>(new Map());

const isChannelPlaying = (node: any) => {
	if (!node.data) return false;
	if (!node.isLeaf && !node.isDeviceChannel && node.type !== 'view') return false;
	return playingIdArr.value.includes(node.id);
}

const updatePlayingStatus = (type: string, id: string) => {
	if (!id) return;
	if (type == 'add') {
		if (!playingIdArr.value.includes(id)) {
			playingIdArr.value.push(id);
		}
	} else if (type == 'del') {
		playingIdArr.value = playingIdArr.value.filter(item => item !== id);
	}
}

const menuVisible = ref<boolean>(false);
const setupIP = ref<string>('')
const x = ref<number>(0)
const y = ref<number>(0)

const menuShow = (event: MouseEvent) => {
	event.preventDefault();
	x.value = event.clientX;
	y.value = event.clientY;
	menuVisible.value = true;
}

const menuHide = () => {
	setupIP.value = '';
	menuVisible.value = false;
}

const goSetup = () => {
	menuVisible.value = false;
	window.ipcRenderer.send('open-new-tab', {
		data: {
			label: 'Setup',
			key: "Setup" + uuid(4),
			path: "Setup",
		},
		type: 'setup',
		ip: setupIP.value
	})
	setupIP.value = '';
}

const onRightClick = (e: MouseEvent, data: any) => {
	if (data.type !== 'site') return;
	setupIP.value = data.data.ipv4Address;
	menuShow(e);
}

const switGrid = (data: string) => {
	actionLayoutClass.value = data;
	if (wplPlayerRef.value) {
		const wplLayoutMap: Record<string, string> = {
			//基本
			'layout1-1-1': 'WPL_LAYOUT_MODE_1X1',
			'layout2-2-1': 'WPL_LAYOUT_MODE_2X2',
			'layout3-3-1': 'WPL_LAYOUT_MODE_3X3',
			'layout4-4-1': 'WPL_LAYOUT_MODE_4X4',
			'layout5-5-1': 'WPL_LAYOUT_MODE_5X5',
			'layout6-6-1': 'WPL_LAYOUT_MODE_6X6',
			'layout8-8-1': 'WPL_LAYOUT_MODE_8X8',
			'layout1-6-1': 'WPL_LAYOUT_MODE_6',
			// 'layout1-8-1': 'WPL-LAYOUT_MODE_',
			// 'layout1-9-1': 'WPL-LAYOUT_MODE_',
			// 'layout1-10-1': 'WPL-LAYOUT_MODE_',
			// 'layout1-12-1': 'WPL-LAYOUT_MODE_',
			// 'layout1-16-1': 'WPL-LAYOUT_MODE_',
			// 'layout1-17-1': 'WPL-LAYOUT_MODE_',
			//竖向
			'layout1-2-1': 'WPL_LAYOUT_MODE_1p1',
			'layout1-3-1': 'WPL_LAYOUT_MODE_1p2',
			// 'layout1-5-1': 'WPL_LAYOUT_MODE_', 
			// "layout1-6-2": 'WPL_LAYOUT_MODE_',
			// "layout1-8-2": 'WPL_LAYOUT_MODE_', 
			//其他
			"layout1-4-1": 'WPL_LAYOUT_MODE_1p3',
			"layout1-4-2": 'WPL_LAYOUT_MODE_8',
			// "layout1-5-2": 'WPL_LAYOUT_MODE_',
			// "layout1-6-3": 'WPL_LAYOUT_MODE_',
			// "layout1-7-1": 'WPL_LAYOUT_MODE_',
			// "layout1-7-2": 'WPL_LAYOUT_MODE_',
			// "layout1-12-2": 'WPL_LAYOUT_MODE_',
			// "layout1-13-1": 'WPL_LAYOUT_MODE_',
			// "layout1-24-1": 'WPL_LAYOUT_MODE_',
			// "layout1-32-1": 'WPL_LAYOUT_MODE_',
			// "layout1-36-1": 'WPL_LAYOUT_MODE_',
			// "layout1-48-1": 'WPL_LAYOUT_MODE_',
		}
		const wplType = wplLayoutMap[data];
		if (wplType) {
			wplPlayerRef.value.switchLayout(wplType);
			saveCurrentPlayState();
		}
	}
}

const onWPLFullscreenExit = () => {
	setTimeout(() => {
		if (wplPlayerRef.value) {
			(wplPlayerRef.value as any).syncWindowPosition?.();
		}
	}, 100);
}
const selectedItem = ref<number>(1);

//WPL
const currentWPLLayoutType = ref('WPL_LAYOUT_MODE_3X3');

const onWPLReady = () => {
	console.log('WPL player already');
}

const onWPLWindowClick = ({ windowIndex, originalData }: any) => {
	selectedItem.value = windowIndex + 1;

	if (originalData?.notifyWinClicked?.strWinIndex !== undefined) {
		const strWinIndex = originalData.notifyWinClicked.strWinIndex;
		clickedWindowIndex.value = parseInt(strWinIndex, 10);
		const token = wplToken.value[clickedWindowIndex.value];
		if (token) {
			refreshWPLRecordCalendar(token);
		} else {
			refreshWPLRecordCalendar('');
		}
	}
}

const playingNodeRefs = ref<Map<string, any>>(new Map());

const onWPLPlayEnded = ({ windowIndex, token, streamprofile, hasOtherPlay }: any) => {
	if (windowIndex !== undefined) {
		delete channelTokens.value[windowIndex + 1];
		delete channelStream.value[windowIndex + 1];
	}
	if (windowIndex !== undefined && windowIndex !== null) {
		const windowKey = windowIndex + 1;
		if (isLive.value) {
			delete liveplayState.value.windows[windowKey]
		} else {
			delete replayState.value.windows[windowKey]
		}
		windowDeviceIpMap.value.delete(windowIndex);
		delete wplToken.value[windowIndex];
		if (clickedWindowIndex.value === windowIndex) {
			refreshWPLRecordCalendar('');
			clickedWindowIndex.value = null;
		}
		const currentToken = wplToken.value[clickedWindowIndex.value || 0];
		if (!currentToken && clickedWindowIndex !== null) {
			refreshWPLRecordCalendar('');
			clickedWindowIndex.value = null;
		}
	}
	if (token && !hasOtherPlay) {
		const nodeData = playingNodeRefs.value.get(token);
		if (nodeData) {
			nodeData.isPlaying = false;
			updatePlayingStatus('del', nodeData.id);
			const iconConfig = getDeviceIconConfig(nodeData, false);
			nodeData.iconfont = iconConfig.iconfont
			nodeData.iconSvg = iconConfig.iconSvg;
			nodeData.iconclass1 = iconConfig.iconclass1;
			nodeData.iconclass2 = iconConfig.iconclass2;
			nodeData.iconclass3 = iconConfig.iconclass3;
			playingNodeRefs.value.delete(token);
		}
		playingChannels.value.delete(token);
	}

	if (wplInformationShow.value && wplCurrentInfoToken.value === token) {
		closeWplInformation()
	}
	if (wplPtzShow.value && wplPtzToken.value === token) {
		closeWplPtz();
	}
	setTimeout(() => {
		const state = buildPlayState();
		saveCurrentPlayState();
	}, 100);
}

const handleNodeClick = (data: any, node: any) => {
	if (data.type === 'site') {
		const siteInfo = data.data;
		siteStore.setSelectedSite(siteInfo);
		return;
	}
	if (!data.isLeaf && !data.isDeviceChannel) return;
	if (data.type !== 'device' || !data.token) return;

	const siteIp = data.ipv4Address;
	const deviceSite = siteStore.siteDevices.find(s => s.ipv4Address === siteIp)

	if (!deviceSite) return;
	if (!deviceSite.session) return;

	const currentWindowIndex = selectedItem.value - 1;

	windowDeviceIpMap.value.set(currentWindowIndex, deviceSite.ipv4Address);

	const session = deviceSite.session;
	const ip = deviceSite.ipv4Address;
	const port = deviceSite.enableHttps ? deviceSite.httpsPort : deviceSite.httpPort;
	const protocol = deviceSite.enableHttps ? 'https:' : 'http:';

	const channelToken = data.token;
	data.isPlaying = true;
	playingNodeRefs.value.set(channelToken, data);
	if (!wplPlayerRef.value) return;

	const windowNumber = selectedItem.value;
	const oldToken = channelTokens.value[windowNumber];
	if (oldToken && oldToken !== channelToken) {
		playingChannels.value.delete(oldToken);
		const oldNodeData = playingNodeRefs.value.get(oldToken);
		if (oldNodeData) {
			oldNodeData.isPlaying = false;
			updatePlayingStatus('del', oldNodeData.id);
			const iconConfig = getDeviceIconConfig(oldNodeData, false);
			oldNodeData.iconSvg = iconConfig.iconSvg;
			oldNodeData.iconclass1 = iconConfig.iconclass1;
			oldNodeData.iconclass2 = iconConfig.iconclass2;
			oldNodeData.iconclass3 = iconConfig.iconclass3;
			playingNodeRefs.value.delete(oldToken);
		}
		updateTreeNodeIcon(oldToken, false);
	}

	data.isPlaying = true;
	playingNodeRefs.value.set(channelToken, data);
	const iconConfig = getDeviceIconConfig(data, true);
	data.iconSvg = iconConfig.iconSvg;
	data.iconclass1 = iconConfig.iconclass1;
	data.iconclass2 = iconConfig.iconclass2;
	data.iconclass3 = iconConfig.iconclass3;
	playingChannels.value.set(channelToken, currentWindowIndex);
	updatePlayingStatus('add', data.id);

	if (isLive.value) {
		wplPlayerRef.value.play({
			windowIndex: currentWindowIndex,
			token: channelToken,
			streamprofile: 'main',
			session: session,
			channelName: data.name || data.label,
			host: ip,
			port: port,
			protocol: protocol
		}).then(() => {
			channelTokens.value[selectedItem.value] = channelToken;
			channelStream.value[selectedItem.value] = 'main';
			saveCurrentPlayState();
		});
	} else {
		wplToken.value[currentWindowIndex] = channelToken;
		clickedWindowIndex.value = currentWindowIndex;
		refreshWPLRecordCalendar(channelToken);
		const now = dateValue.value || new Date();
		const startTime = new Date(now);
		startTime.setHours(0, 0, 0, 0);
		const endTime = new Date(now);
		endTime.setHours(23, 59, 59, 999);

		wplPlayerRef.value.playback({
			windowIndex: currentWindowIndex,
			token: channelToken,
			startTime: startTime.toISOString(),
			endTime: endTime.toISOString(),
			streamprofile: 'main',
			session: session,
			channelName: data.name || data.label,
		}).then(() => {
			channelTokens.value[selectedItem.value] = channelToken;
			channelStream.value[selectedItem.value] = 'main';
			saveCurrentPlayState();
		});
	}
}

const getNodeIcon = (node: any) => {
	switch (node.type) {
		case 'site':
			return 'icon-shebeiguanli';
		case 'partition':
			return 'icon-gen';
		case 'device':
			if (node.isLeaf || node.isDeviceChannel) {
				if (node.data && node.data.recording) {
					if (store.darkMode) {
						return '#icon-baishexiangji'
					} else {
						return '#icon-heishexiangji'
					}
				}
				return 'icon-shexiangjizaixian';
			}
			return 'icon-Device';
		case 'map':
			return 'icon-ditu';
		case 'view':
			return 'icon-shitu2';
		default:
			return 'icon-gen';
	}
}

const getNodeColor = (node: any) => {
	if (node.type === 'device') {
		const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
		return isOnline ? '1' : '0.6';
	}
	return '1';
}

const getRecordingIcon = (node: any) => {
	if (isChannelPlaying(node)) {
		return '#icon-lvshexiangji';
	}
	if (node.data && node.data.recording) {
		if (store.darkMode) {
			return '#icon-baishexiangji'
		} else {
			return '#icon-heishexiangji'
		}
	}
	return getNodeIcon(node);
}

const wplInformationData = computed(() => {
	if (wplPlayerRef.value) {
		return (wplPlayerRef.value as any).infoData;
	}
	return { video: [], audio: [] };
});

const onWPLInfo = (data: any) => {
	if (data?.token) {
		wplCurrentInfoToken.value = data.token;
	}
	if (wplPtzShow.value) {
		closeWplPtz();
	}
	wplInformationShow.value = true;
};

const closeWplInformation = () => {
	wplInformationShow.value = false;
	wplCurrentInfoToken.value = "";
};

const onWPLPtz = ({ token }: any) => {
	if (!token) return;
	if (wplPtzShow.value && wplPtzToken.value === token) {
		closeWplPtz();
	} else {
		showWplPtz(token);
	}
};

const showWplPtz = async (token: string) => {
	if (wplInformationShow.value) {
		closeWplInformation();
	}
	wplPtzToken.value = token;
	wplPtzShow.value = true;
	if (wplPlayerRef.value) {
		const player = wplPlayerRef.value as any;
		player.ptzToken = token;
		await player.getPresets();
		const presetValue = player.presetList;
		if (presetValue && Array.isArray(presetValue) && presetValue.length > 0) {
			wplPresetData.value = presetValue;
		} else {
			wplPresetData.value = [];
		}
		wplPtzSpeed.value = player.ptzSpeed ?? 0.5;
	}
};

const closeWplPtz = () => {
	wplPtzShow.value = false;
	wplPtzToken.value = "";
	wplPresetData.value = [];
	if (wplPlayerRef.value) {
		(wplPlayerRef.value as any).closePtz();
	}
};

const wplPtzAction = (action: string) => {
	if (!wplPtzToken.value || !wplPlayerRef.value) return;
	const player = wplPlayerRef.value as any;
	player.ptzSpeed = wplPtzSpeed.value;
	player.ptzAction(action);
};

const gotoWplPreset = (presetToken: string) => {
	if (!wplPtzToken.value || !wplPlayerRef.value) return;
	(wplPlayerRef.value as any).gotoPreset(presetToken);
};

const deleteWplPreset = async (presetToken: string) => {
	if (!wplPtzToken.value || !wplPlayerRef.value) return;
	try {
		await ElMessageBox.confirm(
			'Are you sure you want to delete this preset position?',
			'Tip',
			{ type: 'warning' }
		);
		const player = wplPlayerRef.value as any;
		await player.deletePreset(presetToken);
		await player.getPresets();
		wplPresetData.value = player.presetList;
		ElMessage({
			message: 'Deleted successfully',
			type: 'success',
		})
	} catch (error) {
		if (error !== 'cancel') console.error(error);
	}
};

const onWPLLocalSnapshot = (data: any) => {
	const { path } = data;
	if (path) {
		ElMessage.success({
			message: `Local snapshot saved successfully. File path:<br/>${path}`,
			duration: 4000,
			customClass: 'message-bl',
			dangerouslyUseHTMLString: true,
		})
	}
};

const onWPLLocalRecord = (data: any) => {
	const { token, windowIndex, path, isRecording } = data;
	if (isRecording) {
		ElMessage.success({
			message: 'Local recording started',
			duration: 1000,
			customClass: 'message-bl',
		});
	} else {
		ElMessage.success({
			message: `Local recording saved successfully. File path:<br/>${path}`,
			customClass: 'message-bl',
			duration: 4000,
			dangerouslyUseHTMLString: true,
		})
	}
};

const onWPLServeSnapshot = (data: any) => {
	const { token } = data;
	if (token) {
		ElMessage.success({
			message: 'Server snapshot succeeded',
			duration: 1000,
			customClass: 'message-bl',
		});
	}
};

const onWPLServeRecord = (data: any) => {
	const { token, windowIndex, isRecording } = data;
	if (isRecording) {
		ElMessage.success({
			message: 'Server recording started',
			duration: 1000,
			customClass: 'message-bl',
		})
	} else {
		ElMessage.success({
			message: 'Server recording ended',
			duration: 1000,
			customClass: 'message-bl',
		})
	}
};

const StopPlay = (type: string) => {
	if (type === 'all' && wplPlayerRef.value) {
		wplPlayerRef.value.stopAll();
		clearAllPlayingState();
	}
}

//清除所有播放状态
const clearAllPlayingState = () => {
	channelTokens.value = {};
	channelStream.value = {};

	// 直接从 playingNodeRefs 中遍历所有播放中的节点
	playingNodeRefs.value.forEach((nodeData, token) => {
		nodeData.isPlaying = false;
		const iconConfig = getDeviceIconConfig(nodeData, false);
		nodeData.iconfont = iconConfig.iconfont;
		nodeData.iconSvg = iconConfig.iconSvg;
		nodeData.iconclass1 = iconConfig.iconclass1;
		nodeData.iconclass2 = iconConfig.iconclass2;
		nodeData.iconclass3 = iconConfig.iconclass3;
	});

	playingIdArr.value = [];
	playingChannels.value.clear();
	playingNodeRefs.value.clear();

	wplToken.value = {};
	clickedWindowIndex.value = null;
	refreshWPLRecordCalendar('');
	if (wplInformationShow.value) {
		closeWplInformation();
	}
	if (wplPtzShow.value) {
		closeWplPtz();
	}

	windowDeviceIpMap.value.clear();
	const count = Number(localStorage.getItem('hproViewCount'));
	if (count <= 1) {
		const loggedIn = new Set(
			siteStore.siteDevices
				.filter((site: DiscoveredDevice) => site.login === true && site.session)
				.map((site: DiscoveredDevice) => site.ipv4Address)
		);
		const allKeys = Object.keys(localStorage);
		const viewKeys = allKeys.filter(key => key.startsWith('hpro_view_'));
		for (const key of viewKeys) {
			const ip = key.replace('hpro_view_', '');
			if (loggedIn.has(ip)) {
				try {
					const cached = localStorage.getItem(key);
					if (cached) {
						const data = JSON.parse(cached);
						data.windows = {};
						localStorage.setItem(key, JSON.stringify(data));
					}
				} catch (error) {
					console.error('failed to clear :', error);
				}
			}
		}
	}
	liveplayState.value = { layoutType: liveplayState.value.layoutType, windows: {} }
	replayState.value = { layoutType: replayState.value.layoutType, windows: {} }
}

//============ 回 放 ============
//日历
const preYearWPL = () => {
	if (!dateValue.value) return;
	const newDate = new Date(dateValue.value);
	newDate.setFullYear(newDate.getFullYear() - 1);
	dateValue.value = newDate;
	calendarKey.value++;
}

const preMonthWPL = () => {
	if (!dateValue.value) return;
	const newDate = new Date(dateValue.value);
	newDate.setMonth(newDate.getMonth() - 1);
	dateValue.value = newDate;
	calendarKey.value++;

	const token = wplToken.value[clickedWindowIndex.value || 0];
	if (token) {
		setTimeout(() => refreshWPLRecordCalendar(token), 200);
	}
}

const today = () => {
	dateValue.value = new Date();
	calendarKey.value++;
}

const nextMonthWPL = () => {
	if (!dateValue.value) return;
	const newDate = new Date(dateValue.value);
	newDate.setMonth(newDate.getMonth() + 1);
	dateValue.value = newDate;
	calendarKey.value++;

	const token = wplToken.value[clickedWindowIndex.value || 0];
	if (token) {
		setTimeout(() => refreshWPLRecordCalendar(token), 200);
	}
}

const nextYearWPL = () => {
	if (!dateValue.value) return;
	const newDate = new Date(dateValue.value);
	newDate.setFullYear(newDate.getFullYear() + 1);
	dateValue.value = newDate;
	calendarKey.value++;
}

const refreshWPLRecordCalendar = (token: string) => {
	const { root, session } = getDeviceInfo();
	if (!token) {
		const wrapper = document.querySelector('.calendar-wrapper');
		if (wrapper) {
			wrapper.querySelectorAll('.record-dot-mark').forEach(el => el.remove());
		}
		wplCustomDateArr.value = [];
		calendarKey.value++;
		return;
	}
	if (!wplPlayerRef.value) return;
	const defaultStorage = (wplPlayerRef.value as any)?.DefaultStorage;

	if (defaultStorage !== 'CentralStorage') {
		wplCustomDateArr.value = [];
		calendarKey.value++;
		return;
	}

	const currentYear = dateValue.value.getFullYear();
	const currentMonth = dateValue.value.getMonth() + 1;

	const url = root + "/api/v1/SearchStorRecordCalendar?token=" + token + "&year=" + currentYear + "&month=" + currentMonth + "&session=" + session;

	fetch(url).then(response => response.json()).then(result => {
		const recordDays: number[] = [];
		if (result.data?.record || result.record) {
			const records = result.data?.record || result.record;
			records.forEach((key: any) => {
				if (key.bHasRec || key.bHasAnalyticsRec) {
					recordDays.push(key.nDay);
				}
			});
		}
		setTimeout(() => {
			const wrapper = document.querySelector('.calendar-wrapper');
			if (!wrapper) return;

			wrapper.querySelectorAll('.record-dot-mark').forEach(el => el.remove());

			const cells = wrapper.querySelectorAll('.el-calendar-table td');
			cells.forEach(cell => {
				const daySpan = cell.querySelector('.el-calendar-day span') as HTMLElement;
				if (!daySpan) return;

				const dayNum = parseInt(daySpan.innerText);
				if (isNaN(dayNum)) return;

				const isCurrentMonth = !cell.classList.contains('prev') && !cell.classList.contains('next');

				if (isCurrentMonth && recordDays.includes(dayNum)) {
					const dot = document.createElement('span');
					dot.className = 'record-dot-mark';
					dot.style.cssText = `
            position: absolute;
            top: 1px;
            left: 1px;
            width: 0;
            height: 0;
            border-right:14px solid transparent;
						border-top:14px solid #FFFFFF;
            pointer-events: none;
						z-index:2
          `;
					if (getComputedStyle(cell).position === 'static') {
						(cell as HTMLElement).style.position = 'relative';
					}
					cell.appendChild(dot);
				}
			});
		}, 200);
	}).catch(error => {
		console.error(error);
	});
}

const handleWPLDateChange = (date: Date) => {
	const { session } = getDeviceInfo();
	if (!wplPlayerRef.value) return;

	const activeWindow = clickedWindowIndex.value !== null ? clickedWindowIndex.value : 0;
	const token = wplToken.value[activeWindow];

	if (!token) return;

	refreshWPLRecordCalendar(token);

	const timevalue = date || dateValue.value;
	const year = timevalue.getFullYear();
	const month = String(timevalue.getMonth() + 1).padStart(2, '0');
	const strDay = String(timevalue.getDate()).padStart(2, '0');
	const localOffset = String(Math.abs(timevalue.getTimezoneOffset() / 60));

	const timevalues = year + '-' + month + '-' + strDay + 'T' + '00:00:00' + '0' + localOffset + ':00';
	const timevaluee = year + '-' + month + '-' + strDay + 'T' + '23:59:59' + '0' + localOffset + ':00';

	const serverpb = (wplPlayerRef.value as any).DefaultStorage === 'CentralStorage' ? 'true' : 'false';

	const pbconf = {
		begintime: timevalues,
		endtime: timevaluee,
		moveto: timevalues,
		serverpb: serverpb,
	};

	wplPlayerRef.value.playback({
		windowIndex: activeWindow,
		token: token,
		streamprofile: 'main',
		session: session,
		channelName: token,
		pbconf: pbconf
	});
}

const showCalendar = computed(() => {
	if (isLive.value) return false;
	if (!wplPlayerRef.value) return false;

	const defaultStorage = (wplPlayerRef.value as any)?.DefaultStorage;
	const storage = defaultStorage?.value ?? defaultStorage;
	return storage === 'CentralStorage';
})

const getNodeClass = (node: TreeNode) => {
	const classes = ['tree-node'];
	if (node.type === 'device') {
		// get online status
		const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);

		if (isOnline) {
			classes.push('device-online');
		} else {
			classes.push('device-offline');
		}
	}
	return classes.join(' ');
};

const getDeviceIconConfig = (data: any, isPlaying: boolean) => {
	const config = {
		iconSvg: "",
		iconfont: "",
		iconclass1: "",
		iconclass2: "",
		iconclass3: "",
	};
	const recording = data.data?.recording ?? false;
	const online = data.online !== undefined ? data.online : (data.data?.online ?? true);
	if (isPlaying) {
		if (recording) {
			config.iconSvg = 'icon-lvshexiangji';
		} else if (!online) {
			config.iconfont = 'icon-shexiangjilixian';
		} else {
			config.iconfont = 'icon-baishexiang';
		}
		config.iconclass1 = 'el-tree-camera-play';
		config.iconclass3 = 'none';
		return config;
	}

	if (!online) {
		config.iconfont = 'icon-shexiangjilixian';
		config.iconclass1 = 'el-tree-camera';
		return config;
	}

	if (recording) {
		if (store.darkMode) {
			config.iconSvg = '#icon-baishexiangji';
		} else {
			config.iconSvg = '#icon-heishexiangji';
		}
		config.iconclass1 = 'el-tree-camera';
		return config;
	}

	config.iconfont = 'icon-baishexiangji';
	config.iconclass1 = 'el-tree-camera';
	return config;
}

const updateTreeNodeIcon = (token: string, isPlaying: boolean) => {
	const findAndUpdateNode = (nodes: any[]): boolean => {
		for (const node of nodes) {
			if (node.token === token && node.type === 'device' && node.isLeaf) {
				const iconConfig = getDeviceIconConfig(node, isPlaying);

				node.iconSvg = iconConfig.iconSvg;
				node.iconfont = iconConfig.iconfont;
				node.iconclass1 = iconConfig.iconclass1;
				node.iconclass2 = iconConfig.iconclass2;
				node.iconclass3 = iconConfig.iconclass3;

				return true;
			}
			if (node.children && node.children.length > 0) {
				if (findAndUpdateNode(node.children)) {
					return true;
				}
			}
		}
		return false;
	};
	findAndUpdateNode(channelData.value);
}

const handleAnalyticsImageClick = (data: any) => {
	window.ipcRenderer.send('open-playback', {
		img: data.img,
		channelName: data.channelName,
		time: data.time,
		trackId: data.trackid,
		targetType: data.targetType,
		ruleType: data.ruleType,
		confidence: data.confidence,
		strEntity: data.strEntity,
		anaEvent: data.anaEvent,
		channelToken: data.channelToken,
		parentWindowId: data.windowId
	});
}

const restorePlayingState = async () => {
	if (hasRestored.value) return;
	let attempts = 0;
	while (attempts < 5) {
		if (wplPlayerRef.value) {
			const player = wplPlayerRef.value as any;
			if (player?.isConnected || player?.wsManager?.isWsConnected) {
				break;
			}
		}
		await new Promise(resolve => setTimeout(resolve, 100));
		attempts++;
	}
	const count = Number(localStorage.getItem('hproViewCount') || '0');
	if (count !== 1) {
		hasRestored.value = true;
		return;
	}
	const loggedInSite = siteStore.siteDevices.filter(
		(site: DiscoveredDevice) => site.login === true && site.session
	);

	if (loggedInSite.length === 0) {
		hasRestored.value = true;
		liveplayState.value = { layoutType: 'WPL_LAYOUT_MODE_3X3', windows: {} }
		return;
	}

	let matched = false;

	for (const site of loggedInSite) {
		const cached = localStorage.getItem(`hpro_view_${site.ipv4Address}`);
		if (!cached) continue;

		try {
			const cacheData = JSON.parse(cached);
			if (cacheData.isLive !== true) continue;
			const windows = cacheData.windows || {};
			if (Object.keys(windows).length > 0) {
				const stateToRestore = {
					layoutType: cacheData.layoutType || 'WPL_LAYOUT_MODE_3X3',
					windows: windows
				};
				liveplayState.value = stateToRestore;
				const protocol = site.enableHttps ? 'https:' : 'http:';
				const port = site.enableHttps ? Number(site.httpsPort) : Number(site.httpPort);
				await restorePlayState(stateToRestore, site.session, site.ipv4Address, port, protocol);
				matched = true;
				break;
			} else {
				const stateToRestore = {
					layoutType: cacheData.layoutType || 'WPL_LAYOUT_MODE_3X3',
					windows: {}
				};
				liveplayState.value = stateToRestore;
				const protocol = site.enableHttps ? 'https:' : 'http:';
				const port = site.enableHttps ? Number(site.httpsPort) : Number(site.httpPort);
				await restorePlayState(stateToRestore, site.session, site.ipv4Address, port, protocol);
				matched = true;
				break;
			}
		} catch (error) {
			console.error('recover layout type failed:', error);
		}
	}
	if (!matched) {
		liveplayState.value = { layoutType: 'WPL_LAYOUT_MODE_3X3', windows: {} }
	}
	hasRestored.value = true;
}

const checkTokenExists = async (token: string): Promise<boolean> => {
	if (!token) return false;
	const findToken = (nodes: any[]): boolean => {
		for (const node of nodes) {
			if (node.data && node.data.token === token) return true;
			if (node.token === token) return true;
			if (node.children && node.children.length > 0) {
				if (findToken(node.children)) return true;
			}
		}
		return false;
	}
	if (channelData.value && channelData.value.length > 0) {
		return findToken(channelData.value);
	}
	await loadDeviceTree();
	return findToken(channelData.value);
}

const buildPlayState = () => {
	if (!wplPlayerRef.value) return null;
	const player = wplPlayerRef.value as any;
	const currentLayout = player.currentLayoutType || 'WPL_LAYOUT_MODE_3X3';
	const windows: Record<number, any> = {};
	const allWindows = player.getAllPlayingWindows?.() || [];

	allWindows.forEach((windowIndex: number) => {
		const info = player.getWindowInfo?.(windowIndex);
		if (info) {
			let currentTime = undefined;
			if (info.isPlayback) {
				const timeValue = player.windowCurrentTime?.get?.(windowIndex);
				if (timeValue instanceof Date) {
					currentTime = timeValue.toISOString();
				} else if (typeof timeValue === 'string') {
					currentTime = timeValue;
				}
			}
			windows[windowIndex + 1] = {
				token: info.token || '',
				streamprofile: info.streamprofile || 'main',
				channelName: info.channelName || info.token || '',
				isPlayback: !!info.isPlayback,
				playbackBeginTime: info.playbackBeginTime || undefined,
				playbackEndTime: info.playbackEndTime || undefined,
				currentTime: currentTime,
			};
		}
	});
	return {
		layoutType: currentLayout,
		windows: windows,
	}
}

const handleStorageChange = (e: StorageEvent) => {
	if (e.key === 'hproViewCount') {
		const count = Number(e.newValue);
	}
}

const getMsg = (data: any) => {
	if (data.type === 'site') {
		const site = data.data || data;
		const port = site.enableHttps ? site.httpsPort : site.httpPort;
		return `${site.ipv4Address}:${port}`;
	}
}

const selectColor = (data:any,event:Event) => {
	if(data.type === 'site'){
		event.stopPropagation();
	}
  if(data.type !== 'site'){
    // if(selectedNode.value){
    //   selectedNode.value = null;
    //   isSelected.value = false;
    // }
    return;
  }

  if(selectedNode.value === data){
    selectedNode.value = null;
    isSelected.value = false;
  }else{
    selectedNode.value = data;
    isSelected.value = true;
  }
}

const siteStyle = (data:any) => {
  if(data.type === 'site' && isSelected.value && selectedNode.value === data){
    return {
      backgroundColor:'#4D5C70'
    }
  }
  return {}
}

onBeforeUnmount(() => {
	if (window.ipcRenderer && typeof window.ipcRenderer.removeAllListeners === 'function') {
		window.ipcRenderer.removeAllListeners('window-closing');
		window.ipcRenderer.removeAllListeners('standalone-window');
		window.ipcRenderer.removeAllListeners('video-wall-play');
		window.ipcRenderer.removeAllListeners('did-finish-load');
		window.ipcRenderer.removeAllListeners('window-before-close');
	}

	if (gamepad) {
		gamepad.stopListening();
	}

	window.removeEventListener('storage', handleStorageChange);
	window.removeEventListener('storage', (event) => {
		if (event.key === 'themeStore') {
			loadDeviceTree();
		}
	});
})

watch(
	() => siteStore.siteDevices,
	(newDevices, oldDevices) => {
		if (newDevices && newDevices.length > 0) {
			loadDeviceTree();
		}
	},
	{ deep: true, immediate: true }
);

watch(dateValue, (newVal, oldVal) => {
	if (!newVal || !wplPlayerRef.value) return;
	if (oldVal && newVal.getTime() === oldVal.getTime()) return;
	if (isSettingDateValue.value) return;
	handleWPLDateChange(newVal);
}, { deep: true });

watch(wplPlayerRef, (newValue) => {
	if (newValue) {
		const defaultStorage = (newValue as any)?.DefaultStorage?.value || (newValue as any)?.DefaultStorage;
		if (defaultStorage === 'CentralStorage') {
			const token = wplToken.value[clickedWindowIndex.value || 0];
			if (token) {
				refreshWPLRecordCalendar(token);
			}
		}
	}
}, { immediate: true });

watch(analyticsEvent, (newValue, oldValue) => {
	nextTick(() => {
		if (wplPlayerRef.value) {
			(wplPlayerRef.value as any)?.syncWindowPosition?.();
			if (!isLive.value) {
				setTimeout(() => {
					(wplPlayerRef.value as any)?.reinitTimeline?.();
				}, 200);
			}
		}
	});
});

</script>
<style scoped lang="scss">
#liveplay {
	width: 100%;
	height: 100%;
	display: flex; // 添加 Flexbox 布局
	flex-direction: column; // 设置主轴方向为垂直

	.selected-item {
		border: 2px solid red !important; // 红色边框
		box-sizing: border-box; // 防止边框影响布局
	}

	.liveplay_header {
		height: 35px;
	}

	.liveplay_top {
		display: flex;
		justify-content: space-between;
		height: 100%;
	}

	.liveplay_left {
		width: 280px;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;

		.el-collapse {
			flex: 1;
			min-height: 0;
			overflow: hidden;

			:deep(.el-collapse-item__wrap) {
				overflow: hidden;
			}

			:deep(.el-collapse-item__content) {
				padding: 0;
				overflow: hidden;
				height: 100%;
			}

			:deep(.el-tree-v2) {
				height: 100% !important;
				max-height: calc(100vh - 320px);
				overflow: auto;
			}
		}

		.liveplay_left_top {
			padding: 0 17px;
			height: 40px;
			line-height: 40px;
			display: flex;
			justify-content: space-between;

			span {
				font-size: 18px;
				cursor: pointer;
			}
		}

		.liveplay_left_search {
			text-align: center;
			padding: 14px;

			.liveview_left_input {

				.el-input__inner {
					width: 100%;
					border: none;
				}
			}
		}

		.liveplay_collapse_title {
			width: 100%;
			padding: 0 10px 0 20px;
			box-sizing: border-box;

			display: flex;
			justify-content: space-between;
		}

		.custom-tree-node {
			display: flex;
			align-items: center;
			width: 100%;
			white-space: nowrap;
			justify-content: space-between;

			.nowplay {
				display: none;
				font-size: 12px;
				color: #606266;
				padding-left: 4px;
				line-height: 23px;
				color: #30D158;

				.dot {
					font-size: 12px;
					line-height: 23px;
					padding-right: 4px;
				}

				.nowplayText {
					line-height: 26px;
				}
			}

			.nowplay.none {
				display: block !important;
			}

			&.offline-node {
				.iconfont {
					color: #9A9A9A;
				}

				.text {
					color: #9A9A9A;
				}
			}
		}

		.playing-node {

			.iconfont {
				color: #30D158 !important;
			}

			.text {
				color: #30D158 !important;
			}

			.nowplay {
				color: #30D158 !important;
			}
		}

		.calendar-wrapper {
			flex-shrink: 0;
			width: 100%;
			top: auto;
			bottom: 0;
			padding: 4px 6px 2px;
			box-sizing: border-box;
			border-top: 1px solid rgba(255, 255, 255, 0.06);
			background: inherit;

			.date_button {
				display: flex !important;
				width: 100% !important;
				justify-content: space-between !important;
				margin-bottom: 0;

				.el-button {
					padding: 0 4px;
					font-size: 11px;
					height: 22px;
					min-height: 22px;
					border: none;
					background: transparent;

					&.el-calendar-title {
						flex: 1;
						text-align: center;
						font-size: 12px;
						font-weight: 500;
						cursor: pointer;

						&:hover {
							color: #0399FE;
						}
					}

					&:hover {
						color: #0399FE;
					}
				}
			}

			.custom-week-header {
				display: flex;
				justify-content: space-around;
				padding: 1px 0;

				.week-item {
					flex: 1;
					text-align: center;
					font-size: 10px;
					padding: 1px 0;
					opacity: 0.5;
				}
			}

			:deep(.el-calendar) {
				height: auto !important;
				background: transparent !important;

				.el-calendar__header {
					display: none !important;
				}

				.el-calendar__body {
					padding: 0 !important;
				}

				.el-calendar-table {
					width: 100%;
					table-layout: fixed;

					thead {
						display: none !important;
					}

					td {
						position: relative;
						padding: 0 !important;
						text-align: center;
						border: none !important;

						.el-calendar-day {
							height: 0;
							padding-bottom: 100%;
							position: relative;
							display: flex;
							align-items: center;
							justify-content: center;
							font-size: 11px;
							cursor: pointer;
							// border-radius: 50%;
							transition: all 0.15s ease;

							&:hover {
								background-color: rgba(3, 153, 254, 0.12);
							}

							span {
								position: absolute;
								top: 50%;
								left: 50%;
								transform: translate(-50%, -50%);
								font-size: 10px;
								line-height: 1;
							}
						}

						&.is-today .el-calendar-day span {
							color: #409EFF;
							font-weight: 600;
						}

						&.is-selected {
							background-color: transparent;

							.el-calendar-day {
								background-color: #0399FE !important;

								span {
									color: #FFFFFF !important;
								}
							}
						}

						&.custom_date_class .el-calendar-day::after {
							content: '';
							position: absolute;
							bottom: 10%;
							left: 50%;
							transform: translateX(-50%);
							width: 4px;
							height: 4px;
							background-color: #0399FE;
							border-radius: 50%;
							opacity: 0.8;
						}

						&.prev,
						&.next {
							.el-calendar-day span {
								opacity: 0.3;
							}
						}
					}
				}
			}
		}
	}

	.liveplay_right {
		flex-grow: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;

		.liveplay_right_top {
			flex: 1;
			display: flex;
			overflow: hidden;

			:deep(.wpl-player-container) {
				flex: 1;
				min-height: 0;
			}

			.analytics {
				width: 20%;
				height: 100%;
				flex-shrink: 0;
				box-sizing: border-box;
				padding: 0 4px;
				overflow-y: auto;
			}
		}

		.liveplay_right_bottom {
			height: 35px;
			padding: 0 10px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-top: auto;

			.liveplay_bottom_left {
				display: flex;
				gap: 0;

				.changeLiveReplay {
					width: 90px;
					height: 28px;
					border-radius: 4px;
					text-align: center;
					line-height: 28px;
					cursor: pointer;
					transition: all 0.3s;
					font-size: 12px;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					gap: 4px;

					&:first-child {
						border-radius: 16px 0 0 16px;
					}

					&:last-child {
						border-radius: 0 16px 16px 0;
						margin-left: -1px;
					}

					&:hover:not(.live) {
						border-color: #0399FE;
						color: #0399FE;

						.iconfont {
							color: #0399FE;
						}
					}

					.iconfont {
						font-size: 20px;
					}
				}
			}

			.liveplay_bottom_guanbi {
				display: flex;
				line-height: 31px;
				gap: 5px;
			}
		}

	}

	.gamepadCtx {
		color: #ffffff;
		position: absolute;
		bottom: 5px;
		left: 15px;
		background: rgba(0, 0, 0, 0.3);
		box-sizing: content-box;
		display: none;

		.gamepadCtxContent {
			padding: 0 3px;
			line-height: 25px;

			span {
				animation: blink 1.4s infinite both;
			}

			span:nth-child(2) {
				animation-delay: 0.2s;
			}

			span:nth-child(3) {
				animation-delay: 0.4s;
			}


			@keyframes blink {
				0% {
					opacity: 0;
				}

				20% {
					opacity: 1;
				}

				100% {
					opacity: 0;
				}
			}
		}

		.gamepadCtxIcon {
			background-color: #0399FE;
			font-size: 20px;
			width: 25px;
			height: 25px;
			text-align: center;
			line-height: 25px;
		}
	}

	.wpl-information-panel {
		position: absolute;
		bottom: 10px;
		width: 280px;
		border-radius: 8px;
		transition: all 0.1s ease;

		&.info-hide {
			display: none;
		}

		.info-header {
			padding: 10px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: 14px;

			i {
				display: block;
				width: 20px;
				height: 20px;
				line-height: 20px;
				text-align: center;
				border-radius: 50%;
				cursor: pointer;
				font-size: 10px;

				&:hover {
					opacity: 0.7;
				}
			}
		}

		.information_con {
			width: 100%;
			height: 90%;
			display: flex;
			justify-content: space-between;
			flex-wrap: wrap;
			align-content: space-between;

			.information1 {
				width: 50%;

				.information_title {
					width: 100%;
					height: 30px;
					line-height: 30px;
					padding: 0 4px;
					font-size: 14px;
				}

				.information_content {
					// width: 80%;
					display: flex;
					justify-content: space-between;
					padding: 0 4px;

					.information_content_left,
					.information_content-right {
						// width: 50%;
						color: #3ABBFE !important;
						text-align: left;
					}
				}
			}
		}
	}

	.wpl-ptz-panel {
		position: absolute;
		padding: 5px;
		bottom: 0;
		width: 280px;
		height: 550px;
		border-radius: 8px;
		transition: bottom 0.3 ease;
		z-index: 1000;

		&.yuntai {
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

						.preset_input {
							width: 150px;
							// background-color: transparent;
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

		&.yuntai-hide {
			bottom: -600px;
		}

		.header {
			width: 100%;
			height: 32px;
			padding-left: 5px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			cursor: pointer;

			i {
				display: block;
				width: 20px;
				height: 20px;
				line-height: 20px;
				text-align: center;
				border-radius: 50%;
				cursor: pointer;
				font-size: 10px;

				&:hover {
					opacity: 0.7;
				}
			}
		}

		.controls {
			width: 100%;
			height: 144px;
			display: flex;
			justify-content: space-between;
			margin: 17px 0;

			.left {
				width: 60px;
				height: 100%;
				display: grid;
				grid-template-columns: repeat(2, 28px);
				grid-template-rows: repeat(4, 28px);
				grid-column-gap: 4px;
				grid-row-gap: 4px;

				i {
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: 4px;
					width: 28px;
					height: 28px;
					font-size: 17px;
					cursor: pointer;

					&:active {
						color: #0399FE;
					}
				}
			}

			.right {
				width: 125px;
				height: 100%;
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				grid-template-rows: repeat(3, 1fr);
				grid-column-gap: 0px;
				grid-row-gap: 0px;

				.ptz-item {
					position: relative;
					display: flex;
					justify-content: center;
					align-items: center;
					cursor: pointer;

					i {
						font-size: 19px;
					}

					&:active i {
						color: #0399FE;
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

				.concer {

					.zs,
					.ys,
					.zx,
					.yx {
						position: absolute;
						width: 28px;
						height: 28px;
						border-radius: 4px;
						display: flex;
						align-items: center;
						justify-content: center;
						cursor: pointer;

						i {
							font-size: 16px;
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
						bottom: 0;
						left: 0;
					}

					.yx {
						right: 0;
						bottom: 0;
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

			span {
				width: 40px;
				text-align: center;
			}

			.el-slider {
				width: 100%;
			}
		}

		.preset-section {
			max-height: 300px;
			overflow-y: auto;

			.preset-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 10px;
			}

			.preset-item {
				display: flex;
				align-items: center;
				gap: 8px;

				.preset-input {
					flex: 1;
					background: transparent;
					border: 1px solid;
					border-radius: 4px;
					padding: 4px 8px;
					color: #FFFFFF;
				}

				button {
					background: transparent;
					border: none;
					cursor: pointer;
					font-size: 16px;

					&:hover {
						opacity: 0.7;
					}
				}
			}
		}

		.el-timeline {

			/* padding: 0 17px; */
			:deep(.el-timeline-item) {
				padding-bottom: 5px;
			}

			:deep(.el-timeline-item__wrapper) {
				.el-card__body {
					padding: 0 !important;
				}

				.preset_bgc {
					width: 100%;
					display: flex;
					// justify-content: space-between;
					align-items: center;
					background-color: transparent;

					.preset_input {
						width: 130px;
						border: none;
						box-shadow: none;
						padding-left: 10px;
					}

					button {
						background-color: transparent;
						border: none;
						cursor: pointer;
						font-size: 16px;

						&:hover {
							opacity: 0.7;
						}
					}
				}
			}
		}
	}

	:global(.message-bl) {
		max-width: 240px !important;
		width: auto !important;
		position: fixed !important;
		top: auto !important;
		right: auto !important;
		bottom: 10px !important;
		left: 5px !important;
		transform: none !important;

		.el-message__content {
			word-break: break-all !important;
			white-space: normal !important;
			line-height: 1.5 !important;
		}
	}

	:global(.el-popper) {
		color: #FFFFFF !important;
		background-color: #303133 !important;
		border-color: #303133 !important;
	}

	:global(.el-popper__arrow) {
		display: none;
	}

	.liveplay_right_bottom {
		.switGrid:hover {
			color: #3099FE;
		}

		.liveplay_bottom_guanbi {
			:hover {
				color: #3099FE;
			}
		}
	}

	.context-menu {
		width: 140px;
		padding: 10px 0;
		background-color: #3A3A3A;
		position: absolute;
		border-radius: 4px;
		z-index: 9999;

		.menu-item {
			width: 100%;
			height: 37px;
			font-size: 14px;
			text-align: center;
			line-height: 37px;
			cursor: pointer;
		}

		.menu-item:hover {
			background-color: #555555;
		}
	}

}
</style>