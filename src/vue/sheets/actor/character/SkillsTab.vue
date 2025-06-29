<script lang="ts" setup>
import { computed, inject, toRaw } from 'vue';

import CharacterDataModel from '@/actor/data/CharacterDataModel';
import { ActorSheetContext, RootContext } from '@/vue/SheetContext';
import CharacterSheet from '@/actor/sheets/CharacterSheet';
import SkillDataModel from '@/item/data/SkillDataModel';
import GenesysItem from '@/item/GenesysItem';
import ApproachPrompt from '@/app/ApproachPrompt';
import GenesysRoller from '@/dice/GenesysRoller';

const context = inject<ActorSheetContext<CharacterDataModel, CharacterSheet>>(RootContext)!;
const system  = computed(() => context.data.actor.systemData);

/* ---------- список навыков персонажа (+ шаблоны из CONFIG) ---------- */
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

/* ---------- локализованные подписи ---------- */
const addSkillLabel = game.i18n.localize('Genesys.Labels.AddSkill');
const customLabel   = game.i18n.localize('Genesys.Labels.CustomSkill');

/* ---------- Добавление навыка ---------- */
async function addSkill() {
  /* готовые навыки, которых ещё нет у персонажа */
  const available = CONFIG.genesys.skills
    .filter((tpl) => !context.data.actor.items.find((i) => i.type === 'skill' && i.name === tpl.name));

  /* HTML для диалога выбора */
  const content =
    `<form class="genesys"><div class="form-group">
       <label>${addSkillLabel}</label>
       <select name="skill" style="width:100%">`
       + available.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')
       + `<option value="__custom">-- ${customLabel} --</option>`
     + `</select></div></form>`;

  /* выбор пользователя */
  const chosen = await Dialog.prompt({
    title  : addSkillLabel,
    content,
    callback: (html) => html.find('select[name="skill"]').val() as string | null,
    rejectClose: false,
  });

  if (!chosen) return;

  /* если «кастомный» — делаем пустой шаблон */
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
    /* берём объект-шаблон из CONFIG, копируем, сбрасываем id */
    const tpl = available.find((s) => s.id === chosen)!;
    source    = duplicate(tpl.toObject()) as typeof tpl['_source'];
    source._id = foundry.utils.randomID();
    /* гарантируем владельца */
    (source as any).ownership ??= { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
  }

  /* создаём Item и открываем редактор */
  const skill = await toRaw(context.sheet).createSkill(source) as unknown as GenesysItem<SkillDataModel>;
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

/* остальной код (toggleCareerSkill, purchaseSkillRank, и т.д.) оставляем без изменений */
</script>
