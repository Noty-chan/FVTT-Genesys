import { ContextBase } from '@/vue/SheetContext';
import VueSheet from '@/vue/VueSheet';
import VueApproachPrompt from '@/vue/apps/ApproachPrompt.vue';
import { Approach } from '@/data/Approaches';

export interface ApproachPromptContext extends ContextBase {
    resolve: (value?: Approach) => void;
}

export default class ApproachPrompt extends VueSheet(Application) {
    override get vueComponent() {
        return VueApproachPrompt;
    }

    static override get defaultOptions() {
        return {
            ...super.defaultOptions,
            classes: ['app-approach-prompt'],
            width: 200,
            title: game.i18n.localize('Genesys.ApproachPrompt.Title'),
        };
    }

    static async promptForApproach(): Promise<Approach | undefined> {
        const app = new ApproachPrompt();
        await app.render(true);
        return new Promise<Approach | undefined>((resolve) => {
            app.#resolve = resolve;
        });
    }

    #resolve?: (value?: Approach) => void;

    override async getVueContext(): Promise<ApproachPromptContext> {
        return {
            resolve: async (approach) => {
                this.#resolve?.(approach);
                this.#resolve = undefined;
                await this.close();
            },
        };
    }

    override async close(options = {}) {
        this.#resolve?.();
        await super.close(options);
    }
}
