<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../store';
import HProBlackEN from '../assets/image/HPro-black-en.svg'
import HProWhiteEN from '../assets/image/HPro-white-en.svg'
import packageJSON from '../../package.json'

const store = useStore();

const darkMode = computed(() => store.darkMode);

const version = packageJSON.description;
</script>

<template>
  <div class="hpro-about">
      <div v-if="store.lang === 'en'">
        <img :src="darkMode ? HProBlackEN : HProWhiteEN" alt="">
      </div>
      <div class="version">Version: {{ version }}</div>
  </div>
</template>

<style lang="scss" scoped>
.hpro-about {
  width: 100%;
  height: 100%;
  background-image: url('../assets/image/About-background.png');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  img {
    height: 46px;
    margin-left: 80px;
  }
  .version {
    margin-top: 70px;
  }
}
</style>