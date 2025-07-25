/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file ActiveEffect configuration sheet
 */

import GenesysEffect from '@/effects/GenesysEffect';
import { Characteristic } from '@/data/Characteristics';
import { PoolModGlyphPattern } from '@/dice/types/GenesysPoolModifications';
import './GenesysEffectSheet.scss';

type EffectChangeExpanded = foundry.data.EffectChangeSource & {
	skill?: string;
	char?: string;
};

type IncompleteSheetSubmitData = { changes: EffectChangeExpanded[] };

export default class GenesysEffectSheet extends ActiveEffectConfig<GenesysEffect> {
	static override get defaultOptions() {
		return {
			...super.defaultOptions,
			classes: ['genesys', 'sheet'],
			width: 500,
			height: 400,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'description',
				},
			],
		};
	}

	override get template(): string {
		return 'systems/genesys/templates/sheets/effect-config.hbs';
	}

	override async getData(options?: DocumentSheetOptions) {
		const data = await super.getData(options);

		// The 'Custom' mode is not explicitly used.
		delete data.modes[CONST.ACTIVE_EFFECT_MODES.CUSTOM];

		// Make a copy of all the changes and do additional processing for the ones that deal with dice pool
		// modifications. We use copies because we don't want to modify the effect itself by simply oppening the sheet.
		const changes = [];
		for (const change of data.data.changes) {
			const thisChange = { ...change } as EffectChangeExpanded;
			const extractDicePoolMod = thisChange.key.split(GenesysEffect.DICE_POOL_MOD_KEY_PATTERN);

			if (extractDicePoolMod.length === 2) {
				thisChange.key = extractDicePoolMod[0];

				if (extractDicePoolMod[0].includes(GenesysEffect.DICE_POOL_MOD_CHAR_TYPE)) {
					thisChange.char = extractDicePoolMod[1];
				} else if (extractDicePoolMod[0].includes(GenesysEffect.DICE_POOL_MOD_SKILL_TYPE)) {
					thisChange.skill = extractDicePoolMod[1];
				}
			}
			changes.push(thisChange);
		}

		return foundry.utils.mergeObject(data, {
			changes,
			skills: Object.fromEntries(CONFIG.genesys.skills.map((skill) => [skill.name, skill.name])),
			characteristics: Object.fromEntries(Object.entries(Characteristic).map(([charName, charKey]) => [charKey, charName])),
		});
	}

	override activateListeners(html: JQuery) {
		super.activateListeners(html);

		// Make sure we show/hide the proper `select` elements when picking a dice pool modification.
		html.find('.effect-change > select:first-child').on('change', (event) => {
			const targetSelect = event.currentTarget as HTMLSelectElement;
			let targetOptionType: string;

			if (GenesysEffect.DICE_POOL_MOD_KEY_PATTERN.test(targetSelect.value)) {
				if (targetSelect.value.includes(GenesysEffect.DICE_POOL_MOD_CHECK_TYPE)) {
					targetOptionType = 'check-selection';
				} else if (targetSelect.value.includes(GenesysEffect.DICE_POOL_MOD_CHAR_TYPE)) {
					targetOptionType = 'characteristic-selection';
				} else if (targetSelect.value.includes(GenesysEffect.DICE_POOL_MOD_SKILL_TYPE)) {
					targetOptionType = 'skill-selection';
				} else {
					targetOptionType = 'effect-mode';
				}
			} else {
				targetOptionType = 'effect-mode';
			}

			const children = targetSelect.nextElementSibling?.children ?? [];
			for (let k = 0; k < children.length; k++) {
				if (children[k].classList.contains(targetOptionType)) {
					children[k].classList.add('show-it');
				} else {
					children[k].classList.remove('show-it');
				}
			}
		});

		if (this.isEditable) {
			// Foundry v10 and v11 bind this functionality differently so instead we override that behavior with our own.
			html.find('img[data-edit]').off('click');
			html.find('img[data-edit]').on('click', this._onEditImage.bind(this));
		}
	}

	protected async _onEditImage(event: Event) {
		const fp = new FilePicker({
			type: 'image',
			current: this.object.img,
			callback: async (path: string) => {
				(<HTMLImageElement>event.currentTarget).src = path;
				await this._onSubmit(event, { preventClose: true });
			},
			top: (this.position.top ?? 0) + 40,
			left: (this.position.left ?? 0) + 10,
		});

		return await fp.browse();
	}

	protected override _getSubmitData(updateData?: Record<string, unknown>) {
		const dicePoolModificationPattern = new RegExp(`^${PoolModGlyphPattern.source}*$`);
		const submitData = super._getSubmitData(updateData) as IncompleteSheetSubmitData;

		// Loop through all the changes and make sure to construct the proper key for those that deal with dice pool
		// modifications.
		for (const change of submitData.changes) {
			if (GenesysEffect.DICE_POOL_MOD_KEY_PATTERN.test(change.key)) {
				if (change.key.includes(GenesysEffect.DICE_POOL_MOD_CHECK_TYPE)) {
					change.key += '.';
				} else if (change.key.includes(GenesysEffect.DICE_POOL_MOD_CHAR_TYPE)) {
					change.key += `.${change.char}`;
				} else if (change.key.includes(GenesysEffect.DICE_POOL_MOD_SKILL_TYPE)) {
					change.key += `.${change.skill}`;
				}

				change.mode = CONST.ACTIVE_EFFECT_MODES.CUSTOM;
				if (!dicePoolModificationPattern.test(change.value)) {
					change.value = '';
				}

				delete change.char;
				delete change.skill;
			}
		}

		return submitData;
	}
}

// Helper function to escape special characters used by regular expressions in strings that we want to match exactly.
export function escapeRegExp(raw: string) {
	return raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
