<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';
import $ from 'jquery';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import GenesysItem from '@/item/GenesysItem';
import SkillDataModel from '@/item/data/SkillDataModel';

/* -------------------------------------------------
 *  Контекст листа
 * ------------------------------------------------*/
const ctx = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;
const system = computed(() => ctx.data.actor.systemData);

/* -------------------------------------------------
 *  Навыки персонажа
 * ------------------------------------------------*/
const skills = computed(
  () =>
    toRaw(ctx.data.actor).items.filter(
      (i) => i.type === 'skill',
    ) as GenesysItem<SkillDataModel>[],
);

/* -------------------------------------------------
 *  Вспомогательный prompt на основе Dialog
 * ------------------------------------------------*/
function simplePrompt(
  title: string,
  placeholder = '',
): Promise<string | null> {
  return new Promise((resolve) => {
    new Dialog({
      title,
      content: `<input type="text" name="value" style="width:100%" placeholder="${placeholder}" />`,
      buttons: {
        ok: {
          label: 'OK',
          callback: (html: JQuery<HTMLElement>) =>
            resolve(
              (html.find('input[name="value"]').val() as string)?.trim() || null,
            ),
        },
        cancel: {
          label: 'Отмена',
          callback: () => resolve(null),
        },
      },
      default: 'ok',
      close: () => resolve(null),
    }).render(true);
  });
}

/* -------------------------------------------------
 *  Выбор подхода (Dialog)
 * ------------------------------------------------*/
type Approach = 'push' | 'maneuver' | 'focus';

function promptApproach(skillName: string): Promise<Approach | null> {
  return new Promise((resolve) => {
    const content = `
      <p>Через какой подход совершается бросок <strong>${skillName}</strong>?</p>
      <div style="display:flex; gap:0.5rem">
        <button type="button" data-value="push">Нажим</button>
        <button type="button" data-value="maneuver">Манёвр</button>
        <button type="button" data-value="focus">Фокус</button>
      </div>`;

    const dlg = new Dialog({
      title: 'Выбор подхода',
      content,
      buttons: {},
      render: (html: JQuery<HTMLElement>) => {
        html.find('button[data-value]').on(
          'click',
          (ev: JQuery.ClickEvent<HTMLButtonElement>) => {
            resolve(
              (ev.currentTarget.dataset.value as Approach) ?? null,
            );
            dlg.close();
          },
        );
      },
      close: () => resolve(null),
    });

    dlg.render(true);
  });
}

/* -------------------------------------------------
 *  Добавление навыка
 * ------------------------------------------------*/
async function addSkill() {
  const name = await simplePrompt('Название нового навыка');
  if (!name) return;

  const description =
    (await simplePrompt(`Описание «${name}»`)) ?? '';

  const source: foundry.data.ItemSource<'skill', SkillDataModel['_source']> = {
    _id: foundry.utils.randomID(),
    name,
    type: 'skill',
    img: 'icons/svg/book.svg',
    system: {
      description,
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

  created.sheet?.render(true);
}

/* -------------------------------------------------
 *  Удаление
 * ------------------------------------------------*/
async function deleteSkill(skill: GenesysItem<SkillDataModel>) {
  new Dialog({
    title: 'Удаление навыка',
    content: `<p>Удалить навык <strong>${skill.name}</strong>?</p>`,
    buttons: {
      yes: {
        icon: '<i class="fas fa-trash"></i>',
        label: 'Удалить',
        callback: () => skill.delete(),
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
 *  Ранг (0-5)
 * ------------------------------------------------*/
function changeRank(skill: GenesysItem<SkillDataModel>, delta: 1 | -1) {
  const next = Math.min(5, Math.max(0, skill.systemData.rank + delta));
  skill.update({ 'system.rank': next });
}

/* -------------------------------------------------
 *  «Бросок» — сообщение в чат
 * ------------------------------------------------*/
async function rollSkill(skill: GenesysItem<SkillDataModel>) {
  const approach = await promptApproach(skill.name);
  if (!approach) return;

  const human: Record<Approach, string> = {
    push: 'Нажим',
    maneuver: 'Манёвр',
    focus: 'Фокус',
  };

  ChatMessage.create({
    speaker: { actor: ctx.data.actor.id },
    content: `<strong>${ctx.data.actor.name}</strong> совершает бросок
              <em>${skill.name}</em> через подход <strong>${human[approach]}</strong>.`,
  });
}

/* -------------------------------------------------
 *  Открыть лист навыка
 * ------------------------------------------------*/
const openSkill = (s: GenesysItem<SkillDataModel>) => s.sheet?.render(true);
</script>

<template>
  <div class="skills-tab">
    <header class="header">
      <button class="add-btn" @click="addSkill">➕ Добавить навык</button>
    </header>

    <table class="skills-table">
      <tbody>
        <tr v-for="skill in skills" :key="skill.id">
          <!-- имя -->
          <td
            class="skill-name"
            :title="skill.systemData.description || '—'"
          >
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
            <button @click="rollSkill(skill)" title="Бросок">🎲</button>
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
