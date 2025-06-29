<!--  src/vue/sheets/actor/character/SkillsTab.vue -->
<script lang="ts" setup>
/* ======================================================= *
 *  TAB «SKILLS» – список навыков персонажа + броски
 * ======================================================= */
import { computed, inject, toRaw } from 'vue';

import CharacterDataModel from '@/actor/data/CharacterDataModel';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterSheet from '@/actor/sheets/CharacterSheet';

import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';

import Characteristic from '@/vue/components/character/Characteristic.vue';
import Localized from '@/vue/components/Localized.vue';
import XPContainer from '@/vue/components/character/XPContainer.vue';

import ContextMenu from '@/vue/components/ContextMenu.vue';
import MenuItem     from '@/vue/components/MenuItem.vue';
import MasonryWall  from '@yeger/vue-masonry-wall';

import ApproachPrompt from '@/app/ApproachPrompt';
import GenesysRoller  from '@/dice/GenesysRoller';

/* ---------- контекст листа ---------- */
const context = inject<ActorSheetContext<CharacterDataModel, CharacterSheet>>(RootContext)!;
const system  = computed(() => context.data.actor.systemData);

/* ---------- категории навыков ---------- */
const SKILL_CATEGORY_SORT_ORDER: Record<string, number> = {
  general  : 0,
  magic    : 1,
  combat   : 2,
  social   : 3,
  knowledge: 4,
};

/* текущие навыки + пустые слоты из шаблона */
const skills = computed(() => {
  const owned = new Map(
    toRaw(context.data.actor).items
      .filter((i) => i.type === 'skill')
      .map((i) => [i.name, i as GenesysItem<SkillDataModel>]),
  );
  return CONFIG.genesys.skills.map(
    (tpl: GenesysItem<SkillDataModel>) => owned.get(tpl.name) ?? tpl,
  );
});

const skillCategories = computed(() =>
  Array.from(
    new Set(
      CONFIG.genesys.skills
        .map((s: GenesysItem<SkillDataModel>) => s.systemData.category)
        .sort((l, r) => {
          const a = SKILL_CATEGORY_SORT_ORDER[l] ?? 99;
          const b = SKILL_CATEGORY_SORT_ORDER[r] ?? 99;
          return a - b;
        }),
    ),
  ),
);

/* ---------- локализация ---------- */
const L = (k: string) => game.i18n.localize(k);
const markCareerLabel    = L('Genesys.Labels.MarkCareerSkill');
const unmarkCareerLabel  = L('Genesys.Labels.UnmarkCareerSkill');
const freeRankUpLabel    = L('Genesys.Labels.FreeRankUp');
const freeRankDownLabel  = L('Genesys.Labels.FreeRankDown');
const editLabel          = L('Genesys.Labels.Edit');
const deleteLabel        = L('Genesys.Labels.Delete');
const addSkillLabel      = L('Genesys.Labels.AddSkill');
const customLabel        = L('Genesys.Labels.CustomSkill');

/* ===================================================================== *
 *  ФУНКЦИИ
 * ===================================================================== */

/* ---- добавить навык ---- */
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
    /* полностью пустой шаблон */
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
    /* копируем выбранный шаблон из компендиума */
    const tpl       = available.find((s) => s.id === chosen)!;
    const tplSource = duplicate(tpl.toObject()) as any;
    tplSource._id   = foundry.utils.randomID();
    tplSource.ownership ??= { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
    source = tplSource as foundry.data.ItemSource<'skill', SkillDataModel['_source']>;
  }

  const skill = await (toRaw(context.sheet) as any).createSkill(source) as GenesysItem<SkillDataModel>;
  await skill?.sheet?.render(true);
}

/* ---- бросок навыка ---- */
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

/* ---- прочие действия ---- */
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
async function editSkill(skill: GenesysItem<SkillDataModel>)   { await toRaw(skill).sheet?.render(true); }
async function deleteSkill(skill: GenesysItem<SkillDataModel>) { await toRaw(skill).delete(); }
</script>

