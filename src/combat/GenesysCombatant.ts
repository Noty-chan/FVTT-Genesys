/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file
 */

import GenesysActor from '@/actor/GenesysActor';
import AdversaryDataModel from '@/actor/data/AdversaryDataModel';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import GenesysCombat, { InitiativeSkill } from '@/combat/GenesysCombat';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import MinionDataModel from '@/actor/data/MinionDataModel';
import { Approach } from '@/data/Approaches';
import GenesysRoller from '@/dice/GenesysRoller';

export default class GenesysCombatant extends Combatant<GenesysCombat, GenesysActor> {
	initiativeSkill?: InitiativeSkill;

	get disposition() {
		switch ((this.actor.token ?? (this.actor.prototypeToken as any)).disposition) {
			case CONST.TOKEN_DISPOSITIONS.FRIENDLY:
				return 'friendly';

			case CONST.TOKEN_DISPOSITIONS.NEUTRAL:
				return 'neutral';

			case CONST.TOKEN_DISPOSITIONS.HOSTILE:
				return 'hostile';

			default:
				return 'neutral';
		}
	}

	override async rollInitiative(formula: string) {
		const roll = this.getInitiativeRoll(formula);
		await roll.evaluate();
		const results = GenesysRoller.parseRollResults(roll);

		return this.update({ initiative: results.netSuccess + results.netAdvantage / 100 });
	}

       override getInitiativeRoll(skillName: string = 'Unskilled', approach: Approach = Approach.Push) {
                const skill = this.actor.items.find((i) => i.type === 'skill' && i.name.toLowerCase() === skillName.toLowerCase()) as GenesysItem<SkillDataModel> | undefined;
                const system = this.actor.systemData as CharacterDataModel | AdversaryDataModel;
                const approachValue = system.approaches[approach];

		let skillValue = skill?.systemData?.rank ?? 0;
		if (skill && this.actor.type === 'minion') {
			skillValue = Math.clamp((this.actor.systemData as MinionDataModel).remainingMembers - 1, 0, 5);
		}

                const yellow = Math.min(approachValue, skillValue);
                const green = Math.max(approachValue, skillValue) - yellow;

                return new Roll(`${yellow}dP+${green}dA`);
        }
}
