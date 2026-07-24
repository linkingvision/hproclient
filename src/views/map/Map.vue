<template>
    <div id="map" class="map">
        <div class="liveview_left">
            <el-input class="liveview_left_input" :placeholder="t('Common.comm_filtration')" v-model="filterText">
                <template #suffix>
                    <i class="iconfont icon-sousuo1 sousuo" style="cursor: pointer;" @click="handleIconClick"></i>
                </template>
            </el-input>
            <div class="collapse_Partition">
                <el-collapse v-model="activeNames">
                    <el-collapse-item name="mapPartition" class="collapse_Content">
                        <template #title>
                            <div class="liveplay_collapse_title">
                                <span>Partition</span>
                                <span class="iconfont icon-shuaxin" @click.stop="Refresh"></span>
                            </div>
                        </template>
                        <el-tree ref="treeRef" :data="treeData" lazy :load="loadNode" :props="treeProps" :default-expanded-keys = "defaultExpandKeys" :filter-node-method="filterNode"
                            node-key="uuid" @node-expand = "handleNodeExpand" @node-collapse="handleNodeCollapse" @node-click="handleNodeClick"  empty-text="no data">
                            <template #default="{ node, data }">
                                <span class="custom-tree-node" :class="{'playing-node':data.isPlaying,'offline-node':data.online === false && data.chanType === 'USC_CHAN_CAMERA'}" draggable="true" @dragstart="dropStart($event, data)">
                                    <span style="display: flex;align-items: center;overflow: hidden;">
                                        <span v-if="data.dome === true" class="iconfont" :class="data.iconclass" style="padding-right: 5px;font-size:20px !important;flex-shrink: 0;" :id="'icon'+data.token"></span>
                                        <span v-else-if="data.chanType !== 'USC_CHAN_CAMERA'" class="iconfont" :class="data.iconfont || data.iconclass" style="padding-right: 5px; font-size: 16px !important;flex-shrink: 0;" :id="'icon' + data.token"></span>
                                        <svg v-else class="icon" aria-hidden="true" style="padding-right: 5px;width: 20px;height: 20px;font-size: 20px;flex-shrink: 0;">
                                            <use :href="'#' + data.iconSvg"></use>
                                        </svg>
                                        <span class="text" :title="node.label" style="overflow: hidden;text-overflow: ellipsis;white-space: nowrap;"> {{ node.label }}</span>
                                    </span>
                                </span>
                            </template>
                        </el-tree>
                    </el-collapse-item>
                </el-collapse>
            </div>
        </div>
        <div class="map_right">
            <div class="map_right_video_hed" id="video_hed" style="position: relative;">
                <div v-for="cell in grid1" :key="cell.id" class="palace videoColor" :style="computeCellStyle(cell)"@drop="dragTarget($event,cell.id)" @dragover.prevent="dragover($event)">
                    <MapLiveplay :id="'h'+cell.id" :hsid="'h'+cell.id" :h5videoid="'hvideo'+cell.id" :canvasid="'canvas'+cell.id"
                    :selected="selectedCellId" :independenceMap="true" :videoid="'hvideo'+cell.id">
                    </MapLiveplay>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted, onErrorCaptured, ref, watch } from "vue";
import { useSiteInfo } from "../../store/site-info.js";
import { useRouter } from 'vue-router';
import { useI18n } from "vue-i18n";
import MapLiveplay from "./mapComponent/MapLiveplay.vue";
import { GetAccessDevice, GetCascadeHierarchy, GetDevPartition, GetSysConfig } from "../../utils/DevicesTree";
import { usePlayStore } from "../../store/play";
import { GetUserItem, GetMapUserDefault, GetMapSystemDefault } from "../../api/map.js";
import { DiscoveredDevice } from "../../types/site-info.js";


const router = useRouter();
const {t,locale} = useI18n();
const siteStore = useSiteInfo();
const playStore = usePlayStore();

