<template>
  <div class="event_search" id="event_search">

    <div class="title">

      <div class="time">
        <div>Start Time</div>
        <el-date-picker v-model="form.beginTime" type="datetime" :teleported="false"
          placeholder="Select Date Time"></el-date-picker>
        <div>End Time</div>
        <el-date-picker v-model="form.endTime" type="datetime" :teleported="false"
          placeholder="Select Date Time"></el-date-picker>
      </div>

      <div class="name">
        <span>Channel Name</span>
        <el-input v-model="form.name"></el-input>
      </div>

      <div class="type">
        <span>Rule Type</span>
        <el-select v-model="form.ruleTypes" multiple collapse-tags popper-class="select-popover-class"
          :teleported="false" class="event_select" placeholder="Please Select">
          <el-checkbox :model-value="selectAll" :indeterminate="indeterminate" @change="selectAllHandle"
            class="event_checkbox">
            Select All
          </el-checkbox>
          <el-option v-for="item in RuleTypeData" :key="item.value" :value="item.value" :label="item.label">
            <el-checkbox :model-value="form.ruleTypes.includes(item.value)" :label="item.label"
              class="event_checkbox"></el-checkbox>
          </el-option>
        </el-select>
      </div>

      <!-- <div class="search_quantity">
        <span>{{ t('Event.e_search_quantity') }}</span>
        <el-input v-model="form.pageSize"></el-input>
      </div> -->

      <div class="button">
        <el-button class="reset" @click="reset" style="margin-right: 12px;">Reset</el-button>
        <el-button class="search" @click="getAnaEventList" style="margin-right: 12px;">Search</el-button>
      </div>

    </div>

    <div class="content">

      <div class="table_content">
        <el-table :data="tableData" @select="selectCell" @select-all="select_Cell" height="100%" style="width: 99.5%;"
          class="event_table" empty-text="No Data Available">
          <el-table-column type="index" label="Serial Number" width="140" align="center"></el-table-column>
          <el-table-column prop="channelName" label="Channel Name" width="180"></el-table-column>
          <el-table-column prop="priority" label="Priority" width="160">
            <template #default="scope">
              <span :style="{ backgroundColor: getPriorityColor(scope.row.priority) }"
                style="padding: 3px;border-radius: 2px;">{{ scope.row.priority }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="ruleType" label="Rule Type" width="200">
            <template #default="scope">
              <span>{{RuleTypeData.find((item: any) => item.value === scope.row.ruleType).label}}</span>
            </template>
          </el-table-column>
          <el-table-column prop="target" label="Target" width="120">
            <template #default="scope">
              <span :class="'iconfont ' + shapeObj[scope.row.targetType]"></span>
            </template>
          </el-table-column>
          <el-table-column prop="time" label="Time" width="200">
            <template #default="scope">
              <span>{{ formatDateTime(scope.row.time) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="event" label="Event">
            <template #default="scope">
              <span v-if="scope.row.ruleType === 'USC_ANA_RULE_FARE'">Name:{{
                scope.row.strEntity
              }}</span>
              <span v-else-if="scope.row.ruleType === 'USC_ANA_RULE_LPRE'">License Plate:{{
                scope.row.strEntity }}</span>
              <span v-else>{{ scope.row.anaEvent }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="strJpeg" label="Picture">
            <template #default="scope">
              <img v-if="scope.row.strJpeg" @click="handleAnalyticsImageClick(scope.row)"
                :src="'data:image/jpeg;base64,' + scope.row.strJpeg" height="30" style="cursor: pointer;">
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination">
        <el-pagination size="small" background layout="total,prev,pager,next,sizes,jumper" :teleported="false" popper-class="page_select"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" v-model:current-page="currentPage"
          :page-sizes="[10, 15, 20, 30]" v-model:page-size="pageSize" :total="total">
        </el-pagination>
        <el-button class="GoTo" style="width: 80px; height: 25px;background-color: transparent;" size="small">Jump</el-button>
      </div>

    </div>
    <el-dialog :visible.sync="dialogVisible" width="50%" center>
      <img id="eventImg" src="" alt="" width="100%">
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AnalyticsEvent from '../../components/AnalyticsEvent.vue';
import { computed, reactive, ref } from 'vue';
import { dayjs } from 'element-plus';
import { GetAnaEventList } from '../../../api/search';
import { getDeviceInfo } from '../../../utils/site.js';

interface FormData {
  beginTime: number,
  endTime: number,
  ruleTypes: string[],
  name: string,
  pageIndex: number,
  pageSize: number,
}

//========= reactive =========
const form = reactive<FormData>({
  beginTime: new Date().getTime() - 3600 * 1000 * 24,
  endTime: new Date().getTime(),
  ruleTypes: [],
  name: '',
  pageIndex: 1,
  pageSize: 20,
})
const RuleTypeData = reactive<any>([
  { label: 'Helmet Detection', value: 'USC_ANA_RULE_PPE', icon: 'icon-a-Safetyhat' },
  { label: 'Moving In An Area', value: 'USC_ANA_RULE_MIAA', icon: 'icon-quyuruqin' },
  { label: 'Fall Detection', value: 'USC_ANA_RULE_PEFA', icon: 'icon-diedaojiance' },
  { label: 'Crossing A Line', value: 'USC_ANA_RULE_CRAL', icon: 'icon-banxianjiance' },
  { label: 'Loitering', value: 'USC_ANA_RULE_LOIT', icon: 'icon-renyuandouliu' },
  { label: 'Stopped Vehicle', value: 'USC_ANA_RULE_STVE', icon: 'icon-weifatingche' },
  { label: 'Face Recognition', value: 'USC_ANA_RULE_FARE', icon: 'icon-renlianshibie1' },
  { label: 'License Plate Recognition', value: 'USC_ANA_RULE_LPRE', icon: 'icon-chepaishibie' },
  { label: 'Crowd', value: 'USC_ANA_RULE_CROD', icon: 'icon-renyuanjishu' },
  { label: 'Fire Smoke Detection', value: 'USC_ANA_RULE_FISM', icon: 'icon-huoyanyanwu' },
  { label: 'Fire Lane', value: 'USC_ANA_RULE_FBLK', icon: 'icon-xiaofangtongdaozhanyong' },
  { label: 'Fight Detection', value: 'USC_ANA_RULE_FIGT', icon: 'icon-shandongnaoshi' },
])
const shapeObj = reactive<any>({
  "person": "icon-person",
  "vehicle": "icon-vehicle",
  "motorcycle": "icon-motorcycle",
  "bicycle": "icon-bicycle",
  "car": "icon-car",
  "truck": "icon-truck",
  "bus": "icon-bus",
  "face": "icon-face",
})
const priorityLevel = reactive<any>({
  Critical: "#7DDFDF",
  High: "#D83D3D",
  Low: "#00B75B",
  Medium: "#F09C37",
})

//========= ref =========
const tableData = ref<any[]>([]);
const selectop = ref<any[]>([]);

const search = ref<string>("");

const dialogVisible = ref(false);
const analysticsEvent = ref(false);

const currentPage = ref<number>(1);
const total = ref<number>(0);
const pageSize = ref<number>(20)

//========= computed =========
const selectAll = computed(() => {
  if (form.ruleTypes.length) {
    return form.ruleTypes.length === RuleTypeData.length;
  }
  return false;
})
const indeterminate = computed(() => {
  if (form.ruleTypes.length) {
    return form.ruleTypes.length !== RuleTypeData.length;
  }
  return false;
})

//========= methods =========
const selectAllHandle = (b: any) => {
  form.ruleTypes = b ? RuleTypeData.map((v: any) => v.value) : [];
}

const reset = () => {
  form.beginTime = new Date().getTime() - 3600 * 1000 * 24;
  form.endTime = new Date().getTime();
  form.name = '';
  form.pageSize = 20;
  form.pageIndex = 1;
  form.ruleTypes = [];
}

const selectCell = (row: any) => {
  selectop.value = [];
  for (var i = 0; i < row.length; i++) {
    var selectedop = {
      token: row[i].id,
      index: row[i].index - 1,
      type: 'dan',
    }
    selectop.value.push(selectedop)
  }
}

const select_Cell = (row: any) => {
  selectop.value = [];
  for (var i = 0; i < row.length; i++) {
    var selectedop = {
      token: row[i].id,
      index: ((currentPage.value - 1) * 10) + i,
      type: 'duo',
      Name: row[i].name,
    }
    selectop.value.push(selectedop);
  }
}

const getPriorityColor = (data: any) => {
  return priorityLevel[data];
}

const getAnaEventList = () => {
  const {root,access_token} = getDeviceInfo();
  const startDate = dayjs(form.beginTime).format('YYYY-MM-DDTHH:mm:ss+08:00');
  const endDate = dayjs(form.endTime).format('YYYY-MM-DDTHH:mm:ss+08:00');
  let ruleTypes = form.ruleTypes;
  const data = {
    pageIndex: currentPage.value,
    pageSize: pageSize.value,
    beginTime: startDate,
    endTime: endDate,
    channelName: form.name,
    ruleTypes: ruleTypes,
  };
  GetAnaEventList(root, access_token,data).then((res: any) => {
    if (res.status === 200) {
      tableData.value = res.data.result.list;
      total.value = res.data.result.count;
    }
  });
}

const handleAnalyticsImageClick = (data: any) => {
  window.ipcRenderer.send('open-playback', {
    img: data.strJpeg,
    channelName: data.channelName,
    time: data.time,
    trackId: data.trackid,
    targetType: data.targetType,
    ruleType: data.ruleType,
    confidence: data.confidence,
    strEntity: data.strEntity,
    anaEvent: data.anaEvent,
    type: 'TextSearch',
    channelToken: data.channelToken,
  });
}

const handleSizeChange = (val: any) => {
  currentPage.value = 1;
  pageSize.value = val;
  getAnaEventList();
}

const handleCurrentChange = (val: any) => {
  currentPage.value = val;
  getAnaEventList();
}

const formatDateTime = (time: any) => {
  return time.replace('T', ' ').replace(/-/g, '/').split('+')[0];
}

</script>

<style scoped lang="scss">
.put {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.event_search {
  height: 100%;
  width: 100%;

  .title {
    @extend .put;
    padding: 15px 20px;
    width: 100%;
    height: 5%;
    font-size: 14px;

    .time {
      width: 36%;
      min-width: 600px;
      @extend .put;
      ;

      :deep(.el-date-editor) {
        width: 220px;

        .el-input__wrapper {
          border: none !important;
          box-shadow: none;
        }
      }

    }

    .name {
      width: 20%;
      min-width: 230px;
      @extend .put;

      :deep(.el-input) {
        width: 250px;
      }
    }

    .type {
      width: 17%;
      min-width: 230px;
      @extend .put;

      :deep(.el-select) {
        width: 250px;
      }
    }

    .button {
      margin-right: 10px;

      .reset {
        background: transparent;
        border: 1px solid #177ddc !important;
        color: #177ddc;
        box-sizing: border-box;
      }

      .search {
        background: #177ddc;
        border-radius: 2px;
        color: #fff;
        border: none;
      }
    }


  }

  .content {
    height: 85%;
    width: 100%;

    .table_content {
      height: 100%;
      width: 100%;

      :deep(.el-table) {
        background-color: transparent !important;
        --el-table-border-color: none;

        .el-table__row {
          background-color: transparent;
        }
      }
    }

    .pagination {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-right: 5%;
      margin-top: 1%;

      :deep(.el-pagination) {
        .el-pager li {
          background-color: transparent !important;

          &:hover {
            background-color: #409EFF !important;
            border: #409EFF solid 1px !important;
          }

          &.is-active {
            color: #409eff !important;
            font-weight: normal;
            border: #409EFF solid 1px !important;
          }
        }

        .btn-prev,
        .btn-next,
        .el-select__wrapper,
        .el-input__wrapper {
          min-height: 0;
          background-color: transparent;
          height: 25px;
        }
      }
    }
  }
}

/* 控制全选按钮样式 */
.select-popover-class .el-scrollbar__view>.el-checkbox {
  padding: 5px 20px;
}

/* 取消多选框触发事件 */
.select-popover-class .el-scrollbar__view>li .el-checkbox {
  pointer-events: none;
}

/* 隐藏多选框选中勾选样式 √ */
.select-popover-class .el-scrollbar__view>li::after {
  display: none;
}
</style>