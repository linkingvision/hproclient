<template>
  <div class="operate_log" id="operate_log">

    <div class="title">

      <div class="time">
        <div>Start Time</div>
        <el-date-picker v-model="startValue" type="datetime" class="searchTime" :teleported="false"
          placeholder="Select Date Time"></el-date-picker>
        <div>End Time</div>
        <el-date-picker v-model="endValue" type="datetime" class="searchTime" :teleported="false"
          placeholder="Select Date Time"></el-date-picker>
      </div>

      <div class="function">
        <span>Operate Function</span>
        <el-input v-model="operateFunction"></el-input>
      </div>

      <div class="user">
        <span>Operate User</span>
        <el-input v-model="operationName"></el-input>
      </div>

      <div class="button">
        <el-button class="reset" @click="reset" style="margin-right: 12px;">Reset</el-button>
        <el-button class="search" @click="getOpLog" style="margin-right: 12px;">Search</el-button>
      </div>

    </div>

    <div class="content">

      <div class="table_content">
        <el-table
          :data="tableData.filter((data: any) => !search || data.name.toLowerCase().includes(search.toLowerCase())).slice((currentPage - 1) * pageSize, currentPage * pageSize)"
          @select="selectCell" @select-all="select_Cell" height="100%" style="width: 99.5%;" class="event_table"
          empty-text="No Data Available">
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="index" label="Serial Number" width="130"></el-table-column>
          <el-table-column prop="username" label="User" width="180"></el-table-column>
          <el-table-column prop="clientIp" label="Client IP" width="180"></el-table-column>
          <el-table-column prop="logLevel" label="Log Level"></el-table-column>
          <el-table-column prop="time" label="Time"></el-table-column>
          <el-table-column prop="moduleType" label="Module Type"></el-table-column>
          <el-table-column prop="operation" label="Operation"></el-table-column>
          <el-table-column prop="OperateResult" label="Operate Result"></el-table-column>
        </el-table>
      </div>

      <div class="pagination">
        <el-pagination size="small" background layout="total,prev,pager,next,sizes,jumper" :teleported="false"
          popper-class="page_select" @size-change="handleSizeChange" @current-change="handleCurrentChange"
          :page-sizes="[10, 30, 50, 100, 500, 1000]" v-model:page-size="pageSize" :total="total">
        </el-pagination>
        <el-button class="GoTo" style="width: 80px; height: 25px;background-color: transparent;" size="small">Jump</el-button>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { GetUscLog } from '../../../api/operate';
import { getDeviceInfo } from '../../../utils/site';

const endValue = ref<number>(new Date().getTime());
const startValue = ref<number>(new Date().getTime() - 3600 * 1000 * 24);

const currentPage = ref<number>(1);
const total = ref<number>(0);
const pageSize = ref<number>(100);

const tableData = ref<any>([]);
const selectop = ref<any>([]);

const search = ref<string>("");
const operateFunction = ref<string>("")
const operationName = ref<string>("")

const getOpLog = () => {
  const {root,access_token} = getDeviceInfo();
  tableData.value = [];
  var startDate = dayjs(startValue.value).format('YYYY-MM-DDTHH:mm:ss+08:00');
  var endDate = dayjs(endValue.value).format('YYYY-MM-DDTHH:mm:ss+08:00');
  var data = {};
  if (operateFunction.value) {
    data = {
      username: operationName.value,
      beginTime: startDate,
      endTime: endDate,
      moduleType: operateFunction.value,
      pageSize: 100000,
      pageIndex: 1,
    }
  } else {
    data = {
      username: operationName.value,
      beginTime: startDate,
      endTime: endDate,
      pageSize: 100000,
      pageIndex: 1,
    }
  }
  GetUscLog(root, access_token ,data).then((res: any) => {
    if (res.status === 200) {
      if (res.data.msg === 'Success') {
        let item = res.data.result.list;
        for (let i = 0; i < item.length; i++) {
          var tabledata = {
            index: i + 1,
            username: item[i].username,
            clientIp: item[i].clientIp,
            logLevel: item[i].logLevel,
            moduleType: item[i].moduleType,
            time: item[i].time,
            operation: item[i].operation,
            OperateResult: item[i].OperateResult
          };
          tableData.value.push(tabledata);
        }
        total.value = res.result.count;
      }
    }
  })
};

const reset = () => {
  endValue.value = new Date().getTime();
  startValue.value = new Date().getTime() - 3600 * 1000 * 24;
  operateFunction.value = '';
  operationName.value = '';
}

const selectCell = (row: any) => {
  selectop.value = [];
  for (var i = 0; i < row.length; i++) {
    var selectOp = {
      token: row[i].Id,
      index: row[i].index - 1,
      type: 'dan',
    };
    selectop.value.push(selectOp);
  }
}

const select_Cell = (row: any) => {
  selectop.value = [];
  for (var i = 0; i < row.length; i++) {
    var selectOp = {
      token: row[i].Id,
      index: ((currentPage.value - 1) * 10) + i,
      type: 'duo',
      Name: row[i].name
    };
    selectop.value.push(selectOp);
  }
}

const handleSizeChange = (val: number) => {
  currentPage.value = 1;
  pageSize.value = val;
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
}

</script>
<style lang="scss" scoped>
.ex {
  display: flex;
  align-items: center;
}

.operate_log {
  height: 100%;
  width: 100%;
  font-size: 14px;

  .title {
    padding: 15px 20px;
    height: 5%;
    @extend .ex;
    justify-content: space-between;

    .time {
      width: 45%;
      min-width: 600px;
      @extend .ex;
      justify-content: space-around;

      :deep(.el-input__wrapper) {
        background-color: transparent;
      }

      :deep(.el-dropdown-menu) {
        background-color: transparent;
      }
    }

    .function,
    .user {
      width: 19%;
      min-width: 240px;
      justify-content: space-around;
      @extend .ex;

      span {
        width: 180px;
        display: block;
      }
    }

    .button {
      .reset {
        background: transparent;
        border: 1px solid #177ddc !important;
        color: #177ddc;
        box-sizing: border-box;
      }

      .search {
        background: #177ddc;
        border-radius: 2px;
        color: #FFFFFF;
        border: none;
      }
    }
  }

  .content {
    height: 95%;

    .table_content {
      height: 92.5%;

      :deep(.el-table) {
        background-color: transparent !important;
        --el-table-border-color: none;

        .el-table__row {
          background-color: transparent;
        }
      }
    }

    .pagination {
      margin: 5px 10px 0 0;
      justify-content: flex-end;
      @extend .ex;

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
</style>