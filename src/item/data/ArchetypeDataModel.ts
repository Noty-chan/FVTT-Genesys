/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Archetypes
 */
import BaseItemDataModel from '@/item/data/BaseItemDataModel';
import GenesysItem from '@/item/GenesysItem';
import { ApproachesContainer } from '@/data/Approaches';

type CharacteristicsContainer = {
	brawn: number;
	agility: number;
	intellect: number;
	cunning: number;
	willpower: number;
	presence: number;
};

export default abstract class ArchetypeDataModel extends BaseItemDataModel {
        /**
         * Approach values granted by the Archetype.
         */
        abstract approaches: ApproachesContainer;

        /**
         * Characteristics values granted by the Archetype.
         */
        abstract characteristics: CharacteristicsContainer;

	/**
	 * Wound Threshold granted by the Archetype.
	 */
	abstract woundThreshold: number;

	/**
	 * Strain Threshold granted by the Archetype.
	 */
	abstract strainThreshold: number;

	/**
	 * Starting XP granted by the Archetype.
	 */
	abstract startingXP: number;

	/**
	 * Arbitrary items such as skills, talents, etc. granted by the archetype.
	 */
	abstract grantedItems: GenesysItem<BaseItemDataModel>[];

        static override defineSchema() {
                const fields = foundry.data.fields;

                return {
                        ...super.defineSchema(),
                        approaches: new fields.SchemaField({
                                push: new fields.NumberField({ initial: 0, integer: true }),
                                maneuver: new fields.NumberField({ initial: 0, integer: true }),
                                focus: new fields.NumberField({ initial: 0, integer: true }),
                        }),
                        characteristics: new fields.SchemaField({
                                brawn: new fields.NumberField({ initial: 2, integer: true }),
                                agility: new fields.NumberField({ initial: 2, integer: true }),
                                intellect: new fields.NumberField({ initial: 2, integer: true }),
				cunning: new fields.NumberField({ initial: 2, integer: true }),
				willpower: new fields.NumberField({ initial: 2, integer: true }),
				presence: new fields.NumberField({ initial: 2, integer: true }),
			}),
			woundThreshold: new fields.NumberField({ initial: 10, integer: true }),
			strainThreshold: new fields.NumberField({ initial: 10, integer: true }),
			startingXP: new fields.NumberField({ initial: 100, integer: true }),
			grantedItems: new fields.ArrayField(new fields.ObjectField()),
		};
	}
}
