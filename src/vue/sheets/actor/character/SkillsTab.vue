<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';

const ctx = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;
const system = computed(() => ctx.data.actor.systemData);

// навыки, уже находящиеся у персонажа
const skills = computed(
  () =>
    toRaw(ctx.data.actor).items.filter(
      (i) => i.type === 'skill',
    ) as GenesysItem<SkillDataModel>[],
);

// добавление нового навыка
async function addSkill() {
  const skillName = prompt('Название нового навыка:');
  if (!skillName) return;

  const skillDesc = prompt('Описание навыка:', '');

  const source: foundry.data.ItemSource<'skill', SkillDataModel['_source']> = {
    _id: foundry.utils.randomID(),
    name: skillName,
    type: 'skill',
    img: 'icons/svg/book.svg',
    system: {
      description: skillDesc ?? '',
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

  await toRaw(ctx.data.actor).createEmbeddedDocuments('Item', [source]);
}

// удаление
async function deleteSkill(skill: GenesysItem<SkillDataModel>) {
  if (confirm(`Удалить навык "${skill.name}"?`)) await skill.delete();
}

// изменение ранга
async function changeRank(skill: GenesysItem<SkillDataModel>, delta: number) {
  const newRank = Math.max(0, Math.min(skill.systemData.rank + delta, 5));
  await skill.update({ 'system.rank': newRank });
}

// «бросок» — лишь сообщение в чат
async function rollSkill(skill: GenesysItem<SkillDataModel>) {
  const approaches: Record<string, string> = {
    push: 'Нажим',
    maneuver: 'Манёвр',
    focus: 'Фокус',
  };

  const approach = prompt('Введите подход (push, maneuver, focus):', 'push');
  if (!approach || !(approach in approaches)) return;

  ChatMessage.create({
    content: `<strong>${ctx.data.actor.name}</strong> делает бросок <strong>${skill.name}</strong> через подход <strong>${approaches[approach]}</strong>.`,
    speaker: { actor: ctx.data.actor.id },
  });
}
</script>

<template>
  <div class="skills-tab">
    <button class="add-skill" @click="addSkill">➕ Добавить навык</button>

    <table class="skills-table">
      <tr v-for="skill in skills" :key="skill.id">
        <td class="skill-name">
          <strong>{{ skill.name }}</strong><br />
          <small>{{ skill.systemData.description }}</small>
        </td>

        <td class="skill-controls">
          <button @click="changeRank(skill, -1)">➖</button>
          <span>{{ skill.systemData.rank }}</span>
          <button @click="changeRank(skill, 1)">➕</button>
        </td>

        <td class="skill-actions">
          <button @click="rollSkill(skill)">🎲</button>
          <button @click="deleteSkill(skill)">🗑️</button>
        </td>
      </tr>
    </table>
  </div>
</template>

<style scoped>
.skills-tab {
  padding: 10px;
}

.add-skill {
  cursor: pointer;
  padding: 5px 10px;
  font-size: 14px;
}

.skills-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.skills-table td {
  padding: 5px;
  border: 1px solid #ddd;
  vertical-align: middle;
}

.skill-controls,
.skill-actions {
  width: 120px;
  text-align: center;
}

.skill-controls button,
.skill-actions button {
  margin: 0 2px;
  cursor: pointer;
}
</style>
