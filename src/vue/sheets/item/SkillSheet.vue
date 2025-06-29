<script lang="ts" setup>
import { inject } from 'vue';

import { ItemSheetContext, RootContext } from '@/vue/SheetContext';
import SkillDataModel from '@/item/data/SkillDataModel';
import BasicItemSheet from '@/vue/sheets/item/BasicItemSheet.vue';

/**
 * Контекст нужен лишь для того, чтобы BasicItemSheet получил item-данные
 * и корректно сохранил описание.  Больше мы здесь ничего не делаем.
 */
inject<ItemSheetContext<SkillDataModel>>(RootContext)!;
</script>

<template>
  <!-- BasicItemSheet сам рендерит:
       • заголовок (иконка + название)
       • вкладку Description с rich-text-полем
       • кнопки сохранения/закрытия
     Всё, что нам нужно для кастомного навыка. -->
  <BasicItemSheet />
</template>

<style scoped>
/* Ничего дополнительно не стилизуем — наследуем стандартный вид. */
</style>
