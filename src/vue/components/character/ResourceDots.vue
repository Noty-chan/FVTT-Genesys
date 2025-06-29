<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';
import Localized from '@/vue/components/Localized.vue';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';

const props = withDefaults(
    defineProps<{
        /** Количество заполненных точек. */
        value: number;
        /** Локализационный ключ подписи. */
        label: string;
        /** CSS‑класс иконки перед подписью. */
        icon?: string;
        /** Путь к обновляемому полю актёра. */
        name: string;
    }>(),
    { icon: '' },
);

const context = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;

const displayedValue = computed(() => Math.min(5, Math.max(0, props.value)));

async function updateDots(i: number) {
    if (!game.user.isGM) {
        return;
    }

    const actor = toRaw(context.data.actor);
    const newValue = i > displayedValue.value ? i : i - 1;
    await actor.update({ [props.name]: Math.min(5, Math.max(0, newValue)) });
}
</script>

<template>
    <div class="resource-dots">
        <label>
            <i v-if="icon" :class="icon"></i>
            <Localized :label="label" />
        </label>
        <div class="dots">
            <i
                v-for="i in 5"
                :key="i"
                :class="i <= displayedValue ? 'fas fa-circle' : 'far fa-circle'"
                @click="updateDots(i)"
            ></i>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.resource-dots {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25em;

    label {
        display: flex;
        align-items: center;
        gap: 0.25em;
        font-family: 'Roboto Condensed', sans-serif;
        text-transform: uppercase;
        font-weight: 600;
    }

    .dots {
        display: flex;
        gap: 0.25em;
    }
}
</style>
