<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
import { GetNodeApi, GetRecordingStatusApi } from '../../../api/videoconfig';
import { GetRecordingCountApi, GetDiskPartitionApi } from '../../../api/videoconfig'
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue';
import { useSiteInfo } from '../../../store/site-info';
import { useTempStore } from '../../../store/temp';
import { useStore } from '../../../store';
import * as echarts from 'echarts';

const siteStore = useSiteInfo();
const tempStore = useTempStore();
const store = useStore();

const site = computed(() => siteStore.getSiteDevice(tempStore.tempIP))
const root = ref<string>('')

const filterText = ref<string>('')
const tableData = ref<NodeItem[]>([])
const total = ref<number>(0)
// const nodeId = ref<string>('')
const form = ref<any>({});

const detailVisible = ref(false);
const totalRecordingCount = ref(0);
const totalChannelCount = ref(0);

interface NodeItem {
  nodeId: string;
  nodeName: string;
  nodeType?: string;
  channelCount?: number;
  recordingCount?: number;
}

const Node = async () => {
  if (!site.value || !site.value.access_token) return;
  root.value = (site.value.enableHttps ? 'https://' : 'http://') + site.value.ipv4Address + ':' + (site.value.enableHttps ? site.value.httpsPort : site.value.httpPort)
  const res = await GetNodeApi(root.value, site.value.access_token)
  if (res.data.result.list && res.data.result.list.length > 0) {
    console.log('Node res', res.data.result.list);
    // nodeId.value = res.data.result.list[0].nodeId;
    const promises = res.data.result.list.map((node: NodeItem) => GetRecordingCount(node.nodeId, node.nodeName, false));
    tableData.value = await Promise.all(promises);
    total.value = tableData.value.length;
    console.log('tableData', tableData.value);
    // GetRecordingCount( '',false);
  }
}

const GetRecordingCount = async (nodeId:string, nodeName:string, NoSummation: boolean) => {
  if (!site.value || !site.value.access_token) return;
  const res = await GetRecordingCountApi(root.value, site.value.access_token, nodeId)
  if (res.status == 200 && res.data.result) {
    if (!NoSummation) {
      totalRecordingCount.value = res.data.result.recordingCount;
      totalChannelCount.value = res.data.result.channelCount;
    }
    return {
      channelCount: res.data.result.channelCount,
      recordingCount: res.data.result.recordingCount,
      nodeId,
      nodeName,
    };
  }
}

const GetDiskPartition = async (nodeId: string, statusData: any) => {
  if (!site.value || !site.value.access_token) return;
  const res = await GetDiskPartitionApi(root.value, site.value.access_token, nodeId)
  form.value.DiskPartitions = mergeDiskData(statusData, res.data.result.partition, nodeId);
  console.log('DiskPartition =>', form.value.DiskPartitions)
}

const mergeDiskData = (statusData: any, partitionData: any, nodeId: string) => {
  const mergedData: any[] = [];
  statusData.forEach((status: any) => {
    if (status.nodeId === nodeId) {
      partitionData.forEach((partition: any) => {
        if (status.Name === partition.strDevice) {
          mergedData.push({ ...status, ...partition });
        }
      });
    }
  });
  return mergedData;
}

const GetRecordingStatus = async (nodeId: string) => {
  if (!site.value || !site.value.access_token) return;
  const res = await GetRecordingStatusApi(root.value, site.value.access_token, nodeId)
  if (res.status == 200) {
    const item = res.data.result.diskInfo;
    item.forEach((disk: any) => disk.nodeId = nodeId)
    // console.log('RecordingStatus =>', item)
    return item;
  }
}

let timer = ref<any>(null);

const Details = async (row: NodeItem) => {
  detailVisible.value = true;
  form.value = row;
  const statusData = await GetRecordingStatus(row.nodeId)
  await GetDiskPartition(row.nodeId, statusData)
  nextTick(() => {
    devimage(row)
  })
  timer.value = setInterval(async () => {
    const statusData1 = await GetRecordingStatus(row.nodeId)
    await GetDiskPartition(row.nodeId, statusData1)
  }, 5000)
}

