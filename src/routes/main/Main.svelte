<script>
    import {push} from "svelte-spa-router";
    import {companyCode, companyName, companySeq, companyYear, completeYn} from "../../../scripts/store/store";
    import Header from "../../lib/layout/Header.svelte";
    import {onDestroy, onMount} from "svelte";
    import {MainTitle} from "../../../scripts/util/enum";

    let isSettingShow = false;
    let title = MainTitle.Main;

    onMount(() => {
        window.api.response('mainResponse', (data) => {
            $companyName = data.name;
            $companySeq = data.id;
            $companyCode = data.code;
            $companyYear = data.year;
            $completeYn = data.completeYn;
        })
        window.api.request('getMainInfo');
    })

    onDestroy(() => {
        window.api.removeResponse('mainResponse')
    })
</script>

<main style="height: 100%">
    <Header {title}/>
    <div style="margin-top: 10px; height: 90%; display: flex; align-items: center; justify-content: center; flex-direction: column">
        <div class="main-wrap">
            <div class="main-button" on:click={() => {push('/info')}}>
                <p>기관정보</p>
            </div>
            <div class="main-button" on:click={() => {push('/self')}}>
                <p>자체평가</p>
            </div>
        </div>
        <div class="main-wrap" style="margin-top: 10px">
            <div class="main-button" on:click={() => {push('/inspect')}}>
                <p>현장실사</p>
            </div>
            <div class="main-button" on:click={() => {push('/result')}}>
                <p>평가관리</p>
            </div>
        </div>
    </div>
</main>

<style>
    .main-wrap {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .main-button {
        width: 49.5%;
        height: 100%;
        border: 1px solid gray;
        border-radius: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor:pointer;
        box-shadow: 1px 1px 1px gray;
    }
    .main-button:hover {
        background-color: #999999;
    }
</style>