const standaloneWindow = ref(false);
const activeNames = ref(['mapPartition']);
const filterText = ref('');
const treeData = ref<any[]>([]);
const defaultExpandKeys = ref<string[]>([]);
const defaultExpandIdsDevices = ref<any[]>([]);
const grid1 = ref<any[]>([
    ...Array.from({length:1},(_,index)=>{
        const row = Math.floor(index / 1) + 1;
        const col = (index % 1) + 1;
        return {
            id:`${row}-${col}`,
            rowStart:row,
            rowEnd:row + 1,
            colStart:col,
            colEnd:col + 1,
            merged:false,
        };
    }),
]);
const selectedCellId = ref('1-1');
const dragData = ref<any>(null);
const isActionPerformed = ref(false);
const layoutType = ref("1|1");

const treeProps = {
    children:"children",
    label:"label",
    token:"token",
    iconclass:"iconclass",
    isLeaf:"isLeaf",
};



const getDeviceInfo = (): { target: DiscoveredDevice | null; access_token: string; session: string; root: string; username: string;} => {
    const devices = siteStore.siteDevices;
    if (!devices || devices.length === 0) {
        return { target: null, access_token: '', session: '', root: '', username: '' };
    }
    const target = devices.find((site: DiscoveredDevice) => site.login === true) || devices[0] || null;
    if (!target) {
        return { target: null, access_token: '', session: '', root: '', username: '' };
    }
    const protocol = target.enableHttps ? 'https' : 'http';
    const port = target.enableHttps ? Number(target.httpsPort) : Number(target.httpPort);
    return {
        target,
        access_token: target.access_token || '',
        session: target.session || '',
        root: `${protocol}://${target.ipv4Address}:${port}`,
        username: target.username ? decodeURIComponent(target.username) : ''
    };
}

const userList = async() => {
    const { username, access_token, root } = getDeviceInfo();
    const token = siteStore.siteDevices.find(site => site.login === true)?.access_token || siteStore.siteDevices[0]?.access_token || '';
    const result = await GetUserItem({root, access_token, username});
    if(result.status === 200 && result.data?.msg === "Success"){
        await UserDefaultMap(result.data.result.userId);
    }
};

const UserDefaultMap = async(userId:string) => {
    const { access_token, root } = getDeviceInfo();
    const result = await GetMapUserDefault({root,access_token,userId});
    const data = result.data?.result;
    if(data && Object.keys(data).length !== 0){
        playStore.SetPlay({
            token:data.mapId,
            streamprofile:"main",
            name:data.mapName,
            mapName:data.mapName,
            vid:"h1-1",
            resourceUUid:data.uuid,
            entityType:"USC_VIEW_MAP",
            MapData:data,
        });
    }else{
        await SystemDefaultMap();
    }

}

const SystemDefaultMap = async() => {
    const { access_token, root } = getDeviceInfo();
    const result = await GetMapSystemDefault({root,access_token});
    const data = result.data?.result;
    if(data && Object.keys(data).length !== 0){
        playStore.SetPlay({
            token:data.mapId,
            streamprofile:"main",
            name:data.mapName,
            mapName:data.mapName,
            vid:"h1-1",
            resourceUUid:data.uuid,
            entityType:"USC_VIEW_MAP",
            MapData:data,
        })
    }
};

const setLeafState = (item: any) => {
    if (item.DifferentType === 'map' || !item.children || item.children.length === 0) {
        item.children = [];
        item.hasChildren = false;
        item.isLeaf = true;
    } else {
        item.hasChildren = true;
        item.isLeaf = false;
    }
};

