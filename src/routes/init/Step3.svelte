<script>
    import {push} from "svelte-spa-router";

    let data = {
        name: '',
        roles: '',
        email: '',
        tel: '',
        phone: ''
    }

    /* 주 담당자 정보 입력 */
    window.api.response('step3Response', (data) => {
        if (data) {
            push('/main');
        }
    })

    function submit() {
        window.api.request('setAdminInfo', data);
    }
</script>

<main>
    <p>주 담당자 정보를 입력해주세요.</p>
    <span>이름 </span>
    <input type="text" bind:value={data.name} style="width: 200px;"/> <br>
    <span>직급 </span>
    <input type="text" bind:value={data.roles} style="width: 200px;"/> <br>
    <span>메일 </span>
    <input type="email" bind:value={data.email} style="width: 200px;"/> <br>
    <span>연락처 </span>
    <input type="text" bind:value={data.tel} style="width: 200px;"/> <br>
    <span>휴대폰 </span>
    <input type="text" bind:value={data.phone} style="width: 200px;"/> <br>
    <button on:click={submit}>저장</button>
</main>

<style>

</style>