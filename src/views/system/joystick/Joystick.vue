<template>
  <div id="client_config_basc">
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane name="basicParam">
        <template #label>
          <span class="custom-tabs-label" style="padding: 0 10px;">
            Basic Actions
          </span>
        </template>
        <div id="joystick">
          <div class="gamepad-container">
            <div class="controls">
              <div class="joystickzoom">
                <div class="joystick1" :class="{ pressed: joystickpressed }">
                  <span class="icon iconfont icon-pingyi-qingxie"></span>
                  <div class="content">
                    <div class="text">Pan And Tilt</div>
                    <div class="sensitivity">
                      <span>Sensitivity</span> &nbsp;&nbsp;&nbsp;
                      <el-slider v-model="sensitivity1" :format-tooltip="formatTooltip1"></el-slider>
                    </div>
                  </div>
                </div>
                <div class="zoominout" :class="{ pressed: zoompressed }">
                  <span class="icon iconfont icon-fangda-suoxiao"></span>
                  <div class="content">
                    <div class="text"> Zoom In / Zoom Out </div>
                    <div class="sensitivity">
                      <span>Sensitivity</span> &nbsp;&nbsp;&nbsp;
                      <el-slider v-model="sensitivity2" :format-tooltip="formatTooltip2"></el-slider>
                    </div>
                  </div>
                </div>
              </div>
              <div v-for="(value, key) in buttonEntries" :key="key" class="button" :class="{ pressed: value.pressed }">
                <span style="display: inline-block; width: 60px;">Button {{ Number(key) + 1 }}</span> &nbsp;
                <div class="btnvalue">{{ value.bind }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup lang="ts">
import { onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted, onErrorCaptured, ref, computed } from "vue";
import type { TabsPaneContext } from 'element-plus'
import { useRouter } from 'vue-router';
import { XboxGamepad } from '../../../utils/gamepad';
import type { GamepadButtonState, GamepadAxisState } from '../../../utils/index';
import { useI18n } from 'vue-i18n'
const router = useRouter();
interface ButtonState {
  pressed: boolean;
  value: number;
  bind: string;
}

interface ButtonMap {
  [key: string]: ButtonState;
}

const sensitivityPT = localStorage.getItem('sensitivityPT');
const sensitivityZ = localStorage.getItem('sensitivityZ');
const sensitivity1 = ref<number>(Math.max(0, parseFloat(sensitivityPT ?? '0.5')) * 100 || 50);
const sensitivity2 = ref<number>(Math.max(0, parseFloat(sensitivityZ ?? '0.5')) * 100 || 50);
const connected = ref<boolean>(false);
const zoompressed = ref<boolean>(false);
const joystickpressed = ref<boolean>(false);

const buttonMap = ref<ButtonMap>({
  '0': {
    pressed: false,
    value: 0,
    bind: 'Next grid'
  },
  '1': {
    pressed: false,
    value: 0,
    bind: 'Previous grid'
  },
  '2': {
    pressed: false,
    value: 0,
    bind: 'Full Screen/Exit Full Screen'
  },
  '3': {
    pressed: false,
    value: 0,
    bind: 'Hotkey 1'
  },
  '4': {
    pressed: false,
    value: 0,
    bind: 'Hotkey 2'
  },
  '5': {
    pressed: false,
    value: 0,
    bind: 'Hotkey 3'
  },
});

const buttonEntries = computed(() => buttonMap.value);

const activeName = ref('basicParam')
const formatTooltip1 = (val: number) => {
  localStorage.setItem('sensitivityPT', (val / 100).toString());
  return val / 100;
};

const formatTooltip2 = (val: number) => {
  localStorage.setItem('sensitivityZ', (val / 100).toString());
  return val / 100;
};

const onButtonPress = (data: any, name: string) => {
  if (data.index == 6 || data.index == 7) {
    zoompressed.value = data.pressed;
  } else {
    buttonMap.value[String(data.index)].pressed = data.pressed;
  }
};

const onButtonRelease = (data: any, name: string) => {
  if (data.index == 6 || data.index == 7) {
    zoompressed.value = data.pressed;
  } else {
    buttonMap.value[String(data.index)].pressed = data.pressed;
  }
};

const onAxisChange = (axis: any) => {
  joystickpressed.value = false;
  for (const key in axis) {
    if (key === 'LeftStickX' || key === 'LeftStickY') {
      if (Math.abs(axis[key].value) > 0.15) {
        joystickpressed.value = true;
        return;
      }
    }
  }
};

const onConnected = (data: boolean) => {
  connected.value = data;
};

let gamepad: XboxGamepad;

onMounted(() => {
  gamepad = new XboxGamepad({
    onButtonPress,
    onButtonRelease,
    onAxisChange,
    onConnected,
    deadZone: 0.15
  });

  gamepad.startListening();
  connected.value = gamepad.connected;
});

onBeforeUnmount(() => {
  if (gamepad) {
    gamepad.stopListening();
  }
});

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}

</script>
<style scoped lang="scss">
#client_config_basc {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 10px;
}

#joystick {
  width: 100%;
  height: 100%;
  padding: 20px 20px;
  font-size: 14px;
  overflow: auto;
}

.gamepad-container {
  max-width: 800px;
  padding: 0 20px;
  font-family: Arial, sans-serif;

  h5 {
    font-size: 23px;
    padding: 30px 0;
  }

  .controls {
    display: flex;
    flex-direction: column;

    .joystickzoom {
      display: flex;
      flex-direction: column;
      padding-bottom: 10px;
      gap: 15px;

      .joystick1,
      .zoominout {
        width: 380px;
        height: 120px;
        padding: 20px 10px;
        display: flex;
        border-radius: 5px;
        align-items: center;

        .icon {
          width: 100px;
          text-align: center;
          font-size: 70px;
        }

        .content {
          padding: 0 15px;
          flex: 1;

          .text {
            font-size: 17px;
            padding-bottom: 15px;
          }

          .sensitivity {
            display: flex;
            align-items: center;

            .el-slider {
              flex: 1;
            }
          }
        }
      }
    }
  }

  .buttons-section,
  .axes-section {
    flex: 1;
    padding: 15px;
    border-radius: 8px;
  }

  .button,
  .axis {
    padding: 8px;
    border-radius: 4px;

    .btnvalue {
      display: inline-block;
      border-radius: 4px;
      padding: 5px;
      width: 300px;
    }
  }
}
</style>
