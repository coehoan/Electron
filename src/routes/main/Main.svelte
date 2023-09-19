<script>
    import {push} from "svelte-spa-router";
    import {companyName, companySeq, year} from "../../../scripts/store/store";
    import Setting from "../../lib/conponents/Setting.svelte";
    import File from "../../lib/conponents/File.svelte";

    let isSettingShow = false;
    let isUploadShow = false;
    let fileTitle = '평가데이터 가져오기';
    let fileContent = '평가데이터를 가져오면 기존 입력 된 평가자료 데이터는 초기화됩니다.';

    window.api.response('mainResponse', (data) => {
        $companyName = data.name;
        $companySeq = data.id;
    })
    window.api.request('getMainInfo');
</script>

<main>
    <h1>메인</h1>
    <div style="border: 1px solid black; display: flex; justify-content: space-between; padding: 0 10px">
        <div style="display:flex; align-items: center; gap: 5px">
            <button on:click={() => {push('/info')}}>기관정보</button>
            <button on:click={() => {push('/self')}}>자체평가</button>
            <button on:click={() => {push('/inspect')}}>현장실사</button>
            <button on:click={() => {push('/result')}}>평가관리</button>
            <button on:click={() => {isSettingShow = true}}>환경설정</button>
        </div>
        <div style="display:flex; gap: 5px">
            <p>{$year}년 </p>
            <p>{$companyName}</p>
            <p>보안관리 실태평가</p>
        </div>
    </div>
    {#if isSettingShow}
        <Setting bind:isSettingShow={isSettingShow} bind:isUploadShow={isUploadShow}/>
    {/if}
    {#if isUploadShow}
        <File bind:isUploadShow={isUploadShow} bind:title={fileTitle} bind:content={fileContent}/>
    {/if}
    <p on:click={() => {push('/info')}}>기관정보</p>
    <p on:click={() => {push('/self')}}>자체평가</p>
    <p on:click={() => {push('/inspect')}}>현장실사</p>
    <p on:click={() => {push('/result')}}>평가관리</p>
</main>

<style>

</style>