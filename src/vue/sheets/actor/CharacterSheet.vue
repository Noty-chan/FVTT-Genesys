<script lang="ts" setup>
import { computed, inject, onBeforeMount, onBeforeUpdate, ref, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import CharacterMeta from '@/vue/sheets/actor/character/CharacterMeta.vue';
import CombatStat from '@/vue/components/character/CombatStat.vue';
import ResourceDots from '@/vue/components/character/ResourceDots.vue';
import Localized from '@/vue/components/Localized.vue';
import EffectsView from '@/vue/views/EffectsView.vue';

import JournalTab from '@/vue/sheets/actor/character/JournalTab.vue';
import SkillsTab from '@/vue/sheets/actor/character/SkillsTab.vue';
import TalentsTab from '@/vue/sheets/actor/character/TalentsTab.vue';
import InventoryTab from '@/vue/sheets/actor/character/InventoryTab.vue';
import CombatTab from '@/vue/sheets/actor/character/CombatTab.vue';

const context = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;
const system = computed(() => toRaw(context.data.actor).systemData);

const effects = ref<any>([]);

async function addEffect(category: string) {
	await toRaw(context.sheet.actor).createEmbeddedDocuments('ActiveEffect', [
		{
			label: context.data.actor.name,
			img: 'icons/svg/aura.svg',
			disabled: category === 'suppressed',
			duration: category === 'temporary' ? { rounds: 1 } : undefined,
		},
	]);
}

function updateEffects() {
	effects.value = [...toRaw(context.data.actor).effects];
}

onBeforeMount(updateEffects);
onBeforeUpdate(updateEffects);
</script>

<template>
	<div class="character-sheet">
		<CharacterMeta />

                <section class="combat-stat-row">
                        <CombatStat
                                label="Genesys.Labels.Wounds"
                                primary-label="Genesys.Labels.Threshold"
                                :value="system.wounds.max"
                                has-secondary
                                secondary-label="Genesys.Labels.Current"
                                secondary-name="system.wounds.value"
                                :secondary-value="system.wounds.value"
                        />


                        <CombatStat :label="system.resourceName" :value="system.resource" />

                        <CombatStat label="XP" :value="system.xp" editable />

                        <CombatStat
                                label="Genesys.Labels.Defense"
                                primary-label="Genesys.Labels.DefenseRanged"
                                :value="system.totalDefense.ranged"
                                has-secondary
                                secondary-label="Genesys.Labels.DefenseMelee"
                                :secondary-value="system.totalDefense.melee"
                                read-only
                        />
                </section>

                <section class="resources">
                        <ResourceDots label="Genesys.Labels.Contacts" :value="system.contacts" name="system.contacts" icon="fas fa-user-friends" />
                        <ResourceDots label="Genesys.Labels.Intel" :value="system.intel" name="system.intel" icon="fas fa-lightbulb" />
                        <ResourceDots label="Genesys.Labels.Will" :value="system.will" name="system.will" icon="fas fa-bolt" />
                </section>

		<nav class="sheet-tabs" data-group="primary">
			<div class="spacer"></div>

			<a class="item" data-tab="skills"><Localized label="Genesys.Tabs.Skills" /></a>
			<a class="item" data-tab="combat"><Localized label="Genesys.Tabs.Combat" /></a>
			<a class="item" data-tab="talents"><Localized label="Genesys.Tabs.Talents" /></a>
			<!--			<a class="item" data-tab="magic"><Localized label="Genesys.Tabs.Magic"/></a>-->
			<a class="item" data-tab="inventory"><Localized label="Genesys.Tabs.Inventory" /></a>
			<a class="item" data-tab="effects"><Localized label="Genesys.Tabs.Effects" /></a>
			<a class="item" data-tab="journal"><Localized label="Genesys.Tabs.Journal" /></a>

			<div class="spacer"></div>
		</nav>

		<section class="sheet-body">
			<div class="tab" data-tab="skills"><SkillsTab /></div>

			<div class="tab" data-tab="combat"><CombatTab /></div>

			<div class="tab" data-tab="talents"><TalentsTab /></div>

			<!--			<div class="tab" data-tab="magic">MAGIC</div>-->

			<div class="tab" data-tab="inventory"><InventoryTab /></div>

			<div class="tab" data-tab="effects">
				<EffectsView :effects="[...effects]" @add-effect="addEffect" />
			</div>

			<div class="tab" data-tab="journal">
				<JournalTab />
			</div>
		</section>
	</div>
</template>

<style lang="scss" scoped>
.character-sheet {
	width: 100%;
	height: 100%;

	display: grid;
	// Meta, Combat Stats, Tabs, tab content
	grid-template-rows: repeat(3, auto) 1fr;
	gap: 0.5em;
}

// Container for the character's secondary combat stats (wounds, resource, etc.)
.combat-stat-row {
    // By default, evenly space the items across the full sheet width.
    display: flex;
    gap: 1em;
    align-items: center;
    justify-content: space-around;

    // When the sheet is wider than 700px, simply center the stat boxes.
    @container sheet (min-width: 700px) {
        display: flex;
        justify-content: center;

        .combat-stat {
            width: 165px;
        }
    }
} // ← ЭТОТ блок был не закрыт!

.resources {
    display: flex;
    justify-content: center;
    gap: 1em;
}
