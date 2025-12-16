<script setup lang='ts'>
import logotest from '../assets/image/logo/hpro.png'
import logozh from '../assets/image/logo/usclogo-zh.png'
import logoen from '../assets/image/logo/usclogo-en.png'
let logo = localStorage.getItem('language') === 'en' ? logoen : logozh;
</script>


<template>
  <div class="logo">
    <img class="logo" :src="logotest" alt="">

    <div class="progress"></div>
  </div>
</template>


<style scoped lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  /* 确保所有元素的尺寸不会因为内边距或边框而增加额外空间 */
}

.logo {
  width: 100%;
  /* 使 logo 自适应屏幕宽度 */
  height: auto;
  /* 自动调整高度，保持图像比例 */
  max-width: 750px;
  /* 防止 logo 超出最大宽度 */
  max-height: 500px;
  /* 防止 logo 超出最大高度 */
  display: block;
  /* 防止图片下方出现空隙 */
  margin: 0 auto;
  /* 居中显示 */
}

.progress {
  width: 100%;
  height: 5px;
  position: absolute;
  border-radius: 10px;
  overflow: hidden;
  bottom: 0;
  left: 0;
  z-index: 10;
}

.progress:after {
  content: '';
  display: block;
  background-color: #0399fe;
  width: 30%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  animation: progressAnimation 10s infinite;
}

@keyframes progressAnimation {
  0% {
    left: 0;
  }

  100% {
    left: 100%;
  }
}
</style>