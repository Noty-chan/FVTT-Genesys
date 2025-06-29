/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Player Character
 */

import GenesysActor from '@/actor/GenesysActor';
import { EntryType, ExperienceJournal } from '@/actor/data/character/ExperienceJournal';
import IHasPreCreate from '@/data/IHasPreCreate';
import GenesysItem from '@/item/GenesysItem';
import ArmorDataModel from '@/item/data/ArmorDataModel';
import EquipmentDataModel, { EquipmentState } from '@/item/data/EquipmentDataModel';
import { Characteristic, CharacteristicsContainer } from '@/data/Characteristics';
import { Approach, ApproachesContainer } from '@/data/Approaches';
import { CombatPool, Defense } from '@/data/Actors';
import GenesysEffect from '@/effects/GenesysEffect';
import TalentDataModel from '@/item/data/TalentDataModel';
import { TokenAttributeDetails } from '@/token/GenesysTokenDocument';

type Motivation = {
	name: string;
	description: string;
};

type Motivations = {
	strength: Motivation;
	flaw: Motivation;
	desire: Motivation;
	fear: Motivation;
};

type Details = {
	gender: string;
	age: string;
	height: string;
	build: string;
	hair: string;
	eyes: string;
	notableFeatures: string;
};

type Encumbrance = {
        value: number;
        threshold: number;
};

export type NarrativeAbility = {
       name: string;
       description: string;
       cost: number;
};

type CharacterActor = GenesysActor<CharacterDataModel>;
type ArmorItem = GenesysItem<ArmorDataModel>;
type EquipmentItem = GenesysItem<EquipmentDataModel>;

// We can get rid of this type when Typescript finally allows getting the keys of private static variables, which will make it so
// that the first argument type of `isRelevantTypeForContext` is replaced with `keyof typeof VehicleDataModel.#RELEVANT_TYPES`.
type RelevantTypes = {
	APTITUDE: string[];
	SKILL: string[];
	COMBAT: string[];
	TALENT: string[];
	ENCUMBRANCE: string[];
	INVENTORY: string[];
	EQUIPABLE: string[];
	CONSUMABLE: string[];
};

export default abstract class CharacterDataModel extends foundry.abstract.DataModel implements IHasPreCreate<CharacterActor> {
        abstract characteristics: CharacteristicsContainer;
        abstract approaches: ApproachesContainer;
       abstract soak: number;
       abstract defense: Defense;
       abstract physDefense: number;
       abstract magicDefense: number;
       abstract wounds: CombatPool;
	abstract strain: CombatPool;
	abstract illustration: string;
	abstract motivations: Motivations;
	abstract details: Details;
	abstract experienceJournal: ExperienceJournal;
       abstract encumbrance: Encumbrance;
       abstract currency: number;
       abstract resource: number;
       abstract resourceName: string;
       abstract contacts: number;
       abstract intel: number;
       abstract will: number;
       abstract xp: number;
       abstract xpHistory: { amount: number; note?: string; target?: string }[];
       abstract resourceHistory: { resource: string; amount: number; note?: string }[];
       abstract abilities: NarrativeAbility[];
       abstract notes: string;
	abstract superCharacteristics: Set<Characteristic>;