const devimage = (row: NodeItem) => {
  const pieId = document.getElementById('count');
  if (!pieId) return;
  let titlecol: any;
  if (store.darkMode) {
    titlecol = '#fff';
  } else {
    titlecol = '#000';
  }

  const oldChart = echarts.getInstanceByDom(pieId);
  if (oldChart) {
    oldChart.dispose();
  }
  const myChart = echarts.init(pieId);
  myChart.setOption({
    tooltip: {
      show: true
    },
    title: {
      x: 'center',
      y: 'center',
      textStyle: {
        fontSize: 12,
        fontWeight: 400,
        color: titlecol
      }
    },
    series: [{
      type: 'pie',
      radius: ['60%', '70%'],
      avoidLabelOverlap: false,
      label: {
        normal: {
          show: false,
          position: 'center'
        },
        emphasis: {
          show: true,
          textStyle: {
            fontSize: '20',
            fontWeight: 'bold',
          },
          formatter: '{b}\n{c}'
        }
      },
      labelLine: {
        normal: {
          show: false
        }
      },
      data: [{
        value: row.channelCount,
        name: 'Number of Channels',
        itemStyle: {
          color: "#06E8EA"
        }
      },
      {
        value: row.recordingCount,
        name: 'Number of Recordings',
        itemStyle: {
          color: '#0399FE'
        }
      }]
    }]
  })
  myChart.setOption({
    title: {
      show: true,
      text: row.recordingCount + '/' + row.channelCount,
      textStyle: {
        fontSize: '20',
      },
    }
  })
  myChart.on('mouseover', () => {
    myChart.setOption({
      title: {
        show: false
      }
    })
  });
  myChart.on('mouseout', () => {
    myChart.setOption({
      title: {
        show: true,
        text: row.recordingCount + '/' + row.channelCount,
      }
    })
  });
  window.onresize = function () {
    myChart.resize();
  }
}

const Back = () => {
  detailVisible.value = false;
  form.value = {};
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
}

const selectChange = () => {}

// calculate total disk capacity and available capacity
const CalculateCapacity = (value: number) => {
  if (value) {
    if ((value / 1024) < 1) {
      return (value / 1024).toFixed(1) + "GB";
    } else if ((value / 1024) > 1000) {
      return (value / 1024 / 1024).toFixed(0) + "TB";
    } else {
      return (value / 1024).toFixed(0) + "GB";
    }
  }
}
const CalculateTime = (value: number) => {
  if (value === 0) return { time: 0, unit: 'ms' };
  if (value >= 1000) {
    return { time: (value / 1000).toFixed(3), unit: 's' };
  } else {
    return { time: value.toFixed(3), unit: 'ms' };
  }
}

const CalculateStorage = (value: number) => {
  if (value == 0) return 0;
  if (value) {
    if (value > 1024) {
      return (value / 1024).toFixed(3);
    } else {
      return value;
    }
  }
}

onMounted(() => {
  Node();
})

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
})

</script>

