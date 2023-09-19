<script>
    import {push} from "svelte-spa-router";
    import {companyName, year} from "../../../scripts/store/store";
    import {onMount} from "svelte";

    export let title = '';
    let path = window.location.href.split('#')[1];

    onMount(() => {
        console.log(path)
    })
</script>

<div style="border: 1px solid black; display: flex; justify-content: space-between; padding: 0 10px">
    <div style="display:flex; align-items: center; gap: 5px">
        <button on:click={() => {push('/main')}}>홈</button>
        <button on:click={() => {push('/info')}}>기관정보</button>
        <button on:click={() => {push('/self')}}>자체평가</button>
        <button on:click={() => {push('/inspect')}}>현장실사</button>
        <button on:click={() => {push('/result')}}>평가관리</button>
        <button>환경설정</button>
    </div>
    <div style="display:flex; gap: 5px">
        <p>{$year}년 </p>
        <p>{$companyName}</p>
        <p>{title}</p>
    </div>
</div>

<style>

</style>