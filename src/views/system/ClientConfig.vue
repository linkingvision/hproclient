<template>
  <div id="client_config">
    <div class="client_config_top">
      Client Configuration
    </div>
    <div class="client_config_bottom">
      <div class="client_config_left">
        <el-menu default-active="/Basic" class="el-menu-vertical-demo" router @open="handleOpen" @close="handleClose">
          <el-menu-item index="/ClientConfig/Basic">
            <span>Basic</span>
          </el-menu-item>
          <el-menu-item index="/ClientConfig/Joystick">
            <span>Joystick</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="clienyt_config_right">
        <router-view></router-view>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { initWPLPlayer } from "../../utils/initWPL";
import { useClientConfig } from "../../store/client";
const router = useRouter();
const client = useClientConfig();

onMounted(async () => {
  if (client.isLinux || client.isWindows) {
    try {
      await initWPLPlayer();
    } catch (error) {
      console.error('[ClientConfig]', error);
    }
  }

})

const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
}

const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
}

</script>

<style lang="scss" scoped>
#client_config {
  width: 100%;
  height: 100%;

  .client_config_top {
    padding-left: 20px;
    width: 100%;
    height: 47px;
    line-height: 47px;
    font-size: 16px;
    font-family: PingFang-SC, PingFang-SC;
    font-style: normal;
    font-weight: bold;
  }

  .client_config_bottom {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;

    .client_config_left {
      width: 13%;
      height: 100%;

      .el-menu {
        border-right: none;

        .el-menu-item.is-active {
          background-color: rgba(16, 158, 251, .2) !important;
          border-right: 2px solid #2E9EFB !important;
        }
      }
    }

    .clienyt_config_right {
      flex: 1;
      background-color: #2F2F2F;
    }
  }
}
</style>