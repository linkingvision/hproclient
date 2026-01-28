<script setup lang="ts">
import { RecordingStatus } from '@/utils/localRecordingStatus.js';
import { GetChannels } from '../../../../api/channel'
import { onMounted, ref, watch } from 'vue';
import { useStore } from '../../../../store';
import { useSiteInfo } from '../../../../store/site-info';
import { useTempStore } from '../../../../store/temp';

interface Props {
  objPartitions: any,
  router: string
}
const props = defineProps<Props>()
const store = useStore();
const siteStore = useSiteInfo();
const tempStore = useTempStore();

const site = siteStore.getSiteDevice(tempStore.tempIP)
const root = ref<string>('')

const currentPage = ref<number>(1);
const pageSize = ref<number>(10);
const total = ref<number>(0);

// const recordingStatus = ref<any>(null);
const chRecordList = ref<any[]>([]);
let recordingStatus: any = ref(null);
const chRec = ref<any[]>([])
const backgroundColor = ref<string>('#FFFFFF');
const labelColor = ref<string>('');

const activeTime = ref<Date>(new Date());
const startTime = ref<Date | undefined>(undefined);
const endTime = ref<Date | undefined>(undefined);
const radio = ref<string>('month')
const activeRadio = (value: string) => {
  radio.value = value;
  const { startTime: start, endTime: end } = getRecordTime(activeTime.value);
  startTime.value = start;
  endTime.value = end;
  recordingStatus.value.setMode(value, {startTime: startTime.value, endTime: endTime.value});
}

const handleChange = (value: any) => {
  let { startTime: start, endTime: end } = getRecordTime(value);
  startTime.value = start;
  endTime.value = end;
  recordingStatus.value.setMode(radio.value, {startTime:start, endTime: end})
}

const renderPartition = (date: Date | null) => {
  if (date == null) {
    date = new Date();
    activeTime.value = new Date(date.getFullYear(), date.getMonth(), 1);
  } else {
    activeTime.value = date;
  }
  let { startTime: start, endTime: end } = getRecordTime(date);
  startTime.value = start;
  endTime.value = end;
  const renderElement = document.querySelector('.render') as HTMLElement;
  const width = renderElement?.offsetWidth;
  const height = renderElement?.offsetHeight;
  recordingStatus.value = new RecordingStatus('#recording', {
    startTime,
    endTime,
    width,
    height,
    backgroundColor: backgroundColor.value,
    labelColor: labelColor.value,
  })
  console.log('recordingStatus =>', recordingStatus.value);
  console.log('chRec.value =>', chRec.value)
  recordingStatus.value.StartDrawing(chRec.value);
}

const getChannels = async () => {
  if (!site || !site.access_token) return;
  let chanNo: any[] = [];
  if (props.objPartitions.chRec && props.objPartitions.chRec.length > 0) {
    props.objPartitions.chRec.map((item: any) => chanNo.push(item.nChan))
  }
  root.value = (site.enableHttps ? 'https://' : 'http://') + site.ipv4Address + ':' + (site.enableHttps ? site.httpsPort : site.httpPort);
  const res = await GetChannels(root.value, site.access_token, {chanNo, all: true});
  if (res.data.result.length > 0) {
    props.objPartitions.chRec.forEach((item: any) => {
      item.record = [{
        strStartTime: item.strStartTime,
        strEndTime: item.strEndTime
      }]
      const match = res.data.result.find((val: any) => val.chanNo === item.nChan)
      if (match) {
        item.devName = match.name;
      }
    })
  }
  if (props.objPartitions && props.objPartitions.bMount && props.objPartitions.chRec) {
    total.value = props.objPartitions.chRec.length;
    chRec.value = props.objPartitions.chRec.slice((currentPage.value -1) * pageSize.value, currentPage.value * pageSize.value);
  }
  renderPartition(null)
}

const getRecordTime = (date: Date) => {
  let startTime, endTime;
  switch (radio.value) {
    case 'month':
      startTime = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
      endTime = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'week':
      const day = date.getDay();
      startTime = new Date(date);
      startTime.setDate(date.getDate() - day);
      startTime.setHours(0, 0, 0, 0);
      endTime = new Date(date);
      endTime.setDate(date.getDate() + (6 - day));
      endTime.setHours(23, 59, 59, 999);
      break;
    case 'date':
      startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      break;
    default:
      break;
  }
  return { startTime, endTime }
}

watch(() =>store.darkMode, (data) => {
  if (!recordingStatus) {
    return
  }
  if (data == 'c-dark-theme') {
    backgroundColor.value = '#2B2B2B';
    labelColor.value = '#FFFFFF';
  } else if (data == 'darkblue') {
    backgroundColor.value = '#1B2A46';
    labelColor.value = '#06E8EA';
  } else {
    backgroundColor.value = '#f0f0f0';
    labelColor.value = '#000';
  }
  recordingStatus.setColors({ backgroundColor: backgroundColor.value, labelColor: labelColor.value });
})
onMounted(() => {
  switch (store.darkMode) {
    case 'c-dark-theme':
      backgroundColor.value = '#2B2B2B';
      labelColor.value = '#FFFFFF';
      break;
    case 'darkblue':
      backgroundColor.value = '#1B2A46';
      labelColor.value = '#06E8EA';
      break;

    default:
      backgroundColor.value = '#f0f0f0';
      labelColor.value = '#000';
      break;
  }
  getChannels();
  console.log('props.objPartitions =>', props.objPartitions)
})
</script>

<template>
  <div class="storage-state">
    <div class="statusInfo" v-if="props.router == 'LocalObjStorage' || props.router == 'S3Storage'">
      <span>Status：</span>
      <span :style="{color: props.objPartitions.bMount ? '#06D20B' : 'red'}">{{ props.objPartitions.bMount ? 'Online' : 'Offline' }} ● </span>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <span>Time：</span>
      <span>{{ `${props.objPartitions.strStartTime} -- ${props.objPartitions.strEndTime}` }}</span>
    </div>
    <div class="DatePicker">
      <div class="block" v-show="radio == 'month'">
        <el-date-picker v-model="activeTime" type="month" placeholder="Pick a month" @change="handleChange"></el-date-picker>
      </div>
      <div class="block" v-show="radio == 'week'">
        <el-date-picker v-model="activeTime" type="week" format="[week] ww" placeholder="Pick a week" @change="handleChange"></el-date-picker>
      </div>
      <div class="block" v-show="radio == 'date'">
        <el-date-picker v-model="activeTime" type="date" placeholder="Pick a date" @change="handleChange"></el-date-picker>
      </div>
      <div class="radio-button">
        <el-button size="small" :class="{active_button: radio == 'month'}" @click="activeRadio('month')">Month</el-button>
      </div>
      <div class="radio-button">
        <el-button size="small" :class="{active_button: radio == 'week'}" @click="activeRadio('week')">Week</el-button>
      </div>
      <div class="radio-button">
        <el-button size="small" :class="{active_button: radio == 'date'}" @click="activeRadio('date')">Day</el-button>
      </div>
    </div>
    <div class="render">
			<div id="recording"></div>
		</div>
    <div class="pagination-box">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 30, 50, 100]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      ></el-pagination>
    </div>
  </div>
</template>

<style scoped lang="scss">
.storage-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  .render {
    width: 100%;
    flex: 1;
    overflow: hidden;
  }
  .DatePicker{
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    margin-bottom: 2px;
    .block{
      margin-left: 10px;
    }
  }
  .statusInfo {
    height: 40px;
    line-height: 40px;
    // padding-left: 10px;
  }
  .pagination-box {
    width: 100%;
    padding: 10px 0;
  }
}
</style>