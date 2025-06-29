<script lang="ts" setup>
import Localized from '@/vue/components/Localized.vue';

withDefaults(
    defineProps<{
        /** Количество заполненных точек. */
        value: number;
        /** Локализационный ключ подписи. */
        label: string;
        /** CSS‑класс иконки перед подписью. */
        icon?: string;
    }>(),
    { icon: '' },
);
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
                :class="i <= value ? 'fas fa-circle' : 'far fa-circle'"
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
