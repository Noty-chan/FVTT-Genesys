<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';
import { RootContext, ActorSheetContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import SkillDataModel from '@/item/data/SkillDataModel';
import GenesysItem from '@/item/GenesysItem';
import Localized from '@/vue/components/Localized.vue';
import { Approach } from '@/data/Approaches';
import GenesysRoller from '@/dice/GenesysRoller';

const context = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;
const system = computed(() => context.data.actor.systemData);

/* ------------------------------------------------------------------ *
 *  helpers                                                           *
 * ------------------------------------------------------------------ */
const ownedSkills = computed(
  () =>
    [...toRaw(context.data.actor).items]
      .filter((i) => i.type === 'skill')
      .sort((a, b) => a.name.localeCompare(b.name)) as GenesysItem<SkillDataModel>[],
);

async function addSkill() {
  // выбор шаблона или «Пустой»
  const choices = [
    ...CONFIG.genesys.skills.map((s: GenesysItem) => s.name),
    game.i18n.localize('Genesys.Labels.Blank'),
  ];

  const { value: name } = await Dialog.prompt({
    title: game.i18n.localize('Genesys.Labels.NewSkill'),
    content: `<p><select name="skill">${choices
      .map((c) => `<option>${c}</option>`)
      .join('')}</select></p>`,
    label: 'ОК',
  });

  if (!name) return;

  // копируем данные шаблона или создаём пустой
  const template = CONFIG.genesys.skills.find(
    (s: GenesysItem) => s.name === name,
  ) as GenesysItem<SkillDataModel> | undefined;

  const source: foundry.data.ItemSource<'skill', SkillDataModel['_source']> =
    template
      ? duplicate(template.toObject())
      : {
          _id: foundry.utils.randomID(),
          name: name === game.i18n.localize('Genesys.Labels.Blank') ? 'New Skill' : name,
          type: 'skill',
          img: 'icons/svg/book.svg',
          system: {
            description: '',
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

  await toRaw(context.sheet).createSkill(source);
}

async function deleteSkill(skill: GenesysItem<SkillDataModel>) {
  const ok = await Dialog.confirm({
    title: game.i18n.localize('Genesys.Labels.Delete'),
    content: skill.name,
  });
  if (ok) await skill.delete();
}

async function rollSkill(skill: GenesysItem<SkillDataModel>) {
  const approach: Approach | null = await game.genesys.promptApproach();
  if (!approach) return;

  await GenesysRoller.skillRoll({
    actor: toRaw(context.data.actor),
    approach,
    usesSuperCharacteristic: false,
    skillId: skill.id ?? '-',
    formula: '',
    symbols: {},
  });
}
</script>

<template>
  <section class="skills-tab">
    <!-- подходы -------------------------------------------------------------->
    <div class="approaches">
      <div
        v-for="appr in Object.keys(system.approaches)"
        :key="appr"
        class="approach"
      >
        <label>{{ $t(`Genesys.Approach.${appr.capitalize()}`) }}</label>
        <input
          type="number"
          min="0"
          max="5"
          v-model.number="system.approaches[appr]"
        />
      </div>
    </div>

    <!-- список навыков ------------------------------------------------------->
    <table class="skills">
      <thead>
        <tr>
          <th><Localized label="Genesys.Labels.Skill" /></th>
          <th style="width: 4rem"><Localized label="Genesys.Labels.Rank" /></th>
          <th style="width: 6rem"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="skill in ownedSkills" :key="skill.id">
          <td @dblclick="rollSkill(skill)">
            <img :src="skill.img" width="18" height="18" /> {{ skill.name }}
          </td>
          <td>
            <input
              type="number"
              min="0"
              max="5"
              :value="skill.system.rank"
              @change="
                (e: any) =>
                  skill.update({
                    'system.rank': Math.clamped(+e.target.value, 0, 5),
                  })
              "
            />
          </td>
          <td class="actions">
            <a @click="rollSkill(skill)" title="Roll"
              ><i class="fas fa-dice"></i
            ></a>
            <a @click="deleteSkill(skill)" title="Delete"
              ><i class="fas fa-trash"></i
            ></a>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="add-skill">
      <button @click="addSkill">
        <i class="fas fa-plus"></i> {{ $t('Genesys.Labels.AddSkill') }}
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.skills-tab {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .approaches {
    display: flex;
    justify-content: center;
    gap: 1rem;

    .approach {
      display: flex;
      flex-direction: column;
      align-items: center;

      label {
        font-family: 'Bebas Neue', sans-serif;
      }

      input {
        width: 3rem;
        text-align: center;
      }
    }
  }

  table.skills {
    width: 100%;
    border-collapse: collapse;

    th,
    td {
      border: 1px dashed #999;
      padding: 0.2rem 0.4rem;
    }

    img {
      vertical-align: text-bottom;
      margin-right: 0.25rem;
    }

    .actions a {
      margin-left: 0.4rem;
    }
  }

  .add-skill {
    text-align: right;

    button {
      font-family: 'Bebas Neue', sans-serif;
    }
  }
}
</style>
