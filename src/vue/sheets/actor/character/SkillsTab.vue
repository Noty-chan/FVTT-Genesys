<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import Characteristic from '@/vue/components/character/Characteristic.vue';
import Localized from '@/vue/components/Localized.vue';

import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';
import ApproachPrompt from '@/app/ApproachPrompt';
import GenesysRoller from '@/dice/GenesysRoller';

const ctx = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;
const system = computed(() => ctx.data.actor.systemData);

// Навыки персонажа + шаблонные
const skills = computed(() => {
  const owned = new Map(
    toRaw(ctx.data.actor).items
      .filter((i) => i.type === 'skill')
      .map((i) => [i.name, i as GenesysItem<SkillDataModel>]),
  );
  return CONFIG.genesys.skills.map(
    (tpl: GenesysItem<SkillDataModel>) => owned.get(tpl.name) ?? tpl,
  );
});

// Добавить навык
async function addSkill() {
  const unused = CONFIG.genesys.skills
    .filter((tpl) => !ctx.data.actor.items.find((i) => i.type === 'skill' && i.name === tpl.name));

  if (!unused.length) {
    ui.notifications.info('Нет доступных навыков');
    return;
  }

  const html = `<form class="genesys"><div class="form-group">
      <label>${game.i18n.localize('Genesys.Labels.AddSkill')}</label>
      <select name="skill">${unused.map((s) => `<option value="${s.id}">${s.name}</option>`)}</select>
    </div></form>`;

  const choice = await (Dialog as any).prompt({
    title: game.i18n.localize('Genesys.Labels.AddSkill'),
    content: html,
    callback: (dom: JQuery<HTMLElement>) =>
      dom[0].querySelector('select')!.value || null,
    rejectClose: false,
  });

  if (!choice) return;

  const tpl = unused.find((s) => s.id === choice)!;
  const src = duplicate(tpl.toObject()) as any;
  src._id = foundry.utils.randomID();
  src.type = "skill";
  await ctx.data.actor.createEmbeddedDocuments("Item", [src]);
}


// Ранг навыка
async function rankAdjust(skill: GenesysItem<SkillDataModel>, delta: number) {
  const newRank = Math.max(0, Math.min(5, skill.systemData.rank + delta));
  await skill.update({ 'system.rank': newRank });
}

// Удалить навык
async function deleteSkill(skill: GenesysItem<SkillDataModel>) {
  await skill.delete();
}

// Бросок
async function rollSkill(skill: GenesysItem<SkillDataModel>) {
  const approach = await ApproachPrompt.promptForApproach();
  if (!approach) return;

  await GenesysRoller.skillRoll({
    actor : toRaw(ctx.data.actor),
    approach,
    usesSuperCharacteristic: false,
    skillId: skill.id,
    formula: '',
    symbols: {},
  });
}
</script>

<template>
  <!-- ======= ПОДХОДЫ ======= -->
  <div class="approaches">
    <Characteristic label="Genesys.Approach.Push"     can-edit name="system.approaches.push"
                    :value="system.approaches.push"/>
    <Characteristic label="Genesys.Approach.Maneuver" can-edit name="system.approaches.maneuver"
                    :value="system.approaches.maneuver"/>
    <Characteristic label="Genesys.Approach.Focus"    can-edit name="system.approaches.focus"
                    :value="system.approaches.focus"/>
  </div>

  <!-- ======= СПИСОК НАВЫКОВ ======= -->
  <section class="skills">
    <header>
      <span><Localized label="Genesys.Labels.Skill"/></span>
      <span style="text-align:right">Ранг</span>
    </header>

    <div v-for="skill in skills" :key="skill.id"
         class="skill-row" :class="{template: skill.isEmbedded !== true}">
      <span @click="rollSkill(skill)" class="skill-name">
        <i v-if="skill.img" class="skill-img" :style="{ backgroundImage:`url('${skill.img}')` }"/>
        {{ skill.name }}
      </span>

      <span class="skill-controls">
        {{ skill.systemData.rank }}
        <template v-if="skill.isEmbedded">
          <i v-if="skill.systemData.rank < 5" class="fas fa-plus-circle" @click="rankAdjust(skill,1)"/>
          <i v-if="skill.systemData.rank > 0" class="fas fa-minus-circle" @click="rankAdjust(skill,-1)"/>
          <i class="fas fa-trash" @click="deleteSkill(skill)"/>
        </template>
      </span>
    </div>

    <footer v-if="ctx.data.editable">
      <a @click="addSkill"><i class="fas fa-plus"></i> <Localized label="Genesys.Labels.AddSkill"/></a>
    </footer>
  </section>
</template>

<style lang="scss" scoped>
@use '@scss/vars/colors.scss' as *;

.approaches{
  display:flex; justify-content:center; gap:3rem; margin-bottom:.5rem;
}
.skills{
  border:1px solid #0002; background:#fff4; padding:.25rem;

  header, .skill-row{
    display:grid; grid-template-columns:1fr auto; align-items:center;
    padding:.15rem .25rem;
  }
  header{ font-family:'Bebas Neue',sans-serif; background:#0001; }
  .skill-row:nth-child(even){ background:#0001; }

  .skill-name{ cursor:pointer; display:flex; align-items:center; gap:.25rem; }
  .skill-img{
    width:16px; height:16px; background-size:cover; background-position:center;
    border-radius:3px; flex:0 0 16px;
  }
  .skill-controls i{ cursor:pointer; margin-left:.25rem; }

  .template { opacity:.4; }

  footer{ text-align:right; margin-top:.25rem; }
}
</style>
