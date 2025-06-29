<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';

const ctx = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;
const system = computed(() => ctx.data.actor.systemData);

/* -------------------------------------------------
 *  Список навыков персонажа
 * ------------------------------------------------*/
const skills = computed(
  () =>
    toRaw(ctx.data.actor).items.filter(
      (i) => i.type === 'skill',
    ) as GenesysItem<SkillDataModel>[],
);

/* -------------------------------------------------
 *  Добавление нового навыка
 * ------------------------------------------------*/
async function addSkill() {
  const name = await TextEditor.prompt(
    'Название нового навыка',
    { default: '' },
  );
  if (!name) return;

  const description = await TextEditor.prompt(
    `Описание «${name}»`,
    { default: '' },
  );

  const source: foundry.data.ItemSource<'skill', SkillDataModel['_source']> = {
    _id: foundry.utils.randomID(),
    name,
    type: 'skill',
    img: 'icons/svg/book.svg',
    system: {
      description: description ?? '',
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

  const [created] = (await toRaw(
    ctx.data.actor,
  ).createEmbeddedDocuments('Item', [source])) as GenesysItem<SkillDataModel>[];

  // сразу открываем окно редактирования
  created.sheet?.render(true);
}

/* -------------------------------------------------
 *  Удаление навыка (красивый диалог)
 * ------------------------------------------------*/
async function deleteSkill(skill: GenesysItem<SkillDataModel>) {
  new Dialog({
    title: 'Удаление навыка',
    content: `<p>Удалить навык <strong>${skill.name}</strong>?</p>`,
    buttons: {
      yes: {
        icon: '<i class="fas fa-trash"></i>',
        label: 'Удалить',
        callback: async () => await skill.delete(),
      },
      no: {
        icon: '<i class="fas fa-times"></i>',
        label: 'Отмена',
      },
    },
    default: 'yes',
  }).render(true);
}

/* -------------------------------------------------
 *  Изменение ранга (0–5)
 * ------------------------------------------------*/
async function changeRank(skill: GenesysItem<SkillDataModel>, d: number) {
  const next = Math.min(5, Math.max(0, skill.systemData.rank + d));
  await skill.update({ 'system.rank': next });
}

/* -------------------------------------------------
 *  «Бросок» — просто сообщение в чат
 * ------------------------------------------------*/
async function rollSkill(skill: GenesysItem<SkillDataModel>) {
  const approach = await Dialog.prompt({
    title: 'Выбор подхода',
    content:
      `<p>Через какой подход совершается бросок <strong>${skill.name}</strong>?</p>
       <div style="display:flex; gap:0.5rem">
         <button type="button" data-value="push">Нажим</button>
         <button type="button" data-value="maneuver">Манёвр</button>
         <button type="button" data-value="focus">Фокус</button>
       </div>`,
    rejectClose: true,
    callback: (html) =>
      (html.find('button[data-value]') as JQuery)
        .on('click', (ev) =>
          Dialog.resolve((ev.currentTarget as HTMLButtonElement).dataset.value),
        ),
  });

  if (!approach) return;

  const humanReadable: Record<string, string> = {
    push: 'Нажим',
    maneuver: 'Манёвр',
    focus: 'Фокус',
  };

  ChatMessage.create({
    speaker: { actor: ctx.data.actor.id },
    content: `<strong>${ctx.data.actor.name}</strong> совершает бросок
              <em>${skill.name}</em> через подход <strong>${humanReadable[approach]}</strong>.`,
  });
}

/* -------------------------------------------------
 *  Открытие листа навыка
 * ------------------------------------------------*/
function openSkill(skill: GenesysItem<SkillDataModel>) {
  skill.sheet?.render(true);
}
</script>

<template>
  <div class="skills-tab">
    <header class="header">
      <button class="add-btn" @click="addSkill">➕ Добавить навык</button>
    </header>

    <table class="skills-table">
      <tbody>
        <tr v-for="skill in skills" :key="skill.id">
          <!-- имя + описание в title -->
          <td class="skill-name" :title="skill.systemData.description">
            <a @click="openSkill(skill)">{{ skill.name }}</a>
          </td>

          <!-- ранг -->
          <td class="rank">
            <button @click="changeRank(skill, -1)">➖</button>
            <span>{{ skill.systemData.rank }}</span>
            <button @click="changeRank(skill, 1)">➕</button>
          </td>

          <!-- действия -->
          <td class="actions">
            <button @click="rollSkill(skill)" title="Бросить">🎲</button>
            <button @click="openSkill(skill)" title="Редактировать">✏️</button>
            <button @click="deleteSkill(skill)" title="Удалить">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.skills-tab {
  padding: 0.5rem;
}

.header {
  text-align: right;
  margin-bottom: 0.5rem;
}

.add-btn {
  cursor: pointer;
  padding: 4px 10px;
  font-size: 14px;
}

.skills-table {
  width: 100%;
  border-collapse: collapse;
}

.skills-table td {
  border: 1px solid #aaa;
  padding: 4px;
  vertical-align: middle;
}

.skill-name a {
  cursor: pointer;
  color: var(--color-text-light-heading, #222);
  text-decoration: none;
}

.skill-name a:hover {
  text-decoration: underline;
}

.rank {
  width: 120px;
  text-align: center;
}

.rank button {
  margin: 0 2px;
}

.actions {
  width: 110px;
  text-align: center;
}

.actions button {
  margin: 0 2px;
  cursor: pointer;
}
</style>