const loadNode = async(node:any,resolve:any) => {
    try{
        const NodeData = node.data;
        if(NodeData.isLeaf || NodeData.hasChildren === false){
            resolve([]);
            return;
        }

        if(node.level === 0){
            const res = await GetDevPartition(
                "USC_MAP",
                playStore.EnableDevPartitionLazyLoading
            );
            const data = res.DevicePartitionData[0]?.children || [];
            treeData.value = data;

            data.forEach((item:any) => {
                setLeafState(item);
            })

            if(res.DevicePartitionData[0]?.uuid){
                defaultExpandKeys.value.push(res.DevicePartitionData[0].uuid);
            }      
            resolve(data);
            return;
        }

        const data = node.data;
        if(data.children?.length > 0){
            data.children.forEach((child:any)=>{
                child.hasChildren = child.children && child.children.length > 0;
            });
            resolve(data.children);
            return;
        }

        if(data.leaf || data.isLeaf){
            data.hasChildren = false;
            resolve([]);
            return;
        }

        if(data.DifferentType === 'map'){
            data.hasChildren = false;
            resolve([]);
            return;
        }

        let children:any[] = [];
        if(data.gbId || data.casPartitionId){
            const token = data.gbId || data.rootToken;
            const CasToken = data.gbId ? undefined : data.token;
            const res = await GetCascadeHierarchy(token,CasToken);
            if(res.CasDevicePartitionStreamProfile?.length > 0){
                children = res.CasDevicePartitionStreamProfile[0].children || [];
                const profile = res.CasDevicePartitionStreamProfile[0];
                data.online = profile.online;
                data.offline = profile.offline;
                data.disable = profile.disable;
                data.idle = profile.idle;
                data.AllLength = profile.AllLength;
            }else if(data.accessDevId){
                const res = await GetAccessDevice(data.accessDevId);
                if(res.AccessDevicePartition?.length > 0){
                    children = res.AccessDevicePartition[0].children || [];
                }
            }else if(data.devPartitionId){
                const res = await GetDevPartition(
                    "USC_MAP",
                    playStore.EnableDevPartitionLazyLoading,
                    undefined,
                    data.devPartitionId,
                );
                if(res.DevicePartitionData?.length > 0){
                    children = res.DevicePartitionData;
                    const partitionData = res.DevicePartitionData[0];
                    if(partitionData){
                        data.online = partitionData.online;
                        data.offline = partitionData.offline;
                        data.disable = partitionData.disable;
                        data.idle = partitionData.idle;
                        data.AllLength = partitionData.AllLength;
                    }
                }
            }

            if(children && children.length > 0){
                children.forEach((child:any)=>{
                    setLeafState(child);
                });
                data.hasChildren = true;
                data.isLeaf = false;
            }else{
                data.hasChildren = false;
                data.isLeaf = true;
            }
            data.children = children;
            resolve(children);
        }
    }catch(e){
        console.error(e);
        resolve([])
    }
}

const handleNodeExpand = (data:any,node:any) => {
    const hasRealChildren = data.children && Array.isArray(data.children) && data.children.length > 0 && !data.children[0]?.EmptyItem;
    if (!hasRealChildren) {
        data.children = [];
        return;
    }
    if(!defaultExpandKeys.value.includes(data.uuid)){
        defaultExpandKeys.value.push(data.uuid);
    }
};

const handleNodeCollapse = (data:any) => {
    defaultExpandKeys.value = defaultExpandKeys.value.filter(
        (item) => item !== data.uuid
    );
    const removeChildrenIds = (nodeData:any) => {
        if(nodeData.children){
            nodeData.children.forEach((child:any)=> {
                defaultExpandKeys.value = defaultExpandKeys.value.filter(
                    (id) => id !== child.uuid
                );
                removeChildrenIds(child)
            })
        }
    };
    removeChildrenIds(data);
}

const handleNodeClick = (data:any,node:any) => {
    if(isActionPerformed.value)return;
    isActionPerformed.value = true;
    setTimeout(()=>{
        isActionPerformed.value = false;
    },300)

    if (data.DifferentType !== 'map' || data.disable_me === true)return;

    const currentIndex = grid1.value.findIndex(
        (cell) => cell.id === selectedCellId.value
    );
    const nextIndex = (currentIndex + 1) % grid1.value.length;
    selectedCellId.value = grid1.value[nextIndex].id;

    const mapData = {
        ...data,
        mapId:data.mapId || data.token,
        type:data.type || 'USC_MAP_STATIC',
    };

    playStore.SetPlay({
        token:data.token,
        streamprofile:data.streamprofile || "main",
        name:data.label,
        label:data.label,
        vid:`h${selectedCellId.value}`,
        resourceUUID:data.uuid,
        entityType:"USC_VIEW_MAP",
        Mapdata:mapData,
    })
}

