<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';

import CharacterDataModel from '@/actor/data/CharacterDataModel';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterSheet from '@/actor/sheets/CharacterSheet';
import SkillDataModel from '@/item/data/SkillDataModel';
import GenesysItem from '@/item/GenesysItem';
import ApproachPrompt from '@/app/ApproachPrompt';
import GenesysRoller from '@/dice/GenesysRoller';

/* 👇 ВЕРНУЛИ визуальные компоненты */
import Characteristic from '@/vue/components/character/Characteristic.vue';
import Localized from '@/vue/components/Localized.vue';
import XPContainer from '@/vue/components/character/XPContainer.vue';
import ContextMenu from '@/vue/components/ContextMenu.vue';
import MenuItem from '@/vue/components/MenuItem.vue';
import MasonryWall from '@yeger/vue-masonry-wall';
/* ↑↑↑ */

const context = inject<ActorSheetContext<CharacterDataModel, CharacterSheet>>(RootContext)!;
const system  = computed(() => context.data.actor.systemData);

/* ---------- список навыков персонажа ---------- */
const SKILL_CATEGORY_SORT_ORDER = { general: 0, magic: 1, combat: 2, social: 3, knowledge: 4 };

const skills = computed(() => {
  const owned = new Map(
    toRaw(context.data.actor).items
      .filter((i) => i.type === 'skill')
      .map((i) => [i.name, i as GenesysItem<SkillDataModel>]),
  );
  return CONFIG.genesys.skills.map(
    (s: GenesysItem<SkillDataModel>) => owned.get(s.name) ?? s,
  );
});

const skillCategories = computed(() =>
  Array.from(
    new Set(
      CONFIG.genesys.skills
        .map((s: GenesysItem<SkillDataModel>) => s.systemData.category)
        .sort((l, r) => SKILL_CATEGORY_SORT_ORDER[l] - SKILL_CATEGORY_SORT_ORDER[r]),
    ),
  ),
);

/* ---------- локализация ---------- */
const addSkillLabel = game.i18n.localize('Genesys.Labels.AddSkill');
const customLabel   = game.i18n.localize('Genesys.Labels.CustomSkill');

/* ---------- Добавление навыка ---------- */
async function addSkill() {
  const available = CONFIG.genesys.skills
    .filter((tpl) => !context.data.actor.items.find((i) => i.type === 'skill' && i.name === tpl.name));

  const content =
    `<form class="genesys"><div class="form-group">
       <label>${addSkillLabel}</label>
       <select name="skill" style="width:100%">`
       + available.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')
       + `<option value="__custom">-- ${customLabel} --</option>`
     + `</select></div></form>`;

  const chosen = await (Dialog as any).prompt({
    title  : addSkillLabel,
    content,
    callback: (html: JQuery<HTMLElement>) =>
      html.find('select[name="skill"]').val() as string | null,
    rejectClose: false,
  });

  if (!chosen) return;

  let source: foundry.data.ItemSource<'skill', SkillDataModel['_source']>;

  if (chosen === '__custom') {
    source = {
      _id : foundry.utils.randomID(),
      name: customLabel,
      type: 'skill',
      img : 'icons/svg/book.svg',
      system: {
        description: '',
        source     : '',
        category   : 'general',
        initiative : false,
        career     : false,
        rank       : 0,
      },
      effects  : [],
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
      sort     : 0,
      folder   : null,
      flags    : {},
    };
  } else {
    const tpl       = available.find((s) => s.id === chosen)!;
    const tplSource = duplicate(tpl.toObject()) as any;
    tplSource._id   = foundry.utils.randomID();
    tplSource.ownership ??= { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
    source = tplSource as foundry.data.ItemSource<'skill', SkillDataModel['_source']>;
  }

  const skill = await (toRaw(context.sheet) as any).createSkill(source) as GenesysItem<SkillDataModel>;
  await skill?.sheet?.render(true);
}

/* ---------- бросок навыка ---------- */
async function rollSkill(skill: GenesysItem<SkillDataModel>) {
  const approach = await ApproachPrompt.promptForApproach();
  if (!approach) return;

  await GenesysRoller.skillRoll({
    actor : toRaw(context.data.actor),
    approach,
    usesSuperCharacteristic: false,
    skillId: skill.id,
    formula: '',
    symbols: {},
  });
}

/* ---------- прочие утилиты ---------- */
async function purchaseSkillRank(skill: GenesysItem<SkillDataModel>) {
  if (skill.systemData.rank >= 5 || system.value.availableXP < 1) return;
  await toRaw(context.data.actor).systemData.spendXP(1, 'skill:' + skill.name);
  await toRaw(skill).update({ 'system.rank': skill.systemData.rank + 1 });
}
async function toggleCareerSkill(skill: GenesysItem<SkillDataModel>) {
  await toRaw(skill).update({ 'system.career': !skill.systemData.career });
}
async function freeSkillRank(skill: GenesysItem<SkillDataModel>, adj: number) {
  await toRaw(skill).update({ 'system.rank': Math.max(0, skill.systemData.rank + adj) });
}
async function editSkill(skill: GenesysItem<SkillDataModel>)  { await toRaw(skill).sheet?.render(true); }
async function deleteSkill(skill: GenesysItem<SkillDataModel>) { await toRaw(skill).delete(); }
</script>
