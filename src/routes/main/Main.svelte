<script>
    import {push} from "svelte-spa-router";
    import {companyName, companySeq, year} from "../../../scripts/store/store";

    window.api.response('main-response', (data) => {
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
            <button>환경설정</button>
        </div>
        <div style="display:flex; gap: 5px">
            <p>{$year}년 </p>
            <p>{$companyName}</p>
            <p>보안관리 실태평가</p>
        </div>
    </div>
    <p on:click={() => {push('/info')}}>기관정보</p>
    <p on:click={() => {push('/self')}}>자체평가</p>
    <p on:click={() => {push('/inspect')}}>현장실사</p>
    <p on:click={() => {push('/result')}}>평가관리</p>
</main>

<style>

</style>