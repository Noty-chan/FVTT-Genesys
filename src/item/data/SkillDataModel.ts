/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Skill Data
 */
import BaseItemDataModel from '@/item/data/BaseItemDataModel';

export default abstract class SkillDataModel extends BaseItemDataModel {
	/**
	 * Skill category
	 */
	abstract category: 'general' | 'magic' | 'combat' | 'social' | 'knowledge';

	/**
	 * Whether the skill can be used for initiative.
	 */
	abstract initiative: boolean;

	/**
	 * (Owned Only) Whether the skill is a career skill for the character.
	 */
	abstract career: boolean;

	/**
	 * (Owned Only) Number of Ranks the player has taken in the skill.
	 */
	abstract rank: number;

	static override defineSchema() {
		const fields = foundry.data.fields;

		return {
			...super.defineSchema(),
			category: new fields.StringField({
				initial: 'general',
				choices: ['general', 'magic', 'combat', 'social', 'knowledge'],
			}),
			initiative: new fields.BooleanField({ initial: false }),
			career: new fields.BooleanField({ initial: false }),
			rank: new fields.NumberField({ integer: true, initial: 0 }),
		};
	}
}