<template>
  <div class="recording-status">
    <div v-if="!detailVisible" class="recording-header">
      <div style="display:flex;align-items: center;">
        <div class="RecordingStatus_header_count" style="background: #0399FE;"></div>
        <span>{{ 'Total Recording Count' }}: {{ totalRecordingCount }}</span>
      </div>
      <div style="display:flex;align-items: center;margin-left: 10%;">
        <div class="RecordingStatus_header_count" style="background: #06E8EA;margin-right:15px;"></div>
        <span>{{ 'Total Number Of Channels' }}: {{ totalChannelCount }}</span>
      </div>
    </div> 
    <el-table v-if="!detailVisible" :data="tableData" style="width: 100%;" @selection-change="selectChange">
      <el-table-column type="selection" width="55" />
      <el-table-column label="Work Server" prop="nodeName"></el-table-column>
      <el-table-column label="Number Of Recordings" prop="recordingCount"></el-table-column>
      <el-table-column label="Number Of Channels" prop="channelCount"></el-table-column>
      <el-table-column>
        <template #default="{ row }">
          <el-button type="text" @click="Details(row)">Details</el-button>
        </template>
      </el-table-column>
      <el-table-column>
        <template #header>
          <el-input v-model="filterText" placeholder="Keywords Filter"></el-input>
        </template>
      </el-table-column>
    </el-table>
    <!-- detail page -->
    <div v-if="detailVisible" class="recording-status-detail">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="Back">Recording Status</el-breadcrumb-item>
          <el-breadcrumb-item>Details</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="detail-box">
        <div class="RecordContent">
          <div class="header"><div></div></div>
          <div class="RecordContent-Content">
            <div class="left">
              <div id="count"></div>
            </div>
            <div class="right">
              <div class="count-text">
                <span style="font-size: 32px;">{{ form.recordingCount }}</span>
                <div class="count-backgroung" style="background: #0399FE;"></div>
                <div style="font-size:18px;width: 180px;white-space: nowrap;">Number Of Recording</div>
              </div>
              <div class="count-text">
                <span style="font-size: 32px;">{{ form.channelCount }}</span>
                <div class="count-backgroung" style="background: #06E8EA;"></div>
                <div style="font-size:18px;width: 180px;white-space: nowrap;">Number Of Channel</div>
              </div>
            </div>
          </div>
        </div>
        <div class="RecordContent-partition" v-for="(item, index) in form.DiskPartitions" :key="index">
          <div class="partition-left">
            <div class="speed">
              <div class="label">Read Time</div>
              <div class="value"><span>{{ CalculateTime(item.ReadTime).time }}</span>{{ CalculateTime(item.ReadTime).unit }}</div>
            </div>
            <div class="speed">
              <div class="label">Read Speed</div>
              <div class="value"><span>{{ CalculateStorage(Number(item.ReadSpeed)) }}</span>{{ Number(item.ReadSpeed) > 1024 ? 'MB' : 'KB' }}/s</div>
            </div>
            <div class="speed">
              <div class="label">Write Time</div>
              <div class="value"><span>{{ CalculateTime(item.WriteTime).time }}</span>{{ CalculateTime(item.WriteTime).unit }}</div>
            </div>
            <div class="speed">
              <div class="label">Write Speed</div>
              <div class="value"><span>{{ CalculateStorage(Number(item.WriteSpeed)) }}</span>{{ Number(item.WriteSpeed) > 1024 ? 'MB' : 'KB' }}/s</div>
            </div>
          </div>
          <div class="partition-right">
            <span>{{ item.strDevice }}</span>
            <span>{{ item.strFstype }}</span>
            <span>Mount Point:{{ item.strMountpoint }}</span>
            <span>
              Used/All:
              {{ CalculateCapacity(item.nTotalInM - item.nFreeInM) }}{{ "/" }}{{ CalculateCapacity(item.nTotalInM) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.recording-status {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  .recording-header {
    display: flex;
    align-items: center;
    padding-left: 20px;
    height: 56px;
    .RecordingStatus_header_count {
      width: 16px;
      height: 16px;
      margin-right: 15px;
      border-radius: 2px;
    }
  }

  .recording-status-detail {
    padding: 20px;
    .bread-header {
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      // background-color: #aaa;
      border-bottom: 1px solid #313131;
      .can-click {
        cursor: pointer;
      }
    }
    .detail-box {
      width: 100%;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      .RecordContent {
        width: 580px;
        height: 234px;
        border-radius: 4px;
        background-color: #2B2B2B;
        margin-bottom: 10px;
        display: flex;
        flex-direction: column;
        padding: 14px;
        .header {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          div {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #0399FE;
          }
        }
        .RecordContent-Content {
          width: 100%;
          flex: 1;
          display: flex;
          .left {
            width: 45%;
            height: 100%;
            #count {
              width: 100%;
              height: 100%;
            }
          }
          .right {
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            .count-text {
              width: 100%;
              display: flex;
              align-items: center;
              margin-bottom: 10px;
              .count-backgroung {
                width: 5px;
                height: 24px;
                margin: 0 10px;
              }
            }
          }
        }
      }
      .RecordContent-partition {
        display: flex;
        width: 580px;
        height: 234px;
        border-radius: 4px;
        background-color: #2B2B2B;
        margin-bottom: 10px;
        padding: 14px;
        .partition-left {
          width: 60%;
          height: 100%;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          border-right: #0399FE 3px dashed;
          .speed {
            width: 50%;
            .label {
              margin-bottom: 10px;
              border-left: 5px solid #0399FE;
              padding-left: 10px;
            }
            .value {
              span {
                font-size: 30px;
              }
            }
          }
        }
        .partition-right {
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          padding-left: 10px;
        }
      }
    }
  }
}
</style>