	/**
	 * A list of Document types that a Character actor cares about for different reasons.
	 */
	static readonly #RELEVANT_TYPES: RelevantTypes = {
		// Types of items that are used to build a character.
		APTITUDE: ['archetype', 'career'],
		// Types that are related to the Skills tab.
		SKILL: ['skill'],
		// Types that are related to the Combat tab.
		COMBAT: ['injury'],
		// Types that are related to the Talents tab.
		TALENT: ['ability', 'talent'],
		// Types that are used to calculate encumbrance values.
		ENCUMBRANCE: ['weapon', 'armor', 'consumable', 'gear', 'container'],
		// Types that are listed on the Inventory tab.
		INVENTORY: ['weapon', 'armor', 'consumable', 'gear', 'container'],
		// Types that can be equipped.
		EQUIPABLE: ['weapon', 'armor'],
		// Types that can be spent.
		CONSUMABLE: ['consumable'],
	};

	static readonly tokenAttributes: Record<string, TokenAttributeDetails> = {
		wounds: {
			label: 'Wounds',
			isBar: true,
			editable: true,
			valuePath: 'wounds.value',
			maxPath: 'wounds.max',
		},
                strain: {
                        label: 'Strain',
                        isBar: true,
                        editable: true,
                        valuePath: 'strain.value',
                        maxPath: 'strain.max',
                },
                resource: {
                        label: 'Resource',
                        isBar: false,
                        editable: true,
                        valuePath: 'resource',
                },
                soak: {
			label: 'Soak',
			isBar: false,
			editable: false,
			valuePath: 'totalSoak',
		},
	};

	static isRelevantTypeForContext(context: keyof RelevantTypes, type: string) {
		return !!type && (CharacterDataModel.#RELEVANT_TYPES[context]?.includes(type) ?? false); // eslint-disable-line
	}

	/**
	 * Total value for Soak (base + Brawn + Armor).
	 */
	get totalSoak(): number {
		const armorSoak = (<CharacterActor>(<unknown>this.parent)).items
			.filter((i) => i.type === 'armor' && (<ArmorItem>i).systemData.state === 'equipped')
			.map((i) => (<ArmorItem>i).systemData.soak)
			.reduce((total, s) => total + s, 0);
		return this.soak + this.characteristics.brawn + armorSoak;
	}

	/**
	 * Total value for Defense (base defenses + armor).
	 */
        get totalDefense(): Defense {
                const armorDefense = (<CharacterActor>(<unknown>this.parent)).items
                        .filter((i) => i.type === 'armor' && (<ArmorItem>i).systemData.state === 'equipped')
                        .map((i) => (<ArmorItem>i).systemData.defense)
                        .reduce((total, d) => total + d, 0);

                return {
                        ranged: Math.min(4, this.defense.ranged + armorDefense),
                        melee: Math.min(4, this.defense.melee + armorDefense),
                };
        }

       get totalPhysDefense(): number {
               return this.physDefense;
       }

       get totalMagicDefense(): number {
               return this.magicDefense;
       }

	/**
	 * Amount of XP the character has available to spend right now.
	 */
	get availableXP() {
		return this.experienceJournal.entries.reduce((total, entry) => total + entry.amount, 0);
	}

	/**
	 * Amount of experience the character has available to spend solely from their starting XP pool.
	 */
	get availableStartingXP() {
		const startingXP = this.experienceJournal.entries[0];
		if (!startingXP || startingXP.type !== EntryType.Starting) {
			return 0;
		}

		return this.experienceJournal.entries.reduce((total, entry) => total + Math.min(0, entry.amount), startingXP.amount);
	}

	/**
	 * Total amount of experience the character has gained over their lifetime.
	 */
	get totalXP() {
		return this.experienceJournal.entries.reduce((total, entry) => total + Math.max(0, entry.amount), 0);
	}

	/**
	 * Player's current Encumbrance value, including both ActiveEffects and equipment.
	 */
	get currentEncumbrance(): Encumbrance {
		return {
			value: Math.max(0, (<CharacterActor>(<unknown>this.parent)).items.reduce((total, i) => total + this.#effectiveEncumbranceForItem(<EquipmentItem>i), 0) + this.encumbrance.value),
			threshold: 5 + this.encumbrance.threshold + this.characteristics.brawn + this.#additionalEncumbranceThreshold(),
		};
	}

	/**
	 * Whether the character is currently encumbered.
	 */
        get isEncumbered() {
                const currentEncumbrance = this.currentEncumbrance;

                return currentEncumbrance.value > currentEncumbrance.threshold;
        }

        /**
         * Use a narrative ability by index.
         */
        async useAbility(index: number) {
                const ability = this.abilities[index];
                if (!ability) {
                        return;
                }

                if (this.resource < ability.cost) {
                        ui.notifications.warn('Genesys.Notifications.NotEnoughResource');
                        return;
                }

                await (this.parent as unknown as Actor).update({ 'system.resource': this.resource - ability.cost });
                const enriched = await TextEditor.enrichHTML(ability.description, { async: true });
                await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: this.parent as unknown as Actor }),
                        content: `<strong>${ability.name}</strong><br/>${enriched}`,
                });
        }

        async gainXP(amount: number, note?: string) {
                await (this.parent as unknown as Actor).update({
                        'system.xp': this.xp + amount,
                        'system.xpHistory': [
                                ...this.xpHistory,
                                { amount, note },
                        ],
                });
        }

        async spendXP(amount: number, target?: string, note?: string) {
                if (this.xp < amount) {
                        return false;
                }

                await (this.parent as unknown as Actor).update({
                        'system.xp': this.xp - amount,
                        'system.xpHistory': [
                                ...this.xpHistory,
                                { amount: -amount, target, note },
                        ],
                });

                return true;
        }

       async gainContacts(amount: number, note?: string) {
               await (this.parent as unknown as Actor).update({
                       'system.contacts': this.contacts + amount,
                       'system.resourceHistory': [
                               ...this.resourceHistory,
                               { resource: 'contacts', amount, note },
                       ],
               });
       }

       async spendContacts(amount: number, note?: string) {
               if (this.contacts < amount) {
                       return false;
               }

               await (this.parent as unknown as Actor).update({
                       'system.contacts': this.contacts - amount,
                       'system.resourceHistory': [
                               ...this.resourceHistory,
                               { resource: 'contacts', amount: -amount, note },
                       ],
               });

               return true;
       }

       async gainIntel(amount: number, note?: string) {
               await (this.parent as unknown as Actor).update({
                       'system.intel': this.intel + amount,
                       'system.resourceHistory': [
                               ...this.resourceHistory,
                               { resource: 'intel', amount, note },
                       ],
               });
       }

       async spendIntel(amount: number, note?: string) {
               if (this.intel < amount) {
                       return false;
               }

               await (this.parent as unknown as Actor).update({
                       'system.intel': this.intel - amount,
                       'system.resourceHistory': [
                               ...this.resourceHistory,
                               { resource: 'intel', amount: -amount, note },
                       ],
               });

               return true;
       }

       async gainWill(amount: number, note?: string) {
               await (this.parent as unknown as Actor).update({
                       'system.will': this.will + amount,
                       'system.resourceHistory': [
                               ...this.resourceHistory,
                               { resource: 'will', amount, note },
                       ],
               });
       }

       async spendWill(amount: number, note?: string) {
               if (this.will < amount) {
                       return false;
               }

               await (this.parent as unknown as Actor).update({
                       'system.will': this.will - amount,
                       'system.resourceHistory': [
                               ...this.resourceHistory,
                               { resource: 'will', amount: -amount, note },
                       ],
               });

               return true;
       }

	get talentPyramidTotals() {
		const allTalents = (<CharacterActor>(<unknown>this.parent)).items.filter((i) => i.type === 'talent') as GenesysItem<TalentDataModel>[];
		return allTalents.reduce(
			(accumulator, talent) => {
				const talentEffectiveTier = talent.systemData.effectiveTier;
				for (let k = talentEffectiveTier; k > 0; k--) {
					if (k === 5 && talentEffectiveTier === 5) {
						// If we want to count talents of tier 5 it requires that we consider the ranking of the talent if appropriate;
						// ranked talents that are at tier 5 remain at that tier for any future purchases.
						accumulator[k] += talent.systemData.rank - (talentEffectiveTier - talent.systemData.tier);
					} else if (talent.systemData.tier === k) {
						// Count the talent if it matches the desired tier.
						accumulator[k]++;
					} else if (talent.systemData.tier < k && talentEffectiveTier >= k) {
						// Count the talent if it's from a lower tier but it has been purchased enough times that at some point it was
						// considered as a talent of the desired tier.
						accumulator[k]++;
					}
				}
				return accumulator;
			},
			{
				'1': 0,
				'2': 0,
				'3': 0,
				'4': 0,
				'5': 0,
			} as Record<number, number>,
		);
	}

        get canPurchaseCharacteristicAdvance(): { brawn: boolean; agility: boolean; intellect: boolean; cunning: boolean; willpower: boolean; presence: boolean } {
                const availableXP = this.xp;

                return {
                        brawn: this.characteristics.brawn < 5 && availableXP >= (this.characteristics.brawn + 1) * 10,
                        agility: this.characteristics.agility < 5 && availableXP >= (this.characteristics.agility + 1) * 10,
                        intellect: this.characteristics.intellect < 5 && availableXP >= (this.characteristics.intellect + 1) * 10,
                        cunning: this.characteristics.cunning < 5 && availableXP >= (this.characteristics.cunning + 1) * 10,
                        willpower: this.characteristics.willpower < 5 && availableXP >= (this.characteristics.willpower + 1) * 10,
                        presence: this.characteristics.presence < 5 && availableXP >= (this.characteristics.presence + 1) * 10,
                };
        }

	#additionalEncumbranceThreshold() {
		return (<CharacterActor>(<unknown>this.parent)).items
			.filter((i) => (<EquipmentItem>i).systemData.encumbrance !== undefined && (i as EquipmentItem).systemData.state !== EquipmentState.Dropped && (i as EquipmentItem).systemData.encumbrance < 0)
			.reduce((total, i) => total + Math.abs((<EquipmentItem>i).systemData.encumbrance), 0);
	}

	#effectiveEncumbranceForItem(item: EquipmentItem) {
		if (!CharacterDataModel.isRelevantTypeForContext('ENCUMBRANCE', item.type)) {
			return 0;
		}

		// Negative encumbrance increases Encumbrance Threshold.
		if (item.systemData.encumbrance < 0 || item.systemData.state === 'dropped') {
			return 0;
		}

		// When armor is worn, its encumbrance rating is reduced by three (to a minimum of 0).
		if (item.type === 'armor') {
			if (item.systemData.state === 'equipped') {
				return Math.max(0, item.systemData.encumbrance - 3) + Math.max(0, item.systemData.encumbrance * (item.systemData.quantity - 1));
			}
		}

		// If it's contained, we need to cycle through to the root container to determine if the container is dropped.
		if (item.systemData.container !== '') {
			let container = <EquipmentItem>(<CharacterActor>(<unknown>this.parent)).items.get(item.systemData.container);
			while (container) {
				if (container.systemData.container === '') {
					// If the root container is dropped, this item doesn't contribute.
					if (container.systemData.state === 'dropped') {
						return 0;
					}

					// Otherwise return to the regular path.
					break;
				}

				container = <EquipmentItem>(<CharacterActor>(<unknown>this.parent)).items.get(item.systemData.container);
			}
		}

		return item.systemData.encumbrance * item.systemData.quantity;
	}

	// Maintain consistent with the function of the same name in `VehicleDataModel`.
	async handleEffectsStatus(items: GenesysItem[], overrides?: { equipmentState: EquipmentState }) {
		const actor = this.parent as unknown as GenesysActor<this>;

		const allUpdates = [];
		for (const item of items) {
			let effectDisableStatus = false;

			// If the item is equipment then enable its effects only if it's are on the proper equipment state.
			if (CharacterDataModel.isRelevantTypeForContext('INVENTORY', item.type)) {
				const itemEquipmentState = overrides?.equipmentState ? overrides.equipmentState : (item.systemData as EquipmentDataModel).state;
				if (CharacterDataModel.isRelevantTypeForContext('EQUIPABLE', item.type)) {
					effectDisableStatus = EquipmentState.Equipped !== itemEquipmentState;
				} else if (CharacterDataModel.isRelevantTypeForContext('CONSUMABLE', item.type)) {
					effectDisableStatus = EquipmentState.Used !== itemEquipmentState;
				} else {
					effectDisableStatus = EquipmentState.Carried !== itemEquipmentState;
				}
			}

			allUpdates.push(
				...actor.effects
					.filter((effect) => (effect as GenesysEffect).originItem?.id === item.id && effect.disabled !== effectDisableStatus)
					.map(
						async (effect) =>
							await effect.update({
								disabled: effectDisableStatus,
							}),
					),
			);
		}

		await Promise.all(allUpdates);
	}

	async preCreate(actor: CharacterActor, _data: PreDocumentId<any>, _options: DocumentModificationContext<CharacterActor>, _user: User) {
		// Player character tokens should default to being Friendly.
		const prototypeToken = {
			bar1: { attribute: 'wounds' },
			bar2: { attribute: 'strain' },
			disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
			actorLink: true,
		};
		await actor.updateSource({ prototypeToken });

		// Already have skills data, so we have no reason to add new ones.
		if (actor.items.find((i) => i.type === 'skill')) {
			return;
		}

		const skills = CONFIG.genesys.skills;

		if (skills.length === 0) {
			ui.notifications.warn('Genesys.Notifications.CharacterWithNoSkills', { localize: true });
			return;
		}

		const skillItems = skills.map((i) => i.toObject());
		await actor.updateSource({ items: skillItems });
	}

	static override defineSchema() {
		const fields = foundry.data.fields;

                return {
                        approaches: new fields.SchemaField({
                                push: new fields.NumberField({ integer: true, initial: 0 }),
                                maneuver: new fields.NumberField({ integer: true, initial: 0 }),
                                focus: new fields.NumberField({ integer: true, initial: 0 }),
                        }),
                        characteristics: new fields.SchemaField({
                                brawn: new fields.NumberField({ integer: true, initial: 0 }),
                                agility: new fields.NumberField({ integer: true, initial: 0 }),
                                intellect: new fields.NumberField({ integer: true, initial: 0 }),
				cunning: new fields.NumberField({ integer: true, initial: 0 }),
				willpower: new fields.NumberField({ integer: true, initial: 0 }),
				presence: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			soak: new fields.NumberField({ integer: true, initial: 0 }),
                       defense: new fields.SchemaField({
                               melee: new fields.NumberField({ integer: true, initial: 0 }),
                               ranged: new fields.NumberField({ integer: true, initial: 0 }),
                       }),
                       physDefense: new fields.NumberField({ integer: true, initial: 0 }),
                       magicDefense: new fields.NumberField({ integer: true, initial: 0 }),
                       wounds: new fields.SchemaField({
                               value: new fields.NumberField({ integer: true, initial: 0 }),
                               max: new fields.NumberField({ integer: true, initial: 0 }),
                       }),
			strain: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				max: new fields.NumberField({ integer: true, initial: 0 }),
			}),
			illustration: new fields.StringField(),
			motivations: new fields.SchemaField({
				strength: new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
				}),
				flaw: new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
				}),
				desire: new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
				}),
				fear: new fields.SchemaField({
					name: new fields.StringField(),
					description: new fields.HTMLField(),
				}),
			}),
			details: new fields.SchemaField({
				gender: new fields.StringField(),
				age: new fields.StringField(),
				height: new fields.StringField(),
				build: new fields.StringField(),
				hair: new fields.StringField(),
				eyes: new fields.StringField(),
				notableFeatures: new fields.StringField(),
			}),
			notes: new fields.HTMLField(),
			experienceJournal: new fields.SchemaField({
				entries: new fields.ArrayField(
					new fields.SchemaField({
						amount: new fields.NumberField({ integer: true, initial: 0 }),
						type: new fields.StringField({ required: true }),
						data: new fields.ObjectField(),
					}),
				),
			}),
			encumbrance: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0 }),
				threshold: new fields.NumberField({ integer: true, initial: 0 }),
			}),
                        currency: new fields.NumberField({ initial: 500 }),
                       resource: new fields.NumberField({ integer: true, initial: 0 }),
                       resourceName: new fields.StringField(),
                       contacts: new fields.NumberField({ integer: true, initial: 0 }),
                       intel: new fields.NumberField({ integer: true, initial: 0 }),
                       will: new fields.NumberField({ integer: true, initial: 0 }),
                       xp: new fields.NumberField({ integer: true, initial: 0 }),
                       xpHistory: new fields.ArrayField(
                               new fields.SchemaField({
                                       amount: new fields.NumberField({ integer: true, initial: 0 }),
                                       note: new fields.StringField(),
                                       target: new fields.StringField(),
                               }),
                       ),
                       resourceHistory: new fields.ArrayField(
                               new fields.SchemaField({
                                       resource: new fields.StringField(),
                                       amount: new fields.NumberField({ integer: true, initial: 0 }),
                                       note: new fields.StringField(),
                               }),
                       ),
                       abilities: new fields.ArrayField(
                               new fields.SchemaField({
                                       name: new fields.StringField(),
                                       description: new fields.HTMLField(),
                                       cost: new fields.NumberField({ integer: true, initial: 0 }),
                                }),
                        ),
                        superCharacteristics: new fields.SetField(new fields.StringField()),
                };
        }
}