const dropStart = (event:DragEvent,data:any) => {
    if(data.DifferentType !== "map" || data.disabled_me === true){
        event.preventDefault();
        return;
    }
    dragData.value = {
        token:data.token,
        label:data.label,
        streamprofile:data.streamprofile || "main",
        name:data.name,
        disable_me:data.disabled_me,
        resourceUUID:data.uuid,
        DifferentType:data.DifferentType,
        data:data,
        setting:data.setting,
    }
    if(event.dataTransfer){
        event.dataTransfer.setData("Text",(event.target as HTMLElement)?.id || "");
    }
}

const dragover = (event:DragEvent) =>{}

const dragTarget = (event:DragEvent,cellId:string) => {
    if(!dragData.value)return;
    const data = dragData.value;

    if(data.DifferentType !== "map")return;
    if(data.disabled_me === true)return;

    const vid = `h${cellId}`;
    playStore.SetPlay({
        token:data.token,
        streamprofile:data.streamprofile || "main",
        name:data.label,
        label:data.label,
        vid:vid,
        resourceUUID:data.resourceUUID,
        entityType:"USC_VIEW_MAP",
        Mapdata:data.data,
    });

    dragData.value = null;
    selectedCellId.value = cellId;
}

const Refresh = async() => {
    const res = await GetDevPartition("USC_MAP",playStore.EnableDevPartitionLazyLoading);
    treeData.value = res.DevicePartitionData[0]?.children || [];
}

const filterNode = (value:string,data:any,node:any) => {
    if(!value)return true;
    if(data.label && data.label.indexOf(value) !== -1)return true;
    let parent = node.parent;
    while(parent && parent.level > 0){
        if(parent.data.label && parent.data.label.indexOf(value)!==-1)return true;
        parent = parent.parent;
    }
    return false;
}

const handleIconClick = () => {
    if(treeRef.value){
        treeRef.value.filter(filterText.value)
    }
}

const computeCellStyle = (cell:any) => {
    const borderWidth = "1px";
    const [totalRows,totalCols] = layoutType.value.split("|").map(Number);
    const cellWidth = 100/totalCols;
    const cellHeight = 100/totalRows;

    return{
        position:"absolute",
        top:`${(cell.rowStart - 1)*cellHeight}%`,
        left:`${(cell.colStart - 1)*cellWidth}%`,
        width:`calc(${cellWidth * (cell.colEnd - cell.colStart)}%-${borderWidth})`,
        height:`calc(${cellHeight * (cell.rowEnd - cell.rowStart)}%-${borderWidth})`,
        boxSizing:"border-box",
        border:`${borderWidth} solid transparent`,
        zIndex:1,
    } as const;
}

const treeRef = ref<any>(null);

watch(filterText,(val)=>{
    if(treeRef.value){
        treeRef.value.filter(val)
    }
})

onMounted(async() => {
    try{
        await GetSysConfig();
    }catch(e){
        console.error("failed to get system config：",e);
    }
    await userList();
    if (!playStore.liveplay?.Mapdata) {
        await SystemDefaultMap();
    }
})
onErrorCaptured((err, instance, info) => {
    console.error('catch error:', err, info);
    return false; // viode broadcasting error
});

</script>

<style lang="scss" scoped>
.map {
  display: flex;
  justify-content: space-between;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  
  .liveview_left {
    flex: 0 0 15%;
    height: 100%;
    margin: 0 5px;
    overflow: auto;
    .liveview_left_input{
        padding: 8px 10px;
        :deep(.el-input__wrapper){
            border-radius: 30px !important;
        }
    }
    .collapse_Content{
        .liveplay_collapse_title{
            display: flex;
            justify-content: space-between;
            padding-inline: 10px;
        }
    }



    &::-webkit-scrollbar {
      display: none;
    }
  }

  .map_right {
    flex: 1;
    height: 100%;
    overflow: hidden;
    position: relative;
    
    .map_right_video_hed {
      width: 100%;
      height: 100%;
      position: relative;
      
      .palace {
        position: absolute !important;
        top: 0;
        left: 0;
        width: 100% !important;
        height: 100% !important;
        min-width: 200px;
        min-height: 200px;
        overflow: hidden;
        
        :deep(.liveplay) {
          width: 100%;
          height: 100%;
          
          .map {
            width: 100%;
            height: 100%;
          }
        }
      }
    }
  }
}
</style>