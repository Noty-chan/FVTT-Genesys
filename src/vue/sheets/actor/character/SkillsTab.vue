<script lang="ts" setup>
/**
 * Упрощённая вкладка «Навыки».
 *  – «Добавить навык» показывает диалог со списком навыков из CONFIG.genesys.skills
 *    плюс вариант «Пользовательский».
 *  – При выборе из списка создаётся копия шаблона (с описанием!).
 *  – Название навыка в таблице содержит title-подсказку с его описанием.
 */

import { computed, inject, toRaw } from 'vue';

import CharacterDataModel from '@/actor/data/CharacterDataModel';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterSheet from '@/actor/sheets/CharacterSheet';
import Characteristic from '@/vue/components/character/Characteristic.vue';
import SkillDataModel from '@/item/data/SkillDataModel';
import Localized from '@/vue/components/Localized.vue';
import GenesysItem from '@/item/GenesysItem';
import XPContainer from '@/vue/components/character/XPContainer.vue';
import GenesysRoller from '@/dice/GenesysRoller';
import ContextMenu from '@/vue/components/ContextMenu.vue';
import MenuItem from '@/vue/components/MenuItem.vue';
import MasonryWall from '@yeger/vue-masonry-wall';
import { Approach } from '@/data/Approaches';

const ctx = inject<ActorSheetContext<CharacterDataModel, CharacterSheet>>(RootContext)!;
const system = computed(() => ctx.data.actor.systemData);

const addSkillLabel = game.i18n.localize('Genesys.Labels.AddSkill'); // ← исправлено

/* -------------------- список навыков -------------------- */

const skills = computed(() => {
	const owned = new Map(
		toRaw(ctx.data.actor).items
			.filter((i) => i.type === 'skill')
			.map((i) => [i.name, i as GenesysItem<SkillDataModel>]),
	);
	return CONFIG.genesys.skills.map(
		(s: GenesysItem<SkillDataModel>) => owned.get(s.name) ?? s,
	);
});

/* -------------------- добавление навыка -------------------- */

async function addSkill() {
	const choices: Record<string, string> = {
		blank: game.i18n.localize('Genesys.Labels.CustomSkill'),
	};
	for (const s of CONFIG.genesys.skills) {
		choices[s.id ?? s.name] = s.name;
	}

	// Foundry V10: Dialog.prompt; типы у него «любые», поэтому as any
	const picked: string | null = await (Dialog as any).prompt({
		title: game.i18n.localize('Genesys.Labels.AddSkill'),
		label: game.i18n.localize('Genesys.UI.Add'),
		choices,
	});

	if (picked === null) return; // отмена

	let source: foundry.data.ItemSource<'skill', SkillDataModel['_source']>;

	if (picked === 'blank') {
		source = {
			_id: foundry.utils.randomID(),
			name: game.i18n.localize('Genesys.Labels.NewSkill'),
			type: 'skill',
			img: 'icons/svg/book.svg',
			system: {
				description: '',
				source: '',
				category: 'general',
				initiative: false,
				career: false,
				rank: 0,
			},
			effects: [],
			ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
			sort: 0,
			folder: null,
			flags: {},
		};
	} else {
		const tpl = CONFIG.genesys.skills.find(
			(s: GenesysItem<SkillDataModel>) => (s.id ?? s.name) === picked,
		)!;
		source = { ...(tpl.toObject() as any), _id: foundry.utils.randomID() };
	}

	const skill = await (toRaw(ctx.sheet) as any).createSkill(
		source as any,
	) as GenesysItem<SkillDataModel>;
	await skill?.sheet?.render(true);
}

/* -------------------- бросок -------------------- */

async function rollSkill(skill: GenesysItem<SkillDataModel>) {
	const approach: Approach | null = await (Dialog as any).prompt({
		title: game.i18n.localize('Genesys.ApproachPrompt.Hint'),
		label: 'OK',
		choices: {
			push: game.i18n.localize('Genesys.Approach.Push'),
			maneuver: game.i18n.localize('Genesys.Approach.Maneuver'),
			focus: game.i18n.localize('Genesys.Approach.Focus'),
		},
	});
	if (!approach) return;

	await GenesysRoller.skillRoll({
		actor: toRaw(ctx.data.actor),
		approach: approach as Approach,
		usesSuperCharacteristic: false,
		skillId: skill.id,
		formula: '',
		symbols: {},
	});
}
</script>

<template>
	<section class="tab-skills">
		<!-- характеристики-подходы -->
		<div class="approaches-row">
			<Characteristic label="Genesys.Approach.Push" :value="system.approaches.push" name="system.approaches.push" can-edit />
			<Characteristic label="Genesys.Approach.Maneuver" :value="system.approaches.maneuver" name="system.approaches.maneuver" can-edit />
			<Characteristic label="Genesys.Approach.Focus" :value="system.approaches.focus" name="system.approaches.focus" can-edit />
		</div>

		<!-- список навыков -->
		<div class="skills-row">
			<div class="add-skill">
				<a @click="addSkill"><i class="fas fa-plus"></i> {{ addSkillLabel }}</a>
			</div>

			<MasonryWall :column-width="300" :items="[1]" :gap="8">
				<!-- один столбец – чтобы работал masonry-layout -->
				<div class="skill-category">
					<div class="body">
						<ContextMenu
							v-for="sk in skills"
							:key="sk.id"
							class="row skill"
						>
							<img :src="sk.img" :alt="sk.name" />
							<a
								class="name"
								@click="rollSkill(sk)"
								:title="sk.systemData.description"
							>
								{{ sk.name }}
							</a>
							<span class="rank-display">{{ sk.systemData.rank }}</span>
						</ContextMenu>
					</div>
				</div>
			</MasonryWall>
		</div>

		<!-- опыт -->
		<section class="experience">
			<XPContainer label="Genesys.Labels.TotalXP" :value="system.totalXP" />
			<XPContainer label="Genesys.Labels.AvailableXP" :value="system.availableXP" />
		</section>
	</section>
</template>

<style lang="scss" scoped>
@use '@scss/vars/colors.scss';

.tab-skills {
	display: grid;
	grid-template-rows: auto auto auto 1fr;
	grid-template-columns: 1fr auto 1fr;
	gap: 0.5em;
}

.approaches-row {
	grid-column: 2 / span 1;
	display: flex;
	justify-content: center;
	gap: 3em;
}

.skills-row {
	grid-column: 1 / span all;
	padding: 0 0.5em;

	.add-skill {
		text-align: right;
		margin-bottom: 0.25rem;
	}

	.skill-category .row {
		display: grid;
		grid-template-columns: 1.5rem 1fr auto;
		align-items: center;
		gap: 0.25rem;

		.rank-display {
			text-align: center;
			min-width: 1.5rem;
			border: 1px dashed black;
			border-radius: 0.75rem;
			background: colors.$light-blue;
		}
	}
}
</style>
