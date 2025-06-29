<script lang="ts" setup>
import { inject } from 'vue';
import { ApproachPromptContext } from '@/app/ApproachPrompt';
import { Approach } from '@/data/Approaches';
import { RootContext } from '@/vue/SheetContext';
import Localized from '@/vue/components/Localized.vue';

const context = inject<ApproachPromptContext>(RootContext)!;

function choose(approach: Approach) {
    context.resolve(approach);
}
</script>

<template>
  <div class="genesys approach-prompt">
    <p class="hint"><Localized label="Genesys.ApproachPrompt.Hint" /></p>
    <div class="choices">
      <button @click="choose(Approach.Push)"><Localized label="Genesys.Approach.Push" /></button>
      <button @click="choose(Approach.Maneuver)"><Localized label="Genesys.Approach.Maneuver" /></button>
      <button @click="choose(Approach.Focus)"><Localized label="Genesys.Approach.Focus" /></button>
    </div>
  </div>
</template>

<style lang="scss">
.app-approach-prompt {
  min-width: 10rem;
  min-height: 6rem;
}
</style>
