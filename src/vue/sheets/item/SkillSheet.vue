<script lang="ts" setup>
/**
 * «Навык» — минимальная карточка:
 *   • только название (заголовок самой карточки)
 *   • только текст-описание
 * Никаких категорий, рейтингов инициативы, источников и т. п.
 */
import { computed, inject } from 'vue';

import { ItemSheetContext, RootContext } from '@/vue/SheetContext';
import BasicItemSheet from '@/vue/sheets/item/BasicItemSheet.vue';
import SkillDataModel from '@/item/data/SkillDataModel';

const ctx = inject<ItemSheetContext<SkillDataModel>>(RootContext)!;
const system = computed(() => ctx.data.item.systemData);
</script>

<template>
	<BasicItemSheet>
		<template #data>
			<section class="data-grid">
				<div class="row">
					<textarea
						name="system.description"
						rows="8"
						placeholder="Описание навыка…"
						v-text="system.description"
					/>
				</div>
			</section>
		</template>
	</BasicItemSheet>
</template>

<style scoped>
.data-grid {
	display: grid;
	gap: 0.5rem;
}
textarea {
	width: 100%;
	resize: vertical;
}
</style>
