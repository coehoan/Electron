<script>
    import {push} from "svelte-spa-router";
    import {DialogType} from "../../../scripts/util/enum";
    import {emailCheck} from "../../../scripts/util/common";
    import {onDestroy} from "svelte";
    import {initData} from "../../../scripts/store/store";

    let data = {
        basic_info_seq: 1,
        company_seq: 0,
        name: '',
        roles: '',
        email: '',
        tel: '',
        phone: '',
        type: '주담당자'
    }

    let dialogOption = {
        option: {
            type: '',
            buttons: [],
            defaultId: 0,
            title: '',
            message: '',
            detail: '',
        }
    }

    onDestroy(() => {
        window.api.removeResponse('step3Response')
    })

    function validCheck() {
        if (!Object.values(data).every(e => e !== '')) {
            dialogOption = {
                option: {
                    type: DialogType.Info,
                    buttons: [],
                    defaultId: 0,
                    title: '알림',
                    message: '',
                    detail: '빈 값을 확인해주세요.',
                }
            }
            window.api.request('dialog', dialogOption);
            return false;
        }
        if (!emailCheck(data.email)) {
            dialogOption = {
                option: {
                    type: DialogType.Info,
                    buttons: [],
                    defaultId: 0,
                    title: '알림',
                    message: '',
                    detail: '이메일 양식을 확인해주세요.',
                }
            }
            window.api.request('dialog', dialogOption);
            return false;
        }
        return true;
    }

    function submit() {
        if (validCheck()) {
            data.company_seq = $initData.basic_info.company_seq;
            $initData.admin = data;
            window.api.response('step3Response', (data) => {
                if (data) {
                    push('/main');
                }
                window.api.removeResponse('step3Response');
            })
            window.api.request('saveInitData', $initData);
        }
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
    <input type="text" bind:value={data.tel} on:input={() => {data.tel = data.tel.replace(/[^0-9]/g,'')}} maxlength="11" style="width: 200px;"/>
    <span style="font-size: 13px; color: #999999;">숫자만 입력해주세요</span> <br>
    <span>휴대폰 </span>
    <input type="text" bind:value={data.phone} on:input={() => {data.phone = data.phone.replace(/[^0-9]/g,'')}} maxlength="11" style="width: 200px;"/>
    <span style="font-size: 13px; color: #999999;">숫자만 입력해주세요</span> <br>
    <button on:click={submit}>저장</button>
</main>

<style>

</style>