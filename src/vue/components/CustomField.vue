<script lang="ts" setup>
import ContextMenu from '@/vue/components/ContextMenu.vue';
import MenuItem from '@/vue/components/MenuItem.vue';
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    field: { id: string; label: string; type: 'text' | 'number' | 'checkbox'; value: any };
    editable?: boolean;
  }>(),
  { editable: true },
);

const emit = defineEmits<{
  (e: 'update', payload: { label?: string; value?: any }): void;
  (e: 'delete'): void;
}>();

const deleteLabel = computed(() => game.i18n.localize('Genesys.Labels.Delete'));

function updateLabel(event: Event) {
  emit('update', { label: (event.target as HTMLInputElement).value });
}

function updateValue(event: Event) {
  const target = event.target as HTMLInputElement;
  let value: any = target.value;
  if (props.field.type === 'number') {
    value = parseFloat(value);
    if (isNaN(value)) value = 0;
  }
  if (props.field.type === 'checkbox') {
    value = target.checked;
  }
  emit('update', { value });
}
</script>

<template>
  <div class="custom-field">
    <ContextMenu v-if="editable" class="field-row">
      <template v-slot:menu-items>
        <MenuItem @click="emit('delete')">
          <template v-slot:icon><i class="fas fa-trash"></i></template>
          {{ deleteLabel }}
        </MenuItem>
      </template>

      <input type="text" class="label" :value="field.label" @change="updateLabel" />
      <template v-if="field.type === 'text'">
        <input type="text" class="value" :value="field.value" @change="updateValue" />
      </template>
      <template v-else-if="field.type === 'number'">
        <input type="number" class="value" :value="field.value" @change="updateValue" />
      </template>
      <template v-else>
        <input type="checkbox" class="value" :checked="field.value" @change="updateValue" />
      </template>
    </ContextMenu>
    <template v-else>
      <div class="field-row readonly">
        <span class="label">{{ field.label }}</span>
        <template v-if="field.type === 'checkbox'">
          <input type="checkbox" disabled :checked="field.value" />
        </template>
        <template v-else>{{ field.value }}</template>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.custom-field {
  display: flex;
  align-items: center;
  .field-row {
    display: flex;
    align-items: center;
    gap: 0.25em;
    width: 100%;
    &.readonly {
      padding-left: 0.25em;
    }
    .label {
      width: 8em;
    }
    .value {
      flex: 1;
    }
  }
}
</style>
