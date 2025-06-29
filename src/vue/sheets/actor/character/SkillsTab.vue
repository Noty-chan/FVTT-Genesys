<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';
import { RootContext, ActorSheetContext } from '@/vue/SheetContext';
import CharacterDataModel from '@/actor/data/CharacterDataModel';
import SkillDataModel from '@/item/data/SkillDataModel';
import GenesysItem from '@/item/GenesysItem';
import { Approach } from '@/data/Approaches';
import GenesysRoller from '@/dice/GenesysRoller';
import ApproachPrompt from '@/app/ApproachPrompt';
import Localized from '@/vue/components/Localized.vue';

const context = inject<ActorSheetContext<CharacterDataModel>>(RootContext)!;
const system = computed(() => context.data.actor.systemData);

const ownedSkills = computed(
  () =>
    [...toRaw(context.data.actor).items]
      .filter((i) => i.type === 'skill')
      .sort((a, b) => a.name.localeCompare(b.name)) as GenesysItem<SkillDataModel>[],
);

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

async function addSkill() {
  // собрать варианты: все базовые + «Пустой»
  const labels = [
    ...CONFIG.genesys.skills.map((s: GenesysItem) => s.name),
    game.i18n.localize('Genesys.Labels.Blank'),
  ];

  // простейший HTML-prompt
  const html = `<p><select name="skill">${labels
    .map((c) => `<option value="${c}">${c}</option>`)
    .join('')}</select></p>`;

  const choice =
    await (Dialog as any).prompt?.({
      title: game.i18n.localize('Genesys.Labels.NewSkill'),
      content: html,
      label: 'OK',
    });

  if (!choice) return;

  // если выбрали «пустой» — делаем дефолт, иначе клонируем шаблон
  const template = CONFIG.genesys.skills.find(
    (s: GenesysItem) => s.name === choice,
  ) as GenesysItem<SkillDataModel> | undefined;

  const src: foundry.data.ItemSource<'skill', SkillDataModel['_source']> =
    template
      ? (duplicate(template.toObject()) as foundry.data.ItemSource<
          'skill',
          SkillDataModel['_source']
        >)
      : {
          _id: foundry.utils.randomID(),
          name: 'New Skill',
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

  const created = (await toRaw(context.data.actor).createEmbeddedDocuments(
    'Item',
    [src],
  )) as GenesysItem<SkillDataModel>[];
  await created[0]?.sheet?.render(true);
}

async function deleteSkill(skill: GenesysItem<SkillDataModel>) {
  const ok = await Dialog.confirm({
    title: game.i18n.localize('Genesys.Labels.Delete'),
    content: skill.name,
  });
  if (ok) await skill.delete();
}

async function rollSkill(skill: GenesysItem<SkillDataModel>) {
  const approach = await ApproachPrompt.promptForApproach();
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
      <div v-for="key in Object.keys(system.approaches)" :key="key" class="approach">
        <label><Localized :label="`Genesys.Approach.${key.capitalize()}`" /></label>
        <input
          type="number"
          min="0"
          max="5"
          :value="(system.approaches as any)[key]"
          @input="(e:any)=> (system.approaches as any)[key] = clamp(+e.target.value,0,5)"
        />
      </div>
    </div>

    <!-- список навыков ------------------------------------------------------->
    <table class="skills">
      <thead>
        <tr>
          <th><Localized label="Genesys.Labels.Skill" /></th>
          <th style="width:4rem"><Localized label="Genesys.Labels.Rank" /></th>
          <th style="width:6rem"></th>
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
              @input="
                (e:any)=> skill.update({'system.rank':clamp(+e.target.value,0,5)})
              "
            />
          </td>
          <td class="actions">
            <a @click="rollSkill(skill)" title="Roll"><i class="fas fa-dice"></i></a>
            <a @click="deleteSkill(skill)" title="Delete"><i class="fas fa-trash"></i></a>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="add-skill">
      <button @click="addSkill"> <i class="fas fa-plus"></i> <Localized label="Genesys.Labels.AddSkill" /></button>
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
