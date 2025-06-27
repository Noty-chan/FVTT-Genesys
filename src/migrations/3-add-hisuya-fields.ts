import GenesysActor from '@/actor/GenesysActor';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import ArchetypeDataModel from '@/item/data/ArchetypeDataModel';
import GenesysItem from '@/item/GenesysItem';
import { MigrationStatus } from '@/migrations/MigrationHelper';

/**
 * Заполнение новых полей Hisuya у существующих документов.
 */
export async function migrate_AddHisuyaFields() {
	const actorTypes = ['character', 'minion', 'rival', 'nemesis'];

	const actorsInWorld = game.actors.filter<GenesysActor<CharacterDataModel | AdversaryDataModel>>((a) => actorTypes.includes(a.type));
	const actorsInCompendium = await Promise.all(
		game.packs.reduce(
			(accum, pack) => {
				if (pack.metadata.type === 'Actor') {
					pack.index.forEach((idx) => {
						if (actorTypes.includes(idx.type)) {
							accum.push(pack.getDocument(idx._id) as Promise<GenesysActor<CharacterDataModel | AdversaryDataModel>>);
						}
					});
				}
				return accum;
			},
			[] as Promise<GenesysActor<CharacterDataModel | AdversaryDataModel>>[],
		),
	);
	const actors = actorsInWorld.concat(actorsInCompendium);

	for (const actor of actors) {
		const update: Record<string, unknown> = {};
		const approaches = actor.system.approaches as any;
		if (!approaches) {
			update['system.approaches'] = { push: 0, maneuver: 0, focus: 0 };
		} else {
			if (approaches.push === undefined) update['system.approaches.push'] = 0;
			if (approaches.maneuver === undefined) update['system.approaches.maneuver'] = 0;
			if (approaches.focus === undefined) update['system.approaches.focus'] = 0;
		}

		if (actor.type === 'character') {
			const charData = actor.system as CharacterDataModel;
			if (charData.resource === undefined) update['system.resource'] = 0;
			if (!Array.isArray((charData as any).abilities)) update['system.abilities'] = [];
			if (!Array.isArray((charData as any).superCharacteristics)) update['system.superCharacteristics'] = [];
		} else {
			const advData = actor.system as AdversaryDataModel;
			if (!Array.isArray((advData as any).superCharacteristics)) update['system.superCharacteristics'] = [];
		}

		if (Object.keys(update).length > 0) {
			await actor.update(update);
		}
	}

	const archetypesInWorld = game.items.filter<GenesysItem<ArchetypeDataModel>>((i) => i.type === 'archetype');
	const archetypesInCompendium = await Promise.all(
		game.packs.reduce(
			(accum, pack) => {
				if (pack.metadata.type === 'Item') {
					pack.index.forEach((idx) => {
						if (idx.type === 'archetype') {
							accum.push(pack.getDocument(idx._id) as Promise<GenesysItem<ArchetypeDataModel>>);
						}
					});
				}
				return accum;
			},
			[] as Promise<GenesysItem<ArchetypeDataModel>>[],
		),
	);
	const archetypes = archetypesInWorld.concat(archetypesInCompendium);

	for (const archetype of archetypes) {
		const update: Record<string, unknown> = {};
		const approaches = archetype.system.approaches as any;
		if (!approaches) {
			update['system.approaches'] = { push: 0, maneuver: 0, focus: 0 };
		} else {
			if (approaches.push === undefined) update['system.approaches.push'] = 0;
			if (approaches.maneuver === undefined) update['system.approaches.maneuver'] = 0;
			if (approaches.focus === undefined) update['system.approaches.focus'] = 0;
		}
		if (!Array.isArray((archetype.system as any).grantedItems)) {
			update['system.grantedItems'] = [];
		}
		if (Object.keys(update).length > 0) {
			await archetype.update(update);
		}
	}

	return MigrationStatus.SUCCESS;
}
