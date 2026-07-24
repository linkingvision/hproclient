import { defineStore } from 'pinia'
import { ref,computed } from 'vue';

export const usePlayStore = defineStore('playStore',()=>{
  const token = ref(0)
  const streamprofile = ref("")
  const name = ref("")
  const label = ref("")
  const mapName = ref("")
  const vid = ref("")
  const resourceUUid = ref("")
  const entityType = ref("")
  const MapData = ref<any>(null)
  const EnableDevPartitionLazyLoading = ref(false)
  const PartitionLoadDeviceOnly = ref(false)
  const PlaybackShowStorageMode = ref(true)
  const EnablePartitionTreeCacheSearch = ref(true)
  const EnableDevPartitionShowDeviceNode = ref(true)
  const devicemarktoggle = ref<string>("false")
  const passwordLength = ref<string>('8')
  const mapCluster = ref<string>('')

  const liveplay = computed(() => ({
    token: token.value || null,
    streamprofile: streamprofile.value || null,
    name: name.value || null,
    label: label.value || null,
    vid: vid.value || null,
    entityType: entityType.value || null,
    Mapdata: MapData.value || null,
    resourceUUID: resourceUUid.value || null,
  }))


  const SetPlay = (data:any)=>{
    token.value = data.token;
    streamprofile.value = data.streamprofile;
    name.value = data.name;
    label.value = data.label;
    mapName.value = data.mapName;
    vid.value = data.vid;
    resourceUUid.value = data.resourceUUid;
    entityType.value = data.entityType;
    MapData.value = data.MapData || data.Mapdata;

    localStorage.setItem('PlayData',JSON.stringify(data));
  }

  const restoreStorage = () => {
    const stored = localStorage.getItem('PlayData');
    if(stored){
      const data = JSON.parse(stored);
      if(data && data.MapData){
        MapData.value = data.MapData;
      }
    }
  }

  return{
    token,
    streamprofile,
    name,
    label,
    mapName,
    vid,
    resourceUUid,
    entityType,
    MapData,
    SetPlay,
    liveplay,
    EnableDevPartitionLazyLoading,
    devicemarktoggle,
    passwordLength,
    PartitionLoadDeviceOnly,
    PlaybackShowStorageMode,
    EnablePartitionTreeCacheSearch,
    EnableDevPartitionShowDeviceNode,
    mapCluster,
    restoreStorage
  };
},{
  persist:{
    key:'playStore',
    storage:localStorage,
    pick:['token','streamprofile','name','label','mapName','vid','resourceUUid','entityType','MapData','EnableDevPartitionLazyLoading',
      'devicemarktoggle','passwordLength','PartitionLoadDeviceOnly','EnableDevPartitionLazyLoading','EnableDevPartitionShowDeviceNode',
      'EnablePartitionTreeCacheSearch','PlaybackShowStorageMode','mapCluster',
    ]
  }
})