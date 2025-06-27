<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';

import CharacterDataModel from '@/actor/data/CharacterDataModel';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import Localized from '@/vue/components/Localized.vue';
import Enriched from '@/vue/components/Enriched.vue';

const context = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;
const system = computed(() => context.data.actor.systemData);

function useAbility(index: number) {
    system.value.useAbility(index);
}
</script>

<template>
    <section class="narrative-abilities block">
        <div class="header"><Localized label="Genesys.Labels.SpecialAbilities" /></div>
        <div class="resource-row">
            <label><Localized label="Genesys.Labels.Resource" /></label>
            <input type="number" name="system.resource" :value="system.resource" />
        </div>
        <div v-if="system.abilities.length === 0" class="no-abilities">
            <Localized label="Genesys.Adversary.None" />
        </div>
        <div v-for="(ability, index) in system.abilities" :key="index" class="ability">
            <div class="ability-header">
                <span class="name">{{ ability.name }}<template v-if="ability.cost"> ({{ ability.cost }})</template></span>
                <button type="button" @click="useAbility(index)"><Localized label="Genesys.Labels.UseAbility" /></button>
            </div>
            <Enriched class="description" :value="ability.description" />
        </div>
    </section>
</template>

<style lang="scss" scoped>
@use '@scss/mixins/reset.scss';

.narrative-abilities {
    display: flex;
    flex-direction: column;
    gap: 0.25em;

    .resource-row {
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

    .ability {
        border-top: 1px dashed black;
        padding-top: 0.25em;

        &:first-of-type {
            border-top: none;
        }

        .ability-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .name {
                font-family: 'Roboto Slab', serif;
            }
        }

        .description {
            padding-left: 0.5em;
        }
    }

    .no-abilities {
        font-style: italic;
    }
}
</style>
