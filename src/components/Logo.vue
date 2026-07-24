<script setup lang='ts'>
import logotest from '../assets/image/logo/hpro.png'
import logozh from '../assets/image/logo/usclogo-zh.png'
import logoen from '../assets/image/logo/usclogo-en.png'
let logo = localStorage.getItem('language') === 'en' ? logoen : logozh;
</script>


<template>
  <div class="logo">
    <img class="logo-img" :src="logotest" alt="">

    <div class="progress"></div>
  </div>
</template>


<style scoped lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.logo {
  width: 100%;
  margin: 0 auto;
  .logo-img {
    width: 100%;
    height: 100%;
    // max-height: 500px;
    // object-fit: cover;
    display: block;
  }
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