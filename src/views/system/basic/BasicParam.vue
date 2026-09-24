<template>
    <div id="client_config_basic_param">
        <div class="WPL_LocalConfig" style="margin-top: 20px;">
            <div class="upperPart">
                <div class="setting">
                    <div class="wpl-config-item" v-if="Configstore.isLinux || Configstore.isWindows">
                        <span class="Aside_content_title">Recording Path :</span>
                        <el-input spellcheck="false" class="wpl-config-input" v-model="wplRecordPath" placeholder="">
                        </el-input>
                    </div>
                    <div class="wpl-config-item" v-if="Configstore.isLinux || Configstore.isWindows">
                        <span class="Aside_content_title">Snapshot Path :</span>
                        <el-input spellcheck="false" class="wpl-config-input" v-model="wplCapturePath" placeholder="">
                        </el-input>
                    </div>
                    <div class="wpl-config-item" v-if="Configstore.isLinux || Configstore.isWindows">
                        <span class="Aside_content_title">GPU Decoding</span>
                        <el-switch v-model="wplGpuDecoding" active-value="true" inactive-value="false"></el-switch>
                    </div>
                    <div class="wpl-config-item" v-if="Configstore.isLinux || Configstore.isWindows">
                        <span class="Aside_content_title">Metadata Rendering</span>
                        <el-switch v-model="wplMetaRender" active-value="true" inactive-value="false"></el-switch>
                    </div>
                    <div class="wpl-config-item" v-if="Configstore.isLinux || Configstore.isWindows">
                        <span class="Aside_content_title">GPU Status :</span>
                        <span v-if="wplGpuEnable === 'true'">GPU Available</span>
                        <span v-else>GPU Not Available</span>
                    </div>
                    <div class="wpl-config-item" v-if="Configstore.isLinux || Configstore.isWindows">
                        <span class="Aside_content_title">Decoder Version :</span>
                        <span>{{ wplVision }}</span>
                    </div>
                    <div class="wpl-config-item">
                        <span class="Aside_content_title">Metadata Rendering</span>
                        <el-switch v-model="metaData"></el-switch>
                    </div>
                    <div class="wpl-config-item">
                        <span class="Aside_content_title">Aspect Ratio</span>
                        <el-switch v-model="aspectRatio"></el-switch>
                    </div>
                    <div class="wpl-config-item">
                        <span class="Aside_content_title">WS Decoder:</span>
                        <span>{{ ws2decoder }}</span>
                    </div>
                </div>
            </div>
            <div class="LowerPart">
                <el-button class="saveBtn" type="primary" @click="saveWPLConfig()"
                    style="align-items: center;">save</el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted, onErrorCaptured, ref, reactive, computed, watch } from "vue";
import { useRouter } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { fetchWPLConfig, getWPLConfig, isWPLPlayerReady, saveWPLConfigToMain } from "../../../utils/initWPL";
import { useClientConfig } from "../../../store/client";
import { H5sGetClientWSDecoder } from '../../../assets/js/h5splayer.js'
import { usePlayStore } from "../../../store/play";

interface WPLConfig {
    recordPath: string;
    capturePath: string;
    gpuDecoding: string;
    metaRender: string;
    gpuSupport: string;
    wplVision: string;
}

const { t, locale } = useI18n()
const router = useRouter();
const Configstore = useClientConfig();
const playStore = usePlayStore();

const wplRecordPath = ref<string>(Configstore.wplRecordPath || '');
const wplCapturePath = ref<string>(Configstore.wplCapturePath || '');
const wplGpuDecoding = ref<string>(Configstore.wplGpuDecoding || 'false');
const wplMetaRender = ref<string>(Configstore.wplMetaRender || 'true');
const isPlayerReady = computed(() => isWPLPlayerReady());
const player = ref(window.$wplPlayer);
const wplGpuEnable = ref<string>('false');
const wplVision = ref<string>('');
const ws2decoder = H5sGetClientWSDecoder();
const metaData = ref(playStore.ws2MetaData);
const aspectRatio = ref(playStore.aspectRatio);

const saveWPLConfig = async () => {
    if (Configstore.isLinux || Configstore.isWindows) {
        if (!player) return;
        const config = {
            recordPath: wplRecordPath.value,
            capturePath: wplCapturePath.value,
            gpuDecoding: wplGpuDecoding.value,
            metaRender: wplMetaRender.value,
        };

        const success = await saveWPLConfigToMain(config);

        if (success) {
            Configstore.wplConfig({
                wplRecordPath: config.recordPath,
                wplCapturePath: config.capturePath,
                wplGpuDecoding: String(config.gpuDecoding),
                wplMetaRender: String(config.metaRender),
            });

            ElMessage.success(t('Common.comm_save_success'));
        } else {
            ElMessage.error(t('Common.comm_save_failed'));
        }
    }else if(Configstore.isMac){
        playStore.ws2MetaData = metaData.value;
        playStore.aspectRatio = aspectRatio.value;
    }

}

