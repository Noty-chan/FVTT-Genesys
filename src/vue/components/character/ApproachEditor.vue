<script lang="ts" setup>
import { computed, inject } from 'vue';
import { RootContext, ActorSheetContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import Localized from '@/vue/components/Localized.vue';

const context = inject<ActorSheetContext<CharacterDataModel | AdversaryDataModel>>(RootContext)!;
const system = computed(() => context.data.actor.systemData);
</script>

<template>
    <section class="approaches block">
        <div class="header"><Localized label="Genesys.Labels.Approaches" /></div>
        <div class="row">
            <label><Localized label="Genesys.Approach.Push" /></label>
            <input type="number" name="system.approaches.push" :value="system.approaches.push" />
        </div>
        <div class="row">
            <label><Localized label="Genesys.Approach.Maneuver" /></label>
            <input type="number" name="system.approaches.maneuver" :value="system.approaches.maneuver" />
        </div>
        <div class="row">
            <label><Localized label="Genesys.Approach.Focus" /></label>
            <input type="number" name="system.approaches.focus" :value="system.approaches.focus" />
        </div>
    </section>
</template>

<style lang="scss" scoped>
@use '@scss/mixins/reset.scss';

.approaches {
    display: flex;
    flex-direction: column;
    gap: 0.25em;

    .row {
        display: flex;
        align-items: center;
        gap: 0.25em;
        @include reset.input;

        label {
            font-family: 'Roboto Condensed', sans-serif;
            text-transform: uppercase;
            font-weight: 600;
        }

        input {
            width: 4em;
            text-align: right;
        }
    }
}
</style>
