<script>
    import {push} from "svelte-spa-router";

    export let isUploadShow = true;
    export let title = '';
    export let content = '';

    function fileUpload() {
        window.api.request('fileUpload')
    }
    window.api.response('step1Response', (data) => {
        if (data) {
            push('/step2');
        } else {
            console.log('Error occurred');
        }
    })
</script>

<div class="modal-overlay">
    <div style="width: 80%; height: 200px; border: 1px solid black">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid black; padding: 5px">
            <div>{title}</div>
            <div style="margin-right: 10px; cursor:pointer; font-size: 20px" on:click={() => {isUploadShow = false}}>X</div>
        </div>
        <div style="display: flex; flex-direction: column; height: 80%; justify-content: center; gap: 20px">
            <div style="padding: 5px; margin-top: 10px">
                {content}
            </div>
            <div style="display:flex; justify-content: space-between; padding: 5px">
                <input style="width: 90%;" type="text" readonly/>
                <button style="width: 9.5%;" on:click={fileUpload}>찾기</button>
            </div>
        </div>
    </div>
</div>

<style>
    .modal-overlay {
        width: 98.5%;
        position: fixed;
        display: flex;
        justify-content: center;
        align-items: center;
        top: 40%;
    }
</style>