const requestWPLConfig = async () => {
    try {
        const config = await getWPLConfig();
        if (config && typeof config === 'object') {
            const configData = config as WPLConfig;
            if (configData.recordPath !== undefined && configData.recordPath !== '') {
                wplRecordPath.value = configData.recordPath;
            }
            if (configData.capturePath !== undefined && configData.capturePath !== '') {
                wplCapturePath.value = configData.capturePath;
            }
            if (configData.gpuDecoding !== undefined && configData.gpuDecoding !== '') {
                wplGpuDecoding.value = String(configData.gpuDecoding);
            }
            if (configData.metaRender !== undefined && configData.metaRender !== '') {
                wplMetaRender.value = String(configData.metaRender);
            }
            if (configData.gpuSupport !== undefined && configData.gpuSupport !== '') {
                wplGpuEnable.value = String(configData.gpuSupport);
            }
            if (configData.wplVision !== undefined && configData.wplVision !== '') {
                wplVision.value = configData.wplVision;
            }

            Configstore.wplConfig({
                wplRecordPath: wplRecordPath.value,
                wplCapturePath: wplCapturePath.value,
                wplGpuDecoding: wplGpuDecoding.value,
                wplMetaRender: wplMetaRender.value,
            });
        }
    } catch (error) {
        console.error('get wpl config failed');
    }
}

const onWPLConnected = () => {
    setTimeout(() => {
        requestWPLConfig();
    }, 200);
}

const loadWPLConfig = async () => {
    const config = await fetchWPLConfig();
    if (config) {
        if (config.recordPath !== undefined && config.recordPath !== '') {
            wplRecordPath.value = config.recordPath;
        }
        if (config.capturePath !== undefined && config.capturePath !== '') {
            wplCapturePath.value = config.capturePath;
        }
        if (config.gpuDecoding !== undefined) {
            wplGpuDecoding.value = String(config.gpuDecoding);
        }
        if (config.metaRender !== undefined) {
            wplMetaRender.value = String(config.metaRender);
        }
    }
}

watch(
    () => [Configstore.wplRecordPath, Configstore.wplCapturePath, Configstore.wplGpuDecoding, Configstore.wplMetaRender],
    ([newRecordPath, newCapturePath, newGpuDecoding, newMetaRender]) => {
        if (Configstore.isLinux || Configstore.isWindows) {
            if (newRecordPath !== undefined && newRecordPath !== wplRecordPath.value) {
                wplRecordPath.value = newRecordPath;
            }
            if (newCapturePath !== undefined && newCapturePath !== wplCapturePath.value) {
                wplCapturePath.value = newCapturePath;
            }
            if (newGpuDecoding !== undefined && newGpuDecoding !== wplGpuDecoding.value) {
                wplGpuDecoding.value = newGpuDecoding;
            }
            if (newMetaRender !== undefined && newMetaRender !== wplMetaRender.value) {
                wplMetaRender.value = newMetaRender;
            }
        }
    },
    { deep: true }
);

onMounted(async () => {
    if (Configstore.isWindows || Configstore.isLinux) {
        window.addEventListener('wpl-config-received', ((e: CustomEvent) => {
            const config = e.detail;
            if (config.recordPath !== undefined && config.recordPath !== '') {
                wplRecordPath.value = config.recordPath;
            }
            if (config.capturePath !== undefined && config.capturePath !== '') {
                wplCapturePath.value = config.capturePath;
            }
            if (config.gpuDecoding !== undefined) {
                wplGpuDecoding.value = String(config.gpuDecoding);
            }
            if (config.metaRender !== undefined) {
                wplMetaRender.value = String(config.metaRender);
            }
            if (config.gpuSupport !== undefined) {
                wplGpuEnable.value = String(config.gpuSupport);
            }
            if (config.wplVision !== undefined && config.wplVision !== '') {
                wplVision.value = config.wplVision;
            }
            Configstore.wplConfig({
                wplRecordPath: wplRecordPath.value,
                wplCapturePath: wplCapturePath.value,
                wplGpuDecoding: wplGpuDecoding.value,
                wplMetaRender: wplMetaRender.value,
            });
        }) as EventListener);
        window.addEventListener('wpl-connected', onWPLConnected);
        loadWPLConfig();
    }
})
onBeforeUnmount(() => {
    if (Configstore.isLinux || Configstore.isWindows) {
        window.removeEventListener('wpl-connected', onWPLConnected);
        window.removeEventListener('wpl-config-received', null as any);
    }

});
</script>

<style scoped lang="scss">
#client_config_basic_param {
    width: 100%;
    height: 100%;
    padding: 10px;

    .WPL_LocalConfig {
        .Aside_content_title {
            font-size: 14px;
            width: 120px;
        }

        .wpl-config-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;

            .wpl-config-input {
                width: 400px;
            }
        }
    }
}
</style>