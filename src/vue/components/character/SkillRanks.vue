<script lang="ts" setup>
defineProps<{
        skillValue: number;
}>();
</script>

<template>
        <div class="skill-ranks">
                <div v-for="i in Math.max(0, 5 - skillValue)" :key="`a${i}`" class="rank" />
                <div v-for="i in skillValue" :key="`p${i}`" class="rank proficiency" />
        </div>
</template>

<style lang="scss" scoped>
.skill-ranks {
	display: flex;
	flex-direction: row-reverse;
	align-items: center;
	padding-left: 6px;

	.rank {
		display: block;
		height: 12px;
		width: 20px;
		background: white;
		border: 1px solid black;
		border-top-left-radius: 4px;
		border-bottom-left-radius: 4px;
		margin-left: -6px;

		&:first-of-type {
			border-radius: 4px;
		}

                &.proficiency {
                        background: #ffe800;
                }
        }
}
</style>
