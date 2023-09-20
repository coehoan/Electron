<script>
    import {push} from "svelte-spa-router";
    import {companyName, year} from "../../../scripts/store/store";
    import Setting from "../conponents/Setting.svelte";

    export let title = '';
    let isSettingShow = false;
    let path = window.location.href.split('#')[1];

</script>

<div style="border: 1px solid black; display: flex; justify-content: space-between; padding: 0 10px">
    <div style="display:flex; align-items: center; gap: 5px">
        {#if path !== '/main'}
            <button on:click={() => {push('/main')}}>홈</button>
        {/if}
        <button on:click={() => {push('/info')}}>기관정보</button>
        <button on:click={() => {push('/self')}}>자체평가</button>
        <button on:click={() => {push('/inspect')}}>현장실사</button>
        <button on:click={() => {push('/result')}}>평가관리</button>
        <button on:click={() => {isSettingShow = true}}>환경설정</button>
    </div>
    <div style="display:flex; gap: 5px">
        <p>{$year}년 </p>
        <p>{$companyName}</p>
        <p>{title}</p>
    </div>
    {#if isSettingShow}
        <Setting bind:isSettingShow={isSettingShow}/>
    {/if}
</div>

<style>

</style>