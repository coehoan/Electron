<script>
    import {push} from "svelte-spa-router";
    import {companyName, companySeq} from "../../../scripts/store/store";
    import Header from "../../lib/layout/Header.svelte";
    import {onDestroy, onMount} from "svelte";

    let isSettingShow = false;
    let title = '보안관리 실태평가';

    onMount(() => {
        window.api.response('mainResponse', (data) => {
            $companyName = data.name;
            $companySeq = data.id;
        })
        window.api.request('getMainInfo');
    })

    onDestroy(() => {
        window.api.removeResponse('mainResponse')
    })
</script>

<main>
    <h1>메인</h1>
    <Header {title}/>
    <p on:click={() => {push('/info')}}>기관정보</p>
    <p on:click={() => {push('/self')}}>자체평가</p>
    <p on:click={() => {push('/inspect')}}>현장실사</p>
    <p on:click={() => {push('/result')}}>평가관리</p>
</main>

<style>

</style>