<script>
    import {push} from "svelte-spa-router";
    import {onDestroy} from "svelte";
    import {initData} from "../../../scripts/store/store";

    onDestroy(() => {
        window.api.removeResponse('step1Response');
    })

    function fileUpload() {
        window.api.request('fileUpload');
        window.api.response('step1Response', (data) => {
            if (data === 'canceled') {
                console.log('Canceled.');
            } else if (data) {
                $initData.questions = data.questions;
                $initData.company = data.company;
                push('/step2');
            } else {
                console.log('Error occurred');
            }
            window.api.removeResponse('step1Response');
        })
    }
</script>

<main>
    <p>평가기준 데이터를 등록해주세요.</p>
    <input type="text" style="width: 150px" readonly>
    <button on:click={fileUpload}>찾기</button>
</main>

<style>

</style>