<template>
  <section class="tab-skills">
    <!-- ===== Характеристики-подходы ===== -->
    <div class="approaches-row">
      <Characteristic
        label="Genesys.Approach.Push"
        :value="system.approaches.push"
        name="system.approaches.push"
        can-edit
      />
      <Characteristic
        label="Genesys.Approach.Maneuver"
        :value="system.approaches.maneuver"
        name="system.approaches.maneuver"
        can-edit
      />
      <Characteristic
        label="Genesys.Approach.Focus"
        :value="system.approaches.focus"
        name="system.approaches.focus"
        can-edit
      />
    </div>

    <!-- ===== Навыки ===== -->
    <div class="skills-row">
      <div class="add-skill">
        <a @click="addSkill"><i class="fas fa-plus"></i> {{ addSkillLabel }}</a>
      </div>

      <MasonryWall :column-width="300" :items="skillCategories" :gap="8">
        <template #default="{ item: skillCategory, index }">
          <div class="skill-category"
               :style="`position: relative; z-index: ${skillCategories.length - index}`">
            <!-- header -->
            <div class="header">
              <label>
                <Localized :label="`Genesys.Labels.${skillCategory}.Skills`"
                           v-if="SKILL_CATEGORY_SORT_ORDER[skillCategory] !== undefined"/>
                <span v-else>{{ skillCategory }}</span>
              </label>
              <div class="blank"></div>
              <label style="position: relative; left:-3px">
                <Localized label="Genesys.Labels.Rank"/>
              </label>
              <div class="blank"></div>
            </div>

            <!-- skills list -->
            <div class="body">
              <ContextMenu
                v-for="skill in skills.filter((s) => s.systemData.category === skillCategory)
                                      .sort((l, r) => l.name.localeCompare(r.name))"
                :key="skill.id"
                class="skill row"
              >
                <template #menu-items>
                  <MenuItem v-if="context.data.editable" @click="toggleCareerSkill(skill)">
                    <template #icon><i :class="`${skill.systemData.career ? 'fat' : 'fas'} fa-stars`"/></template>
                    {{ skill.systemData.career ? unmarkCareerLabel : markCareerLabel }}
                  </MenuItem>
                  <MenuItem v-if="context.data.editable" @click="freeSkillRank(skill, 1)">
                    <template #icon><i class="fas fa-circle-up"/></template>{{ freeRankUpLabel }}
                  </MenuItem>
                  <MenuItem v-if="context.data.editable" @click="freeSkillRank(skill, -1)">
                    <template #icon><i class="fas fa-circle-down"/></template>{{ freeRankDownLabel }}
                  </MenuItem>
                  <MenuItem @click="editSkill(skill)">
                    <template #icon><i class="fas fa-edit"/></template>{{ editLabel }}
                  </MenuItem>
                  <MenuItem v-if="context.data.editable" @click="deleteSkill(skill)">
                    <template #icon><i class="fas fa-trash"/></template>{{ deleteLabel }}
                  </MenuItem>
                </template>

                <img :src="skill.img" :alt="skill.name"/>
                <a class="name" @click="rollSkill(skill)">
                  <span>{{ skill.name }}</span>
                  <i v-if="skill.systemData.career" class="fas fa-stars"></i>
                </a>

                <span class="rank-display">
                  {{ skill.systemData.rank }}
                  <a v-if="skill.systemData.rank < 5 && system.availableXP >= 1"
                     @click="purchaseSkillRank(skill)">
                    <i class="fas fa-arrow-circle-up"/>
                  </a>
                  <a v-if="skill.systemData.rank > 0" @click="freeSkillRank(skill, -1)">
                    <i class="fas fa-arrow-circle-down"/>
                  </a>
                  <a v-if="context.data.editable" @click="deleteSkill(skill)">
                    <i class="fas fa-trash"/>
                  </a>
                </span>
              </ContextMenu>
            </div>
          </div>
        </template>
      </MasonryWall>
    </div>

    <!-- ===== XP ===== -->
    <section class="experience">
      <XPContainer label="Genesys.Labels.TotalXP"     :value="system.totalXP"/>
      <XPContainer label="Genesys.Labels.AvailableXP" :value="system.availableXP"/>
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

  .experience {
    grid-column: 1 / span all;
    padding: 0.5em;
    display: grid;
    grid-template-columns: auto 1fr auto;
    width: 100%;
  }
  .skills-row {
    grid-column: 1 / span all;
  }
}

.approaches-row {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 3em;
  align-items: center;
  padding-bottom: 0.25rem;
  grid-column: 2 / span 1;

  &::after {
    display: block;
    content: '';
    position: absolute;
    top: 0; left: -1.5rem;
    width: calc(100% + 3rem); height: 100%;
    background: colors.$gold;
    border-radius: 4rem;
    clip-path: polygon(0% 50%,100% 50%,100% 100%,0% 100%);
  }
  .characteristic-field { z-index: 2; }
}

.skills-row {
  position: relative; z-index: 1;
  width: 100%;
  padding: 0 0.5em;

  .add-skill {
    text-align: right;
    margin-bottom: 0.25rem;
    a { font-family: 'Bebas Neue', sans-serif; }
  }

  .skill-category {
    container: skill-category / inline-size;
    width: 100%;
    break-inside: avoid-column;
    white-space: nowrap;
    background: transparentize(colors.$light-blue, .8);
    padding: 8px;
  }

  .header,
  .body .row {
    width: 100%;
    display: grid;
    grid-template-columns: 1.5rem 1fr auto 80px;
    align-items: center;
    gap: 0.25rem;
  }

  .header {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1em;
    color: #6d6e71;
  }
  .body {
    border: 1px solid black;
    &:empty { border-style:dashed; opacity:.25; height:1em; }
  }
  .row {
    border-bottom: 1px dashed black;
    & > * { padding: 0.2em; }
    img { border:none; padding:0; margin-left:.1em; }
    .name {
      text-overflow: ellipsis; overflow: hidden;
      span { font-family: 'Roboto Slab', serif; }
      i { position: relative; top:-2px; left:3px; }
    }
    &:last-of-type { border-bottom:none; }
    .rank-display {
      background: transparentize(white,.5);
      border:1px dashed black; border-radius:.75rem;
      text-align:center; margin:.1em .1em .1em .2em;
      min-width:1.5rem; height:1.5rem;
    }
  }
}
</style>
