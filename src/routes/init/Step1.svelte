<script>
    import {push} from "svelte-spa-router";

    /* 평가지표 파일을 불러온 후 DB 저장 */
    function fileUpload() {
        window.api.request('fileUpload');
        window.api.response('step1Response', (data) => {
            if (data) {
                push('/step2');
            } else if (data === 'canceled') {
                console.log('Canceled.')
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