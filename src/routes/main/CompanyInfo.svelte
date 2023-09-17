<script>
    import {companyName, companySeq, year} from "../../../scripts/store/store";
    import {push} from "svelte-spa-router";
    import {onDestroy, onMount} from "svelte";

    let companyInfo = [];
    let newAdminList =[];

    onMount(() => {
        window.api.response('infoResponse', (data) => {
            companyInfo = data;
        })
        window.api.request('getCompanyInfo');
    })

    onDestroy(() => {
        window.api.removeResponse('infoResponse');
        window.api.removeResponse('adminResponse');
    })

    /**
     * 담당자 입력창 추가
     * */
    function addAdminList() {
        let adminInfo = {
            basic_info_seq: 1,
            company_seq: $companySeq,
            name: '',
            roles: '',
            email: '',
            tel: '',
            phone: '',
            type: ''
        }
        newAdminList = [...newAdminList, adminInfo];
    }

    /**
     * 담당자 입력창 삭제
     * */
    function removeAdminList(e) {
        newAdminList.splice(e, 1);
        newAdminList = newAdminList;
    }

    /**
     * 담당자 삭제
     * */
    function deleteAdmin (e) {
        window.api.response('adminResponse', (data) => {
            if (data) {
                newAdminList = [];
                // 담당자 저장, 삭제 성공 후 목록 재조회
                window.api.request('getCompanyInfo');
            }
        })
        window.api.request('deleteAdmin', e);
    }

    /**
     * 담당자 저장
     * */
    function saveAdmin() {
        window.api.response('adminResponse', (data) => {
            if (data) {
                newAdminList = [];
                // 담당자 저장, 삭제 성공 후 목록 재조회
                window.api.request('getCompanyInfo');
            }
        })
        if (newAdminList.every((e) => !Object.values(e).includes(''))) {
            console.log('pass')
            window.api.request('saveAdmin', newAdminList);
        } else {
            console.log('값을 입력해주세요');
        }
    }

</script>

<main>
    <h1>기관정보</h1>
    <div style="border: 1px solid black; display: flex; justify-content: space-between; padding: 0 10px">
        <div style="display:flex; align-items: center; gap: 5px">
            <button on:click={() => {push('/main')}}>홈</button>
            <button on:click={() => {push('/info')}}>기관정보</button>
            <button on:click={() => {push('/self')}}>자체평가</button>
            <button on:click={() => {push('/inspect')}}>현장실사</button>
            <button on:click={() => {push('/result')}}>평가관리</button>
            <button>환경설정</button>
        </div>
        <div style="display:flex; gap: 5px">
            <p>{$year}년 </p>
            <p>{$companyName}</p>
            <p>기관 정보</p>
        </div>
    </div>
    <h3>기관정보</h3>
    {#if companyInfo.length > 0}
        <ul>
            <li>기관명: {companyInfo[0].name}</li>
            <li>주소: {companyInfo[0].address}</li>
            <li>기관코드: {companyInfo[0].code}</li>
            <li>타입: {companyInfo[0].company_type}</li>
        </ul>
    {/if}
    <h3>담당자 정보</h3>
    {#if companyInfo.length > 0}
        <table>
            <thead>
            <tr>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th>
                    <button on:click={addAdminList} style="width: 100px">추가</button>
                </th>
            </tr>
            <tr>
                <th>이름</th>
                <th>직급</th>
                <th>이메일</th>
                <th>연락처</th>
                <th>휴대폰</th>
                <th>분류</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            {#each companyInfo as info}
                <tr>
                    <td style="display: none">{info.id}</td>
                    <td>{info.admin_name}</td>
                    <td>{info.roles}</td>
                    <td>{info.email}</td>
                    <td>{info.tel}</td>
                    <td>{info.phone}</td>
                    <td>{info.type}</td>
                    {#if info.id > 1}
                        <td>
                            <button on:click={() => {deleteAdmin(info.id)}}>삭제</button>
                        </td>
                    {/if}
                </tr>
            {/each}
            {#if newAdminList.length > 0}
                {#each newAdminList as list, index}
                    <tr>
                        <td>
                            <input bind:value={list.name} style="width: 150px;" />
                        </td>
                        <td>
                            <input bind:value={list.roles} style="width: 150px;" />
                        </td>
                        <td>
                            <input bind:value={list.email} style="width: 150px;" />
                        </td>
                        <td>
                            <input bind:value={list.tel} style="width: 150px;" />
                        </td>
                        <td>
                            <input bind:value={list.phone} style="width: 150px;" />
                        </td>
                        <td>
                            <select bind:value={list.type} style="width: 150px">
                                <option value="주담당자">주담당자</option>
                                <option value="부담당자">부담당자</option>
                                <option value="기타">기타</option>
                            </select>
                        </td>
                        <td>
                            <button on:click={() => removeAdminList(index)}>삭제</button>
                        </td>
                    </tr>
                {/each}
            {/if}
            <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>
                    <button on:click={saveAdmin} style="width: 100px">저장</button>
                </td>
            </tr>
            </tbody>
        </table>
    {/if}
</main>

<style>
    tr {
        height: 50px;
    }
    td {
        text-align: center;
        width: 150px;
    }
</style>